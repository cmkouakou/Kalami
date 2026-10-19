-- =============================================================
--  Fichier    : 20261105120000_strategy_orders.sql
--  Projet     : Kalami
--  Description: Paiement de Kalami Stratégie (Sprint 5b, v0.10.2) : prix de l'étude et des
--               lots (10 et 30), achat des forfaits du coach par le propriétaire de l'étude
--               ou l'enseignant (remise enseignant), livraison par le webhook signé,
--               remboursement par l'administrateur avec retrait des droits.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-19
--  Dépendances: 20261104120000_orders.sql, 20261030120000_strategy_coach_packs.sql,
--               20261029120000_strategy_classes.sql
-- =============================================================

-- ==================== OFFRES : ÉTUDE ET LOTS ====================

-- Prix saisis par l'auteur (docs/ETUDE-PRIX.md) ; un code fixe par offre
create table public.strategy_offers (
  code text primary key check (code in ('study', 'lot_10', 'lot_30')),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  credits integer not null check (credits between 1 and 100),
  price_xof integer check (price_xof > 0),
  price_eur numeric(10, 2) check (price_eur > 0),
  price_cad numeric(10, 2) check (price_cad > 0),
  active boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger strategy_offers_set_updated_at
  before update on public.strategy_offers
  for each row execute function public.set_updated_at();

insert into public.strategy_offers
  (code, name, credits, price_xof, price_eur, price_cad, position)
values
  ('study', 'Une étude', 1, 9900, 19.99, 29.99, 1),
  ('lot_10', 'Lot de 10 études', 10, 79200, 159.92, 239.92, 2),
  ('lot_30', 'Lot de 30 études', 30, 193050, 389.80, 584.80, 3);

-- ==================== FORFAITS : REMISE ENSEIGNANT ====================

alter table public.coach_packs
  add column teacher_discount_pct integer not null default 0
    check (teacher_discount_pct between 0 and 90);

update public.coach_packs set teacher_discount_pct = 20
where lower(name) like 'essentiel%';

-- ==================== COMMANDES : CRÉDITS, REMBOURSEMENT ====================

-- Crédits d'étude livrés par l'article (1 pour une étude, 10 ou 30 pour un lot)
alter table public.order_items
  add column credits integer check (credits between 1 and 100);

alter table public.orders drop constraint orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'expired', 'failed', 'refunded'));
alter table public.orders
  add column refunded_at timestamptz,
  add column refund_id text check (refund_id ~ '^re_[A-Za-z0-9]+$');

alter table public.coach_allowances
  add column order_id uuid references public.orders (id) on delete set null;

create index orders_status_idx on public.orders (status, created_at desc);

-- ==================== FONCTIONS INTERNES ====================

-- Prix d'une offre ou d'un forfait en unité mineure (FCFA entiers, sinon centimes)
create or replace function public.price_to_minor(
  p_currency text,
  p_xof integer,
  p_eur numeric,
  p_cad numeric
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_currency
    when 'XOF' then p_xof
    when 'EUR' then round(p_eur * 100)::integer
    when 'CAD' then round(p_cad * 100)::integer
  end;
$$;

revoke execute on function public.price_to_minor(text, integer, numeric, numeric)
  from public, anon, authenticated;

-- Remplacée : les forfaits achetés s'ajoutent au plafond de la classe au lieu d'être bornés
-- par lui (l'enseignant qui paie un forfait pour l'étude d'une classe l'obtient en entier)
create or replace function public.coach_study_budget(p_study_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select least(
    coalesce((
      select sum(a.amount_usd) from public.coach_allowances a
      where a.study_id = p_study_id and a.source <> 'purchase'
    ), 0),
    coalesce((
      select c.study_budget_usd
      from public.studies s
      join public.classes c on c.id = s.class_id
      where s.id = p_study_id
    ), 'infinity'::numeric)
  ) + coalesce((
    select sum(a.amount_usd) from public.coach_allowances a
    where a.study_id = p_study_id and a.source = 'purchase'
  ), 0);
$$;

revoke execute on function public.coach_study_budget(uuid) from public, anon, authenticated;

-- ==================== FONCTIONS : OFFRES ====================

-- Offres d'étude et de lots ouvertes à la vente (prix publics)
create or replace function public.strategy_offer_list()
returns table (
  code text,
  name text,
  credits integer,
  price_xof integer,
  price_eur numeric,
  price_cad numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.code, o.name, o.credits, o.price_xof, o.price_eur, o.price_cad
  from public.strategy_offers o
  where o.active
  order by o.position, o.credits;
$$;

revoke execute on function public.strategy_offer_list() from public;
grant execute on function public.strategy_offer_list() to anon, authenticated;

-- Remplacée (colonne ajoutée) : forfaits avec la remise enseignant
drop function public.coach_pack_offers();

create function public.coach_pack_offers()
returns table (
  id uuid,
  name text,
  price_xof integer,
  price_eur numeric,
  price_cad numeric,
  approx_reviews integer,
  teacher_discount_pct integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.price_xof, p.price_eur, p.price_cad,
    greatest(floor(p.cost_usd / public.coach_review_cost()), 1)::integer,
    p.teacher_discount_pct
  from public.coach_packs p
  where p.active and auth.uid() is not null
  order by p.position, p.cost_usd;
$$;

revoke execute on function public.coach_pack_offers() from public, anon;
grant execute on function public.coach_pack_offers() to authenticated;

-- ==================== FONCTIONS : CRÉATION D'UNE COMMANDE ====================

-- Crée la commande d'une offre Stratégie au prix de la base, pour l'acheteur connecté.
--   p_kind 'study_offer' : p_code = 'study' | 'lot_10' | 'lot_30' (tout compte connecté)
--   p_kind 'coach_pack'  : p_pack_id et p_study_id ; propriétaire de l'étude ou enseignant
--                          de sa classe (remise enseignant appliquée)
-- Erreurs : invalid_currency, not_for_sale, not_allowed, rate_limited.
create or replace function public.create_strategy_order(
  p_kind text,
  p_currency text,
  p_code text,
  p_pack_id uuid,
  p_study_id uuid
)
returns table (order_id uuid, total_minor integer, label text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_offer public.strategy_offers;
  v_pack public.coach_packs;
  v_amount integer;
  v_label text;
  v_item_kind text;
  v_credits integer;
  v_is_owner boolean;
  v_is_teacher boolean;
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_currency not in ('XOF', 'EUR', 'CAD') then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;

  if p_kind = 'study_offer' then
    select * into v_offer from public.strategy_offers where code = p_code and active;
    v_amount := public.price_to_minor(p_currency, v_offer.price_xof, v_offer.price_eur,
      v_offer.price_cad);
    v_label := v_offer.name;
    v_credits := v_offer.credits;
    v_item_kind := case when v_offer.credits = 1 then 'study' else 'study_lot' end;
  elsif p_kind = 'coach_pack' then
    select * into v_pack from public.coach_packs where id = p_pack_id and active;
    if v_pack.id is null or p_study_id is null then
      raise exception 'not_for_sale' using errcode = 'P0001';
    end if;
    v_is_owner := exists (
      select 1 from public.study_members
      where study_id = p_study_id and user_id = v_user_id and role = 'owner'
    );
    v_is_teacher := public.strategy_study_teacher(p_study_id) is not distinct from v_user_id;
    if not v_is_owner and not v_is_teacher then
      raise exception 'not_allowed' using errcode = 'P0001';
    end if;
    v_amount := public.price_to_minor(p_currency, v_pack.price_xof, v_pack.price_eur,
      v_pack.price_cad);
    v_label := 'Forfait du coach « ' || v_pack.name || ' »';
    if v_is_teacher and v_pack.teacher_discount_pct > 0 and v_amount is not null then
      v_amount := round(v_amount * (100 - v_pack.teacher_discount_pct) / 100.0)::integer;
      v_label := v_label || ' (remise enseignant −' || v_pack.teacher_discount_pct || ' %)';
    end if;
    v_item_kind := 'coach_pack';
  else
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;

  if v_amount is null or v_amount <= 0 then
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.orders
    where user_id = v_user_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.orders (user_id, provider, currency, total_minor)
  values (v_user_id, 'stripe', p_currency, v_amount)
  returning id into v_order_id;

  insert into public.order_items
    (order_id, kind, coach_pack_id, study_id, unit_minor, label, credits)
  values (v_order_id, v_item_kind, v_pack.id,
    case when v_item_kind = 'coach_pack' then p_study_id end, v_amount, v_label, v_credits);

  return query select v_order_id, v_amount, v_label;
end;
$$;

revoke execute on function public.create_strategy_order(text, text, text, uuid, uuid)
  from public, anon;
grant execute on function public.create_strategy_order(text, text, text, uuid, uuid)
  to authenticated;

-- ==================== FONCTIONS : LIVRAISON ====================

-- Remplacée : ajoute les articles Stratégie (crédits d'étude, forfait du coach)
create or replace function public.fulfil_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item record;
begin
  select user_id into v_user_id from public.orders where id = p_order_id;

  for v_item in
    select i.kind, i.book_id, i.study_id, i.coach_pack_id, i.credits, i.label,
      b.pdf_enabled, b.grants_study_credit, b.title, p.cost_usd, p.name as pack_name
    from public.order_items i
    left join public.books b on b.id = i.book_id
    left join public.coach_packs p on p.id = i.coach_pack_id
    where i.order_id = p_order_id
  loop
    if v_item.kind = 'book' and v_item.book_id is not null then
      insert into public.entitlements (user_id, book_id, source, order_id)
      values (v_user_id, v_item.book_id, 'purchase', p_order_id)
      on conflict (user_id, book_id) where revoked_at is null do nothing;

      if v_item.pdf_enabled then
        insert into public.pdf_purchases (user_id, book_id, reference, source, order_id)
        values (v_user_id, v_item.book_id,
          'KAL-' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8)),
          'purchase', p_order_id)
        on conflict do nothing;
      end if;

      if v_item.grants_study_credit then
        insert into public.study_credits (user_id, source, note, order_id)
        values (v_user_id, 'book_bonus', 'Offerte avec « ' || v_item.title || ' »', p_order_id)
        on conflict (user_id) where source = 'book_bonus' do nothing;
      end if;
    elsif v_item.kind in ('study', 'study_lot') then
      insert into public.study_credits (user_id, source, note, order_id)
      select v_user_id, 'purchase', v_item.label, p_order_id
      from generate_series(1, coalesce(v_item.credits, 1));
    elsif v_item.kind = 'coach_pack' and v_item.study_id is not null
      and v_item.cost_usd is not null then
      insert into public.coach_allowances
        (study_id, amount_usd, source, note, granted_by, pack_id, order_id)
      values (v_item.study_id, v_item.cost_usd, 'purchase', v_item.label, v_user_id,
        v_item.coach_pack_id, p_order_id);
    end if;
  end loop;
end;
$$;

revoke execute on function public.fulfil_order(uuid) from public, anon, authenticated;

-- ==================== FONCTIONS : REMBOURSEMENT ====================

-- Enregistre un remboursement fait chez Stripe (appelée par la route admin après l'API) :
-- commande « refunded », livre et PDF révoqués, crédits non utilisés et forfaits retirés.
-- Les crédits déjà utilisés (étude créée) restent : l'étude n'est pas supprimée.
create or replace function public.admin_refund_order(p_order_id uuid, p_refund_id text)
returns table (credits_removed integer, credits_kept integer, packs_removed integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order public.orders;
  v_removed integer;
  v_kept integer;
  v_packs integer;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.status <> 'paid' then
    raise exception 'not_refundable' using errcode = 'P0001';
  end if;

  update public.orders
  set status = 'refunded', refunded_at = now(), refund_id = p_refund_id
  where id = p_order_id;

  update public.entitlements set revoked_at = now()
  where order_id = p_order_id and revoked_at is null;
  update public.pdf_purchases set revoked_at = now()
  where order_id = p_order_id and revoked_at is null;

  delete from public.study_credits where order_id = p_order_id and consumed_at is null;
  get diagnostics v_removed = row_count;
  select count(*)::integer into v_kept from public.study_credits where order_id = p_order_id;

  delete from public.coach_allowances where order_id = p_order_id;
  get diagnostics v_packs = row_count;

  perform public.write_audit('order.refund', 'order', p_order_id::text,
    jsonb_build_object('refund', p_refund_id, 'total_minor', v_order.total_minor,
      'currency', v_order.currency, 'credits_removed', v_removed,
      'credits_kept', v_kept, 'packs_removed', v_packs));

  return query select v_removed, v_kept, v_packs;
end;
$$;

revoke execute on function public.admin_refund_order(uuid, text) from public, anon;
grant execute on function public.admin_refund_order(uuid, text) to authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Commandes de toute la boutique avec l'adresse de l'acheteur (200 plus récentes)
create or replace function public.admin_orders(p_status text)
returns table (
  id uuid,
  buyer_email text,
  status text,
  currency text,
  total_minor integer,
  labels text,
  provider_payment_id text,
  receipt_url text,
  created_at timestamptz,
  paid_at timestamptz,
  refunded_at timestamptz
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
    select o.id, u.email::text, o.status, o.currency, o.total_minor,
      (select string_agg(i.label, ' · ' order by i.created_at)
       from public.order_items i where i.order_id = o.id),
      o.provider_payment_id, o.receipt_url, o.created_at, o.paid_at, o.refunded_at
    from public.orders o
    left join auth.users u on u.id = o.user_id
    where p_status is null or o.status = p_status
    order by o.created_at desc
    limit 200;
end;
$$;

revoke execute on function public.admin_orders(text) from public, anon;
grant execute on function public.admin_orders(text) to authenticated;

-- Modifie le prix d'une offre d'étude ou de lot
create or replace function public.admin_save_strategy_offer(
  p_code text,
  p_name text,
  p_price_xof integer,
  p_price_eur numeric,
  p_price_cad numeric,
  p_active boolean
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
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if coalesce(p_price_xof, 1) <= 0 or coalesce(p_price_eur, 1) <= 0
    or coalesce(p_price_cad, 1) <= 0 then
    raise exception 'invalid_price' using errcode = 'P0001';
  end if;

  update public.strategy_offers
  set name = btrim(p_name), price_xof = p_price_xof, price_eur = p_price_eur,
    price_cad = p_price_cad, active = coalesce(p_active, active)
  where code = p_code;
  if not found then
    raise exception 'offer_not_found' using errcode = 'P0001';
  end if;

  perform public.write_audit('strategy.offer', 'strategy_offer', p_code,
    jsonb_build_object('name', btrim(p_name), 'xof', p_price_xof, 'eur', p_price_eur,
      'cad', p_price_cad, 'active', p_active));
end;
$$;

revoke execute on function
  public.admin_save_strategy_offer(text, text, integer, numeric, numeric, boolean)
  from public, anon;
grant execute on function
  public.admin_save_strategy_offer(text, text, integer, numeric, numeric, boolean)
  to authenticated;

-- Remplacée (paramètre ajouté) : enregistre aussi la remise enseignant
drop function public.admin_save_coach_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer
);

create function public.admin_save_coach_pack(
  p_id uuid,
  p_name text,
  p_cost numeric,
  p_price_xof integer,
  p_price_eur numeric,
  p_price_cad numeric,
  p_active boolean,
  p_position integer,
  p_teacher_discount integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if p_cost is null or p_cost <= 0 or p_cost > 1000 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  if coalesce(p_price_xof, 1) <= 0 or coalesce(p_price_eur, 1) <= 0
    or coalesce(p_price_cad, 1) <= 0 then
    raise exception 'invalid_price' using errcode = 'P0001';
  end if;
  if coalesce(p_teacher_discount, 0) not between 0 and 90 then
    raise exception 'invalid_discount' using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.coach_packs (
      name, cost_usd, price_xof, price_eur, price_cad, active, position, teacher_discount_pct
    )
    values (btrim(p_name), p_cost, p_price_xof, p_price_eur, p_price_cad,
      coalesce(p_active, true), coalesce(p_position, 0), coalesce(p_teacher_discount, 0))
    returning id into v_id;
  else
    update public.coach_packs
    set name = btrim(p_name), cost_usd = p_cost, price_xof = p_price_xof,
      price_eur = p_price_eur, price_cad = p_price_cad, active = coalesce(p_active, active),
      position = coalesce(p_position, position),
      teacher_discount_pct = coalesce(p_teacher_discount, teacher_discount_pct)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'pack_not_found' using errcode = 'P0001';
    end if;
  end if;

  perform public.write_audit('strategy.coach.pack', 'coach_pack', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'cost', p_cost, 'active', p_active,
      'teacher_discount', p_teacher_discount));
  return v_id;
end;
$$;

revoke execute on function public.admin_save_coach_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer, integer
) from public, anon;
grant execute on function public.admin_save_coach_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer, integer
) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

-- Offres : lues par strategy_offer_list ; modifiées par admin_save_strategy_offer
alter table public.strategy_offers enable row level security;

create policy "strategy_offers_admin_select" on public.strategy_offers
  for select to authenticated
  using (public.is_admin());
