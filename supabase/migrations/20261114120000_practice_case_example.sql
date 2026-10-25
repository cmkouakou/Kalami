-- =============================================================
--  Fichier    : 20261114120000_practice_case_example.sql
--  Projet     : Kalami
--  Description: Cas résolu (S10b, v0.14.3). En plus de l'exercice (étude vierge et corrigé
--               progressif), l'acheteur d'un cas peut ouvrir une seconde étude, préremplie
--               avec le corrigé de l'auteur aux étapes 1 à 8 (validées) : il y génère
--               lui-même le plan (étape 9) et peut tout modifier, comme dans toute étude.
--               Cette étude ne déverrouille aucun corrigé. Administration : liste des
--               comptes qui ont accès à un cas ; le courriel du compte est écrit dans le
--               journal d'audit des accès accordés ou retirés.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-24
--  Dépendances: 20261113120000_practice_cases.sql, 20261014120000_strategy_templates.sql,
--               20261024120000_strategy_action.sql
-- =============================================================

-- ==================== COLONNES ====================

-- Étude d'un cas ouverte en version résolue (et non en exercice)
alter table public.studies
  add column practice_case_example boolean not null default false;

alter table public.studies
  add constraint studies_practice_case_example_check
    check (not practice_case_example or practice_case is not null);

-- Étude résolue de l'acheteur (null tant qu'elle n'est pas ouverte)
alter table public.practice_case_access
  add column example_study_id uuid references public.studies (id) on delete set null;

-- ==================== FONCTIONS : ACHETEUR ====================

-- Remplacée (étude résolue renvoyée en plus de l'exercice) : le type de retour change
drop function public.practice_case_my_access(text);

create function public.practice_case_my_access(p_code text)
returns table (
  study_id uuid,
  example_study_id uuid,
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
    case when exists (
      select 1 from public.study_members m
      where m.study_id = a.example_study_id and m.user_id = a.user_id and m.role = 'owner'
    ) then a.example_study_id end,
    a.unlocked_steps, c.unlock_immediately, a.source
  from public.practice_case_access a
  join public.practice_cases c on c.code = a.case_code
  where a.user_id = auth.uid() and a.case_code = p_code and a.revoked_at is null;
$$;

revoke execute on function public.practice_case_my_access(text) from public, anon;
grant execute on function public.practice_case_my_access(text) to authenticated;

-- Remplacée : l'étude retrouvée après un retrait ne peut pas être l'étude résolue
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
  where s.practice_case = p_code and not s.practice_case_example
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

-- Ouvre l'étude résolue d'un cas (sans crédit), ou renvoie celle déjà ouverte. p_steps
-- porte le corrigé des étapes 1 à 8 ({"1": {...}, …}), envoyé par le serveur ; une étape
-- dont la liste de contrôle n'est pas remplie reste « en cours ». Le plan (9) est laissé
-- vide : l'acheteur le génère. Erreurs : no_access, invalid_profile, invalid_steps.
create or replace function public.practice_case_start_example(
  p_code text,
  p_company_name text,
  p_strategic_question text,
  p_profile jsonb,
  p_steps jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_access public.practice_case_access;
  v_study_id uuid;
  v_step smallint;
  v_payload jsonb;
  v_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_profile is null or jsonb_typeof(p_profile) <> 'object' then
    raise exception 'invalid_profile' using errcode = 'P0001';
  end if;
  if p_steps is null or jsonb_typeof(p_steps) <> 'object' then
    raise exception 'invalid_steps' using errcode = 'P0001';
  end if;

  -- Verrou : deux ouvertes simultanées ne créent qu'une étude
  select * into v_access from public.practice_case_access
  where user_id = auth.uid() and case_code = p_code and revoked_at is null
  for update;
  if v_access.id is null then
    raise exception 'no_access' using errcode = 'P0001';
  end if;

  if v_access.example_study_id is not null and exists (
    select 1 from public.study_members
    where study_id = v_access.example_study_id and user_id = auth.uid() and role = 'owner'
  ) then
    return v_access.example_study_id;
  end if;

  -- Accès rendu après un retrait : l'étude résolue déjà ouverte est retrouvée
  select s.id into v_study_id
  from public.studies s
  join public.study_members m
    on m.study_id = s.id and m.user_id = auth.uid() and m.role = 'owner'
  where s.practice_case = p_code and s.practice_case_example
  order by s.created_at desc
  limit 1;
  if v_study_id is not null then
    update public.practice_case_access set example_study_id = v_study_id
    where id = v_access.id;
    return v_study_id;
  end if;

  insert into public.studies (owner_id, company_name, strategic_question, practice_case,
    practice_case_example)
  values (auth.uid(), btrim(p_company_name), coalesce(btrim(p_strategic_question), ''),
    p_code, true)
  returning id into v_study_id;

  insert into public.study_members (study_id, user_id, role)
  values (v_study_id, auth.uid(), 'owner');

  insert into public.study_steps (study_id, step_no)
  select v_study_id, step_no from public.strategy_steps;

  insert into public.company_profiles (study_id, data, updated_by)
  values (v_study_id, p_profile, auth.uid());

  -- Étapes 1 à 8 : corrigé de l'auteur, validé si sa liste de contrôle est remplie
  for v_step in 1..8 loop
    v_payload := p_steps -> v_step::text;
    continue when v_payload is null or jsonb_typeof(v_payload) <> 'object';
    v_ok := public.strategy_checklist_ok(v_step, v_payload);
    update public.study_steps
    set payload = v_payload,
      status = case when v_ok then 'validated' else 'in_progress' end,
      validated_at = case when v_ok then now() end,
      validated_by = case when v_ok then auth.uid() end
    where study_id = v_study_id and step_no = v_step;
    -- Version de départ : le corrigé de l'auteur reste restaurable après modification
    perform public.strategy_add_version(v_study_id, v_step, v_payload, 0,
      case when v_ok then 'validation' else 'auto' end);
  end loop;

  update public.practice_case_access set example_study_id = v_study_id
  where id = v_access.id;

  return v_study_id;
end;
$$;

revoke execute on function public.practice_case_start_example(text, text, text, jsonb, jsonb)
  from public, anon;
grant execute on function public.practice_case_start_example(text, text, text, jsonb, jsonb)
  to authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Comptes qui ont accès à un cas (accès actifs), du plus récent au plus ancien
create or replace function public.admin_practice_case_accesses(p_code text)
returns table (
  email text,
  source text,
  granted_at timestamptz,
  has_study boolean,
  has_example boolean
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
    select u.email::text, a.source, a.created_at, a.study_id is not null,
      a.example_study_id is not null
    from public.practice_case_access a
    join auth.users u on u.id = a.user_id
    where a.case_code = p_code and a.revoked_at is null
    order by a.created_at desc;
end;
$$;

revoke execute on function public.admin_practice_case_accesses(text) from public, anon;
grant execute on function public.admin_practice_case_accesses(text) to authenticated;

-- Remplacée : le journal d'audit garde le courriel du compte en plus de son identifiant
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
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select id, email into v_user_id, v_email from auth.users
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
    'practice_case', p_code, jsonb_build_object('user', v_user_id, 'email', v_email));
end;
$$;
