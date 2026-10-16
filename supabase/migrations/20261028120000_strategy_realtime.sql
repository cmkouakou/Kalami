-- =============================================================
--  Fichier    : 20261028120000_strategy_realtime.sql
--  Projet     : Kalami Stratégie
--  Description: Sprint S9c, présence et verrouillage doux (cahier §3.4) : autorisation des
--               canaux Realtime privés « study:<id> ». Tout membre de l'étude écoute et
--               signale sa présence (observateur compris) ; seuls le propriétaire et les
--               contributeurs diffusent des messages (enregistrement d'une étape).
--               Copie de secours : la saisie refusée pour conflit de révision est gardée
--               comme version « conflict », restaurable depuis l'historique.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-16
--  Dépend de  : 20261013120000_strategy_core.sql (study_role)
-- =============================================================

-- ==================== FONCTION D'ACCÈS ====================

-- Rôle de l'utilisateur courant dans l'étude désignée par un sujet « study:<uuid> »
-- (null si le sujet est mal formé ou si l'utilisateur n'est pas membre)
create or replace function public.strategy_topic_role(p_topic text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_topic is null
    or p_topic !~ '^study:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return public.study_role(substr(p_topic, 7)::uuid);
end;
$$;

revoke execute on function public.strategy_topic_role(text) from public, anon;
grant execute on function public.strategy_topic_role(text) to authenticated;

-- ==================== POLITIQUES REALTIME ====================

-- Recevoir les messages et la présence : tout membre
create policy "strategy_realtime_read"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension in ('presence', 'broadcast')
    and public.strategy_topic_role(realtime.topic()) is not null
  );

-- Signaler sa présence : tout membre
create policy "strategy_realtime_presence"
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and public.strategy_topic_role(realtime.topic()) is not null
  );

-- Diffuser un message : propriétaire et contributeurs
create policy "strategy_realtime_broadcast"
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and public.strategy_topic_role(realtime.topic()) in ('owner', 'contributor')
  );

-- ==================== COPIE DE SECOURS EN CAS DE CONFLIT ====================

-- Nouvelle raison de version : saisie d'un membre refusée parce qu'un autre membre a
-- enregistré l'étape entre-temps. Elle se restaure comme toute version (la restauration
-- garde d'abord le contenu courant) : aucune saisie n'est perdue.
alter table public.study_step_versions drop constraint study_step_versions_reason_check;
alter table public.study_step_versions add constraint study_step_versions_reason_check
  check (reason in ('auto', 'validation', 'restore', 'conflict'));

-- Garde la saisie refusée comme version « conflict » ; ne change ni le contenu ni la
-- révision de l'étape. Une copie au plus toutes les 10 secondes par membre et par étape.
create or replace function public.strategy_save_conflict_copy(
  p_study_id uuid,
  p_step_no smallint,
  p_payload jsonb
)
returns boolean
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
  if p_step_no not between 1 and 9 then
    raise exception 'invalid_step' using errcode = 'P0001';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid_payload' using errcode = 'P0001';
  end if;
  if octet_length(p_payload::text) > 262144 then
    raise exception 'payload_too_large' using errcode = 'P0001';
  end if;

  select status, revision into v_status, v_revision from public.study_steps
  where study_id = p_study_id and step_no = p_step_no
  for update;
  if v_status is null then
    raise exception 'invalid_step' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.study_step_versions v
    where v.study_id = p_study_id and v.step_no = p_step_no and v.reason = 'conflict'
      and v.created_by = auth.uid() and v.created_at > now() - interval '10 seconds'
  ) then
    return false;
  end if;

  perform public.strategy_add_version(p_study_id, p_step_no, p_payload, v_revision, 'conflict');
  return true;
end;
$$;

revoke execute on function public.strategy_save_conflict_copy(uuid, smallint, jsonb)
  from public, anon;
grant execute on function public.strategy_save_conflict_copy(uuid, smallint, jsonb)
  to authenticated;
