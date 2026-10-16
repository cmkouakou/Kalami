-- =============================================================
--  Fichier    : 20261026120000_strategy_team.sql
--  Projet     : Kalami Stratégie
--  Description: Sprint S9a, travail en équipe (cahier §6) : invitations par courriel avec
--               rôle (contributeur, observateur) et acceptation obligatoire, gestion des
--               membres (rôle, retrait, départ), attribution indicative des étapes et
--               journal d'activité de l'étude. Le lien d'invitation n'est jamais stocké :
--               seule son empreinte SHA-256 l'est. Accepter exige d'être connecté avec le
--               courriel invité, confirmé.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-15
--  Dépend de  : 20261013120000_strategy_core.sql
-- =============================================================

-- ==================== INVITATIONS ====================

create table public.study_invitations (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  role text not null check (role in ('contributor', 'observer')),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz,
  responded_by uuid references auth.users (id) on delete set null
);

-- Une seule invitation en attente par courriel et par étude
create unique index study_invitations_pending_idx
  on public.study_invitations (study_id, email) where status = 'pending';
create index study_invitations_email_idx
  on public.study_invitations (email) where status = 'pending';

-- ==================== JOURNAL D'ACTIVITÉ ====================

create table public.study_activity (
  id bigint generated always as identity primary key,
  study_id uuid not null references public.studies (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in (
    'invitation_sent', 'invitation_renewed', 'invitation_revoked', 'invitation_declined',
    'member_joined', 'member_role_changed', 'member_removed', 'member_left',
    'step_assigned', 'step_unassigned',
    'step_started', 'step_validated', 'step_reopened', 'step_needs_review'
  )),
  step_no smallint,
  target_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index study_activity_study_idx on public.study_activity (study_id, id desc);

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.study_invitations enable row level security;
alter table public.study_activity enable row level security;

-- Le propriétaire voit les invitations de son étude ; l'invité passe par les fonctions
create policy "study_invitations_select_owner" on public.study_invitations
  for select to authenticated
  using ((select public.study_role(study_id)) = 'owner');

-- Le journal se lit par strategy_study_activity (noms des membres) : aucun accès direct
revoke all on public.study_invitations from anon;
revoke insert, update, delete on public.study_invitations from authenticated;
revoke all on public.study_activity from anon, authenticated;

-- ==================== FONCTIONS UTILITAIRES ====================

-- Inscrit une ligne au journal (appelée par les fonctions ci-dessous, jamais directement)
create or replace function public.strategy_log(
  p_study_id uuid,
  p_action text,
  p_step_no smallint default null,
  p_target_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.study_activity (study_id, actor_id, action, step_no, target_id, details)
  values (p_study_id, auth.uid(), p_action, p_step_no, p_target_id,
          coalesce(p_details, '{}'::jsonb));
$$;

revoke execute on function public.strategy_log(uuid, text, smallint, uuid, jsonb)
  from public, anon, authenticated;

-- Nom affiché d'un utilisateur : son nom s'il l'a renseigné, sinon son courriel
create or replace function public.strategy_member_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.display_name), ''), u.email)
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = p_user_id;
$$;

revoke execute on function public.strategy_member_name(uuid) from public, anon, authenticated;

-- Empreinte d'un lien d'invitation
create or replace function public.strategy_token_hash(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

revoke execute on function public.strategy_token_hash(text) from public, anon, authenticated;

-- Courriel confirmé de l'utilisateur connecté (null s'il n'est pas confirmé)
create or replace function public.strategy_my_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(email) from auth.users
  where id = auth.uid() and email_confirmed_at is not null;
$$;

revoke execute on function public.strategy_my_email() from public, anon, authenticated;

-- Vérifie le débit et le nombre d'invitations en attente d'une étude
create or replace function public.strategy_check_invite_limits(p_study_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.study_invitations
      where study_id = p_study_id and last_sent_at > now() - interval '1 hour') >= 10 then
    raise exception 'invite_rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.study_invitations
      where study_id = p_study_id and status = 'pending' and expires_at > now()) >= 30 then
    raise exception 'too_many_invitations' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.strategy_check_invite_limits(uuid)
  from public, anon, authenticated;

-- ==================== JOURNAL DES ÉTAPES ====================

-- Chaque changement de statut d'une étape entre au journal (démarrage, validation,
-- réouverture, passage « à revoir » en cascade)
create or replace function public.strategy_log_step_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  v_action := case
    when new.status = 'validated' then 'step_validated'
    when new.status = 'needs_review' then 'step_needs_review'
    when new.status = 'in_progress' and old.status = 'todo' then 'step_started'
    when new.status = 'in_progress' and old.status = 'validated' then 'step_reopened'
  end;
  if v_action is not null then
    perform public.strategy_log(new.study_id, v_action, new.step_no);
  end if;
  return null;
end;
$$;

revoke execute on function public.strategy_log_step_status() from public, anon, authenticated;

create trigger study_steps_log_status
  after update of status on public.study_steps
  for each row
  when (old.status is distinct from new.status)
  execute function public.strategy_log_step_status();

-- ==================== FONCTIONS : INVITATIONS (PROPRIÉTAIRE) ====================

-- Invite un courriel avec un rôle. Le lien (p_token) est créé par le serveur et envoyé par
-- courriel ; seule son empreinte est gardée. Retourne l'identifiant de l'invitation.
create or replace function public.strategy_invite_member(
  p_study_id uuid,
  p_email text,
  p_role text,
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id uuid;
begin
  if public.study_role(p_study_id) is distinct from 'owner' then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if p_role not in ('contributor', 'observer') then
    raise exception 'invalid_role' using errcode = 'P0001';
  end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_token, '')) < 32 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.study_members m
    join auth.users u on u.id = m.user_id
    where m.study_id = p_study_id and lower(u.email) = v_email
  ) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  -- Une invitation échue libère la place
  update public.study_invitations set status = 'expired'
  where study_id = p_study_id and email = v_email and status = 'pending'
    and expires_at <= now();
  if exists (
    select 1 from public.study_invitations
    where study_id = p_study_id and email = v_email and status = 'pending'
  ) then
    raise exception 'already_invited' using errcode = 'P0001';
  end if;
  perform public.strategy_check_invite_limits(p_study_id);

  insert into public.study_invitations
    (study_id, email, role, token_hash, invited_by, expires_at)
  values (p_study_id, v_email, p_role, public.strategy_token_hash(p_token), auth.uid(),
          now() + interval '14 days')
  returning id into v_id;

  perform public.strategy_log(p_study_id, 'invitation_sent', null, null,
                              jsonb_build_object('role', p_role));
  return v_id;
end;
$$;

revoke execute on function public.strategy_invite_member(uuid, text, text, text)
  from public, anon;
grant execute on function public.strategy_invite_member(uuid, text, text, text)
  to authenticated;

-- Renouvelle une invitation en attente ou échue : nouveau lien, 14 jours de plus
create or replace function public.strategy_renew_invitation(p_invitation_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.study_invitations;
begin
  select * into v_inv from public.study_invitations where id = p_invitation_id for update;
  if not found or public.study_role(v_inv.study_id) is distinct from 'owner' then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if v_inv.status not in ('pending', 'expired') then
    raise exception 'invitation_closed' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_token, '')) < 32 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if v_inv.status = 'expired' and exists (
    select 1 from public.study_invitations
    where study_id = v_inv.study_id and email = v_inv.email and status = 'pending'
  ) then
    raise exception 'already_invited' using errcode = 'P0001';
  end if;
  perform public.strategy_check_invite_limits(v_inv.study_id);

  update public.study_invitations
  set token_hash = public.strategy_token_hash(p_token),
      status = 'pending',
      last_sent_at = now(),
      expires_at = now() + interval '14 days'
  where id = p_invitation_id;

  perform public.strategy_log(v_inv.study_id, 'invitation_renewed', null, null,
                              jsonb_build_object('role', v_inv.role));
end;
$$;

revoke execute on function public.strategy_renew_invitation(uuid, text) from public, anon;
grant execute on function public.strategy_renew_invitation(uuid, text) to authenticated;

-- Retire une invitation en attente
create or replace function public.strategy_revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.study_invitations;
begin
  select * into v_inv from public.study_invitations where id = p_invitation_id for update;
  if not found or public.study_role(v_inv.study_id) is distinct from 'owner' then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if v_inv.status not in ('pending', 'expired') then
    raise exception 'invitation_closed' using errcode = 'P0001';
  end if;

  update public.study_invitations set status = 'revoked' where id = p_invitation_id;
  perform public.strategy_log(v_inv.study_id, 'invitation_revoked', null, null,
                              jsonb_build_object('role', v_inv.role));
end;
$$;

revoke execute on function public.strategy_revoke_invitation(uuid) from public, anon;
grant execute on function public.strategy_revoke_invitation(uuid) to authenticated;

-- ==================== FONCTIONS : INVITATIONS (INVITÉ) ====================

-- Invitation désignée par un lien, vue par la personne connectée (aucune ligne si le lien
-- est inconnu). Le courriel invité est montré pour expliquer un refus de correspondance.
create or replace function public.strategy_invitation_by_token(p_token text)
returns table (
  invitation_id uuid,
  study_id uuid,
  company_name text,
  inviter_name text,
  role text,
  email text,
  status text,
  expired boolean,
  email_matches boolean,
  already_member boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.study_id, s.company_name, public.strategy_member_name(i.invited_by),
         i.role, i.email, i.status, i.expires_at <= now(),
         i.email = public.strategy_my_email(),
         exists (select 1 from public.study_members m
                 where m.study_id = i.study_id and m.user_id = auth.uid())
  from public.study_invitations i
  join public.studies s on s.id = i.study_id
  where auth.uid() is not null
    and i.token_hash = public.strategy_token_hash(coalesce(p_token, ''));
$$;

revoke execute on function public.strategy_invitation_by_token(text) from public, anon;
grant execute on function public.strategy_invitation_by_token(text) to authenticated;

-- Invitations en attente adressées au courriel confirmé de la personne connectée
create or replace function public.strategy_my_invitations()
returns table (
  invitation_id uuid,
  study_id uuid,
  company_name text,
  inviter_name text,
  role text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.study_id, s.company_name, public.strategy_member_name(i.invited_by),
         i.role, i.expires_at
  from public.study_invitations i
  join public.studies s on s.id = i.study_id
  where i.status = 'pending' and i.expires_at > now()
    and i.email = public.strategy_my_email()
    and not exists (select 1 from public.study_members m
                    where m.study_id = i.study_id and m.user_id = auth.uid())
  order by i.created_at desc;
$$;

revoke execute on function public.strategy_my_invitations() from public, anon;
grant execute on function public.strategy_my_invitations() to authenticated;

-- Accepte ou refuse une invitation adressée au courriel confirmé de la personne connectée.
-- Retourne l'identifiant de l'étude.
create or replace function public.strategy_respond_invitation(
  p_invitation_id uuid,
  p_accept boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.study_invitations;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  select * into v_inv from public.study_invitations where id = p_invitation_id for update;
  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;
  if v_inv.email is distinct from public.strategy_my_email() then
    raise exception 'email_mismatch' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'invitation_closed' using errcode = 'P0001';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  update public.study_invitations
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now(),
      responded_by = auth.uid()
  where id = p_invitation_id;

  if not p_accept then
    perform public.strategy_log(v_inv.study_id, 'invitation_declined', null, auth.uid(),
                                jsonb_build_object('role', v_inv.role));
    return v_inv.study_id;
  end if;

  -- Déjà membre (autre invitation acceptée entre-temps) : le rôle actuel est gardé
  insert into public.study_members (study_id, user_id, role)
  values (v_inv.study_id, auth.uid(), v_inv.role)
  on conflict (study_id, user_id) do nothing;
  if found then
    perform public.strategy_log(v_inv.study_id, 'member_joined', null, auth.uid(),
                                jsonb_build_object('role', v_inv.role));
  end if;
  return v_inv.study_id;
end;
$$;

revoke execute on function public.strategy_respond_invitation(uuid, boolean) from public, anon;
grant execute on function public.strategy_respond_invitation(uuid, boolean) to authenticated;

-- ==================== FONCTIONS : MEMBRES ====================

-- Membres d'une étude avec leur nom et leur courriel (réservé aux membres)
create or replace function public.strategy_study_members(p_study_id uuid)
returns table (
  user_id uuid,
  role text,
  display_name text,
  email text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.study_role(p_study_id) is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  return query
    select m.user_id, m.role, nullif(btrim(p.display_name), ''), u.email::text, m.created_at
    from public.study_members m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    where m.study_id = p_study_id
    order by case m.role when 'owner' then 0 when 'contributor' then 1 else 2 end,
             m.created_at;
end;
$$;

revoke execute on function public.strategy_study_members(uuid) from public, anon;
grant execute on function public.strategy_study_members(uuid) to authenticated;

-- Change le rôle d'un membre (propriétaire). Un observateur perd ses attributions.
create or replace function public.strategy_set_member_role(
  p_study_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  if public.study_role(p_study_id) is distinct from 'owner' then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if p_role not in ('contributor', 'observer') then
    raise exception 'invalid_role' using errcode = 'P0001';
  end if;
  select role into v_current from public.study_members
  where study_id = p_study_id and user_id = p_user_id
  for update;
  if v_current is null then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
  if v_current = 'owner' then
    raise exception 'owner_role' using errcode = 'P0001';
  end if;
  if v_current = p_role then
    return;
  end if;

  update public.study_members set role = p_role
  where study_id = p_study_id and user_id = p_user_id;
  if p_role = 'observer' then
    update public.study_steps set assignee_id = null
    where study_id = p_study_id and assignee_id = p_user_id;
  end if;
  perform public.strategy_log(p_study_id, 'member_role_changed', null, p_user_id,
                              jsonb_build_object('role', p_role));
end;
$$;

revoke execute on function public.strategy_set_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.strategy_set_member_role(uuid, uuid, text) to authenticated;

-- Retire un membre (propriétaire) ou quitte l'étude (soi-même). Le propriétaire ne part pas.
create or replace function public.strategy_remove_member(p_study_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target text;
  v_self boolean := p_user_id = auth.uid();
begin
  if public.study_role(p_study_id) is null
     or (not v_self and public.study_role(p_study_id) <> 'owner') then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  select role into v_target from public.study_members
  where study_id = p_study_id and user_id = p_user_id
  for update;
  if v_target is null then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
  if v_target = 'owner' then
    raise exception 'owner_role' using errcode = 'P0001';
  end if;

  delete from public.study_members where study_id = p_study_id and user_id = p_user_id;
  update public.study_steps set assignee_id = null
  where study_id = p_study_id and assignee_id = p_user_id;
  perform public.strategy_log(p_study_id,
                              case when v_self then 'member_left' else 'member_removed' end,
                              null, p_user_id, '{}'::jsonb);
end;
$$;

revoke execute on function public.strategy_remove_member(uuid, uuid) from public, anon;
grant execute on function public.strategy_remove_member(uuid, uuid) to authenticated;

-- ==================== FONCTIONS : ATTRIBUTION ====================

-- Attribue une étape à un membre qui peut la remplir (propriétaire ou contributeur), ou
-- retire l'attribution (p_user_id null). Indicatif : ne change aucun droit.
create or replace function public.strategy_assign_step(
  p_study_id uuid,
  p_step_no smallint,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current uuid;
begin
  if public.study_role(p_study_id) is distinct from 'owner' then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if p_step_no not between 1 and 9 then
    raise exception 'invalid_step' using errcode = 'P0001';
  end if;
  if p_user_id is not null and not exists (
    select 1 from public.study_members
    where study_id = p_study_id and user_id = p_user_id and role in ('owner', 'contributor')
  ) then
    raise exception 'invalid_assignee' using errcode = 'P0001';
  end if;

  select assignee_id into v_current from public.study_steps
  where study_id = p_study_id and step_no = p_step_no
  for update;
  if v_current is not distinct from p_user_id then
    return;
  end if;

  update public.study_steps set assignee_id = p_user_id
  where study_id = p_study_id and step_no = p_step_no;
  perform public.strategy_log(p_study_id,
                              case when p_user_id is null then 'step_unassigned'
                                   else 'step_assigned' end,
                              p_step_no, coalesce(p_user_id, v_current), '{}'::jsonb);
end;
$$;

revoke execute on function public.strategy_assign_step(uuid, smallint, uuid) from public, anon;
grant execute on function public.strategy_assign_step(uuid, smallint, uuid) to authenticated;

-- ==================== FONCTIONS : JOURNAL ====================

-- Journal d'une étude, du plus récent au plus ancien, par pages (p_before : dernier
-- identifiant déjà affiché)
create or replace function public.strategy_study_activity(
  p_study_id uuid,
  p_before bigint default null,
  p_limit integer default 50
)
returns table (
  id bigint,
  action text,
  step_no smallint,
  actor_name text,
  target_name text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.study_role(p_study_id) is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  return query
    select a.id, a.action, a.step_no, public.strategy_member_name(a.actor_id),
           public.strategy_member_name(a.target_id), a.details, a.created_at
    from public.study_activity a
    where a.study_id = p_study_id and (p_before is null or a.id < p_before)
    order by a.id desc
    limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

revoke execute on function public.strategy_study_activity(uuid, bigint, integer)
  from public, anon;
grant execute on function public.strategy_study_activity(uuid, bigint, integer)
  to authenticated;
