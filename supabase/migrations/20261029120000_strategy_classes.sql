-- =============================================================
--  Fichier    : 20261029120000_strategy_classes.sql
--  Projet     : Kalami Stratégie
--  Description: Sprint S10a, mode enseignant (cahier §7) : statut enseignant accordé par
--               l'administrateur, classes (réglages, date limite indicative, archivage),
--               inscription des étudiants par lien de classe ou invitation par courriel,
--               distribution des études (une par étudiant ou par équipe, payée par les
--               crédits de l'enseignant, enseignant observateur d'office) et suivi de la
--               classe. Retouches : coach coupé par étape et plafond d'IA propre à la
--               classe ; l'étudiant ne peut ni retirer l'enseignant ni changer son rôle.
--               Les liens ne sont jamais stockés : seule leur empreinte SHA-256 l'est.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-16
--  Dépend de  : 20261026120000_strategy_team.sql, 20261025120000_strategy_plan.sql
-- =============================================================

-- ==================== ENSEIGNANTS ====================

create table public.strategy_teachers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ==================== CLASSES ====================

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  institution text not null default '' check (char_length(institution) <= 160),
  term text not null default '' check (char_length(term) <= 60),
  due_date date,
  -- Étapes où le coach est coupé (1 à 8)
  coach_disabled_steps smallint[] not null default '{}'
    check (coach_disabled_steps <@ array[1, 2, 3, 4, 5, 6, 7, 8, 9]::smallint[]),
  -- Plafond d'IA par étude (null : plafond général)
  study_budget_usd numeric(8, 2) check (study_budget_usd between 0 and 50),
  join_token_hash text unique,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_teacher_idx on public.classes (teacher_id, created_at desc);

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- Étudiants inscrits (l'enseignant n'en fait pas partie)
create table public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index class_members_user_idx on public.class_members (user_id);

create table public.class_invitations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz,
  responded_by uuid references auth.users (id) on delete set null
);

create unique index class_invitations_pending_idx
  on public.class_invitations (class_id, email) where status = 'pending';

-- Étude distribuée dans une classe (archiver la classe ne supprime aucune étude)
alter table public.studies
  add column class_id uuid references public.classes (id) on delete set null;

create index studies_class_idx on public.studies (class_id) where class_id is not null;

-- ==================== JOURNAL D'ACTIVITÉ ====================

alter table public.study_activity drop constraint study_activity_action_check;
alter table public.study_activity add constraint study_activity_action_check check (action in (
  'invitation_sent', 'invitation_renewed', 'invitation_revoked', 'invitation_declined',
  'member_joined', 'member_role_changed', 'member_removed', 'member_left',
  'step_assigned', 'step_unassigned',
  'step_started', 'step_validated', 'step_reopened', 'step_needs_review',
  'comment_added', 'class_assigned'
));

-- ==================== FONCTIONS UTILITAIRES ====================

-- Vrai si la personne connectée a le statut enseignant
create or replace function public.strategy_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.strategy_teachers where user_id = auth.uid());
$$;

revoke execute on function public.strategy_is_teacher() from public, anon;
grant execute on function public.strategy_is_teacher() to authenticated;

-- Vrai si la personne connectée est l'enseignant de la classe
create or replace function public.strategy_class_teacher(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classes where id = p_class_id and teacher_id = auth.uid()
  );
$$;

revoke execute on function public.strategy_class_teacher(uuid) from public, anon;
grant execute on function public.strategy_class_teacher(uuid) to authenticated;

-- Enseignant de la classe d'une étude (null hors classe)
create or replace function public.strategy_study_teacher(p_study_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.teacher_id
  from public.studies s
  join public.classes c on c.id = s.class_id
  where s.id = p_study_id;
$$;

revoke execute on function public.strategy_study_teacher(uuid) from public, anon, authenticated;

-- Classe dont la personne connectée est l'enseignant, verrouillée ; refus sinon
create or replace function public.strategy_own_class(p_class_id uuid)
returns public.classes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class public.classes;
begin
  select * into v_class from public.classes where id = p_class_id for update;
  if not found or v_class.teacher_id is distinct from auth.uid() then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  return v_class;
end;
$$;

revoke execute on function public.strategy_own_class(uuid) from public, anon, authenticated;

-- Texte borné et sans espaces de bord ; refus si trop long
create or replace function public.strategy_class_text(p_text text, p_max integer)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_text text := btrim(coalesce(p_text, ''));
begin
  if char_length(v_text) > p_max then
    raise exception 'text_too_long' using errcode = 'P0001';
  end if;
  return v_text;
end;
$$;

revoke execute on function public.strategy_class_text(text, integer)
  from public, anon, authenticated;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.strategy_teachers enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_invitations enable row level security;

create policy "strategy_teachers_select_own_or_admin" on public.strategy_teachers
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Les étudiants passent par strategy_student_classes (pas d'accès aux empreintes)
create policy "classes_select_teacher" on public.classes
  for select to authenticated
  using (teacher_id = (select auth.uid()));

create policy "class_members_select_teacher_or_self" on public.class_members
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.strategy_class_teacher(class_id)));

create policy "class_invitations_select_teacher" on public.class_invitations
  for select to authenticated
  using ((select public.strategy_class_teacher(class_id)));

revoke all on public.strategy_teachers from anon;
revoke insert, update, delete on public.strategy_teachers from authenticated;
revoke all on public.classes from anon;
revoke insert, update, delete on public.classes from authenticated;
revoke all on public.class_members from anon;
revoke insert, update, delete on public.class_members from authenticated;
revoke all on public.class_invitations from anon;
revoke insert, update, delete on public.class_invitations from authenticated;

-- ==================== FONCTIONS : ADMINISTRATION ====================

-- Accorde ou retire le statut enseignant. Les classes existantes restent en place.
create or replace function public.admin_strategy_set_teacher(p_email text, p_enabled boolean)
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
  select id into v_user_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_user_id is null then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  if p_enabled then
    insert into public.strategy_teachers (user_id, granted_by)
    values (v_user_id, auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from public.strategy_teachers where user_id = v_user_id;
  end if;

  perform public.write_audit(
    case when p_enabled then 'strategy.teacher.grant' else 'strategy.teacher.revoke' end,
    'user', v_user_id::text, '{}'::jsonb
  );
  return v_user_id;
end;
$$;

revoke execute on function public.admin_strategy_set_teacher(text, boolean) from public, anon;
grant execute on function public.admin_strategy_set_teacher(text, boolean) to authenticated;

-- Enseignants, avec leurs crédits disponibles et leurs classes
create or replace function public.admin_strategy_teachers()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  credits_available integer,
  classes integer
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
    select t.user_id, u.email::text, t.created_at,
      (select count(*)::integer from public.study_credits c
       where c.user_id = t.user_id and c.consumed_at is null),
      (select count(*)::integer from public.classes k where k.teacher_id = t.user_id)
    from public.strategy_teachers t
    join auth.users u on u.id = t.user_id
    order by t.created_at desc;
end;
$$;

revoke execute on function public.admin_strategy_teachers() from public, anon;
grant execute on function public.admin_strategy_teachers() to authenticated;

-- ==================== FONCTIONS : CLASSES (ENSEIGNANT) ====================

-- Crée une classe (statut enseignant requis, 50 classes actives au plus)
create or replace function public.strategy_create_class(
  p_name text,
  p_institution text,
  p_term text,
  p_due_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := public.strategy_class_text(p_name, 120);
  v_id uuid;
begin
  if not public.strategy_is_teacher() then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  if v_name = '' then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if (select count(*) from public.classes
      where teacher_id = auth.uid() and status = 'active') >= 50 then
    raise exception 'too_many_classes' using errcode = 'P0001';
  end if;

  insert into public.classes (teacher_id, name, institution, term, due_date)
  values (auth.uid(), v_name, public.strategy_class_text(p_institution, 160),
          public.strategy_class_text(p_term, 60), p_due_date)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.strategy_create_class(text, text, text, date)
  from public, anon;
grant execute on function public.strategy_create_class(text, text, text, date)
  to authenticated;

-- Modifie une classe : description, date limite, réglages du coach, archivage. Reste
-- possible si le statut enseignant a été retiré (suivi des classes déjà ouvertes).
create or replace function public.strategy_update_class(
  p_class_id uuid,
  p_name text,
  p_institution text,
  p_term text,
  p_due_date date,
  p_coach_disabled_steps smallint[],
  p_study_budget numeric,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := public.strategy_class_text(p_name, 120);
  v_steps smallint[];
begin
  perform public.strategy_own_class(p_class_id);
  if v_name = '' then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if p_status not in ('active', 'archived') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;
  if p_study_budget is not null and p_study_budget not between 0 and 50 then
    raise exception 'invalid_budget' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(distinct s order by s), '{}') into v_steps
  from unnest(coalesce(p_coach_disabled_steps, '{}')) s;
  if not v_steps <@ array[1, 2, 3, 4, 5, 6, 7, 8]::smallint[] then
    raise exception 'invalid_steps' using errcode = 'P0001';
  end if;

  update public.classes
  set name = v_name,
      institution = public.strategy_class_text(p_institution, 160),
      term = public.strategy_class_text(p_term, 60),
      due_date = p_due_date,
      coach_disabled_steps = v_steps,
      study_budget_usd = p_study_budget,
      status = p_status
  where id = p_class_id;
end;
$$;

revoke execute on function public.strategy_update_class(
  uuid, text, text, text, date, smallint[], numeric, text
) from public, anon;
grant execute on function public.strategy_update_class(
  uuid, text, text, text, date, smallint[], numeric, text
) to authenticated;

-- Lien de classe : un nouveau jeton le régénère (l'ancien ne marche plus), null le désactive
create or replace function public.strategy_set_class_link(p_class_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.strategy_own_class(p_class_id);
  if p_token is not null and char_length(p_token) < 32 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  update public.classes
  set join_token_hash = case when p_token is null then null
                             else public.strategy_token_hash(p_token) end
  where id = p_class_id;
end;
$$;

revoke execute on function public.strategy_set_class_link(uuid, text) from public, anon;
grant execute on function public.strategy_set_class_link(uuid, text) to authenticated;

-- Vérifie le débit (50 envois par heure) et le nombre d'invitations en attente (300)
create or replace function public.strategy_check_class_invite_limits(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.class_invitations
      where class_id = p_class_id and last_sent_at > now() - interval '1 hour') >= 50 then
    raise exception 'invite_rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.class_invitations
      where class_id = p_class_id and status = 'pending' and expires_at > now()) >= 300 then
    raise exception 'too_many_invitations' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.strategy_check_class_invite_limits(uuid)
  from public, anon, authenticated;

-- Invite un étudiant par courriel. Le lien (p_token) est créé par le serveur ; seule son
-- empreinte est gardée. Retourne l'identifiant de l'invitation.
create or replace function public.strategy_invite_student(
  p_class_id uuid,
  p_email text,
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class public.classes;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id uuid;
begin
  v_class := public.strategy_own_class(p_class_id);
  if v_class.status <> 'active' then
    raise exception 'class_archived' using errcode = 'P0001';
  end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_token, '')) < 32 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.class_members m
    join auth.users u on u.id = m.user_id
    where m.class_id = p_class_id and lower(u.email) = v_email
  ) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  update public.class_invitations set status = 'expired'
  where class_id = p_class_id and email = v_email and status = 'pending'
    and expires_at <= now();
  if exists (
    select 1 from public.class_invitations
    where class_id = p_class_id and email = v_email and status = 'pending'
  ) then
    raise exception 'already_invited' using errcode = 'P0001';
  end if;
  perform public.strategy_check_class_invite_limits(p_class_id);

  insert into public.class_invitations (class_id, email, token_hash, invited_by, expires_at)
  values (p_class_id, v_email, public.strategy_token_hash(p_token), auth.uid(),
          now() + interval '14 days')
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.strategy_invite_student(uuid, text, text) from public, anon;
grant execute on function public.strategy_invite_student(uuid, text, text) to authenticated;

-- Renouvelle une invitation en attente ou échue : nouveau lien, 14 jours de plus
create or replace function public.strategy_renew_class_invitation(
  p_invitation_id uuid,
  p_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.class_invitations;
begin
  select * into v_inv from public.class_invitations where id = p_invitation_id for update;
  if not found or not public.strategy_class_teacher(v_inv.class_id) then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  if v_inv.status not in ('pending', 'expired') then
    raise exception 'invitation_closed' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_token, '')) < 32 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if v_inv.status = 'expired' and exists (
    select 1 from public.class_invitations
    where class_id = v_inv.class_id and email = v_inv.email and status = 'pending'
  ) then
    raise exception 'already_invited' using errcode = 'P0001';
  end if;
  perform public.strategy_check_class_invite_limits(v_inv.class_id);

  update public.class_invitations
  set token_hash = public.strategy_token_hash(p_token),
      status = 'pending',
      last_sent_at = now(),
      expires_at = now() + interval '14 days'
  where id = p_invitation_id;
end;
$$;

revoke execute on function public.strategy_renew_class_invitation(uuid, text)
  from public, anon;
grant execute on function public.strategy_renew_class_invitation(uuid, text)
  to authenticated;

-- Retire une invitation en attente ou échue
create or replace function public.strategy_revoke_class_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.class_invitations;
begin
  select * into v_inv from public.class_invitations where id = p_invitation_id for update;
  if not found or not public.strategy_class_teacher(v_inv.class_id) then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  if v_inv.status not in ('pending', 'expired') then
    raise exception 'invitation_closed' using errcode = 'P0001';
  end if;
  update public.class_invitations set status = 'revoked' where id = p_invitation_id;
end;
$$;

revoke execute on function public.strategy_revoke_class_invitation(uuid) from public, anon;
grant execute on function public.strategy_revoke_class_invitation(uuid) to authenticated;

-- Étudiants inscrits, avec le nombre d'études reçues dans la classe (enseignant)
create or replace function public.strategy_class_students(p_class_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  joined_at timestamptz,
  studies integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.strategy_class_teacher(p_class_id) then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  return query
    select m.user_id, nullif(btrim(p.display_name), ''), u.email::text, m.joined_at,
      (select count(*)::integer from public.studies s
       join public.study_members sm on sm.study_id = s.id
       where s.class_id = p_class_id and sm.user_id = m.user_id)
    from public.class_members m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    where m.class_id = p_class_id
    order by coalesce(nullif(btrim(p.display_name), ''), u.email::text);
end;
$$;

revoke execute on function public.strategy_class_students(uuid) from public, anon;
grant execute on function public.strategy_class_students(uuid) to authenticated;

-- Retire un étudiant (enseignant) ou quitte la classe (soi-même). Ses études restent.
create or replace function public.strategy_remove_student(p_class_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is distinct from auth.uid() and not public.strategy_class_teacher(p_class_id)
  then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  delete from public.class_members where class_id = p_class_id and user_id = p_user_id;
  if not found then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.strategy_remove_student(uuid, uuid) from public, anon;
grant execute on function public.strategy_remove_student(uuid, uuid) to authenticated;

-- ==================== FONCTIONS : DISTRIBUTION ====================

-- Distribue une étude par groupe (p_groups : tableau de tableaux d'identifiants ; un
-- groupe d'un seul étudiant est une étude individuelle). Le premier membre du groupe est
-- propriétaire, les autres contributeurs, l'enseignant observateur. Chaque étude consomme
-- un crédit de l'enseignant ; tout ou rien. Retourne les identifiants des études créées.
create or replace function public.strategy_distribute_studies(
  p_class_id uuid,
  p_company_name text,
  p_strategic_question text,
  p_groups jsonb
)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class public.classes;
  v_company text := btrim(coalesce(p_company_name, ''));
  v_question text := btrim(coalesce(p_strategic_question, ''));
  v_count integer;
  v_credits uuid[];
  v_group jsonb;
  v_index integer;
  v_members uuid[];
  v_study_id uuid;
  v_created uuid[] := '{}';
begin
  v_class := public.strategy_own_class(p_class_id);
  if v_class.status <> 'active' then
    raise exception 'class_archived' using errcode = 'P0001';
  end if;
  if char_length(v_company) not between 1 and 200 or char_length(v_question) > 1000 then
    raise exception 'invalid_study' using errcode = 'P0001';
  end if;
  if p_groups is null or jsonb_typeof(p_groups) <> 'array' then
    raise exception 'invalid_groups' using errcode = 'P0001';
  end if;
  v_count := jsonb_array_length(p_groups);
  if v_count not between 1 and 100 then
    raise exception 'invalid_groups' using errcode = 'P0001';
  end if;

  -- Chaque groupe : 1 à 6 étudiants inscrits ; un étudiant dans un seul groupe par envoi
  if exists (
    select 1 from jsonb_array_elements(p_groups) g
    where jsonb_typeof(g) <> 'array' or jsonb_array_length(g) not between 1 and 6
  ) then
    raise exception 'invalid_groups' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_groups) g, jsonb_array_elements(g) m
    where jsonb_typeof(m) <> 'string'
      or (m #>> '{}') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) then
    raise exception 'invalid_groups' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_groups) g, jsonb_array_elements_text(g) m
    group by m having count(*) > 1
  ) or exists (
    select 1 from jsonb_array_elements(p_groups) g, jsonb_array_elements_text(g) m
    where not exists (
      select 1 from public.class_members cm
      where cm.class_id = p_class_id and cm.user_id = m::uuid
    )
  ) then
    raise exception 'invalid_groups' using errcode = 'P0001';
  end if;

  -- Verrouille autant de crédits que d'études (deux envois simultanés : crédits distincts)
  select array_agg(id) into v_credits from (
    select id from public.study_credits
    where user_id = auth.uid() and consumed_at is null
    order by created_at
    limit v_count
    for update skip locked
  ) c;
  if coalesce(cardinality(v_credits), 0) < v_count then
    raise exception 'not_enough_credits' using errcode = 'P0001';
  end if;

  for v_group, v_index in
    select value, ordinality::integer from jsonb_array_elements(p_groups) with ordinality
  loop
    select array_agg(value::uuid order by ordinality) into v_members
    from jsonb_array_elements_text(v_group) with ordinality;

    insert into public.studies (owner_id, company_name, strategic_question, class_id)
    values (v_members[1], v_company, v_question, p_class_id)
    returning id into v_study_id;

    insert into public.study_members (study_id, user_id, role)
    select v_study_id, member, case when rank_no = 1 then 'owner' else 'contributor' end
    from unnest(v_members) with ordinality as t(member, rank_no);
    insert into public.study_members (study_id, user_id, role)
    values (v_study_id, auth.uid(), 'observer');

    insert into public.study_steps (study_id, step_no)
    select v_study_id, step_no from public.strategy_steps;
    insert into public.company_profiles (study_id, updated_by)
    values (v_study_id, auth.uid());

    update public.study_credits
    set consumed_at = now(), study_id = v_study_id
    where id = v_credits[v_index];

    perform public.strategy_log(v_study_id, 'class_assigned', null, null,
                                jsonb_build_object('class', v_class.name));
    v_created := v_created || v_study_id;
  end loop;

  return v_created;
end;
$$;

revoke execute on function public.strategy_distribute_studies(uuid, text, text, jsonb)
  from public, anon;
grant execute on function public.strategy_distribute_studies(uuid, text, text, jsonb)
  to authenticated;

-- ==================== FONCTIONS : SUIVI ====================

-- Suivi d'une classe : une ligne par étude, membres, statut des 9 étapes, dernière activité
create or replace function public.strategy_class_tracking(p_class_id uuid)
returns table (
  study_id uuid,
  company_name text,
  created_at timestamptz,
  last_activity timestamptz,
  members jsonb,
  steps jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.strategy_class_teacher(p_class_id) then
    raise exception 'not_teacher' using errcode = '42501';
  end if;
  return query
    select s.id, s.company_name, s.created_at,
      greatest(s.updated_at,
               (select max(st.updated_at) from public.study_steps st where st.study_id = s.id),
               (select max(a.created_at) from public.study_activity a
                where a.study_id = s.id and a.action <> 'class_assigned')),
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'userId', m.user_id, 'role', m.role,
                 'name', public.strategy_member_name(m.user_id))
               order by case m.role when 'owner' then 0 else 1 end, m.created_at)
        from public.study_members m
        where m.study_id = s.id and m.role <> 'observer'
      ), '[]'::jsonb),
      coalesce((
        select jsonb_agg(st.status order by st.step_no)
        from public.study_steps st where st.study_id = s.id
      ), '[]'::jsonb)
    from public.studies s
    where s.class_id = p_class_id
    order by s.created_at, s.id;
end;
$$;

revoke execute on function public.strategy_class_tracking(uuid) from public, anon;
grant execute on function public.strategy_class_tracking(uuid) to authenticated;

-- ==================== FONCTIONS : ÉTUDIANTS ====================

-- Classes de la personne connectée (étudiant)
create or replace function public.strategy_student_classes()
returns table (
  class_id uuid,
  name text,
  institution text,
  term text,
  due_date date,
  status text,
  teacher_name text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.institution, c.term, c.due_date, c.status,
         public.strategy_member_name(c.teacher_id), m.joined_at
  from public.class_members m
  join public.classes c on c.id = m.class_id
  where m.user_id = auth.uid()
  order by c.status, m.joined_at desc;
$$;

revoke execute on function public.strategy_student_classes() from public, anon;
grant execute on function public.strategy_student_classes() to authenticated;

-- Classe d'une étude, vue par ses membres (null hors classe) : nom, date limite, étapes
-- sans coach et enseignant
create or replace function public.strategy_study_class(p_study_id uuid)
returns table (
  class_id uuid,
  name text,
  due_date date,
  coach_disabled_steps smallint[],
  teacher_id uuid,
  teacher_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.due_date, c.coach_disabled_steps, c.teacher_id,
         public.strategy_member_name(c.teacher_id)
  from public.studies s
  join public.classes c on c.id = s.class_id
  where s.id = p_study_id and public.study_role(p_study_id) is not null;
$$;

revoke execute on function public.strategy_study_class(uuid) from public, anon;
grant execute on function public.strategy_study_class(uuid) to authenticated;

-- Classe désignée par un lien (lien de classe ou invitation), vue par la personne
-- connectée ; aucune ligne si le lien est inconnu ou le lien de classe désactivé
create or replace function public.strategy_class_by_token(p_token text)
returns table (
  class_id uuid,
  name text,
  institution text,
  term text,
  teacher_name text,
  class_status text,
  kind text,
  invitation_email text,
  invitation_status text,
  expired boolean,
  email_matches boolean,
  is_teacher boolean,
  already_member boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select c.*, 'link'::text as kind, null::text as inv_email, null::text as inv_status,
           false as inv_expired
    from public.classes c
    where c.join_token_hash = public.strategy_token_hash(coalesce(p_token, ''))
    union all
    select c.*, 'invitation', i.email, i.status, i.expires_at <= now()
    from public.class_invitations i
    join public.classes c on c.id = i.class_id
    where i.token_hash = public.strategy_token_hash(coalesce(p_token, ''))
  )
  select t.id, t.name, t.institution, t.term, public.strategy_member_name(t.teacher_id),
         t.status, t.kind, t.inv_email, t.inv_status, t.inv_expired,
         t.kind = 'link' or t.inv_email = public.strategy_my_email(),
         t.teacher_id = auth.uid(),
         exists (select 1 from public.class_members m
                 where m.class_id = t.id and m.user_id = auth.uid())
  from target t
  where auth.uid() is not null
  limit 1;
$$;

revoke execute on function public.strategy_class_by_token(text) from public, anon;
grant execute on function public.strategy_class_by_token(text) to authenticated;

-- Rejoint une classe par son lien ou par une invitation adressée au courriel confirmé de
-- la personne connectée (300 étudiants au plus). Retourne l'identifiant de la classe.
create or replace function public.strategy_join_class(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text := public.strategy_token_hash(coalesce(p_token, ''));
  v_class public.classes;
  v_inv public.class_invitations;
begin
  if auth.uid() is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  select * into v_class from public.classes where join_token_hash = v_hash for update;
  if not found then
    select * into v_inv from public.class_invitations where token_hash = v_hash for update;
    if not found then
      raise exception 'link_not_found' using errcode = 'P0001';
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
    select * into v_class from public.classes where id = v_inv.class_id for update;
  end if;

  if v_class.teacher_id = auth.uid() then
    raise exception 'is_teacher' using errcode = 'P0001';
  end if;
  if v_class.status <> 'active' then
    raise exception 'class_archived' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.class_members
             where class_id = v_class.id and user_id = auth.uid()) then
    return v_class.id;
  end if;
  if (select count(*) from public.class_members where class_id = v_class.id) >= 300 then
    raise exception 'class_full' using errcode = 'P0001';
  end if;

  insert into public.class_members (class_id, user_id) values (v_class.id, auth.uid());
  if v_inv.id is not null then
    update public.class_invitations
    set status = 'accepted', responded_at = now(), responded_by = auth.uid()
    where id = v_inv.id;
  end if;
  return v_class.id;
end;
$$;

revoke execute on function public.strategy_join_class(text) from public, anon;
grant execute on function public.strategy_join_class(text) to authenticated;

-- ==================== RETOUCHES : MEMBRES ====================

-- Remplacée : l'enseignant de la classe garde son rôle d'observateur
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
  if p_user_id = public.strategy_study_teacher(p_study_id) then
    raise exception 'class_teacher' using errcode = 'P0001';
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

-- Remplacée : le propriétaire ne peut pas retirer l'enseignant de la classe (l'enseignant
-- peut partir de lui-même)
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
  if not v_self and p_user_id = public.strategy_study_teacher(p_study_id) then
    raise exception 'class_teacher' using errcode = 'P0001';
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

-- ==================== RETOUCHES : COACH ====================

-- Remplacée : le plafond de la classe, s'il est fixé, remplace le plafond général
create or replace function public.coach_study_budget(p_study_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select c.study_budget_usd
    from public.studies s
    join public.classes c on c.id = s.class_id
    where s.id = p_study_id
  ), g.coach_study_budget) + coalesce((
    select sum(a.amount_usd) from public.coach_allowances a where a.study_id = p_study_id
  ), 0)
  from public.strategy_settings g
  where g.id;
$$;

revoke execute on function public.coach_study_budget(uuid) from public, anon, authenticated;

-- Remplacée (même signature) : refus « coach_disabled_step » si la classe de l'étude a
-- coupé le coach pour cette étape. Le reste est inchangé.
create or replace function public.coach_reserve(
  p_study_id uuid,
  p_step_no smallint,
  p_function text,
  p_estimate numeric,
  p_attachment_id uuid default null
)
returns table (
  request_id uuid,
  refusal text,
  model text,
  input_price numeric,
  output_price numeric,
  search_max_uses integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.strategy_settings;
  v_status text;
  v_count integer;
  v_id uuid;
  v_estimate numeric;
begin
  if coalesce(public.study_role(p_study_id), '') not in ('owner', 'contributor') then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_function = 'extract' then
    if p_step_no is not null or not exists (
      select 1 from public.study_attachments
      where id = p_attachment_id and study_id = p_study_id
    ) then
      raise exception 'invalid_request' using errcode = 'P0001';
    end if;
  elsif p_function = 'plan' then
    if p_step_no is distinct from 9 or p_attachment_id is not null then
      raise exception 'invalid_request' using errcode = 'P0001';
    end if;
  elsif p_function not in ('review', 'deepen', 'score', 'research', 'synthesize')
    or p_step_no is null or p_step_no not between 1 and 8
    or p_attachment_id is not null
    or (p_function = 'research' and p_step_no not in (1, 2))
    or (p_function = 'synthesize' and p_step_no <> 5) then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;
  if p_estimate is null or p_estimate < 0 or p_estimate > 50 then
    raise exception 'invalid_estimate' using errcode = 'P0001';
  end if;
  if p_function <> 'extract' then
    if cardinality(public.strategy_missing_prerequisites(p_study_id, p_step_no)) > 0 then
      raise exception 'prerequisites_missing' using errcode = 'P0001';
    end if;
    select status into v_status from public.study_steps
    where study_id = p_study_id and step_no = p_step_no;
    if v_status = 'validated' then
      raise exception 'step_validated' using errcode = 'P0001';
    end if;
  end if;

  select * into v_settings from public.strategy_settings where id;
  if not v_settings.coach_enabled then
    return query select null::uuid, 'coach_disabled'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  -- Coach coupé par l'enseignant pour cette étape
  if p_step_no is not null and exists (
    select 1 from public.studies s
    join public.classes c on c.id = s.class_id
    where s.id = p_study_id and p_step_no = any (c.coach_disabled_steps)
  ) then
    return query select null::uuid, 'coach_disabled_step'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  v_estimate := p_estimate;
  if p_function = 'research' then
    v_estimate := v_estimate
      + v_settings.coach_search_max_uses * v_settings.coach_search_price;
  end if;

  -- Sérialise les demandes d'un même utilisateur et d'une même étude
  perform pg_advisory_xact_lock(hashtext('coach:user:' || auth.uid()::text));
  perform pg_advisory_xact_lock(hashtext('coach:study:' || p_study_id::text));

  select count(*) into v_count from public.coach_requests
  where user_id = auth.uid()
    and created_at > now() - make_interval(mins => v_settings.coach_rate_window);
  if v_count >= v_settings.coach_rate_limit then
    if not exists (
      select 1 from public.audit_logs
      where action = 'coach.rate_limited' and target_id = auth.uid()::text
        and created_at > now() - make_interval(mins => v_settings.coach_rate_window)
    ) then
      insert into public.audit_logs (actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'coach.rate_limited', 'user', auth.uid()::text,
        jsonb_build_object('study_id', p_study_id, 'count', v_count));
    end if;
    return query select null::uuid, 'rate_limited'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  if public.coach_study_spent(p_study_id) + v_estimate > public.coach_study_budget(p_study_id)
  then
    if not exists (
      select 1 from public.audit_logs
      where action = 'coach.budget_reached' and target_id = p_study_id::text
        and created_at > now() - interval '1 day'
    ) then
      insert into public.audit_logs (actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'coach.budget_reached', 'study', p_study_id::text,
        jsonb_build_object('spent', public.coach_study_spent(p_study_id)));
    end if;
    return query select null::uuid, 'budget_exhausted'::text, null::text, null::numeric,
      null::numeric, null::integer;
    return;
  end if;

  insert into public.coach_requests (
    study_id, user_id, function, step_no, attachment_id, model, input_price, output_price,
    search_price, estimate_usd
  )
  values (
    p_study_id, auth.uid(), p_function, p_step_no, p_attachment_id, v_settings.coach_model,
    v_settings.coach_input_price, v_settings.coach_output_price,
    v_settings.coach_search_price, v_estimate
  )
  returning id into v_id;

  return query select v_id, null::text, v_settings.coach_model,
    v_settings.coach_input_price, v_settings.coach_output_price,
    v_settings.coach_search_max_uses;
end;
$$;

revoke execute on function public.coach_reserve(uuid, smallint, text, numeric, uuid)
  from public, anon;
grant execute on function public.coach_reserve(uuid, smallint, text, numeric, uuid)
  to authenticated;
