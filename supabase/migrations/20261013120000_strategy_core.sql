-- =============================================================
--  Fichier    : 20261013120000_strategy_core.sql
--  Projet     : Kalami Stratégie
--  Description: Sprints S0 et S1 de l'assistant stratégie : référence des 9 étapes et de
--               leurs prérequis, crédits d'étude (accordés par l'administrateur jusqu'à
--               l'ouverture des paiements), études, membres et rôles, profil de
--               l'entreprise, étapes d'une étude (statuts, validation, invalidation en
--               cascade). Toutes les écritures passent par des fonctions SQL.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-11
--  Dépendances: 20261006120000_profiles_roles.sql, 20261007120000_catalog.sql (write_audit)
-- =============================================================

-- ==================== RÉFÉRENCE DES ÉTAPES ====================

-- Démarche du livre : étapes, module correspondant, phase et prérequis (source unique du graphe)
create table public.strategy_steps (
  step_no smallint primary key check (step_no between 1 and 9),
  key text not null unique,
  module smallint not null,
  phase text not null check (phase in ('understand', 'synthesize', 'decide', 'act')),
  prerequisites smallint[] not null default '{}',
  requires_profile boolean not null default false,
  lock_reason text not null check (char_length(lock_reason) <= 500)
);

comment on table public.strategy_steps is
  'Étapes de la démarche ; lock_reason est modifiable par l''administrateur.';

insert into public.strategy_steps
  (step_no, key, module, phase, prerequisites, requires_profile, lock_reason)
values
  (1, 'external', 2, 'understand', '{}', true,
   'L''analyse de l''environnement part du profil de l''entreprise : secteur, pays, offre.'),
  (2, 'competitive', 3, 'understand', '{}', true,
   'L''analyse concurrentielle part du profil de l''entreprise : secteur, offre, concurrents.'),
  (3, 'internal', 4, 'understand', '{}', true,
   'L''analyse interne part du profil de l''entreprise : organisation, offre.'),
  (4, 'stakeholders', 6, 'understand', '{}', true,
   'L''analyse des parties prenantes part du profil de l''entreprise.'),
  (5, 'synthesis', 5, 'synthesize', '{1,2,3,4}', false,
   'La synthèse rassemble les constats des quatre analyses : elles doivent être validées.'),
  (6, 'direction', 7, 'decide', '{5}', false,
   'Le cap se fixe à partir des enjeux dégagés par la synthèse.'),
  (7, 'choice', 8, 'decide', '{6}', false,
   'Les options stratégiques s''évaluent au regard du cap et des objectifs fixés.'),
  (8, 'action', 9, 'act', '{7}', false,
   'La feuille de route met en œuvre la stratégie retenue.'),
  (9, 'plan', 10, 'act', '{8}', false,
   'Le plan stratégique se rédige quand les huit étapes sont validées.');

-- ==================== ÉTUDES ====================

create table public.studies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null check (char_length(company_name) between 1 and 200),
  strategic_question text not null default '' check (char_length(strategic_question) <= 1000),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index studies_owner_idx on public.studies (owner_id);

create trigger studies_set_updated_at
  before update on public.studies
  for each row execute function public.set_updated_at();

-- Membres et rôles : propriétaire (un seul), contributeur, observateur
create table public.study_members (
  study_id uuid not null references public.studies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'contributor', 'observer')),
  created_at timestamptz not null default now(),
  primary key (study_id, user_id)
);

create unique index study_members_one_owner_idx
  on public.study_members (study_id) where role = 'owner';
create index study_members_user_idx on public.study_members (user_id);

-- ==================== CRÉDITS D'ÉTUDE ====================

-- Une ligne = un crédit ; consommé une seule fois par la création d'une étude.
-- Source « admin_grant » jusqu'au S11, puis « purchase » (webhook de paiement).
create table public.study_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('admin_grant', 'purchase')),
  note text check (char_length(note) <= 500),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  study_id uuid references public.studies (id) on delete set null
);

create index study_credits_available_idx
  on public.study_credits (user_id, created_at) where consumed_at is null;

-- ==================== PROFIL DE L'ENTREPRISE ====================

-- Réponses au questionnaire (validées par Zod côté serveur avant écriture)
create table public.company_profiles (
  study_id uuid primary key references public.studies (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ==================== ÉTAPES D'UNE ÉTUDE ====================

-- « submitted » (soumise au coach) sera utilisé à partir du S4 ; payload à partir du S2
create table public.study_steps (
  study_id uuid not null references public.studies (id) on delete cascade,
  step_no smallint not null references public.strategy_steps (step_no),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'submitted', 'validated', 'needs_review')),
  assignee_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  review_reasons jsonb not null default '[]'::jsonb check (jsonb_typeof(review_reasons) = 'array'),
  validated_at timestamptz,
  validated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (study_id, step_no)
);

create trigger study_steps_set_updated_at
  before update on public.study_steps
  for each row execute function public.set_updated_at();

-- ==================== FONCTIONS D'ACCÈS ====================

-- Rôle de l'utilisateur courant dans l'étude (null s'il n'est pas membre)
create or replace function public.study_role(p_study_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.study_members
  where study_id = p_study_id and user_id = auth.uid();
$$;

revoke execute on function public.study_role(uuid) from public, anon;
grant execute on function public.study_role(uuid) to authenticated;

-- Vrai si le profil contient les réponses indispensables (miroir de isProfileComplete en TS)
create or replace function public.strategy_profile_complete(p_study_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select btrim(s.strategic_question) <> ''
      and btrim(coalesce(p.data ->> 'sector', '')) <> ''
      and jsonb_typeof(p.data -> 'countries') = 'array'
      and jsonb_array_length(p.data -> 'countries') > 0
      and jsonb_typeof(p.data -> 'offers') = 'array'
      and jsonb_array_length(p.data -> 'offers') > 0
    from public.studies s
    join public.company_profiles p on p.study_id = s.id
    where s.id = p_study_id
  ), false);
$$;

revoke execute on function public.strategy_profile_complete(uuid) from public, anon;
grant execute on function public.strategy_profile_complete(uuid) to authenticated;

-- Prérequis manquants d'une étape ; 0 signifie « profil incomplet »
create or replace function public.strategy_missing_prerequisites(
  p_study_id uuid,
  p_step_no smallint
)
returns smallint[]
language sql
stable
security definer
set search_path = ''
as $$
  select
    (case
      when d.requires_profile and not public.strategy_profile_complete(p_study_id)
      then array[0::smallint] else '{}'::smallint[]
    end)
    || coalesce((
      select array_agg(pre order by pre)
      from unnest(d.prerequisites) as pre
      where not exists (
        select 1 from public.study_steps st
        where st.study_id = p_study_id and st.step_no = pre and st.status = 'validated'
      )
    ), '{}'::smallint[])
  from public.strategy_steps d
  where d.step_no = p_step_no;
$$;

revoke execute on function public.strategy_missing_prerequisites(uuid, smallint)
  from public, anon;
grant execute on function public.strategy_missing_prerequisites(uuid, smallint)
  to authenticated;

-- ==================== FONCTIONS : ÉTUDE ET PROFIL ====================

-- Crée une étude en consommant un crédit : membre propriétaire, 9 étapes, profil vide
create or replace function public.strategy_create_study(
  p_company_name text,
  p_strategic_question text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credit_id uuid;
  v_study_id uuid;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  -- Verrouille le plus ancien crédit disponible (deux créations simultanées : deux crédits)
  select id into v_credit_id
  from public.study_credits
  where user_id = auth.uid() and consumed_at is null
  order by created_at
  limit 1
  for update skip locked;
  if v_credit_id is null then
    raise exception 'no_credit' using errcode = 'P0001';
  end if;

  insert into public.studies (owner_id, company_name, strategic_question)
  values (auth.uid(), btrim(p_company_name), coalesce(btrim(p_strategic_question), ''))
  returning id into v_study_id;

  insert into public.study_members (study_id, user_id, role)
  values (v_study_id, auth.uid(), 'owner');

  insert into public.study_steps (study_id, step_no)
  select v_study_id, step_no from public.strategy_steps;

  insert into public.company_profiles (study_id, updated_by)
  values (v_study_id, auth.uid());

  update public.study_credits
  set consumed_at = now(), study_id = v_study_id
  where id = v_credit_id;

  return v_study_id;
end;
$$;

revoke execute on function public.strategy_create_study(text, text) from public, anon;
grant execute on function public.strategy_create_study(text, text) to authenticated;

-- Enregistre le profil (propriétaire ou contributeur). Ne déclenche aucune cascade.
create or replace function public.strategy_save_profile(
  p_study_id uuid,
  p_company_name text,
  p_strategic_question text,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'invalid_profile' using errcode = 'P0001';
  end if;

  update public.studies
  set company_name = btrim(p_company_name),
      strategic_question = coalesce(btrim(p_strategic_question), '')
  where id = p_study_id;

  update public.company_profiles
  set data = p_data, updated_by = auth.uid(), updated_at = now()
  where study_id = p_study_id;
end;
$$;

revoke execute on function public.strategy_save_profile(uuid, text, text, jsonb)
  from public, anon;
grant execute on function public.strategy_save_profile(uuid, text, text, jsonb)
  to authenticated;

-- ==================== FONCTIONS : ÉTAPES ====================

-- Commence une étape ouverte (propriétaire ou contributeur) : « à faire » → « en cours »
create or replace function public.strategy_start_step(p_study_id uuid, p_step_no smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if cardinality(public.strategy_missing_prerequisites(p_study_id, p_step_no)) > 0 then
    raise exception 'prerequisites_missing' using errcode = 'P0001';
  end if;

  update public.study_steps
  set status = 'in_progress'
  where study_id = p_study_id and step_no = p_step_no and status = 'todo';
  update public.studies set updated_at = now() where id = p_study_id;
end;
$$;

revoke execute on function public.strategy_start_step(uuid, smallint) from public, anon;
grant execute on function public.strategy_start_step(uuid, smallint) to authenticated;

-- Valide une étape (propriétaire seulement), si tous ses prérequis sont validés.
-- L'étape 9 (plan) n'est jamais validée à la main : elle suit la génération du plan (S8).
create or replace function public.strategy_validate_step(p_study_id uuid, p_step_no smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if public.study_role(p_study_id) is distinct from 'owner' then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if p_step_no = 9 then
    raise exception 'plan_step' using errcode = 'P0001';
  end if;
  if cardinality(public.strategy_missing_prerequisites(p_study_id, p_step_no)) > 0 then
    raise exception 'prerequisites_missing' using errcode = 'P0001';
  end if;

  select status into v_status from public.study_steps
  where study_id = p_study_id and step_no = p_step_no
  for update;
  if v_status = 'todo' then
    raise exception 'not_started' using errcode = 'P0001';
  end if;
  if v_status = 'validated' then
    return;
  end if;

  update public.study_steps
  set status = 'validated', validated_at = now(), validated_by = auth.uid(),
      review_reasons = '[]'::jsonb
  where study_id = p_study_id and step_no = p_step_no;
  update public.studies set updated_at = now() where id = p_study_id;
end;
$$;

revoke execute on function public.strategy_validate_step(uuid, smallint) from public, anon;
grant execute on function public.strategy_validate_step(uuid, smallint) to authenticated;

-- Rouvre une étape validée (propriétaire ou contributeur) : elle repasse « en cours » et
-- toutes les étapes en aval déjà commencées passent « à revoir », avec l'étape d'origine.
-- Retourne le nombre d'étapes aval touchées.
create or replace function public.strategy_reopen_step(p_study_id uuid, p_step_no smallint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  update public.study_steps
  set status = 'in_progress', validated_at = null, validated_by = null
  where study_id = p_study_id and step_no = p_step_no and status = 'validated';
  if not found then
    raise exception 'not_validated' using errcode = 'P0001';
  end if;

  with recursive downstream(step_no) as (
    select d.step_no from public.strategy_steps d where p_step_no = any (d.prerequisites)
    union
    select d.step_no
    from public.strategy_steps d
    join downstream ds on ds.step_no = any (d.prerequisites)
  )
  update public.study_steps st
  set status = 'needs_review',
      validated_at = null,
      validated_by = null,
      review_reasons = st.review_reasons
        || jsonb_build_array(jsonb_build_object('step', p_step_no, 'at', now()))
  from downstream ds
  where st.study_id = p_study_id and st.step_no = ds.step_no and st.status <> 'todo';
  get diagnostics v_count = row_count;

  update public.studies set updated_at = now() where id = p_study_id;
  return v_count;
end;
$$;

revoke execute on function public.strategy_reopen_step(uuid, smallint) from public, anon;
grant execute on function public.strategy_reopen_step(uuid, smallint) to authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Accorde des crédits d'étude à un compte existant, identifié par son courriel
create or replace function public.strategy_grant_credits(
  p_email text,
  p_quantity integer,
  p_note text
)
returns uuid
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
  if p_quantity is null or p_quantity not between 1 and 100 then
    raise exception 'invalid_quantity' using errcode = 'P0001';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_user_id is null then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  insert into public.study_credits (user_id, source, note, granted_by)
  select v_user_id, 'admin_grant', nullif(btrim(p_note), ''), auth.uid()
  from generate_series(1, p_quantity);

  perform public.write_audit(
    'strategy.credits.grant', 'user', v_user_id::text,
    jsonb_build_object('quantity', p_quantity, 'note', nullif(btrim(p_note), ''))
  );
  return v_user_id;
end;
$$;

revoke execute on function public.strategy_grant_credits(text, integer, text) from public, anon;
grant execute on function public.strategy_grant_credits(text, integer, text) to authenticated;

-- Vue d'ensemble pour l'administrateur : métadonnées seulement, jamais le contenu des études
create or replace function public.admin_strategy_studies()
returns table (
  id uuid,
  company_name text,
  owner_email text,
  created_at timestamptz,
  updated_at timestamptz,
  validated_steps integer
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
    select s.id, s.company_name, u.email::text, s.created_at, s.updated_at,
      (select count(*)::integer from public.study_steps st
       where st.study_id = s.id and st.status = 'validated')
    from public.studies s
    left join auth.users u on u.id = s.owner_id
    order by s.updated_at desc
    limit 200;
end;
$$;

revoke execute on function public.admin_strategy_studies() from public, anon;
grant execute on function public.admin_strategy_studies() to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.strategy_steps enable row level security;
alter table public.studies enable row level security;
alter table public.study_members enable row level security;
alter table public.study_credits enable row level security;
alter table public.company_profiles enable row level security;
alter table public.study_steps enable row level security;

-- Référence des étapes : lecture publique ; modification administrateur
create policy "strategy_steps_select_all" on public.strategy_steps
  for select to anon, authenticated using (true);
create policy "strategy_steps_admin_update" on public.strategy_steps
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Études et contenu : membres seulement (l'administrateur passe par admin_strategy_studies)
create policy "studies_select_member" on public.studies
  for select to authenticated
  using ((select public.study_role(id)) is not null);

create policy "study_members_select_member" on public.study_members
  for select to authenticated
  using ((select public.study_role(study_id)) is not null);

create policy "company_profiles_select_member" on public.company_profiles
  for select to authenticated
  using ((select public.study_role(study_id)) is not null);

create policy "study_steps_select_member" on public.study_steps
  for select to authenticated
  using ((select public.study_role(study_id)) is not null);

-- Crédits : chacun voit les siens ; l'administrateur voit tout
create policy "study_credits_select_own_or_admin" on public.study_credits
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Aucune écriture directe : uniquement par les fonctions ci-dessus
revoke insert, update, delete on public.strategy_steps from anon, authenticated;
grant update (lock_reason) on public.strategy_steps to authenticated;
revoke insert, update, delete on public.studies from anon, authenticated;
revoke insert, update, delete on public.study_members from anon, authenticated;
revoke insert, update, delete on public.study_credits from anon, authenticated;
revoke insert, update, delete on public.company_profiles from anon, authenticated;
revoke insert, update, delete on public.study_steps from anon, authenticated;
