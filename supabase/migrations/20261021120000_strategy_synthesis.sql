-- =============================================================
--  Fichier    : 20261021120000_strategy_synthesis.sql
--  Projet     : Kalami Stratégie
--  Description: Stratégie v0.7.0 (S6a) : liste de contrôle de l'étape 5 (synthèse) ajoutée
--               à strategy_checklist_ok, vérifiée à la validation : au moins un élément
--               dans chaque case de la SWOT, au moins une piste TOWS, deux ou trois enjeux
--               nommés (minimum choisi par l'auteur). Étapes 1 à 4 inchangées.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-14
--  Dépend de  : 20261016120000_strategy_guides_content.sql
-- =============================================================

-- ==================== LISTE DE CONTRÔLE ====================

create or replace function public.strategy_checklist_ok(p_step_no smallint, p_payload jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_list jsonb;
  v_forces jsonb;
  v_swot jsonb;
  v_key text;
  v_count integer;
  v_ok boolean;
begin
  if p_step_no = 1 then
    v_list := p_payload -> 'factors';
    if jsonb_typeof(v_list) is distinct from 'array' then
      return false;
    end if;
    return exists (
      select 1 from jsonb_array_elements(v_list) f
      where f ->> 'nature' in ('opportunity', 'both')
        and btrim(coalesce(f ->> 'factor', '')) <> ''
    ) and exists (
      select 1 from jsonb_array_elements(v_list) f
      where f ->> 'nature' in ('threat', 'both')
        and btrim(coalesce(f ->> 'factor', '')) <> ''
    );
  end if;

  if p_step_no = 2 then
    v_forces := p_payload -> 'forces';
    if jsonb_typeof(v_forces) is distinct from 'object' then
      return false;
    end if;
    foreach v_key in array array['rivalry', 'newEntrants', 'substitutes', 'buyers', 'suppliers']
    loop
      if coalesce(v_forces -> v_key ->> 'intensity', '') not in ('low', 'medium', 'high')
        or btrim(coalesce(v_forces -> v_key ->> 'justification', '')) = '' then
        return false;
      end if;
    end loop;
    return true;
  end if;

  if p_step_no = 3 then
    v_list := p_payload -> 'activities';
    if coalesce(p_payload ->> 'model', '') not in ('porter', 'services')
      or jsonb_typeof(v_list) is distinct from 'array'
      or jsonb_typeof(p_payload -> 'resources') is distinct from 'array' then
      return false;
    end if;
    -- Au moins 4 activités nommées et évaluées
    select count(*) into v_count
    from jsonb_array_elements(v_list) a
    where btrim(coalesce(a ->> 'name', '')) <> ''
      and coalesce(a ->> 'evaluation', '') in ('strength', 'improve', 'weakness', 'marginal');
    if v_count < 4 then
      return false;
    end if;
    -- Au moins 3 ressources nommées, et chaque ressource nommée a ses quatre réponses
    select count(*) into v_count
    from jsonb_array_elements(p_payload -> 'resources') r
    where btrim(coalesce(r ->> 'name', '')) <> '';
    if v_count < 3 then
      return false;
    end if;
    return not exists (
      select 1 from jsonb_array_elements(p_payload -> 'resources') r
      where btrim(coalesce(r ->> 'name', '')) <> ''
        and (
          coalesce(r -> 'tests' -> 'value' ->> 'answer', '') not in ('yes', 'no', 'partial')
          or coalesce(r -> 'tests' -> 'rarity' ->> 'answer', '') not in ('yes', 'no', 'partial')
          or coalesce(r -> 'tests' -> 'imitability' ->> 'answer', '')
            not in ('yes', 'no', 'partial')
          or coalesce(r -> 'tests' -> 'organization' ->> 'answer', '')
            not in ('yes', 'no', 'partial')
        )
    );
  end if;

  if p_step_no = 4 then
    v_list := p_payload -> 'stakeholders';
    if jsonb_typeof(v_list) is distinct from 'array' then
      return false;
    end if;
    -- Case de chaque partie prenante nommée : choisie à la main, sinon calculée (fort dès 3)
    with placed as (
      select coalesce(
        case when s ->> 'quadrantOverride' in ('manage', 'satisfy', 'inform', 'monitor')
          then s ->> 'quadrantOverride' end,
        case
          when coalesce(s ->> 'power', '') not in ('1', '2', '3', '4', '5')
            or coalesce(s ->> 'interest', '') not in ('1', '2', '3', '4', '5') then null
          when (s ->> 'power')::int >= 3 and (s ->> 'interest')::int >= 3 then 'manage'
          when (s ->> 'power')::int >= 3 then 'satisfy'
          when (s ->> 'interest')::int >= 3 then 'inform'
          else 'monitor'
        end
      ) as quadrant
      from jsonb_array_elements(v_list) s
      where btrim(coalesce(s ->> 'name', '')) <> ''
    )
    select case
      when count(*) < 5 then false
      when count(*) filter (where quadrant is null) > 0 then false
      else count(*) filter (where quadrant in ('manage', 'satisfy')) > 0
    end into strict v_ok
    from placed;
    return v_ok;
  end if;

  if p_step_no = 5 then
    v_swot := p_payload -> 'swot';
    if jsonb_typeof(v_swot) is distinct from 'object'
      or jsonb_typeof(p_payload -> 'tows') is distinct from 'array'
      or jsonb_typeof(p_payload -> 'issues') is distinct from 'array' then
      return false;
    end if;
    -- Au moins un élément rédigé dans chacune des quatre cases de la SWOT
    foreach v_key in array array['strengths', 'weaknesses', 'opportunities', 'threats']
    loop
      if jsonb_typeof(v_swot -> v_key) is distinct from 'array' or not exists (
        select 1 from jsonb_array_elements(v_swot -> v_key) i
        where btrim(coalesce(i ->> 'text', '')) <> ''
      ) then
        return false;
      end if;
    end loop;
    -- Au moins une piste TOWS rédigée
    if not exists (
      select 1 from jsonb_array_elements(p_payload -> 'tows') t
      where btrim(coalesce(t ->> 'text', '')) <> ''
    ) then
      return false;
    end if;
    -- Deux ou trois enjeux nommés
    select count(*) into v_count
    from jsonb_array_elements(p_payload -> 'issues') e
    where btrim(coalesce(e ->> 'title', '')) <> '';
    return v_count between 2 and 3;
  end if;

  return true;
end;
$$;

revoke execute on function public.strategy_checklist_ok(smallint, jsonb) from public, anon;
grant execute on function public.strategy_checklist_ok(smallint, jsonb) to authenticated;
