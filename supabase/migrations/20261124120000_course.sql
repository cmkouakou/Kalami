-- =============================================================
--  Fichier    : 20261124120000_course.sql
--  Projet     : Kalami Stratégie — le cours
--  Description: Cours de stratégie (v0.28.0, Sprint 1) : cohortes, droits d'accès,
--               progression par leçon, temps de formation par jour, tentatives aux
--               exercices et annotations. Le contenu des leçons vit dans le code
--               (src/lib/cours) ; la base ne garde que ce que fait l'apprenant.
--               Identifiants stables : leçon « m01-l02 », exercice « m01-l02-e3 »,
--               quiz de module « m01-quiz », examen « examen ».
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-19
--  Dépend de  : 20261006120000_profiles_roles.sql, 20261104120000_orders.sql
-- =============================================================

-- ==================== COHORTES ====================

create table public.course_cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  country text check (country ~ '^[A-Z]{2}$'),
  starts_on date,
  ends_on date,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create trigger course_cohorts_set_updated_at
  before update on public.course_cohorts
  for each row execute function public.set_updated_at();

-- ==================== DROITS D'ACCÈS ====================

-- Accordés par un achat (Sprint 2) ou par l'administrateur (cohorte)
create table public.course_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('purchase', 'admin_grant')),
  cohort_id uuid references public.course_cohorts (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  granted_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul droit actif par apprenant
create unique index course_access_active_unique
  on public.course_access (user_id) where revoked_at is null;
create index course_access_cohort_idx on public.course_access (cohort_id);

create trigger course_access_set_updated_at
  before update on public.course_access
  for each row execute function public.set_updated_at();

/**
 * Vrai si l'utilisateur courant peut suivre le cours : droit actif, ou administrateur
 * (sans exiger la double authentification, pour relire le cours comme un apprenant).
 */
create or replace function public.has_course_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.course_access a
    where a.user_id = auth.uid() and a.revoked_at is null
  ) or coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke execute on function public.has_course_access() from public, anon;
grant execute on function public.has_course_access() to authenticated;

-- ==================== PROGRESSION PAR LEÇON ====================

create table public.course_lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^m[0-9]{2}-l[0-9]{2}$'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Temps actif sur la leçon (battements espacés de 2 minutes au plus)
  seconds integer not null default 0 check (seconds between 0 and 864000),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

comment on table public.course_lesson_progress is
  'Leçons du cours ouvertes et terminées, avec le temps actif passé sur chacune.';

-- ==================== TEMPS DE FORMATION PAR JOUR ====================

create table public.course_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  seconds integer not null default 0 check (seconds between 0 and 86400),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index course_activity_day_idx on public.course_activity (day);

/**
 * Battement de présence sur une leçon (envoyé toutes les 30 s quand l'onglet est visible
 * et que l'apprenant a agi récemment). L'écart depuis le battement précédent est compté
 * s'il ne dépasse pas 2 minutes ; au-delà, c'est une pause et rien n'est compté.
 * Ouvre la leçon (started_at) au premier appel.
 */
create or replace function public.record_course_activity(p_lesson text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'connexion requise' using errcode = '42501';
  end if;
  if p_lesson is null or p_lesson !~ '^m[0-9]{2}-l[0-9]{2}$' then
    raise exception 'leçon invalide' using errcode = '22023';
  end if;
  if not public.has_course_access() then
    raise exception 'accès au cours requis' using errcode = '42501';
  end if;

  insert into public.course_lesson_progress as p (user_id, lesson_id)
  values (v_user, p_lesson)
  on conflict (user_id, lesson_id) do update set
    seconds = least(
      864000,
      p.seconds + case
        when now() - p.last_seen_at <= interval '2 minutes'
          then extract(epoch from now() - p.last_seen_at)::integer
        else 0
      end
    ),
    last_seen_at = now();

  insert into public.course_activity as a (user_id, day)
  values (v_user, (now() at time zone 'utc')::date)
  on conflict (user_id, day) do update set
    seconds = least(
      86400,
      a.seconds + case
        when now() - a.last_seen_at <= interval '2 minutes'
          then extract(epoch from now() - a.last_seen_at)::integer
        else 0
      end
    ),
    last_seen_at = now();
end;
$$;

revoke execute on function public.record_course_activity(text) from public, anon;
grant execute on function public.record_course_activity(text) to authenticated;

/** Marque une leçon comme terminée (une seule fois : la première date est gardée). */
create or replace function public.complete_course_lesson(p_lesson text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'connexion requise' using errcode = '42501';
  end if;
  if p_lesson is null or p_lesson !~ '^m[0-9]{2}-l[0-9]{2}$' then
    raise exception 'leçon invalide' using errcode = '22023';
  end if;
  if not public.has_course_access() then
    raise exception 'accès au cours requis' using errcode = '42501';
  end if;

  insert into public.course_lesson_progress as p (user_id, lesson_id, completed_at)
  values (v_user, p_lesson, now())
  on conflict (user_id, lesson_id) do update set
    completed_at = coalesce(p.completed_at, now());
end;
$$;

revoke execute on function public.complete_course_lesson(text) from public, anon;
grant execute on function public.complete_course_lesson(text) to authenticated;

-- ==================== TENTATIVES (EXERCICES, QUIZ, EXAMEN) ====================

-- Notées par le serveur (clé secrète) : l'apprenant lit ses tentatives, n'en écrit aucune
create table public.course_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null
    check (exercise_id ~ '^(m[0-9]{2}-l[0-9]{2}-e[0-9]{1,2}|m[0-9]{2}-quiz|examen)$'),
  score numeric(5, 2) not null check (score between 0 and 100),
  answers jsonb not null default '{}'::jsonb check (pg_column_size(answers) <= 8192),
  created_at timestamptz not null default now()
);

create index course_attempts_user_idx on public.course_attempts (user_id, exercise_id);

-- ==================== ANNOTATIONS ====================

-- Même ancrage que la liseuse : bloc de la leçon + décalage dans son texte
create table public.course_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^m[0-9]{2}-l[0-9]{2}$'),
  start_block integer not null check (start_block >= 0),
  start_offset integer not null check (start_offset >= 0),
  end_block integer not null check (end_block >= 0),
  end_offset integer not null check (end_offset >= 0),
  color text not null default 'jaune'
    check (color in ('jaune', 'vert', 'bleu', 'rose', 'orange')),
  quote text not null check (char_length(quote) between 1 and 1000),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    end_block > start_block
    or (end_block = start_block and end_offset > start_offset)
  )
);

create index course_annotations_user_lesson_idx
  on public.course_annotations (user_id, lesson_id, start_block, start_offset);

create trigger course_annotations_set_updated_at
  before update on public.course_annotations
  for each row execute function public.set_updated_at();

-- Plafond d'annotations par apprenant et par leçon
create or replace function public.course_annotations_enforce_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*) from public.course_annotations
    where user_id = new.user_id and lesson_id = new.lesson_id
  ) >= 500 then
    raise exception 'trop d''annotations pour cette leçon' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger course_annotations_limit
  before insert on public.course_annotations
  for each row execute function public.course_annotations_enforce_limit();

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.course_cohorts enable row level security;
alter table public.course_access enable row level security;
alter table public.course_lesson_progress enable row level security;
alter table public.course_activity enable row level security;
alter table public.course_attempts enable row level security;
alter table public.course_annotations enable row level security;

revoke all on public.course_cohorts, public.course_access, public.course_lesson_progress,
  public.course_activity, public.course_attempts, public.course_annotations from anon;
revoke insert, update, delete on public.course_cohorts, public.course_access,
  public.course_lesson_progress, public.course_activity, public.course_attempts
  from authenticated;

-- Cohortes : administrateurs (lecture ; l'écriture passe par la clé serveur)
create policy "course_cohorts_select_admin" on public.course_cohorts
  for select to authenticated using (public.is_admin());

-- Droits : l'apprenant voit le sien, l'administrateur tous
create policy "course_access_select" on public.course_access
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

-- Progression, temps, tentatives : lecture de ses propres lignes (écriture par fonctions)
create policy "course_lesson_progress_select" on public.course_lesson_progress
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
create policy "course_activity_select" on public.course_activity
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
create policy "course_attempts_select" on public.course_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

-- Annotations : privées à l'apprenant, écriture réservée aux détenteurs d'un accès
create policy "course_annotations_select_own" on public.course_annotations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "course_annotations_insert_own" on public.course_annotations
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.has_course_access());
create policy "course_annotations_update_own" on public.course_annotations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "course_annotations_delete_own" on public.course_annotations
  for delete to authenticated using ((select auth.uid()) = user_id);
