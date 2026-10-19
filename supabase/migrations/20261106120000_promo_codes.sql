-- =============================================================
--  Fichier    : 20261106120000_promo_codes.sql
--  Projet     : Kalami
--  Description: Codes promo et Stripe Tax (Sprint 5c, v0.10.3). Un code donne un
--               pourcentage ou un montant par devise, pour un livre, tous les livres, les
--               offres Stratégie ou tout ; date d'expiration, limite d'utilisations, une
--               fois par compte. La réduction est calculée par la base à la création de la
--               commande ; l'utilisation est comptée au paiement. Interrupteur Stripe Tax
--               (éteint : dispense TPS/TVQ du petit fournisseur).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-19
--  Dépendances: 20261104120000_orders.sql, 20261105120000_strategy_orders.sql,
--               20261101120000_authors_switch.sql (platform_settings)
-- =============================================================

-- ==================== CODES PROMO ====================

-- Portée : 'book' (un livre), 'books' (tous les livres), 'strategy' (étude, lots, forfaits),
-- 'all' (tout). Réduction : pourcentage (1 à 90) OU montant dans une ou plusieurs devises.
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_-]{2,29}$'),
  scope text not null check (scope in ('book', 'books', 'strategy', 'all')),
  book_id uuid references public.books (id) on delete cascade,
  percent_off integer check (percent_off between 1 and 90),
  amount_off_xof integer check (amount_off_xof > 0),
  amount_off_eur numeric(10, 2) check (amount_off_eur > 0),
  amount_off_cad numeric(10, 2) check (amount_off_cad > 0),
  expires_at timestamptz,
  max_uses integer check (max_uses between 1 and 100000),
  uses_count integer not null default 0 check (uses_count >= 0),
  active boolean not null default true,
  note text check (char_length(note) <= 200),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope = 'book') = (book_id is not null)),
  check (
    (percent_off is not null)
    <> (coalesce(amount_off_xof::numeric, amount_off_eur, amount_off_cad) is not null)
  )
);

create trigger promo_codes_set_updated_at
  before update on public.promo_codes
  for each row execute function public.set_updated_at();

-- Utilisations payées : une par compte et par code, une par commande
create table public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  discount_minor integer not null check (discount_minor > 0),
  currency text not null check (currency in ('XOF', 'EUR', 'CAD')),
  created_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

-- Réduction figée dans la commande (total_minor est déjà réduit)
alter table public.orders
  add column promo_code_id uuid references public.promo_codes (id) on delete set null,
  add column discount_minor integer not null default 0 check (discount_minor >= 0);

-- ==================== RÉGLAGES : STRIPE TAX ====================

-- Éteint par défaut : dispense TPS/TVQ (petit fournisseur, docs/ETUDE-PRIX.md § 6).
-- Allumé : Stripe calcule la taxe sur les prix affichés (taxes comprises).
alter table public.platform_settings
  add column stripe_tax_enabled boolean not null default false;

-- ==================== FONCTIONS INTERNES ====================

-- Plus petit total accepté par Stripe après réduction (unité mineure)
create or replace function public.promo_min_total(p_currency text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_currency when 'XOF' then 500 else 50 end;
$$;

revoke execute on function public.promo_min_total(text) from public, anon, authenticated;

-- Vérifie un code pour un compte et une cible ('book' avec p_book_id, ou 'strategy').
-- Erreurs : promo_invalid, promo_expired, promo_exhausted, promo_used, promo_not_applicable.
create or replace function public.promo_check(
  p_user_id uuid,
  p_code text,
  p_target text,
  p_book_id uuid
)
returns public.promo_codes
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_promo public.promo_codes;
begin
  select * into v_promo from public.promo_codes
  where code = upper(btrim(coalesce(p_code, ''))) and active;
  if v_promo.id is null then
    raise exception 'promo_invalid' using errcode = 'P0001';
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at <= now() then
    raise exception 'promo_expired' using errcode = 'P0001';
  end if;
  if v_promo.max_uses is not null and v_promo.uses_count >= v_promo.max_uses then
    raise exception 'promo_exhausted' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.promo_redemptions
    where promo_code_id = v_promo.id and user_id = p_user_id
  ) then
    raise exception 'promo_used' using errcode = 'P0001';
  end if;
  if not (
    v_promo.scope = 'all'
    or (p_target = 'strategy' and v_promo.scope = 'strategy')
    or (p_target = 'book' and v_promo.scope = 'books')
    or (p_target = 'book' and v_promo.scope = 'book' and v_promo.book_id = p_book_id)
  ) then
    raise exception 'promo_not_applicable' using errcode = 'P0001';
  end if;
  return v_promo;
end;
$$;

revoke execute on function public.promo_check(uuid, text, text, uuid)
  from public, anon, authenticated;

-- Réduction (unité mineure) d'un code sur un montant ; même calcul que lib/payments/promo.ts.
-- Erreurs : promo_not_applicable (pas de montant dans la devise), promo_too_low.
create or replace function public.promo_discount(
  p_promo public.promo_codes,
  p_currency text,
  p_amount integer
)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_discount integer;
begin
  if p_promo.percent_off is not null then
    v_discount := p_amount - round(p_amount * (100 - p_promo.percent_off) / 100.0)::integer;
  else
    v_discount := public.price_to_minor(p_currency, p_promo.amount_off_xof,
      p_promo.amount_off_eur, p_promo.amount_off_cad);
  end if;
  if v_discount is null then
    raise exception 'promo_not_applicable' using errcode = 'P0001';
  end if;
  if p_amount - v_discount < public.promo_min_total(p_currency) then
    raise exception 'promo_too_low' using errcode = 'P0001';
  end if;
  return v_discount;
end;
$$;

revoke execute on function public.promo_discount(public.promo_codes, text, integer)
  from public, anon, authenticated;

-- ==================== FONCTIONS : APERÇU D'UN CODE ====================

-- Aperçu pour l'acheteur connecté : réduction du code sur l'article affiché
-- (p_target 'book' avec p_book_id, ou 'strategy'). Mêmes refus que la commande, sauf le
-- total minimal, vérifié à la commande.
create or replace function public.promo_preview(p_code text, p_target text, p_book_id uuid)
returns table (
  code text,
  percent_off integer,
  amount_off_xof integer,
  amount_off_eur numeric,
  amount_off_cad numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_promo public.promo_codes;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  v_promo := public.promo_check(auth.uid(), p_code, p_target, p_book_id);
  return query select v_promo.code, v_promo.percent_off, v_promo.amount_off_xof,
    v_promo.amount_off_eur, v_promo.amount_off_cad;
end;
$$;

revoke execute on function public.promo_preview(text, text, uuid) from public, anon;
grant execute on function public.promo_preview(text, text, uuid) to authenticated;

-- ==================== FONCTIONS : CRÉATION D'UNE COMMANDE ====================

-- Remplacée (paramètre p_promo_code ajouté) : livre au prix de la base, code promo facultatif
drop function public.create_book_order(uuid, text);

create function public.create_book_order(
  p_book_id uuid,
  p_currency text,
  p_promo_code text default null
)
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
  v_promo public.promo_codes;
  v_discount integer := 0;
  v_label text;
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

  v_label := v_title;
  if nullif(btrim(coalesce(p_promo_code, '')), '') is not null then
    v_promo := public.promo_check(v_user_id, p_promo_code, 'book', p_book_id);
    v_discount := public.promo_discount(v_promo, p_currency, v_amount);
    v_label := v_title || ' (code ' || v_promo.code || ')';
  end if;

  if (
    select count(*) from public.orders
    where user_id = v_user_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.orders
    (user_id, provider, currency, total_minor, promo_code_id, discount_minor)
  values (v_user_id, 'stripe', p_currency, v_amount - v_discount, v_promo.id, v_discount)
  returning id into v_order_id;

  insert into public.order_items (order_id, kind, book_id, unit_minor, label)
  values (v_order_id, 'book', p_book_id, v_amount, v_title);

  return query select v_order_id, v_amount - v_discount, v_label;
end;
$$;

revoke execute on function public.create_book_order(uuid, text, text) from public, anon;
grant execute on function public.create_book_order(uuid, text, text) to authenticated;

-- Remplacée (paramètre p_promo_code ajouté) : offre Stratégie, code promo facultatif
-- appliqué après la remise enseignant
drop function public.create_strategy_order(text, text, text, uuid, uuid);

create function public.create_strategy_order(
  p_kind text,
  p_currency text,
  p_code text,
  p_pack_id uuid,
  p_study_id uuid,
  p_promo_code text default null
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
  v_promo public.promo_codes;
  v_discount integer := 0;
  v_amount integer;
  v_label text;
  v_item_label text;
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
    v_item_label := v_offer.name;
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
    v_item_label := 'Forfait du coach « ' || v_pack.name || ' »';
    if v_is_teacher and v_pack.teacher_discount_pct > 0 and v_amount is not null then
      v_amount := round(v_amount * (100 - v_pack.teacher_discount_pct) / 100.0)::integer;
      v_item_label := v_item_label
        || ' (remise enseignant −' || v_pack.teacher_discount_pct || ' %)';
    end if;
    v_item_kind := 'coach_pack';
  else
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;

  if v_amount is null or v_amount <= 0 then
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;

  v_label := v_item_label;
  if nullif(btrim(coalesce(p_promo_code, '')), '') is not null then
    v_promo := public.promo_check(v_user_id, p_promo_code, 'strategy', null);
    v_discount := public.promo_discount(v_promo, p_currency, v_amount);
    v_label := v_item_label || ' (code ' || v_promo.code || ')';
  end if;

  if (
    select count(*) from public.orders
    where user_id = v_user_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.orders
    (user_id, provider, currency, total_minor, promo_code_id, discount_minor)
  values (v_user_id, 'stripe', p_currency, v_amount - v_discount, v_promo.id, v_discount)
  returning id into v_order_id;

  insert into public.order_items
    (order_id, kind, coach_pack_id, study_id, unit_minor, label, credits)
  values (v_order_id, v_item_kind, v_pack.id,
    case when v_item_kind = 'coach_pack' then p_study_id end, v_amount, v_item_label,
    v_credits);

  return query select v_order_id, v_amount - v_discount, v_label;
end;
$$;

revoke execute on function public.create_strategy_order(text, text, text, uuid, uuid, text)
  from public, anon;
grant execute on function public.create_strategy_order(text, text, text, uuid, uuid, text)
  to authenticated;

-- ==================== UTILISATION AU PAIEMENT ====================

-- Commande payée avec un code : utilisation enregistrée et comptée (une fois par commande).
-- Un remboursement ne rend pas l'utilisation (le code reste consommé pour ce compte).
create or replace function public.promo_record_redemption()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and old.status <> 'paid' and new.promo_code_id is not null
    and new.discount_minor > 0 then
    insert into public.promo_redemptions
      (promo_code_id, user_id, order_id, discount_minor, currency)
    values (new.promo_code_id, new.user_id, new.id, new.discount_minor, new.currency)
    on conflict do nothing;
    if found then
      update public.promo_codes set uses_count = uses_count + 1
      where id = new.promo_code_id;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.promo_record_redemption() from public, anon, authenticated;

create trigger orders_promo_redemption
  after update of status on public.orders
  for each row execute function public.promo_record_redemption();

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Crée un code promo (administrateur aal2). Erreurs : promo_taken, invalid_promo.
create or replace function public.admin_create_promo_code(
  p_code text,
  p_scope text,
  p_book_id uuid,
  p_percent_off integer,
  p_amount_off_xof integer,
  p_amount_off_eur numeric,
  p_amount_off_cad numeric,
  p_expires_at timestamptz,
  p_max_uses integer,
  p_note text
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
  begin
    insert into public.promo_codes (code, scope, book_id, percent_off, amount_off_xof,
      amount_off_eur, amount_off_cad, expires_at, max_uses, note, created_by)
    values (upper(btrim(p_code)), p_scope, p_book_id, p_percent_off, p_amount_off_xof,
      p_amount_off_eur, p_amount_off_cad, p_expires_at, p_max_uses,
      nullif(btrim(p_note), ''), auth.uid())
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'promo_taken' using errcode = 'P0001';
    when check_violation or foreign_key_violation then
      raise exception 'invalid_promo' using errcode = 'P0001';
  end;
  perform public.write_audit('promo.create', 'promo_code', v_id::text,
    jsonb_build_object('code', upper(btrim(p_code)), 'scope', p_scope));
  return v_id;
end;
$$;

revoke execute on function public.admin_create_promo_code(text, text, uuid, integer, integer,
  numeric, numeric, timestamptz, integer, text) from public, anon;
grant execute on function public.admin_create_promo_code(text, text, uuid, integer, integer,
  numeric, numeric, timestamptz, integer, text) to authenticated;

-- Active ou désactive un code (administrateur aal2). Erreur : promo_not_found.
create or replace function public.admin_set_promo_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.promo_codes set active = coalesce(p_active, false) where id = p_id;
  if not found then
    raise exception 'promo_not_found' using errcode = 'P0001';
  end if;
  perform public.write_audit(
    case when p_active then 'promo.activate' else 'promo.deactivate' end,
    'promo_code', p_id::text, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_set_promo_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_promo_active(uuid, boolean) to authenticated;

-- Allume ou éteint Stripe Tax (administrateur aal2), avec trace dans le journal d'audit
create or replace function public.admin_set_stripe_tax(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  update public.platform_settings
  set stripe_tax_enabled = coalesce(p_enabled, false), updated_at = now(),
    updated_by = auth.uid()
  where id;
  perform public.write_audit(
    case when p_enabled then 'platform.tax.enable' else 'platform.tax.disable' end,
    'platform_settings', 'stripe_tax_enabled', '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_set_stripe_tax(boolean) from public, anon;
grant execute on function public.admin_set_stripe_tax(boolean) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

-- Codes et utilisations : lecture administrateur seulement (l'acheteur passe par l'aperçu).
-- Aucune écriture directe : fonctions admin et déclencheur de paiement.
create policy "promo_codes_admin_select" on public.promo_codes
  for select to authenticated
  using (public.is_admin());

create policy "promo_redemptions_admin_select" on public.promo_redemptions
  for select to authenticated
  using (public.is_admin());
