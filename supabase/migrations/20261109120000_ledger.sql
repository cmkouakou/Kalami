-- =============================================================
--  Fichier    : 20261109120000_ledger.sql
--  Projet     : Kalami
--  Description: Grand livre et commissions (Sprint 10a, v0.12.0). Chaque vente payée crée
--               une écriture par article, en devise d'origine : montant brut, frais de
--               paiement, taxes, commission Kalami et part de l'auteur (brut = frais + taxes
--               + commission + part). Un remboursement crée l'écriture inverse (frais non
--               rendus : à la charge de Kalami). Part de l'auteur : 70 % du net par défaut,
--               exception possible par auteur ; disponible après 30 jours. Frais Mobile Money
--               en pourcentage par opérateur (0 par défaut) ; frais Stripe réels transmis par
--               le webhook. Les écritures sont posées par déclencheur sur `orders`.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-19
--  Dépendances: 20261104120000_orders.sql, 20261105120000_strategy_orders.sql,
--               20261108120000_mobile_money.sql, 20261007120000_catalog.sql (write_audit)
-- =============================================================

-- ==================== TABLE : RÉGLAGES DES REVENUS ====================

-- Ligne unique (id = true) ; modifiable seulement par admin_set_revenue_settings
create table public.revenue_settings (
  id boolean primary key default true check (id),
  -- Part de l'auteur sur le net (après frais et taxes), en points de base (7000 = 70 %)
  author_share_bps integer not null default 7000 check (author_share_bps between 0 and 10000),
  -- Délai avant qu'une part devienne disponible pour un versement
  hold_days integer not null default 30 check (hold_days between 0 and 365),
  -- Seuil minimal d'une demande de versement, par devise (unités mineures)
  payout_min_xof integer not null default 5000 check (payout_min_xof > 0),
  payout_min_eur integer not null default 1000 check (payout_min_eur > 0),
  payout_min_cad integer not null default 1500 check (payout_min_cad > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.revenue_settings is
  'Commission, délai de disponibilité et seuils de versement (ligne unique).';

insert into public.revenue_settings (id) values (true);

-- ==================== TABLE : EXCEPTIONS PAR AUTEUR ====================

-- Part propre à un auteur (remplace la part globale) ; écriture par fonction admin
create table public.author_commissions (
  author_id uuid primary key references public.authors (id) on delete cascade,
  author_share_bps integer not null check (author_share_bps between 0 and 10000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ==================== COLONNES : FRAIS ET TAXES ====================

-- Frais facturés par l'opérateur Mobile Money, en points de base du montant (100 = 1 %)
alter table public.mobile_money_operators
  add column fee_bps integer not null default 0 check (fee_bps between 0 and 2000);

-- Frais de paiement et taxes de la commande, en devise de la commande (null : inconnus)
alter table public.orders
  add column fee_minor integer check (fee_minor >= 0),
  add column tax_minor integer check (tax_minor >= 0);

-- ==================== TABLE : GRAND LIVRE ====================

-- Une écriture par article et par événement (vente, remboursement). Conservée même si la
-- commande ou le compte de l'acheteur disparaît (références mises à null).
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('sale', 'refund')),
  order_id uuid references public.orders (id) on delete set null,
  order_item_id uuid references public.order_items (id) on delete set null,
  reference text not null check (char_length(reference) between 1 and 20),
  item_kind text not null,
  label text not null check (char_length(label) between 1 and 300),
  book_id uuid references public.books (id) on delete set null,
  author_id uuid references public.authors (id) on delete set null,
  provider text not null,
  currency text not null check (currency in ('XOF', 'EUR', 'CAD')),
  gross_minor integer not null,
  fee_minor integer not null,
  tax_minor integer not null,
  commission_minor integer not null,
  author_minor integer not null,
  author_share_bps integer not null check (author_share_bps between 0 and 10000),
  available_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint ledger_entries_balanced
    check (gross_minor = fee_minor + tax_minor + commission_minor + author_minor),
  -- Une vente et un remboursement au plus par article
  constraint ledger_entries_once unique (order_item_id, entry_type)
);

comment on table public.ledger_entries is
  'Grand livre : brut = frais + taxes + commission + part auteur, en devise d''origine.';

create index ledger_entries_author_idx on public.ledger_entries (author_id, created_at desc);
create index ledger_entries_created_idx on public.ledger_entries (created_at desc);
create index ledger_entries_order_idx on public.ledger_entries (order_id);

-- ==================== FONCTIONS : ÉCRITURES ====================

-- Part de l'auteur d'un livre : exception propre, sinon part globale
create or replace function public.author_share_bps(p_author_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select c.author_share_bps from public.author_commissions c
     where c.author_id = p_author_id),
    (select s.author_share_bps from public.revenue_settings s where s.id));
$$;

revoke execute on function public.author_share_bps(uuid) from public, anon, authenticated;

-- Écritures de vente d'une commande payée. Brut, frais et taxes répartis entre les articles
-- au prorata de leur prix (le reste d'arrondi va au dernier article). Part de l'auteur
-- arrondie à l'unité inférieure ; la commission prend le reste. Sans effet si déjà posées.
create or replace function public.ledger_record_sale(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item record;
  v_base bigint;
  v_count integer;
  v_index integer := 0;
  v_hold integer;
  v_gross integer;
  v_fee integer;
  v_tax integer;
  v_net integer;
  v_bps integer;
  v_author integer;
  v_left_gross integer;
  v_left_fee integer;
  v_left_tax integer;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null or v_order.status not in ('paid', 'refunded') then
    return;
  end if;
  if exists (select 1 from public.ledger_entries
             where order_id = p_order_id and entry_type = 'sale') then
    return;
  end if;

  select coalesce(sum(i.unit_minor::bigint * i.quantity), 0), count(*)
  into v_base, v_count
  from public.order_items i where i.order_id = p_order_id;
  if v_count = 0 or v_base = 0 then
    return;
  end if;

  select s.hold_days into v_hold from public.revenue_settings s where s.id;
  v_left_gross := v_order.total_minor;
  v_left_fee := least(coalesce(v_order.fee_minor, 0), v_order.total_minor);
  v_left_tax := least(coalesce(v_order.tax_minor, 0), v_order.total_minor - v_left_fee);

  for v_item in
    select i.id, i.kind, i.label, i.book_id, i.unit_minor::bigint * i.quantity as amount,
      b.author_id
    from public.order_items i
    left join public.books b on b.id = i.book_id and i.kind = 'book'
    where i.order_id = p_order_id
    order by i.created_at, i.id
  loop
    v_index := v_index + 1;
    if v_index = v_count then
      v_gross := v_left_gross;
      v_fee := v_left_fee;
      v_tax := v_left_tax;
    else
      v_gross := floor(v_order.total_minor::numeric * v_item.amount / v_base);
      v_fee := floor(coalesce(v_order.fee_minor, 0)::numeric * v_item.amount / v_base);
      v_tax := floor(coalesce(v_order.tax_minor, 0)::numeric * v_item.amount / v_base);
      v_fee := least(v_fee, v_left_fee, v_gross);
      v_tax := least(v_tax, v_left_tax, v_gross - v_fee);
    end if;
    v_left_gross := v_left_gross - v_gross;
    v_left_fee := v_left_fee - v_fee;
    v_left_tax := v_left_tax - v_tax;

    v_net := greatest(v_gross - v_fee - v_tax, 0);
    v_bps := case when v_item.author_id is null then 0
              else public.author_share_bps(v_item.author_id) end;
    v_author := floor(v_net::numeric * v_bps / 10000);

    insert into public.ledger_entries (
      entry_type, order_id, order_item_id, reference, item_kind, label, book_id, author_id,
      provider, currency, gross_minor, fee_minor, tax_minor, commission_minor, author_minor,
      author_share_bps, available_at)
    values (
      'sale', p_order_id, v_item.id,
      coalesce(v_order.mm_reference,
        'KAL-' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8))),
      v_item.kind, v_item.label, v_item.book_id, v_item.author_id,
      v_order.provider, v_order.currency, v_gross, v_fee, v_tax,
      v_gross - v_fee - v_tax - v_author, v_author, v_bps,
      coalesce(v_order.paid_at, now()) + make_interval(days => v_hold))
    on conflict (order_item_id, entry_type) do nothing;
  end loop;
end;
$$;

revoke execute on function public.ledger_record_sale(uuid) from public, anon, authenticated;

-- Écritures inverses d'une commande remboursée : brut, taxes et part de l'auteur rendus ;
-- les frais de paiement ne sont pas rendus et pèsent sur la commission. Déduction immédiate.
create or replace function public.ledger_record_refund(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ledger_record_sale(p_order_id);
  insert into public.ledger_entries (
    entry_type, order_id, order_item_id, reference, item_kind, label, book_id, author_id,
    provider, currency, gross_minor, fee_minor, tax_minor, commission_minor, author_minor,
    author_share_bps, available_at)
  select 'refund', e.order_id, e.order_item_id, e.reference, e.item_kind, e.label, e.book_id,
    e.author_id, e.provider, e.currency, -e.gross_minor, 0, -e.tax_minor,
    -e.gross_minor + e.tax_minor + e.author_minor, -e.author_minor, e.author_share_bps, now()
  from public.ledger_entries e
  where e.order_id = p_order_id and e.entry_type = 'sale'
  on conflict (order_item_id, entry_type) do nothing;
end;
$$;

revoke execute on function public.ledger_record_refund(uuid) from public, anon, authenticated;

-- ==================== DÉCLENCHEURS SUR LES COMMANDES ====================

-- Avant le passage à « payée » : frais Mobile Money calculés selon l'opérateur
create or replace function public.orders_set_mm_fee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid'
    and new.provider = 'mobile_money' and new.fee_minor is null then
    new.fee_minor := coalesce(
      (select round(new.total_minor::numeric * o.fee_bps / 10000)::integer
       from public.mobile_money_operators o where o.code = new.mm_operator), 0);
  end if;
  return new;
end;
$$;

create trigger orders_set_mm_fee
  before update of status on public.orders
  for each row execute function public.orders_set_mm_fee();

-- Après le changement de statut : écritures de vente ou de remboursement
create or replace function public.orders_write_ledger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.ledger_record_sale(new.id);
  elsif new.status = 'refunded' and old.status is distinct from 'refunded' then
    perform public.ledger_record_refund(new.id);
  end if;
  return null;
end;
$$;

create trigger orders_write_ledger
  after update of status on public.orders
  for each row execute function public.orders_write_ledger();

-- ==================== WEBHOOK STRIPE : FRAIS ET TAXES ====================

-- Remplacée : reçoit aussi les frais Stripe (convertis en devise de la commande) et la taxe
-- de la session, enregistrés sur la commande avant les écritures du grand livre.
drop function public.stripe_process_event(text, text, uuid, text, integer, text, text, text);

create or replace function public.stripe_process_event(
  p_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_session_id text,
  p_amount_minor integer,
  p_currency text,
  p_payment_id text,
  p_receipt_url text,
  p_fee_minor integer default null,
  p_tax_minor integer default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_result text;
begin
  insert into public.stripe_events (id, type, order_id, result)
  values (p_event_id, p_event_type, null, 'pending')
  on conflict (id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  select * into v_order from public.orders
  where id = p_order_id and provider_session_id = p_session_id
  for update;

  if v_order.id is null then
    v_result := 'unknown_order';
  elsif p_event_type = 'checkout.session.completed' then
    if v_order.status = 'paid' then
      v_result := 'ignored';
    elsif p_amount_minor <> v_order.total_minor or upper(p_currency) <> v_order.currency then
      v_result := 'amount_mismatch';
    else
      update public.orders
      set status = 'paid', paid_at = now(), provider_payment_id = p_payment_id,
        receipt_url = p_receipt_url,
        fee_minor = case when p_fee_minor >= 0 then p_fee_minor end,
        tax_minor = case when p_tax_minor >= 0 then p_tax_minor end
      where id = v_order.id;
      perform public.fulfil_order(v_order.id);
      v_result := 'processed';
    end if;
  elsif p_event_type = 'checkout.session.expired' then
    update public.orders set status = 'expired'
    where id = v_order.id and status = 'pending';
    v_result := 'processed';
  else
    v_result := 'ignored';
  end if;

  update public.stripe_events
  set order_id = v_order.id, result = v_result
  where id = p_event_id;
  return v_result;
end;
$$;

revoke execute on function
  public.stripe_process_event(text, text, uuid, text, integer, text, text, text, integer, integer)
  from public, anon, authenticated;

-- ==================== FONCTIONS : SOLDES ET TOTAUX ====================

-- Revenus de l'auteur connecté par devise : ventes nettes, brut, part gagnée, disponible
-- (délai écoulé ou remboursement) et en attente
create or replace function public.author_ledger_balances()
returns table (
  currency text,
  sales integer,
  gross_minor bigint,
  earned_minor bigint,
  available_minor bigint,
  pending_minor bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.currency,
    sum(case when e.entry_type = 'sale' then 1 else -1 end)::integer,
    sum(e.gross_minor),
    sum(e.author_minor),
    coalesce(sum(e.author_minor) filter (where e.available_at <= now()), 0),
    coalesce(sum(e.author_minor) filter (where e.available_at > now()), 0)
  from public.ledger_entries e
  where e.author_id = public.current_author_id()
  group by e.currency
  order by e.currency;
$$;

revoke execute on function public.author_ledger_balances() from public, anon;
grant execute on function public.author_ledger_balances() to authenticated;

-- Totaux de la plateforme par devise (administrateur)
create or replace function public.admin_ledger_totals()
returns table (
  currency text,
  sales integer,
  gross_minor bigint,
  fee_minor bigint,
  tax_minor bigint,
  commission_minor bigint,
  author_minor bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  return query
    select e.currency,
      sum(case when e.entry_type = 'sale' then 1 else -1 end)::integer,
      sum(e.gross_minor), sum(e.fee_minor), sum(e.tax_minor), sum(e.commission_minor),
      sum(e.author_minor)
    from public.ledger_entries e
    group by e.currency
    order by e.currency;
end;
$$;

revoke execute on function public.admin_ledger_totals() from public, anon;
grant execute on function public.admin_ledger_totals() to authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Réglages des revenus (part en points de base, seuils en unités mineures).
-- Erreur : invalid_settings.
create or replace function public.admin_set_revenue_settings(
  p_author_share_bps integer,
  p_hold_days integer,
  p_payout_min_xof integer,
  p_payout_min_eur integer,
  p_payout_min_cad integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_author_share_bps is null or p_author_share_bps not between 0 and 10000
    or p_hold_days is null or p_hold_days not between 0 and 365
    or coalesce(p_payout_min_xof, 0) <= 0 or coalesce(p_payout_min_eur, 0) <= 0
    or coalesce(p_payout_min_cad, 0) <= 0 then
    raise exception 'invalid_settings' using errcode = 'P0001';
  end if;
  update public.revenue_settings
  set author_share_bps = p_author_share_bps, hold_days = p_hold_days,
    payout_min_xof = p_payout_min_xof, payout_min_eur = p_payout_min_eur,
    payout_min_cad = p_payout_min_cad, updated_at = now(), updated_by = auth.uid()
  where id;
  perform public.write_audit('revenue.settings', 'revenue_settings', null,
    jsonb_build_object('author_share_bps', p_author_share_bps, 'hold_days', p_hold_days,
      'payout_min_xof', p_payout_min_xof, 'payout_min_eur', p_payout_min_eur,
      'payout_min_cad', p_payout_min_cad));
end;
$$;

revoke execute on function
  public.admin_set_revenue_settings(integer, integer, integer, integer, integer)
  from public, anon;
grant execute on function
  public.admin_set_revenue_settings(integer, integer, integer, integer, integer)
  to authenticated;

-- Exception de commission d'un auteur (null : retour à la part globale). Ne touche pas aux
-- écritures déjà posées. Erreurs : author_not_found, invalid_share.
create or replace function public.admin_set_author_commission(
  p_author_id uuid,
  p_author_share_bps integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if not exists (select 1 from public.authors where id = p_author_id) then
    raise exception 'author_not_found' using errcode = 'P0001';
  end if;
  if p_author_share_bps is null then
    delete from public.author_commissions where author_id = p_author_id;
  elsif p_author_share_bps not between 0 and 10000 then
    raise exception 'invalid_share' using errcode = 'P0001';
  else
    insert into public.author_commissions (author_id, author_share_bps, updated_by)
    values (p_author_id, p_author_share_bps, auth.uid())
    on conflict (author_id) do update
    set author_share_bps = excluded.author_share_bps, updated_at = now(),
      updated_by = excluded.updated_by;
  end if;
  perform public.write_audit('revenue.author_commission', 'author', p_author_id::text,
    jsonb_build_object('author_share_bps', p_author_share_bps));
end;
$$;

revoke execute on function public.admin_set_author_commission(uuid, integer) from public, anon;
grant execute on function public.admin_set_author_commission(uuid, integer) to authenticated;

-- Frais d'un opérateur Mobile Money (points de base). Erreurs : operator_not_found,
-- invalid_fee.
create or replace function public.admin_mm_set_fee(p_code text, p_fee_bps integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_fee_bps is null or p_fee_bps not between 0 and 2000 then
    raise exception 'invalid_fee' using errcode = 'P0001';
  end if;
  update public.mobile_money_operators
  set fee_bps = p_fee_bps, updated_at = now()
  where code = p_code;
  if not found then
    raise exception 'operator_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit('mm.operator.fee', 'mobile_money_operator', p_code,
    jsonb_build_object('fee_bps', p_fee_bps));
end;
$$;

revoke execute on function public.admin_mm_set_fee(text, integer) from public, anon;
grant execute on function public.admin_mm_set_fee(text, integer) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.revenue_settings enable row level security;
alter table public.author_commissions enable row level security;
alter table public.ledger_entries enable row level security;

-- Réglages lisibles par tout compte connecté (l'auteur voit le délai et le seuil)
create policy "revenue_settings_select" on public.revenue_settings
  for select to authenticated using (true);
revoke insert, update, delete on public.revenue_settings from anon, authenticated;

-- Exception : visible par l'auteur concerné et l'administrateur
create policy "author_commissions_select_own_or_admin" on public.author_commissions
  for select to authenticated
  using (author_id = (select public.current_author_id()) or (select public.is_admin()));
revoke insert, update, delete on public.author_commissions from anon, authenticated;

-- Grand livre : l'auteur lit ses écritures, l'administrateur tout ; aucune écriture directe
create policy "ledger_entries_select_own_or_admin" on public.ledger_entries
  for select to authenticated
  using (author_id = (select public.current_author_id()) or (select public.is_admin()));
revoke insert, update, delete on public.ledger_entries from anon, authenticated;

-- ==================== RATTRAPAGE DES VENTES EXISTANTES ====================

-- Commandes déjà payées ou remboursées avant le grand livre (frais inconnus : 0)
do $$
declare
  v_order record;
begin
  for v_order in
    select id, status from public.orders where status in ('paid', 'refunded')
    order by paid_at
  loop
    perform public.ledger_record_sale(v_order.id);
    if v_order.status = 'refunded' then
      perform public.ledger_record_refund(v_order.id);
    end if;
  end loop;
end;
$$;
