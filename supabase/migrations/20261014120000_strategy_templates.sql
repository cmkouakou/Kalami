-- =============================================================
--  Fichier    : 20261014120000_strategy_templates.sql
--  Projet     : Kalami Stratégie
--  Description: Sprint S2 de l'assistant stratégie : contenu des gabarits (PESTEL, cinq
--               forces) enregistré en JSON dans study_steps.payload avec un numéro de
--               révision (refus d'écraser une modification plus récente), historique des
--               versions (automatique toutes les 15 minutes d'édition, à la validation et
--               à la restauration ; 50 par étape), restauration, et liste de contrôle
--               minimale vérifiée avant la validation des étapes 1 et 2.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-11
--  Dépendances: 20261013120000_strategy_core.sql
-- =============================================================

-- ==================== RÉVISION DU CONTENU ====================

-- Incrémentée à chaque enregistrement : un enregistrement fondé sur une révision périmée
-- est refusé (deux onglets, deux membres) au lieu d'écraser le travail de l'autre.
alter table public.study_steps
  add column revision integer not null default 0 check (revision >= 0);

-- ==================== VERSIONS ====================

create table public.study_step_versions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null,
  step_no smallint not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null,
  reason text not null check (reason in ('auto', 'validation', 'restore')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (study_id, step_no)
    references public.study_steps (study_id, step_no) on delete cascade
);

create index study_step_versions_step_idx
  on public.study_step_versions (study_id, step_no, created_at desc);

comment on table public.study_step_versions is
  'Copies du contenu d''une étape ; écrites uniquement par les fonctions strategy_*.';

-- ==================== FONCTIONS UTILITAIRES ====================

-- Nombre de versions conservées par étape
create or replace function public.strategy_versions_keep()
returns integer
language sql
immutable
set search_path = ''
as $$ select 50 $$;

-- Ajoute une version puis supprime les plus anciennes au-delà de la limite
create or replace function public.strategy_add_version(
  p_study_id uuid,
  p_step_no smallint,
  p_payload jsonb,
  p_revision integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.study_step_versions (study_id, step_no, payload, revision, reason, created_by)
  values (p_study_id, p_step_no, p_payload, p_revision, p_reason, auth.uid());

  delete from public.study_step_versions v
  where v.study_id = p_study_id and v.step_no = p_step_no
    and v.id not in (
      select k.id from public.study_step_versions k
      where k.study_id = p_study_id and k.step_no = p_step_no
      order by k.created_at desc
      limit public.strategy_versions_keep()
    );
end;
$$;

-- Fonction interne : jamais appelée directement par un client
revoke execute on function public.strategy_add_version(uuid, smallint, jsonb, integer, text)
  from public, anon, authenticated;

-- Liste de contrôle minimale avant validation (miroir de checklist() dans templates/*.ts).
-- Étape 1 : au moins une opportunité et une menace nommées (« les deux » compte pour chacune).
-- Étape 2 : les cinq forces ont une intensité et une justification.
-- Les autres étapes n'ont pas encore de gabarit : rien à vérifier.
create or replace function public.strategy_checklist_ok(p_step_no smallint, p_payload jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_factors jsonb;
  v_forces jsonb;
  v_key text;
begin
  if p_step_no = 1 then
    v_factors := p_payload -> 'factors';
    if jsonb_typeof(v_factors) is distinct from 'array' then
      return false;
    end if;
    return exists (
      select 1 from jsonb_array_elements(v_factors) f
      where f ->> 'nature' in ('opportunity', 'both')
        and btrim(coalesce(f ->> 'factor', '')) <> ''
    ) and exists (
      select 1 from jsonb_array_elements(v_factors) f
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

  return true;
end;
$$;

revoke execute on function public.strategy_checklist_ok(smallint, jsonb) from public, anon;
grant execute on function public.strategy_checklist_ok(smallint, jsonb) to authenticated;

-- ==================== ENREGISTREMENT ====================

-- Enregistre le contenu d'une étape (propriétaire ou contributeur) si la révision connue du
-- client est la révision courante. Une étape « à faire » passe « en cours » ; une étape
-- validée doit d'abord être rouverte. Version automatique si la dernière date de plus de
-- 15 minutes. Retourne la nouvelle révision.
create or replace function public.strategy_save_step(
  p_study_id uuid,
  p_step_no smallint,
  p_payload jsonb,
  p_revision integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_revision integer;
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_step_no not between 1 and 8 then
    raise exception 'plan_step' using errcode = 'P0001';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid_payload' using errcode = 'P0001';
  end if;
  if octet_length(p_payload::text) > 262144 then
    raise exception 'payload_too_large' using errcode = 'P0001';
  end if;
  if cardinality(public.strategy_missing_prerequisites(p_study_id, p_step_no)) > 0 then
    raise exception 'prerequisites_missing' using errcode = 'P0001';
  end if;

  select status, revision into v_status, v_revision from public.study_steps
  where study_id = p_study_id and step_no = p_step_no
  for update;
  if v_status = 'validated' then
    raise exception 'step_validated' using errcode = 'P0001';
  end if;
  if v_revision is distinct from p_revision then
    raise exception 'revision_conflict' using errcode = 'P0001';
  end if;

  v_revision := v_revision + 1;
  update public.study_steps
  set payload = p_payload,
      revision = v_revision,
      status = case when status = 'todo' then 'in_progress' else status end
  where study_id = p_study_id and step_no = p_step_no;

  if not exists (
    select 1 from public.study_step_versions v
    where v.study_id = p_study_id and v.step_no = p_step_no
      and v.created_at > now() - interval '15 minutes'
  ) then
    perform public.strategy_add_version(p_study_id, p_step_no, p_payload, v_revision, 'auto');
  end if;

  update public.studies set updated_at = now() where id = p_study_id;
  return v_revision;
end;
$$;

revoke execute on function public.strategy_save_step(uuid, smallint, jsonb, integer)
  from public, anon;
grant execute on function public.strategy_save_step(uuid, smallint, jsonb, integer)
  to authenticated;

-- Restaure une version (propriétaire ou contributeur). L'état courant est d'abord copié
-- (version « auto ») pour pouvoir revenir en arrière. Retourne la nouvelle révision.
create or replace function public.strategy_restore_version(
  p_study_id uuid,
  p_step_no smallint,
  p_version_id uuid,
  p_revision integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_revision integer;
  v_current jsonb;
  v_payload jsonb;
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  select status, revision, payload into v_status, v_revision, v_current
  from public.study_steps
  where study_id = p_study_id and step_no = p_step_no
  for update;
  if v_status is null then
    raise exception 'version_not_found' using errcode = 'P0001';
  end if;
  if v_status = 'validated' then
    raise exception 'step_validated' using errcode = 'P0001';
  end if;
  if v_revision is distinct from p_revision then
    raise exception 'revision_conflict' using errcode = 'P0001';
  end if;

  select payload into v_payload from public.study_step_versions
  where id = p_version_id and study_id = p_study_id and step_no = p_step_no;
  if v_payload is null then
    raise exception 'version_not_found' using errcode = 'P0001';
  end if;

  perform public.strategy_add_version(p_study_id, p_step_no, v_current, v_revision, 'auto');
  v_revision := v_revision + 1;
  update public.study_steps
  set payload = v_payload, revision = v_revision
  where study_id = p_study_id and step_no = p_step_no;
  perform public.strategy_add_version(p_study_id, p_step_no, v_payload, v_revision, 'restore');

  update public.studies set updated_at = now() where id = p_study_id;
  return v_revision;
end;
$$;

revoke execute on function public.strategy_restore_version(uuid, smallint, uuid, integer)
  from public, anon;
grant execute on function public.strategy_restore_version(uuid, smallint, uuid, integer)
  to authenticated;

-- ==================== VALIDATION ====================

-- Remplace la version du S1 : vérifie en plus la liste de contrôle du gabarit et garde une
-- copie du contenu validé.
create or replace function public.strategy_validate_step(p_study_id uuid, p_step_no smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_payload jsonb;
  v_revision integer;
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

  select status, payload, revision into v_status, v_payload, v_revision
  from public.study_steps
  where study_id = p_study_id and step_no = p_step_no
  for update;
  if v_status = 'todo' then
    raise exception 'not_started' using errcode = 'P0001';
  end if;
  if v_status = 'validated' then
    return;
  end if;
  if not public.strategy_checklist_ok(p_step_no, v_payload) then
    raise exception 'checklist_incomplete' using errcode = 'P0001';
  end if;

  update public.study_steps
  set status = 'validated', validated_at = now(), validated_by = auth.uid(),
      review_reasons = '[]'::jsonb
  where study_id = p_study_id and step_no = p_step_no;
  perform public.strategy_add_version(p_study_id, p_step_no, v_payload, v_revision, 'validation');
  update public.studies set updated_at = now() where id = p_study_id;
end;
$$;

revoke execute on function public.strategy_validate_step(uuid, smallint) from public, anon;
grant execute on function public.strategy_validate_step(uuid, smallint) to authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.study_step_versions enable row level security;

-- Versions : membres de l'étude seulement
create policy "study_step_versions_select_member" on public.study_step_versions
  for select to authenticated
  using ((select public.study_role(study_id)) is not null);

-- Aucune écriture directe : uniquement par les fonctions ci-dessus
revoke insert, update, delete on public.study_step_versions from anon, authenticated;
