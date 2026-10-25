-- =============================================================
--  Fichier    : 20261116120000_author_workshop.sql
--  Projet     : Kalami
--  Description: Atelier de l'auteur (v0.15.0). Les outils reliés à Claude (relecture,
--               style, fiche du livre) consomment des « crédits Atelier » propres à chaque
--               auteur : forfaits achetés (Stripe ou Mobile Money) ou accordés par
--               l'administrateur. Réglages (modèle, prix Anthropic, limite de fréquence),
--               journal des demandes (réservation puis clôture au coût réel), commandes
--               d'un forfait, livraison et remboursement. Les montants en dollars restent
--               internes : l'auteur voit son solde en pourcentage.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-25
--  Dépend de  : 20261113120000_practice_cases.sql, 20261106120000_promo_codes.sql
-- =============================================================

-- ==================== RÉGLAGES ====================

-- Ligne unique (id = true), modifiable par l'administrateur seulement
create table public.workshop_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  model text not null default 'claude-opus-5-5' check (char_length(model) between 1 and 80),
  -- Prix Anthropic en dollars US par million de jetons
  input_price numeric(10, 4) not null default 4 check (input_price >= 0),
  output_price numeric(10, 4) not null default 20 check (output_price >= 0),
  -- Demandes permises par auteur sur la fenêtre (minutes)
  rate_limit integer not null default 30 check (rate_limit between 1 and 1000),
  rate_window integer not null default 60 check (rate_window between 1 and 1440),
  updated_at timestamptz not null default now()
);

create trigger workshop_settings_set_updated_at
  before update on public.workshop_settings
  for each row execute function public.set_updated_at();

insert into public.workshop_settings (id) values (true);

-- ==================== FORFAITS ====================

create table public.workshop_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  -- Coût Anthropic couvert (dollars US), jamais montré aux auteurs
  cost_usd numeric(10, 2) not null check (cost_usd > 0 and cost_usd <= 1000),
  -- Prix de vente ; vides tant que le forfait n'est pas en vente
  price_xof integer check (price_xof > 0),
  price_eur numeric(10, 2) check (price_eur > 0),
  price_cad numeric(10, 2) check (price_cad > 0),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workshop_packs_set_updated_at
  before update on public.workshop_packs
  for each row execute function public.set_updated_at();

-- ==================== CRÉDITS ====================

create table public.workshop_allowances (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors (id) on delete cascade,
  amount_usd numeric(10, 2) not null check (amount_usd > 0 and amount_usd <= 1000),
  source text not null check (source in ('purchase', 'admin_grant')),
  note text check (char_length(note) <= 500),
  pack_id uuid references public.workshop_packs (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index workshop_allowances_author_idx on public.workshop_allowances (author_id);
create index workshop_allowances_order_idx
  on public.workshop_allowances (order_id) where order_id is not null;

-- ==================== DEMANDES À CLAUDE ====================

create table public.workshop_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  book_id uuid references public.books (id) on delete set null,
  version_id uuid references public.book_versions (id) on delete set null,
  chapter_id uuid references public.chapters (id) on delete set null,
  -- proofread : orthographe et grammaire ; style : lisibilité ; listing : fiche du livre
  tool text not null check (tool in ('proofread', 'style', 'listing')),
  model text not null,
  served_model text,
  input_price numeric(10, 4) not null,
  output_price numeric(10, 4) not null,
  estimate_usd numeric(12, 6) not null check (estimate_usd >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'done', 'failed', 'refused')),
  input jsonb,
  output jsonb,
  -- Suggestions acceptées ou refusées par l'auteur ({ "<index>": "accepted" | "rejected" })
  decisions jsonb not null default '{}'::jsonb check (jsonb_typeof(decisions) = 'object'),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  error text check (char_length(error) <= 500),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index workshop_requests_author_idx
  on public.workshop_requests (author_id, created_at desc);
create index workshop_requests_chapter_idx
  on public.workshop_requests (chapter_id, created_at desc) where chapter_id is not null;

-- ==================== COMMANDES : ARTICLE « FORFAIT ATELIER » ====================

alter table public.order_items drop constraint order_items_kind_check;
alter table public.order_items
  add constraint order_items_kind_check
  check (kind in ('book', 'study', 'study_lot', 'coach_pack', 'practice_case', 'workshop_pack'));
alter table public.order_items
  add column workshop_pack_id uuid references public.workshop_packs (id) on delete set null,
  add constraint order_items_workshop_pack_check
    check (kind <> 'workshop_pack' or workshop_pack_id is not null);

-- ==================== FONCTIONS INTERNES ====================

-- Fiche auteur du compte connecté (null si le compte n'est pas auteur)
create or replace function public.workshop_my_author()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.authors where user_id = auth.uid() and auth.uid() is not null;
$$;

-- Total des crédits d'un auteur (dollars US)
create or replace function public.workshop_budget(p_author_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount_usd), 0)
  from public.workshop_allowances
  where author_id = p_author_id;
$$;

-- Consommation d'un auteur : coût réel, plus l'estimation des demandes en cours récentes
create or replace function public.workshop_spent(p_author_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(
    case
      when status <> 'pending' then cost_usd
      when created_at > now() - interval '15 minutes' then estimate_usd
      else 0
    end
  ), 0)
  from public.workshop_requests
  where author_id = p_author_id;
$$;

-- Coût moyen d'une relecture de chapitre sur 90 jours (0,25 $ faute d'historique), pour
-- traduire un forfait en « nombre de chapitres » approximatif
create or replace function public.workshop_chapter_cost()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(coalesce((
    select avg(cost_usd) from public.workshop_requests
    where tool = 'proofread' and status = 'done' and cost_usd > 0
      and created_at > now() - interval '90 days'
  ), 0.25), 0.01);
$$;

-- Lisible par les connectés : la politique RLS des demandes s'en sert
revoke execute on function public.workshop_my_author() from public, anon;
grant execute on function public.workshop_my_author() to authenticated;
revoke execute on function public.workshop_budget(uuid) from public, anon, authenticated;
revoke execute on function public.workshop_spent(uuid) from public, anon, authenticated;
revoke execute on function public.workshop_chapter_cost() from public, anon, authenticated;

-- ==================== FONCTIONS : AUTEUR ====================

-- Solde de l'auteur connecté, sans montant en dollars : outils ouverts, pourcentage restant
-- du total acheté ou accordé, nombre approximatif de chapitres restants
create or replace function public.workshop_my_balance()
returns table (
  enabled boolean,
  unlocked boolean,
  remaining_pct integer,
  approx_chapters integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_author uuid := public.workshop_my_author();
  v_budget numeric;
  v_left numeric;
begin
  if v_author is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  v_budget := public.workshop_budget(v_author);
  v_left := greatest(v_budget - public.workshop_spent(v_author), 0);
  return query select
    (select s.enabled from public.workshop_settings s where s.id),
    v_budget > 0,
    case when v_budget > 0 then floor(v_left * 100 / v_budget)::integer else 0 end,
    floor(v_left / public.workshop_chapter_cost())::integer;
end;
$$;

revoke execute on function public.workshop_my_balance() from public, anon;
grant execute on function public.workshop_my_balance() to authenticated;

-- Forfaits en vente, avec le nombre approximatif de chapitres relus
create or replace function public.workshop_pack_offers()
returns table (
  id uuid,
  name text,
  price_xof integer,
  price_eur numeric,
  price_cad numeric,
  approx_chapters integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.price_xof, p.price_eur, p.price_cad,
    greatest(floor(p.cost_usd / public.workshop_chapter_cost()), 1)::integer
  from public.workshop_packs p
  where p.active and auth.uid() is not null
  order by p.position, p.cost_usd;
$$;

revoke execute on function public.workshop_pack_offers() from public, anon;
grant execute on function public.workshop_pack_offers() to authenticated;

-- Réserve une demande avant l'appel à Claude. Vérifie que le livre appartient à l'auteur,
-- que la version est celle du livre et le chapitre celui de la version. Refus renvoyés
-- (sans exception) : workshop_disabled, workshop_locked, rate_limited, budget_exhausted.
create or replace function public.workshop_reserve(
  p_book_id uuid,
  p_version_id uuid,
  p_chapter_id uuid,
  p_tool text,
  p_estimate numeric
)
returns table (
  request_id uuid,
  refusal text,
  model text,
  input_price numeric,
  output_price numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid := public.workshop_my_author();
  v_settings public.workshop_settings;
  v_count integer;
  v_budget numeric;
  v_id uuid;
begin
  if v_author is null or not exists (
    select 1 from public.books where id = p_book_id and author_id = v_author
  ) then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_tool not in ('proofread', 'style', 'listing') then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;
  if p_version_id is not null and not exists (
    select 1 from public.book_versions where id = p_version_id and book_id = p_book_id
  ) then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;
  if p_chapter_id is not null and (p_version_id is null or not exists (
    select 1 from public.chapters where id = p_chapter_id and version_id = p_version_id
  )) then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;
  if p_tool in ('proofread', 'style') and p_chapter_id is null then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;
  if p_estimate is null or p_estimate < 0 or p_estimate > 20 then
    raise exception 'invalid_estimate' using errcode = 'P0001';
  end if;

  select * into v_settings from public.workshop_settings where id;
  if not v_settings.enabled then
    return query select null::uuid, 'workshop_disabled'::text, null::text, null::numeric,
      null::numeric;
    return;
  end if;

  v_budget := public.workshop_budget(v_author);
  if v_budget <= 0 then
    return query select null::uuid, 'workshop_locked'::text, null::text, null::numeric,
      null::numeric;
    return;
  end if;

  -- Sérialise les demandes d'un même auteur
  perform pg_advisory_xact_lock(hashtext('workshop:author:' || v_author::text));

  select count(*) into v_count from public.workshop_requests
  where author_id = v_author
    and created_at > now() - make_interval(mins => v_settings.rate_window);
  if v_count >= v_settings.rate_limit then
    return query select null::uuid, 'rate_limited'::text, null::text, null::numeric,
      null::numeric;
    return;
  end if;

  if public.workshop_spent(v_author) + p_estimate > v_budget then
    return query select null::uuid, 'budget_exhausted'::text, null::text, null::numeric,
      null::numeric;
    return;
  end if;

  insert into public.workshop_requests (
    author_id, user_id, book_id, version_id, chapter_id, tool, model, input_price,
    output_price, estimate_usd
  )
  values (
    v_author, auth.uid(), p_book_id, p_version_id, p_chapter_id, p_tool, v_settings.model,
    v_settings.input_price, v_settings.output_price, p_estimate
  )
  returning id into v_id;

  return query select v_id, null::text, v_settings.model, v_settings.input_price,
    v_settings.output_price;
end;
$$;

revoke execute on function public.workshop_reserve(uuid, uuid, uuid, text, numeric)
  from public, anon;
grant execute on function public.workshop_reserve(uuid, uuid, uuid, text, numeric)
  to authenticated;

-- Clôt une demande au coût réel (prix figés à la réservation) ; serveur seulement
create or replace function public.workshop_complete(
  p_request_id uuid,
  p_status text,
  p_served_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_input jsonb,
  p_output jsonb,
  p_error text
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost numeric;
begin
  if p_status not in ('done', 'failed', 'refused') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  update public.workshop_requests
  set status = p_status,
      served_model = left(p_served_model, 80),
      input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
      output_tokens = greatest(coalesce(p_output_tokens, 0), 0),
      cost_usd = (greatest(coalesce(p_input_tokens, 0), 0) * input_price
        + greatest(coalesce(p_output_tokens, 0), 0) * output_price) / 1000000,
      input = p_input,
      output = p_output,
      error = left(p_error, 500),
      completed_at = now()
  where id = p_request_id and status = 'pending'
  returning cost_usd into v_cost;
  if not found then
    raise exception 'request_not_pending' using errcode = 'P0001';
  end if;
  return v_cost;
end;
$$;

revoke execute on function public.workshop_complete(
  uuid, text, text, integer, integer, jsonb, jsonb, text
) from public, anon, authenticated;
grant execute on function public.workshop_complete(
  uuid, text, text, integer, integer, jsonb, jsonb, text
) to service_role;

-- ==================== FONCTIONS : CRÉATION D'UNE COMMANDE ====================

-- Commande d'un forfait Atelier par un auteur. Un code promo ne s'applique que s'il vaut
-- pour tout le site (cible 'workshop' : seule la portée 'all' correspond).
create or replace function public.create_workshop_order(
  p_pack_id uuid,
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
  v_pack public.workshop_packs;
  v_promo public.promo_codes;
  v_discount integer := 0;
  v_amount integer;
  v_label text;
  v_item_label text;
  v_order_id uuid;
begin
  if v_user_id is null or public.workshop_my_author() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_currency not in ('XOF', 'EUR', 'CAD') then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;

  select * into v_pack from public.workshop_packs where id = p_pack_id and active;
  v_amount := public.price_to_minor(p_currency, v_pack.price_xof, v_pack.price_eur,
    v_pack.price_cad);
  if v_pack.id is null or v_amount is null or v_amount <= 0 then
    raise exception 'not_for_sale' using errcode = 'P0001';
  end if;
  v_item_label := 'Crédits Atelier « ' || v_pack.name || ' »';

  v_label := v_item_label;
  if nullif(btrim(coalesce(p_promo_code, '')), '') is not null then
    v_promo := public.promo_check(v_user_id, p_promo_code, 'workshop', null);
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

  insert into public.order_items (order_id, kind, workshop_pack_id, unit_minor, label)
  values (v_order_id, 'workshop_pack', v_pack.id, v_amount, v_item_label);

  return query select v_order_id, v_amount - v_discount, v_label;
end;
$$;

revoke execute on function public.create_workshop_order(uuid, text, text) from public, anon;
grant execute on function public.create_workshop_order(uuid, text, text) to authenticated;

-- ==================== FONCTIONS : LIVRAISON ====================

-- Remplacée : ajoute les crédits Atelier (à la fiche auteur de l'acheteur)
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
      i.practice_case, i.workshop_pack_id, b.pdf_enabled, b.grants_study_credit, b.title,
      p.cost_usd, p.name as pack_name, w.cost_usd as workshop_cost
    from public.order_items i
    left join public.books b on b.id = i.book_id
    left join public.coach_packs p on p.id = i.coach_pack_id
    left join public.workshop_packs w on w.id = i.workshop_pack_id
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
    elsif v_item.kind = 'practice_case' and v_item.practice_case is not null then
      insert into public.practice_case_access (user_id, case_code, source, order_id)
      values (v_user_id, v_item.practice_case, 'purchase', p_order_id)
      on conflict (user_id, case_code) where revoked_at is null do nothing;
    elsif v_item.kind = 'workshop_pack' and v_item.workshop_cost is not null then
      insert into public.workshop_allowances
        (author_id, amount_usd, source, note, pack_id, order_id, granted_by)
      select a.id, v_item.workshop_cost, 'purchase', v_item.label, v_item.workshop_pack_id,
        p_order_id, v_user_id
      from public.authors a
      where a.user_id = v_user_id;
    end if;
  end loop;
end;
$$;

revoke execute on function public.fulfil_order(uuid) from public, anon, authenticated;

-- ==================== FONCTIONS : REMBOURSEMENT ====================

-- Remplacée : retire aussi les crédits Atelier de la commande (le solde peut devenir
-- négatif si l'auteur les a déjà consommés : les outils se verrouillent alors)
create or replace function public.apply_order_refund(
  p_order public.orders,
  p_refund_id text,
  p_source text
)
returns table (credits_removed integer, credits_kept integer, packs_removed integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_removed integer;
  v_kept integer;
  v_packs integer;
  v_cases integer;
  v_workshop integer;
begin
  update public.orders
  set status = 'refunded', refunded_at = now(), refund_id = p_refund_id
  where id = p_order.id;

  update public.entitlements set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;
  update public.pdf_purchases set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;

  delete from public.study_credits where order_id = p_order.id and consumed_at is null;
  get diagnostics v_removed = row_count;
  select count(*)::integer into v_kept from public.study_credits where order_id = p_order.id;

  delete from public.coach_allowances where order_id = p_order.id;
  get diagnostics v_packs = row_count;

  update public.practice_case_access set revoked_at = now()
  where order_id = p_order.id and revoked_at is null;
  get diagnostics v_cases = row_count;

  delete from public.workshop_allowances where order_id = p_order.id;
  get diagnostics v_workshop = row_count;

  -- Insertion directe : write_audit exige un administrateur, absent pour le webhook
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'order.refund', 'order', p_order.id::text,
    jsonb_build_object('refund', p_refund_id, 'total_minor', p_order.total_minor,
      'currency', p_order.currency, 'credits_removed', v_removed,
      'credits_kept', v_kept, 'packs_removed', v_packs, 'cases_removed', v_cases,
      'workshop_removed', v_workshop, 'source', p_source));

  return query select v_removed, v_kept, v_packs + v_workshop;
end;
$$;

revoke execute on function public.apply_order_refund(public.orders, text, text)
  from public, anon, authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Modifie les réglages de l'atelier ; administrateur seulement
create or replace function public.admin_update_workshop_settings(
  p_enabled boolean,
  p_model text,
  p_input_price numeric,
  p_output_price numeric,
  p_rate_limit integer,
  p_rate_window integer
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
  if char_length(btrim(coalesce(p_model, ''))) not between 1 and 80
    or btrim(p_model) !~ '^[a-z0-9][a-z0-9.\-]*$' then
    raise exception 'invalid_model' using errcode = 'P0001';
  end if;
  if p_input_price is null or p_input_price < 0 or p_input_price > 1000
    or p_output_price is null or p_output_price < 0 or p_output_price > 1000 then
    raise exception 'invalid_price' using errcode = 'P0001';
  end if;
  if p_rate_limit is null or p_rate_limit not between 1 and 1000
    or p_rate_window is null or p_rate_window not between 1 and 1440 then
    raise exception 'invalid_rate' using errcode = 'P0001';
  end if;

  update public.workshop_settings
  set enabled = coalesce(p_enabled, enabled), model = btrim(p_model),
    input_price = p_input_price, output_price = p_output_price,
    rate_limit = p_rate_limit, rate_window = p_rate_window
  where id;

  perform public.write_audit('workshop.settings', 'workshop_settings', 'true',
    jsonb_build_object('enabled', p_enabled, 'model', btrim(p_model),
      'input_price', p_input_price, 'output_price', p_output_price));
end;
$$;

revoke execute on function public.admin_update_workshop_settings(
  boolean, text, numeric, numeric, integer, integer
) from public, anon;
grant execute on function public.admin_update_workshop_settings(
  boolean, text, numeric, numeric, integer, integer
) to authenticated;

-- Crée (p_id null) ou modifie un forfait Atelier ; administrateur seulement
create or replace function public.admin_save_workshop_pack(
  p_id uuid,
  p_name text,
  p_cost numeric,
  p_price_xof integer,
  p_price_eur numeric,
  p_price_cad numeric,
  p_active boolean,
  p_position integer
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

  if p_id is null then
    insert into public.workshop_packs (
      name, cost_usd, price_xof, price_eur, price_cad, active, position
    )
    values (btrim(p_name), p_cost, p_price_xof, p_price_eur, p_price_cad,
      coalesce(p_active, true), coalesce(p_position, 0))
    returning id into v_id;
  else
    update public.workshop_packs
    set name = btrim(p_name), cost_usd = p_cost, price_xof = p_price_xof,
      price_eur = p_price_eur, price_cad = p_price_cad, active = coalesce(p_active, active),
      position = coalesce(p_position, position)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'pack_not_found' using errcode = 'P0001';
    end if;
  end if;

  perform public.write_audit('workshop.pack', 'workshop_pack', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'cost', p_cost, 'active', p_active));
  return v_id;
end;
$$;

revoke execute on function public.admin_save_workshop_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer
) from public, anon;
grant execute on function public.admin_save_workshop_pack(
  uuid, text, numeric, integer, numeric, numeric, boolean, integer
) to authenticated;

-- Accorde un forfait Atelier à un auteur ; administrateur seulement
create or replace function public.admin_grant_workshop_pack(
  p_author_id uuid,
  p_pack_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pack public.workshop_packs;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if not exists (select 1 from public.authors where id = p_author_id) then
    raise exception 'author_not_found' using errcode = 'P0001';
  end if;
  select * into v_pack from public.workshop_packs where id = p_pack_id;
  if v_pack.id is null then
    raise exception 'pack_not_found' using errcode = 'P0001';
  end if;

  insert into public.workshop_allowances
    (author_id, amount_usd, source, note, granted_by, pack_id)
  values (p_author_id, v_pack.cost_usd, 'admin_grant', nullif(btrim(p_note), ''),
    auth.uid(), v_pack.id);

  perform public.write_audit('workshop.allowance', 'author', p_author_id::text,
    jsonb_build_object('pack', v_pack.name, 'amount', v_pack.cost_usd,
      'note', nullif(btrim(p_note), '')));
end;
$$;

revoke execute on function public.admin_grant_workshop_pack(uuid, uuid, text)
  from public, anon;
grant execute on function public.admin_grant_workshop_pack(uuid, uuid, text)
  to authenticated;

-- Consommation par auteur (auteurs ayant des crédits ou des demandes)
create or replace function public.admin_workshop_usage()
returns table (
  author_id uuid,
  display_name text,
  email text,
  requests integer,
  spent numeric,
  budget numeric,
  last_at timestamptz
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
    select a.id, a.display_name, u.email::text, count(r.id)::integer,
      public.workshop_spent(a.id), public.workshop_budget(a.id), max(r.created_at)
    from public.authors a
    left join public.workshop_requests r on r.author_id = a.id
    left join auth.users u on u.id = a.user_id
    where exists (select 1 from public.workshop_requests x where x.author_id = a.id)
      or exists (select 1 from public.workshop_allowances w where w.author_id = a.id)
    group by a.id, a.display_name, u.email
    order by max(r.created_at) desc nulls last
    limit 200;
end;
$$;

revoke execute on function public.admin_workshop_usage() from public, anon;
grant execute on function public.admin_workshop_usage() to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.workshop_settings enable row level security;
alter table public.workshop_packs enable row level security;
alter table public.workshop_allowances enable row level security;
alter table public.workshop_requests enable row level security;

-- Réglages, forfaits et crédits : administrateur seulement (montants en dollars) ;
-- les auteurs passent par workshop_my_balance et workshop_pack_offers
create policy "workshop_settings_select_admin" on public.workshop_settings
  for select to authenticated using ((select public.is_admin()));
create policy "workshop_packs_select_admin" on public.workshop_packs
  for select to authenticated using ((select public.is_admin()));
create policy "workshop_allowances_select_admin" on public.workshop_allowances
  for select to authenticated using ((select public.is_admin()));

-- Demandes : l'auteur lit les siennes (suggestions à accepter), l'administrateur toutes
create policy "workshop_requests_select_own_or_admin" on public.workshop_requests
  for select to authenticated
  using (
    author_id = (select public.workshop_my_author()) or (select public.is_admin())
  );

revoke insert, update, delete on public.workshop_settings from anon, authenticated;
revoke insert, update, delete on public.workshop_packs from anon, authenticated;
revoke insert, update, delete on public.workshop_allowances from anon, authenticated;
revoke insert, update, delete on public.workshop_requests from anon, authenticated;
