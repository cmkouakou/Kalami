-- =============================================================
--  Fichier    : 20261113120000_practice_cases.sql
--  Projet     : Kalami
--  Description: Cas d'entraînement de Kalami Stratégie (S10b, v0.14.0). Un cas (Ajinomoto)
--               se vend comme une offre Stratégie (carte, Mobile Money, code promo) ou
--               s'accorde par l'administrateur. L'accès ouvre une étude préremplie, sans
--               crédit (profil et question du cas, envoyés par le serveur), et le corrigé
--               de chaque étape se déverrouille quand l'acheteur valide la même étape
--               (le plan et l'épilogue quand les étapes 1 à 8 sont validées), sauf si
--               l'interrupteur « tout de suite » du cas est allumé. L'énoncé et le corrigé
--               restent dans le code du serveur ; la base ne garde que les droits.
--               Un remboursement retire l'accès (l'étude de l'acheteur reste).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-23
--  Dépendances: 20261105120000_strategy_orders.sql, 20261106120000_promo_codes.sql,
--               20261111130000_refund_audit.sql
-- =============================================================

-- ==================== CAS ====================

-- Un code fixe par cas (même code que le dossier src/lib/strategy/cases/<code>) ; prix vides
-- et cas fermé tant que l'administrateur ne les a pas saisis
create table public.practice_cases (
  code text primary key check (code ~ '^[a-z0-9-]{2,40}$'),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  price_xof integer check (price_xof > 0),
  price_eur numeric(10, 2) check (price_eur > 0),
  price_cad numeric(10, 2) check (price_cad > 0),
  active boolean not null default false,
  unlock_immediately boolean not null default false,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger practice_cases_set_updated_at
  before update on public.practice_cases
  for each row execute function public.set_updated_at();

insert into public.practice_cases (code, title, position)
values ('ajinomoto', 'Cas Ajinomoto Afrique de l''Ouest', 1);

-- ==================== ACCÈS ====================

-- Un accès actif par compte et par cas ; l'étude est créée à la première ouverture.
-- unlocked_steps garde les corrigés déjà ouverts (une étape rouverte ne les referme pas).
create table public.practice_case_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_code text not null references public.practice_cases (code) on delete cascade,
  source text not null check (source in ('purchase', 'admin_grant')),
  order_id uuid references public.orders (id) on delete set null,
  granted_by uuid references auth.users (id) on delete set null,
  study_id uuid references public.studies (id) on delete set null,
  unlocked_steps smallint[] not null default '{}',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index practice_case_access_active
  on public.practice_case_access (user_id, case_code) where revoked_at is null;
create index practice_case_access_study_idx
  on public.practice_case_access (study_id) where study_id is not null;
create index practice_case_access_order_idx
  on public.practice_case_access (order_id) where order_id is not null;

-- Étude ouverte depuis un cas (la page du cas y retrouve le corrigé à comparer)
alter table public.studies
  add column practice_case text references public.practice_cases (code) on delete restrict;

-- ==================== COMMANDES : ARTICLE « CAS » ====================

alter table public.order_items drop constraint order_items_kind_check;
alter table public.order_items
  add constraint order_items_kind_check
  check (kind in ('book', 'study', 'study_lot', 'coach_pack', 'practice_case'));
alter table public.order_items
  add column practice_case text references public.practice_cases (code) on delete set null,
  add constraint order_items_practice_case_check
    check (kind <> 'practice_case' or practice_case is not null);

-- ==================== FONCTIONS : DÉVERROUILLAGE ====================

-- Corrigés ouverts après la validation d'une étape d'une étude de cas : l'étape validée,
-- puis le plan (9) quand les étapes 1 à 8 l'ont été
create or replace function public.practice_case_unlock_on_validate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'validated' and old.status is distinct from 'validated' then
    update public.practice_case_access a
    set unlocked_steps = (
      select array_agg(distinct s order by s)
      from unnest(a.unlocked_steps || array[new.step_no]) s
    )
    where a.study_id = new.study_id and a.revoked_at is null;

    update public.practice_case_access a
    set unlocked_steps = a.unlocked_steps || array[9::smallint]
    where a.study_id = new.study_id and a.revoked_at is null
      and not (9::smallint = any (a.unlocked_steps))
      and (select count(distinct s) from unnest(a.unlocked_steps) s where s between 1 and 8)
        = 8;
  end if;
  return new;
end;
$$;

revoke execute on function public.practice_case_unlock_on_validate()
  from public, anon, authenticated;

create trigger study_steps_practice_case_unlock
  after update of status on public.study_steps
  for each row execute function public.practice_case_unlock_on_validate();

-- ==================== FONCTIONS : ACHETEUR ====================

-- Cas ouverts à la vente (prix publics)
create or replace function public.practice_case_list()
returns table (
  code text,
  title text,
  price_xof integer,
  price_eur numeric,
  price_cad numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.code, c.title, c.price_xof, c.price_eur, c.price_cad
  from public.practice_cases c
  where c.active
  order by c.position, c.code;
$$;

revoke execute on function public.practice_case_list() from public;
grant execute on function public.practice_case_list() to anon, authenticated;

-- Accès actif du compte connecté à un cas (aucune ligne : pas d'accès)
create or replace function public.practice_case_my_access(p_code text)
returns table (
  study_id uuid,
  unlocked_steps smallint[],
  unlock_immediately boolean,
  source text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    -- Étude supprimée ou quittée : l'accès reste, une nouvelle étude sera ouverte
    case when exists (
      select 1 from public.study_members m
      where m.study_id = a.study_id and m.user_id = a.user_id and m.role = 'owner'
    ) then a.study_id end,
    a.unlocked_steps, c.unlock_immediately, a.source
  from public.practice_case_access a
  join public.practice_cases c on c.code = a.case_code
  where a.user_id = auth.uid() and a.case_code = p_code and a.revoked_at is null;
$$;

revoke execute on function public.practice_case_my_access(text) from public, anon;
grant execute on function public.practice_case_my_access(text) to authenticated;

-- Ouvre l'étude préremplie d'un cas (sans crédit), ou renvoie celle déjà ouverte.
-- Le profil vient du serveur (données du cas) : l'acheteur peut ensuite le modifier comme
-- dans toute étude. Erreurs : no_access, invalid_profile.
create or replace function public.practice_case_start(
  p_code text,
  p_company_name text,
  p_strategic_question text,
  p_profile jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_access public.practice_case_access;
  v_study_id uuid;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_profile is null or jsonb_typeof(p_profile) <> 'object' then
    raise exception 'invalid_profile' using errcode = 'P0001';
  end if;

  -- Verrou : deux ouvertes simultanées ne créent qu'une étude
  select * into v_access from public.practice_case_access
  where user_id = auth.uid() and case_code = p_code and revoked_at is null
  for update;
  if v_access.id is null then
    raise exception 'no_access' using errcode = 'P0001';
  end if;

  if v_access.study_id is not null and exists (
    select 1 from public.study_members
    where study_id = v_access.study_id and user_id = auth.uid() and role = 'owner'
  ) then
    return v_access.study_id;
  end if;

  -- Accès rendu après un retrait ou un remboursement : l'étude déjà faite est retrouvée,
  -- avec les corrigés des étapes qu'elle a validées
  select s.id into v_study_id
  from public.studies s
  join public.study_members m
    on m.study_id = s.id and m.user_id = auth.uid() and m.role = 'owner'
  where s.practice_case = p_code
  order by s.created_at desc
  limit 1;
  if v_study_id is not null then
    update public.practice_case_access a
    set study_id = v_study_id,
      unlocked_steps = coalesce((
        select array_agg(st.step_no order by st.step_no)
        from public.study_steps st
        where st.study_id = v_study_id and st.status = 'validated'
      ), '{}')
    where a.id = v_access.id;
    update public.practice_case_access a
    set unlocked_steps = a.unlocked_steps || array[9::smallint]
    where a.id = v_access.id
      and not (9::smallint = any (a.unlocked_steps))
      and (select count(distinct s) from unnest(a.unlocked_steps) s where s between 1 and 8)
        = 8;
    return v_study_id;
  end if;

  insert into public.studies (owner_id, company_name, strategic_question, practice_case)
  values (auth.uid(), btrim(p_company_name), coalesce(btrim(p_strategic_question), ''),
    p_code)
  returning id into v_study_id;

  insert into public.study_members (study_id, user_id, role)
  values (v_study_id, auth.uid(), 'owner');

  insert into public.study_steps (study_id, step_no)
  select v_study_id, step_no from public.strategy_steps;

  insert into public.company_profiles (study_id, data, updated_by)
  values (v_study_id, p_profile, auth.uid());

  -- Nouvelle étude : les corrigés se déverrouillent de nouveau étape par étape
  update public.practice_case_access
  set study_id = v_study_id, unlocked_steps = '{}'
  where id = v_access.id;

  return v_study_id;
end;
$$;

revoke execute on function public.practice_case_start(text, text, text, jsonb)
  from public, anon;
grant execute on function public.practice_case_start(text, text, text, jsonb)
  to authenticated;

-- ==================== FONCTIONS : CRÉATION D'UNE COMMANDE ====================

-- Remplacée (article « cas » ajouté) : p_kind 'practice_case', p_code = code du cas ;
-- refusé si le compte a déjà accès au cas (already_owned)
create or replace function public.create_strategy_order(
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
  v_case public.practice_cases;
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
  elsif p_kind = 'practice_case' then
    select * into v_case from public.practice_cases where code = p_code and active;
    if v_case.code is null then
      raise exception 'not_for_sale' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.practice_case_access
      where user_id = v_user_id and case_code = v_case.code and revoked_at is null
    ) then
      raise exception 'already_owned' using errcode = 'P0001';
    end if;
    v_amount := public.price_to_minor(p_currency, v_case.price_xof, v_case.price_eur,
      v_case.price_cad);
    v_item_label := v_case.title;
    v_item_kind := 'practice_case';
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
    (order_id, kind, coach_pack_id, study_id, practice_case, unit_minor, label, credits)
  values (v_order_id, v_item_kind, v_pack.id,
    case when v_item_kind = 'coach_pack' then p_study_id end, v_case.code, v_amount,
    v_item_label, v_credits);

  return query select v_order_id, v_amount - v_discount, v_label;
end;
$$;

revoke execute on function public.create_strategy_order(text, text, text, uuid, uuid, text)
  from public, anon;
grant execute on function public.create_strategy_order(text, text, text, uuid, uuid, text)
  to authenticated;

-- ==================== FONCTIONS : LIVRAISON ====================

-- Remplacée : ajoute l'accès à un cas d'entraînement
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
      i.practice_case, b.pdf_enabled, b.grants_study_credit, b.title, p.cost_usd,
      p.name as pack_name
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
    elsif v_item.kind = 'practice_case' and v_item.practice_case is not null then
      insert into public.practice_case_access (user_id, case_code, source, order_id)
      values (v_user_id, v_item.practice_case, 'purchase', p_order_id)
      on conflict (user_id, case_code) where revoked_at is null do nothing;
    end if;
  end loop;
end;
$$;

revoke execute on function public.fulfil_order(uuid) from public, anon, authenticated;

-- ==================== FONCTIONS : REMBOURSEMENT ====================

-- Remplacée : retire aussi l'accès aux cas achetés par la commande
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

  -- Insertion directe : write_audit exige un administrateur, absent pour le webhook
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'order.refund', 'order', p_order.id::text,
    jsonb_build_object('refund', p_refund_id, 'total_minor', p_order.total_minor,
      'currency', p_order.currency, 'credits_removed', v_removed,
      'credits_kept', v_kept, 'packs_removed', v_packs, 'cases_removed', v_cases,
      'source', p_source));

  return query select v_removed, v_kept, v_packs;
end;
$$;

revoke execute on function public.apply_order_refund(public.orders, text, text)
  from public, anon, authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Tous les cas, ouverts ou non, avec le nombre d'accès actifs
create or replace function public.admin_practice_cases()
returns table (
  code text,
  title text,
  price_xof integer,
  price_eur numeric,
  price_cad numeric,
  active boolean,
  unlock_immediately boolean,
  access_count integer
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
    select c.code, c.title, c.price_xof, c.price_eur, c.price_cad, c.active,
      c.unlock_immediately,
      (select count(*)::integer from public.practice_case_access a
       where a.case_code = c.code and a.revoked_at is null)
    from public.practice_cases c
    order by c.position, c.code;
end;
$$;

revoke execute on function public.admin_practice_cases() from public, anon;
grant execute on function public.admin_practice_cases() to authenticated;

-- Modifie le titre, les prix, l'ouverture à la vente et l'interrupteur « tout de suite ».
-- Erreurs : invalid_name, invalid_price, case_not_found.
create or replace function public.admin_save_practice_case(
  p_code text,
  p_title text,
  p_price_xof integer,
  p_price_eur numeric,
  p_price_cad numeric,
  p_active boolean,
  p_unlock_immediately boolean
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
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 120 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if coalesce(p_price_xof, 1) <= 0 or coalesce(p_price_eur, 1) <= 0
    or coalesce(p_price_cad, 1) <= 0 then
    raise exception 'invalid_price' using errcode = 'P0001';
  end if;

  update public.practice_cases
  set title = btrim(p_title), price_xof = p_price_xof, price_eur = p_price_eur,
    price_cad = p_price_cad, active = coalesce(p_active, active),
    unlock_immediately = coalesce(p_unlock_immediately, unlock_immediately)
  where code = p_code;
  if not found then
    raise exception 'case_not_found' using errcode = 'P0001';
  end if;

  perform public.write_audit('strategy.case', 'practice_case', p_code,
    jsonb_build_object('title', btrim(p_title), 'xof', p_price_xof, 'eur', p_price_eur,
      'cad', p_price_cad, 'active', p_active, 'unlock_immediately', p_unlock_immediately));
end;
$$;

revoke execute on function
  public.admin_save_practice_case(text, text, integer, numeric, numeric, boolean, boolean)
  from public, anon;
grant execute on function
  public.admin_save_practice_case(text, text, integer, numeric, numeric, boolean, boolean)
  to authenticated;

-- Accorde (p_enabled vrai) ou retire l'accès d'un compte à un cas, par son adresse.
-- Erreurs : user_not_found, case_not_found.
create or replace function public.admin_set_practice_case_access(
  p_email text,
  p_code text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select id into v_user_id from auth.users
  where lower(email) = lower(btrim(coalesce(p_email, '')));
  if v_user_id is null then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.practice_cases where code = p_code) then
    raise exception 'case_not_found' using errcode = 'P0001';
  end if;

  if coalesce(p_enabled, false) then
    insert into public.practice_case_access (user_id, case_code, source, granted_by)
    values (v_user_id, p_code, 'admin_grant', auth.uid())
    on conflict (user_id, case_code) where revoked_at is null do nothing;
  else
    update public.practice_case_access set revoked_at = now()
    where user_id = v_user_id and case_code = p_code and revoked_at is null;
  end if;

  perform public.write_audit(
    case when p_enabled then 'strategy.case.grant' else 'strategy.case.revoke' end,
    'practice_case', p_code, jsonb_build_object('user', v_user_id));
end;
$$;

revoke execute on function public.admin_set_practice_case_access(text, text, boolean)
  from public, anon;
grant execute on function public.admin_set_practice_case_access(text, text, boolean)
  to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

-- Aucune écriture directe : fonctions ci-dessus
alter table public.practice_cases enable row level security;
alter table public.practice_case_access enable row level security;

create policy "practice_cases_admin_select" on public.practice_cases
  for select to authenticated
  using (public.is_admin());

create policy "practice_case_access_select" on public.practice_case_access
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
