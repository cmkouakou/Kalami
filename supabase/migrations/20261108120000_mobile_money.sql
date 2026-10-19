-- =============================================================
--  Fichier    : 20261108120000_mobile_money.sql
--  Projet     : Kalami
--  Description: Mobile Money manuel (Sprint 6, v0.11.0). L'administrateur saisit les
--               numéros marchands par opérateur et par pays. L'acheteur (FCFA seulement)
--               choisit un numéro, paie hors de l'application avec la référence KAL-…,
--               puis déclare son numéro de transaction et le numéro payeur.
--               L'administrateur rapproche avec son relevé, puis valide (droits accordés
--               par fulfil_order) ou refuse avec un motif. Un numéro de transaction ne
--               sert qu'une fois ; une commande non déclarée expire au bout de 24 heures.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-19
--  Dépendances: 20261104120000_orders.sql, 20261105120000_strategy_orders.sql,
--               20261106120000_promo_codes.sql
-- =============================================================

-- ==================== OPÉRATEURS ET NUMÉROS MARCHANDS ====================

-- Opérateurs connus ; seuls Wave et Orange Money sont ouverts au lancement
create table public.mobile_money_operators (
  code text primary key check (code ~ '^[a-z_]{2,20}$'),
  name text not null check (char_length(name) between 2 and 40),
  enabled boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.mobile_money_operators (code, name, enabled, sort_order) values
  ('wave', 'Wave', true, 1),
  ('orange_money', 'Orange Money', true, 2),
  ('mtn_momo', 'MTN MoMo', false, 3),
  ('moov_money', 'Moov Money', false, 4),
  ('free_money', 'Free Money', false, 5);

-- Un numéro marchand par opérateur et par pays de l'UEMOA, saisi par l'administrateur
create table public.mobile_money_accounts (
  id uuid primary key default gen_random_uuid(),
  operator text not null references public.mobile_money_operators (code) on delete cascade,
  country text not null check (country in ('BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG')),
  merchant_number text not null check (merchant_number ~ '^\+?[0-9 ]{8,20}$'),
  account_name text check (char_length(account_name) between 2 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator, country)
);

create trigger mobile_money_accounts_set_updated_at
  before update on public.mobile_money_accounts
  for each row execute function public.set_updated_at();

-- ==================== COMMANDES : TRANSACTION MOBILE MONEY ====================

-- Numéro marchand figé dans la commande : il reste affiché même si l'admin le change
alter table public.orders
  add column mm_account_id uuid references public.mobile_money_accounts (id)
    on delete set null,
  add column mm_operator text references public.mobile_money_operators (code),
  add column mm_country text,
  add column mm_merchant_number text,
  add column mm_reference text unique,
  add column mm_expires_at timestamptz,
  add column mm_transaction_id text check (mm_transaction_id ~ '^[A-Za-z0-9.\-]{4,40}$'),
  add column mm_payer_number text check (mm_payer_number ~ '^\+?[0-9 ]{8,20}$'),
  add column mm_declared_at timestamptz,
  add column mm_reviewed_at timestamptz,
  add column mm_reviewed_by uuid references auth.users (id) on delete set null,
  add column mm_rejection_reason text
    check (char_length(mm_rejection_reason) between 3 and 300),
  add constraint orders_mm_fields_check
    check (provider = 'mobile_money' or mm_reference is null);

-- Un numéro de transaction ne sert qu'une fois par opérateur, même si la commande est refusée
create unique index orders_mm_transaction_once
  on public.orders (mm_operator, upper(mm_transaction_id))
  where mm_transaction_id is not null;

-- Commandes à valider (déclarées, en attente)
create index orders_mm_review_idx on public.orders (mm_declared_at)
  where provider = 'mobile_money' and status = 'pending' and mm_declared_at is not null;

-- ==================== FONCTIONS : ACHETEUR ====================

-- Numéros proposés à l'acheteur connecté : opérateur ouvert et numéro actif
create or replace function public.mm_payment_options()
returns table (
  account_id uuid,
  operator text,
  operator_name text,
  country text,
  merchant_number text,
  account_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.operator, o.name, a.country, a.merchant_number, a.account_name
  from public.mobile_money_accounts a
  join public.mobile_money_operators o on o.code = a.operator
  where a.active and o.enabled and auth.uid() is not null
  order by o.sort_order, a.country;
$$;

revoke execute on function public.mm_payment_options() from public, anon;
grant execute on function public.mm_payment_options() to authenticated;

-- Passe en Mobile Money une commande que l'acheteur vient de créer (create_book_order ou
-- create_strategy_order, en FCFA, sans session Stripe) : prix, promo et remise enseignant
-- sont ainsi calculés au même endroit. Erreurs : order_not_found, invalid_currency,
-- operator_unavailable.
create or replace function public.mm_start_order(p_order_id uuid, p_account_id uuid)
returns table (
  reference text,
  merchant_number text,
  operator_name text,
  total_minor integer,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order public.orders;
  v_account record;
  v_reference text;
  v_expires timestamptz := now() + interval '24 hours';
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select * into v_order from public.orders
  where id = p_order_id and user_id = auth.uid() and status = 'pending'
    and provider = 'stripe' and provider_session_id is null and mm_reference is null
    and created_at > now() - interval '15 minutes'
  for update;
  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.currency <> 'XOF' then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;

  select a.id, a.operator, a.country, a.merchant_number, o.name into v_account
  from public.mobile_money_accounts a
  join public.mobile_money_operators o on o.code = a.operator
  where a.id = p_account_id and a.active and o.enabled;
  if v_account.id is null then
    raise exception 'operator_unavailable' using errcode = 'P0001';
  end if;

  -- Même forme que la référence des PDF : 8 premiers caractères de l'identifiant
  v_reference := 'KAL-' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8));
  update public.orders
  set provider = 'mobile_money', mm_account_id = v_account.id,
    mm_operator = v_account.operator, mm_country = v_account.country,
    mm_merchant_number = v_account.merchant_number, mm_reference = v_reference,
    mm_expires_at = v_expires
  where id = p_order_id;

  return query select v_reference, v_account.merchant_number::text, v_account.name::text,
    v_order.total_minor, v_expires;
end;
$$;

revoke execute on function public.mm_start_order(uuid, uuid) from public, anon;
grant execute on function public.mm_start_order(uuid, uuid) to authenticated;

-- Déclare la transaction payée hors de l'application (une seule fois par commande).
-- Erreurs : order_not_found, already_declared, order_expired, invalid_transaction,
-- invalid_payer, transaction_used.
create or replace function public.mm_declare_transaction(
  p_order_id uuid,
  p_transaction_id text,
  p_payer_number text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_transaction text := btrim(coalesce(p_transaction_id, ''));
  v_payer text := regexp_replace(btrim(coalesce(p_payer_number, '')), '\s+', ' ', 'g');
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select * into v_order from public.orders
  where id = p_order_id and user_id = auth.uid() and provider = 'mobile_money'
  for update;
  if v_order.id is null or v_order.status not in ('pending', 'expired') then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.mm_declared_at is not null then
    raise exception 'already_declared' using errcode = 'P0001';
  end if;
  if v_order.status = 'expired' or v_order.mm_expires_at <= now() then
    raise exception 'order_expired' using errcode = 'P0001';
  end if;
  if v_transaction !~ '^[A-Za-z0-9.\-]{4,40}$' then
    raise exception 'invalid_transaction' using errcode = 'P0001';
  end if;
  if v_payer !~ '^\+?[0-9 ]{8,20}$' then
    raise exception 'invalid_payer' using errcode = 'P0001';
  end if;

  begin
    update public.orders
    set mm_transaction_id = v_transaction, mm_payer_number = v_payer, mm_declared_at = now()
    where id = p_order_id;
  exception
    when unique_violation then
      raise exception 'transaction_used' using errcode = 'P0001';
  end;
end;
$$;

revoke execute on function public.mm_declare_transaction(uuid, text, text) from public, anon;
grant execute on function public.mm_declare_transaction(uuid, text, text) to authenticated;

-- ==================== FONCTIONS : SERVEUR ====================

-- Expire les commandes non déclarées après 24 heures (tâche quotidienne ; la commande
-- échue reste refusée à la déclaration même avant ce passage)
create or replace function public.mm_expire_stale()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.orders set status = 'expired'
  where provider = 'mobile_money' and status = 'pending' and mm_declared_at is null
    and mm_expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.mm_expire_stale() from public, anon, authenticated;

-- Adresses des administrateurs, pour l'alerte de nouvelle déclaration (serveur seulement)
create or replace function public.mm_admin_emails()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.is_admin and u.email is not null;
$$;

revoke execute on function public.mm_admin_emails() from public, anon, authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Valide une transaction rapprochée avec le relevé : commande payée, droits accordés.
-- Erreurs : order_not_found, not_declared.
create or replace function public.admin_mm_validate(p_order_id uuid)
returns table (buyer_email text, labels text, total_minor integer, reference text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select * into v_order from public.orders
  where id = p_order_id and provider = 'mobile_money' and status = 'pending'
  for update;
  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.mm_declared_at is null then
    raise exception 'not_declared' using errcode = 'P0001';
  end if;

  update public.orders
  set status = 'paid', paid_at = now(), provider_payment_id = v_order.mm_transaction_id,
    mm_reviewed_at = now(), mm_reviewed_by = auth.uid()
  where id = p_order_id;
  perform public.fulfil_order(p_order_id);

  perform public.write_audit('order.mm.validate', 'order', p_order_id::text,
    jsonb_build_object('reference', v_order.mm_reference, 'operator', v_order.mm_operator,
      'transaction', v_order.mm_transaction_id, 'total_minor', v_order.total_minor));

  return query
    select u.email::text,
      (select string_agg(i.label, ' · ' order by i.created_at)
       from public.order_items i where i.order_id = p_order_id),
      v_order.total_minor, v_order.mm_reference
    from auth.users u where u.id = v_order.user_id;
end;
$$;

revoke execute on function public.admin_mm_validate(uuid) from public, anon;
grant execute on function public.admin_mm_validate(uuid) to authenticated;

-- Refuse une transaction introuvable sur le relevé, avec un motif montré à l'acheteur.
-- Erreurs : order_not_found, invalid_reason.
create or replace function public.admin_mm_reject(p_order_id uuid, p_reason text)
returns table (buyer_email text, labels text, total_minor integer, reference text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order public.orders;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if char_length(v_reason) not between 3 and 300 then
    raise exception 'invalid_reason' using errcode = 'P0001';
  end if;
  select * into v_order from public.orders
  where id = p_order_id and provider = 'mobile_money' and status = 'pending'
  for update;
  if v_order.id is null then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;

  update public.orders
  set status = 'failed', mm_rejection_reason = v_reason, mm_reviewed_at = now(),
    mm_reviewed_by = auth.uid()
  where id = p_order_id;

  perform public.write_audit('order.mm.reject', 'order', p_order_id::text,
    jsonb_build_object('reference', v_order.mm_reference, 'operator', v_order.mm_operator,
      'transaction', v_order.mm_transaction_id, 'reason', v_reason));

  return query
    select u.email::text,
      (select string_agg(i.label, ' · ' order by i.created_at)
       from public.order_items i where i.order_id = p_order_id),
      v_order.total_minor, v_order.mm_reference
    from auth.users u where u.id = v_order.user_id;
end;
$$;

revoke execute on function public.admin_mm_reject(uuid, text) from public, anon;
grant execute on function public.admin_mm_reject(uuid, text) to authenticated;

-- Ouvre ou ferme un opérateur. Erreur : operator_not_found.
create or replace function public.admin_mm_set_operator(p_code text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.mobile_money_operators
  set enabled = coalesce(p_enabled, false), updated_at = now()
  where code = p_code;
  if not found then
    raise exception 'operator_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit(
    case when p_enabled then 'mm.operator.enable' else 'mm.operator.disable' end,
    'mobile_money_operator', p_code, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_mm_set_operator(text, boolean) from public, anon;
grant execute on function public.admin_mm_set_operator(text, boolean) to authenticated;

-- Enregistre le numéro marchand d'un opérateur dans un pays (création ou mise à jour).
-- Erreur : invalid_account.
create or replace function public.admin_mm_save_account(
  p_operator text,
  p_country text,
  p_merchant_number text,
  p_account_name text,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_number text := regexp_replace(btrim(coalesce(p_merchant_number, '')), '\s+', ' ', 'g');
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  begin
    insert into public.mobile_money_accounts
      (operator, country, merchant_number, account_name, active)
    values (p_operator, upper(btrim(p_country)), v_number,
      nullif(btrim(coalesce(p_account_name, '')), ''), coalesce(p_active, false))
    on conflict (operator, country) do update
    set merchant_number = excluded.merchant_number, account_name = excluded.account_name,
      active = excluded.active
    returning id into v_id;
  exception
    when check_violation or foreign_key_violation or not_null_violation then
      raise exception 'invalid_account' using errcode = 'P0001';
  end;
  perform public.write_audit('mm.account.save', 'mobile_money_account', v_id::text,
    jsonb_build_object('operator', p_operator, 'country', upper(btrim(p_country)),
      'number', v_number, 'active', coalesce(p_active, false)));
  return v_id;
end;
$$;

revoke execute on function public.admin_mm_save_account(text, text, text, text, boolean)
  from public, anon;
grant execute on function public.admin_mm_save_account(text, text, text, text, boolean)
  to authenticated;

-- Remplacée (colonnes Mobile Money ajoutées) : p_status 'to_review' = déclarées à valider
drop function public.admin_orders(text);

create function public.admin_orders(p_status text)
returns table (
  id uuid,
  buyer_email text,
  status text,
  provider text,
  currency text,
  total_minor integer,
  labels text,
  provider_payment_id text,
  receipt_url text,
  created_at timestamptz,
  paid_at timestamptz,
  refunded_at timestamptz,
  mm_operator text,
  mm_country text,
  mm_reference text,
  mm_transaction_id text,
  mm_payer_number text,
  mm_declared_at timestamptz,
  mm_rejection_reason text
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
    select o.id, u.email::text, o.status, o.provider, o.currency, o.total_minor,
      (select string_agg(i.label, ' · ' order by i.created_at)
       from public.order_items i where i.order_id = o.id),
      o.provider_payment_id, o.receipt_url, o.created_at, o.paid_at, o.refunded_at,
      o.mm_operator, o.mm_country, o.mm_reference, o.mm_transaction_id, o.mm_payer_number,
      o.mm_declared_at, o.mm_rejection_reason
    from public.orders o
    left join auth.users u on u.id = o.user_id
    where p_status is null
      or (p_status = 'to_review' and o.provider = 'mobile_money' and o.status = 'pending'
        and o.mm_declared_at is not null)
      or o.status = p_status
    order by o.created_at desc
    limit 200;
end;
$$;

revoke execute on function public.admin_orders(text) from public, anon;
grant execute on function public.admin_orders(text) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.mobile_money_operators enable row level security;
alter table public.mobile_money_accounts enable row level security;

-- Lecture administrateur seulement (l'acheteur passe par mm_payment_options) ;
-- aucune écriture directe : fonctions d'administration
create policy "mobile_money_operators_admin_select" on public.mobile_money_operators
  for select to authenticated
  using (public.is_admin());

create policy "mobile_money_accounts_admin_select" on public.mobile_money_accounts
  for select to authenticated
  using (public.is_admin());
