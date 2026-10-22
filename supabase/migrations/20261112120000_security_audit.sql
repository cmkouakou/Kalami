-- =============================================================
--  Fichier    : 20261112120000_security_audit.sql
--  Projet     : Kalami
--  Description: Correctifs de l'audit des droits (Sprint 11s-2, v0.13.1) :
--               - record_consent réservée au serveur (rôle service) : le compte est passé
--                 en paramètre, le débit par adresse IP est compté par l'action serveur ;
--               - strategy_attachment_objects ne compte que pour un membre de l'étude ;
--               - strategy_profile_complete et strategy_missing_prerequisites retirées aux
--                 comptes (appelées seulement par d'autres fonctions de la base) ;
--               - fonctions de déclencheur retirées à anon et authenticated.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-22
--  Dépendances: 20261031120000_legal_privacy.sql, 20261020120000_strategy_attachments.sql
-- =============================================================

-- ==================== REGISTRE DES CONSENTEMENTS ====================

-- Ancienne version (appelable avec la clé publique : registre remplissable à volonté)
drop function public.record_consent(uuid, text, integer);

create function public.record_consent(
  p_visitor_id uuid,
  p_choice text,
  p_consent_version integer,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  if p_visitor_id is null or p_choice not in ('accepted', 'refused')
    or p_consent_version is null or p_consent_version < 1 then
    raise exception 'invalid_consent' using errcode = '22023';
  end if;
  -- Limitation de débit : 20 choix par visiteur et par heure
  select count(*)::integer into v_recent from public.consent_records
  where visitor_id = p_visitor_id and created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.consent_records
    (visitor_id, user_id, choice, consent_version, privacy_version)
  values (
    p_visitor_id, p_user_id, p_choice, p_consent_version,
    (select max(version) from public.legal_documents where kind = 'privacy')
  );
end;
$$;

revoke execute on function public.record_consent(uuid, text, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.record_consent(uuid, text, integer, uuid) to service_role;

-- ==================== PIÈCES JOINTES ====================

-- Nombre de fichiers déposés dans le dossier d'une étude ; 0 pour un non-membre
create or replace function public.strategy_attachment_objects(p_study_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from storage.objects
  where bucket_id = 'study-attachments'
    and name like 'etudes/' || p_study_id::text || '/%'
    and public.study_role(p_study_id) is not null;
$$;

-- ==================== AVANCEMENT DES ÉTUDES ====================

revoke execute on function public.strategy_profile_complete(uuid) from authenticated;
revoke execute on function public.strategy_missing_prerequisites(uuid, smallint)
  from authenticated;

-- ==================== FONCTIONS DE DÉCLENCHEUR ====================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.orders_set_mm_fee() from public, anon, authenticated;
revoke execute on function public.orders_write_ledger() from public, anon, authenticated;
