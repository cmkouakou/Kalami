-- =============================================================
--  Fichier    : 20261123120000_strategy_eac_link.sql
--  Projet     : Kalami Stratégie
--  Description: Liaison avec Entrepreneur au Combat (v0.26.0). L'équipe d'EAC ouvre une
--               étude Kalami depuis un dossier : l'étude appartient au compte Kalami
--               « Entrepreneur au Combat », ne consomme aucun crédit, est pré-remplie (profil,
--               question, contexte du dossier) et l'apprenant et le mentor du dossier y sont
--               ajoutés (membres directs s'ils ont un compte, sinon invitation). Un budget
--               de coach IA est accordé à la création (montant fixé par le serveur).
--               Seul le serveur (clé secrète, service_role) appelle la fonction.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-17
-- =============================================================

-- ==================== LIAISON ÉTUDE ↔ DOSSIER EXTERNE ====================

create table public.study_external_links (
  study_id uuid primary key references public.studies (id) on delete cascade,
  source text not null check (source in ('eac')),
  -- Identifiant du dossier dans l'application d'origine (unique par source)
  external_id text not null check (char_length(external_id) between 1 and 100),
  -- Numéro lisible du dossier (ex. EAC-2026-0012)
  external_ref text not null default '' check (char_length(external_ref) <= 50),
  -- Contexte transmis (reformulation validée, travaux des 4 étapes) : validé par Zod
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  -- Dernier renvoi du plan vers l'application d'origine (v0.26.1)
  sent_back_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create trigger study_external_links_set_updated_at
  before update on public.study_external_links
  for each row execute function public.set_updated_at();

alter table public.study_external_links enable row level security;

-- Les membres de l'étude lisent la liaison (panneau « Dossier transmis »)
create policy "study_external_links_select_member" on public.study_external_links
  for select to authenticated
  using ((select public.study_role(study_id)) is not null);

-- Aucune écriture directe : uniquement par la fonction ci-dessous
revoke insert, update, delete on public.study_external_links from anon, authenticated;

-- ==================== CRÉATION D'UNE ÉTUDE EAC ====================

-- Crée (ou retrouve) l'étude liée à un dossier EAC, puis ajoute les membres manquants.
-- p_members : [{ "email": "...", "token": "..." }] ; le jeton (≥ 32 caractères) ne sert
-- que si la personne n'a pas encore de compte Kalami (invitation de 14 jours).
-- Retour : { study_id, created, added: [courriels], invited: [{ email, token }] }.
create or replace function public.strategy_eac_open_study(
  p_owner_id uuid,
  p_external_id text,
  p_external_ref text,
  p_company_name text,
  p_strategic_question text,
  p_profile jsonb,
  p_context jsonb,
  p_members jsonb,
  p_coach_usd numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_study_id uuid;
  v_created boolean := false;
  v_member jsonb;
  v_email text;
  v_token text;
  v_user_id uuid;
  v_added text[] := '{}';
  v_invited jsonb := '[]'::jsonb;
begin
  if p_owner_id is null or not exists (select 1 from auth.users where id = p_owner_id) then
    raise exception 'owner_not_found' using errcode = 'P0001';
  end if;
  if p_profile is null or jsonb_typeof(p_profile) <> 'object'
     or p_context is null or jsonb_typeof(p_context) <> 'object'
     or p_members is null or jsonb_typeof(p_members) <> 'array' then
    raise exception 'invalid_payload' using errcode = 'P0001';
  end if;

  -- Verrou : deux envois simultanés du même dossier ne créent qu'une étude
  perform pg_advisory_xact_lock(hashtext('eac:' || p_external_id));

  select study_id into v_study_id
  from public.study_external_links
  where source = 'eac' and external_id = p_external_id;

  if v_study_id is null then
    insert into public.studies (owner_id, company_name, strategic_question)
    values (p_owner_id, btrim(p_company_name), coalesce(btrim(p_strategic_question), ''))
    returning id into v_study_id;

    insert into public.study_members (study_id, user_id, role)
    values (v_study_id, p_owner_id, 'owner');

    insert into public.study_steps (study_id, step_no)
    select v_study_id, step_no from public.strategy_steps;

    insert into public.company_profiles (study_id, data, updated_by)
    values (v_study_id, p_profile, p_owner_id);

    insert into public.study_external_links (study_id, source, external_id, external_ref, context)
    values (v_study_id, 'eac', p_external_id, coalesce(p_external_ref, ''), p_context);

    -- Budget du coach IA offert : l'étude est payée par le dossier EAC
    if coalesce(p_coach_usd, 0) > 0 then
      insert into public.coach_allowances (study_id, amount_usd, source, note, granted_by)
      values (v_study_id, least(p_coach_usd, 1000), 'admin_grant',
              'Entrepreneur au Combat — dossier ' || coalesce(p_external_ref, ''), p_owner_id);
    end if;
    v_created := true;
  else
    -- Étude déjà ouverte : seul le contexte du dossier est rafraîchi (le travail fait dans
    -- Kalami, profil compris, n'est jamais écrasé)
    update public.study_external_links
    set context = p_context, external_ref = coalesce(p_external_ref, external_ref)
    where study_id = v_study_id;
  end if;

  -- Membres : contributeurs directs s'ils ont un compte, sinon invitation
  for v_member in select * from jsonb_array_elements(p_members) loop
    v_email := lower(btrim(coalesce(v_member ->> 'email', '')));
    v_token := coalesce(v_member ->> 'token', '');
    continue when char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';

    select id into v_user_id from auth.users where lower(email) = v_email limit 1;
    if v_user_id is not null then
      if not exists (
        select 1 from public.study_members where study_id = v_study_id and user_id = v_user_id
      ) then
        insert into public.study_members (study_id, user_id, role)
        values (v_study_id, v_user_id, 'contributor');
        perform public.strategy_log(v_study_id, 'member_joined', null, v_user_id,
                                    jsonb_build_object('source', 'eac'));
        v_added := v_added || v_email;
      end if;
    elsif char_length(v_token) >= 32 and not exists (
      select 1 from public.study_invitations
      where study_id = v_study_id and email = v_email and status = 'pending'
        and expires_at > now()
    ) then
      update public.study_invitations set status = 'expired'
      where study_id = v_study_id and email = v_email and status = 'pending';
      insert into public.study_invitations
        (study_id, email, role, token_hash, invited_by, expires_at)
      values (v_study_id, v_email, 'contributor', public.strategy_token_hash(v_token),
              p_owner_id, now() + interval '14 days');
      perform public.strategy_log(v_study_id, 'invitation_sent', null, null,
                                  jsonb_build_object('role', 'contributor', 'source', 'eac'));
      v_invited := v_invited || jsonb_build_object('email', v_email, 'token', v_token);
    end if;
  end loop;

  return jsonb_build_object(
    'study_id', v_study_id,
    'created', v_created,
    'added', to_jsonb(v_added),
    'invited', v_invited
  );
end;
$$;

revoke execute on function public.strategy_eac_open_study(
  uuid, text, text, text, text, jsonb, jsonb, jsonb, numeric
) from public, anon, authenticated;
grant execute on function public.strategy_eac_open_study(
  uuid, text, text, text, text, jsonb, jsonb, jsonb, numeric
) to service_role;
