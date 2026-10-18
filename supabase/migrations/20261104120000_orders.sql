-- =============================================================
--  Fichier    : 20261104120000_orders.sql
--  Projet     : Kalami
--  Description: Commandes et paiement par carte (Sprint 5a, v0.10.0) : commandes et articles
--               génériques (livre, étude, lot, forfait du coach), événements Stripe traités
--               une seule fois, accès au livre (et PDF) accordé par le webhook signé, étude
--               Stratégie offerte une fois aux acheteurs du livre guide (option A).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-18
--  Dépendances: 20261008120000_content.sql, 20261012120000_pdf.sql,
--               20261013120000_strategy_core.sql, 20261030120000_strategy_coach_packs.sql
-- =============================================================

-- ==================== LIVRES : ÉTUDE OFFERTE ====================

-- Cochée pour le livre guide : son achat donne un crédit d'étude Stratégie (une fois par compte)
alter table public.books
  add column grants_study_credit boolean not null default false;

update public.books set grants_study_credit = true
where slug = 'la-strategie-d-entreprise';

-- ==================== COMMANDES ====================

-- Montants en unité mineure de la devise (centimes ; FCFA entiers pour XOF)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'failed')),
  provider text not null check (provider in ('stripe', 'mobile_money')),
  currency text not null check (currency in ('XOF', 'EUR', 'CAD')),
  total_minor integer not null check (total_minor > 0),
  -- Session Stripe Checkout (cs_…) et paiement (pi_…)
  provider_session_id text unique,
  provider_payment_id text,
  receipt_url text check (char_length(receipt_url) <= 2000),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Un article par ligne ; le type rend la commande extensible (Stratégie au Sprint 5b)
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('book', 'study', 'study_lot', 'coach_pack')),
  book_id uuid references public.books (id) on delete set null,
  coach_pack_id uuid references public.coach_packs (id) on delete set null,
  study_id uuid references public.studies (id) on delete set null,
  quantity integer not null default 1 check (quantity between 1 and 100),
  unit_minor integer not null check (unit_minor > 0),
  label text not null check (char_length(label) between 1 and 300),
  created_at timestamptz not null default now(),
  check (kind <> 'book' or book_id is not null)
);

create index order_items_order_idx on public.order_items (order_id);

-- Liens laissés en attente aux sprints précédents
alter table public.entitlements
  add constraint entitlements_order_fk
  foreign key (order_id) references public.orders (id) on delete set null;
alter table public.pdf_purchases
  add constraint pdf_purchases_order_fk
  foreign key (order_id) references public.orders (id) on delete set null;

-- ==================== CRÉDITS D'ÉTUDE : ACHAT ET LIVRE ====================

alter table public.study_credits
  add column order_id uuid references public.orders (id) on delete set null;
alter table public.study_credits drop constraint study_credits_source_check;
alter table public.study_credits
  add constraint study_credits_source_check
  check (source in ('admin_grant', 'purchase', 'book_bonus'));

-- Étude offerte avec le livre : une seule fois par compte, quel que soit le nombre d'achats
create unique index study_credits_book_bonus_once
  on public.study_credits (user_id) where source = 'book_bonus';

-- ==================== ÉVÉNEMENTS STRIPE ====================

-- Chaque événement (evt_…) n'est traité qu'une fois, même si Stripe le renvoie
create table public.stripe_events (
  id text primary key check (id ~ '^evt_[A-Za-z0-9]+$'),
  type text not null,
  order_id uuid references public.orders (id) on delete set null,
  result text not null,
  received_at timestamptz not null default now()
);

-- ==================== FONCTIONS : CRÉATION D'UNE COMMANDE ====================

-- Crée la commande d'un livre au prix de la base (seule source de vérité), pour l'acheteur
-- connecté. Refuse : livre non publié, prix absent dans la devise, livre déjà possédé,
-- plus de 10 commandes en une heure.
create or replace function public.create_book_order(p_book_id uuid, p_currency text)
returns table (order_id uuid, total_minor integer, label text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_title text;
  v_amount integer;
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_currency not in ('XOF', 'EUR', 'CAD') then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;

  select b.title, p.amount_minor into v_title, v_amount
  from public.books b
  join public.book_prices p on p.book_id = b.id and p.currency = p_currency
  where b.id = p_book_id and b.status = 'published';
  if v_amount is null then
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.entitlements
    where user_id = v_user_id and book_id = p_book_id and revoked_at is null
  ) then
    raise exception 'already_owned' using errcode = 'P0001';
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

  insert into public.order_items (order_id, kind, book_id, unit_minor, label)
  values (v_order_id, 'book', p_book_id, v_amount, v_title);

  return query select v_order_id, v_amount, v_title;
end;
$$;

revoke execute on function public.create_book_order(uuid, text) from public, anon;
grant execute on function public.create_book_order(uuid, text) to authenticated;

-- Rattache la session Stripe à la commande (serveur seulement)
create or replace function public.order_attach_session(p_order_id uuid, p_session_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders set provider_session_id = p_session_id
  where id = p_order_id and status = 'pending' and provider_session_id is null;
$$;

revoke execute on function public.order_attach_session(uuid, text)
  from public, anon, authenticated;

-- ==================== FONCTIONS : LIVRAISON ====================

-- Accorde les droits d'une commande payée (appelée par stripe_process_event) :
-- livre → droit de lecture, droit PDF si l'option est active, étude offerte (livre guide).
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
    select i.kind, i.book_id, b.pdf_enabled, b.grants_study_credit, b.title
    from public.order_items i
    left join public.books b on b.id = i.book_id
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
    end if;
    -- Articles Stratégie (étude, lot, forfait) : Sprint 5b
  end loop;
end;
$$;

revoke execute on function public.fulfil_order(uuid) from public, anon, authenticated;

-- Traite un événement Stripe Checkout en une transaction : enregistrement de l'événement
-- (doublon → rien), contrôle du montant et de la devise, passage au statut payé ou expiré.
-- Résultats : processed, duplicate, unknown_order, amount_mismatch, ignored.
create or replace function public.stripe_process_event(
  p_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_session_id text,
  p_amount_minor integer,
  p_currency text,
  p_payment_id text,
  p_receipt_url text
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
        receipt_url = p_receipt_url
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
  public.stripe_process_event(text, text, uuid, text, integer, text, text, text)
  from public, anon, authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stripe_events enable row level security;

-- Chacun lit ses commandes ; l'administrateur lit tout. Aucune écriture depuis le navigateur.
create policy "orders_select_own" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "order_items_select_own" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())
  ));

-- Événements Stripe : administrateur seulement
create policy "stripe_events_admin_select" on public.stripe_events
  for select to authenticated
  using (public.is_admin());
