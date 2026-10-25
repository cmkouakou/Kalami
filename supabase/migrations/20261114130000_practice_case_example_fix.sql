-- =============================================================
--  Fichier    : 20261114130000_practice_case_example_fix.sql
--  Projet     : Kalami
--  Description: Correctif du cas résolu (v0.14.3). La variable d'une boucle FOR entière
--               est toujours un integer en PL/pgSQL : strategy_checklist_ok(smallint, jsonb)
--               et strategy_add_version(…, smallint, …) n'étaient pas trouvées. L'étape est
--               convertie explicitement en smallint.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-24
--  Dépendances: 20261114120000_practice_case_example.sql
-- =============================================================

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
  v_step integer;
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
    v_ok := public.strategy_checklist_ok(v_step::smallint, v_payload);
    update public.study_steps
    set payload = v_payload,
      status = case when v_ok then 'validated' else 'in_progress' end,
      validated_at = case when v_ok then now() end,
      validated_by = case when v_ok then auth.uid() end
    where study_id = v_study_id and step_no = v_step::smallint;
    -- Version de départ : le corrigé de l'auteur reste restaurable après modification
    perform public.strategy_add_version(v_study_id, v_step::smallint, v_payload, 0,
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
