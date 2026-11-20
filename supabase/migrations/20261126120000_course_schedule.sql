/*
=============================================================
  Fichier    : 20261126120000_course_schedule.sql
  Projet     : Kalami Stratégie — le cours
  Description: Diffusion programmée par cohorte (v0.33.0). Chaque cohorte peut activer
               un calendrier : une date d'ouverture par module, et au besoin par leçon
               (la date de la leçon remplace celle du module). Sans date, le contenu est
               ouvert. Option « lecture en avance » : la prochaine leçon se lit avant sa
               date, sans exercices ni fin de leçon. Les apprenants sans cohorte, et les
               cohortes non programmées, gardent l'accès complet.
               Les dates sont des instants (minuit dans le fuseau de la cohorte).
  Auteur     : Claude Marcel
  Version    : 1.0
  Date       : 2026-11-20
  Dépend de  : 20261124120000_course.sql, 20261125120000_course_admin.sql
=============================================================
*/

-- ==================== COHORTES : RÉGLAGES DE DIFFUSION ====================

alter table public.course_cohorts
  add column schedule_enabled boolean not null default false,
  add column read_ahead boolean not null default false,
  add column timezone text not null default 'Africa/Abidjan'
    check (timezone in ('Africa/Abidjan', 'America/Toronto'));

comment on column public.course_cohorts.schedule_enabled is
  'Vrai : le calendrier de diffusion s''applique aux apprenants de la cohorte.';
comment on column public.course_cohorts.read_ahead is
  'Vrai : la prochaine leçon se lit avant sa date (sans exercices).';
comment on column public.course_cohorts.timezone is
  'Fuseau des ouvertures (minuit local) : Abidjan ou Montréal (America/Toronto).';

-- ==================== CALENDRIER ====================

create table public.course_schedule (
  cohort_id uuid not null references public.course_cohorts (id) on delete cascade,
  -- Module « m05 » ou leçon « m05-l02 »
  item_id text not null check (item_id ~ '^m[0-9]{2}(-l[0-9]{2})?$'),
  opens_at timestamptz not null,
  primary key (cohort_id, item_id)
);

comment on table public.course_schedule is
  'Dates d''ouverture des modules et des leçons, par cohorte.';

alter table public.course_schedule enable row level security;

revoke all on public.course_schedule from anon;
revoke insert, update, delete on public.course_schedule from authenticated;

-- Lecture : administrateurs (l'apprenant passe par course_my_calendar)
create policy "course_schedule_select_admin" on public.course_schedule
  for select to authenticated using (public.is_admin());

-- ==================== CALENDRIER DE L'APPRENANT ====================

/**
 * Calendrier de la cohorte de l'utilisateur courant, si elle est programmée :
 * { timezone, read_ahead, items: { "m05": "2026-12-01T00:00:00Z", ... } }.
 * Null : aucune restriction (sans cohorte, cohorte non programmée, ou pas d'accès).
 */
create or replace function public.course_my_calendar()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'timezone', c.timezone,
    'read_ahead', c.read_ahead,
    'items', coalesce(
      (select jsonb_object_agg(s.item_id, s.opens_at)
       from public.course_schedule s where s.cohort_id = c.id),
      '{}'::jsonb
    )
  )
  from public.course_access a
  join public.course_cohorts c on c.id = a.cohort_id and c.schedule_enabled
  where a.user_id = auth.uid() and a.revoked_at is null;
$$;

revoke execute on function public.course_my_calendar() from public, anon;
grant execute on function public.course_my_calendar() to authenticated;

/**
 * Date d'ouverture d'une leçon pour l'utilisateur courant (date de la leçon, sinon du
 * module) et option de lecture en avance de sa cohorte. Aucune ligne : pas de calendrier.
 * Usage interne (fonctions du cours).
 */
create or replace function public.course_lesson_window(p_lesson text)
returns table (opens_at timestamptz, read_ahead boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sl.opens_at, sm.opens_at), c.read_ahead
  from public.course_access a
  join public.course_cohorts c on c.id = a.cohort_id and c.schedule_enabled
  left join public.course_schedule sl
    on sl.cohort_id = c.id and sl.item_id = p_lesson
  left join public.course_schedule sm
    on sm.cohort_id = c.id and sm.item_id = left(p_lesson, 3)
  where a.user_id = auth.uid() and a.revoked_at is null;
$$;

revoke execute on function public.course_lesson_window(text)
  from public, anon, authenticated;

-- ==================== CONTRÔLE DANS LES FONCTIONS DU COURS ====================

/**
 * Battement de présence (voir 20261124120000_course.sql). Ajout v0.33.0 : refusé sur
 * une leçon pas encore ouverte, sauf si la cohorte permet la lecture en avance.
 */
create or replace function public.record_course_activity(p_lesson text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_opens timestamptz;
  v_ahead boolean;
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
  select w.opens_at, w.read_ahead into v_opens, v_ahead
  from public.course_lesson_window(p_lesson) w;
  if v_opens is not null and v_opens > now() and not coalesce(v_ahead, false) then
    raise exception 'lesson_locked' using errcode = 'P0001';
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

/** Leçon terminée. Ajout v0.33.0 : refusé tant que la leçon n'est pas ouverte. */
create or replace function public.complete_course_lesson(p_lesson text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_opens timestamptz;
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
  select w.opens_at into v_opens from public.course_lesson_window(p_lesson) w;
  if v_opens is not null and v_opens > now() then
    raise exception 'lesson_locked' using errcode = 'P0001';
  end if;

  insert into public.course_lesson_progress as p (user_id, lesson_id, completed_at)
  values (v_user, p_lesson, now())
  on conflict (user_id, lesson_id) do update set
    completed_at = coalesce(p.completed_at, now());
end;
$$;

revoke execute on function public.complete_course_lesson(text) from public, anon;
grant execute on function public.complete_course_lesson(text) to authenticated;

-- ==================== ADMINISTRATION ====================

/**
 * Enregistre le calendrier d'une cohorte : activation, lecture en avance, fuseau, et
 * dates (objet { "m05": "2026-12-01", "m05-l02": "2026-12-04" }, 300 entrées au plus).
 * Les dates remplacent tout le calendrier précédent ; chaque date ouvre à minuit dans
 * le fuseau de la cohorte.
 */
create or replace function public.admin_course_save_schedule(
  p_cohort_id uuid,
  p_enabled boolean,
  p_read_ahead boolean,
  p_timezone text,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_timezone is null or p_timezone not in ('Africa/Abidjan', 'America/Toronto') then
    raise exception 'invalid_timezone' using errcode = 'P0001';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'object' then
    raise exception 'invalid_schedule' using errcode = 'P0001';
  end if;
  select count(*) into v_count from jsonb_each(p_items);
  if v_count > 300 or exists (
    select 1 from jsonb_each(p_items) e
    where e.key !~ '^m[0-9]{2}(-l[0-9]{2})?$'
      or jsonb_typeof(e.value) <> 'string'
      or (e.value #>> '{}') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ) then
    raise exception 'invalid_schedule' using errcode = 'P0001';
  end if;

  update public.course_cohorts set
    schedule_enabled = coalesce(p_enabled, false),
    read_ahead = coalesce(p_read_ahead, false),
    timezone = p_timezone
  where id = p_cohort_id
  returning id into v_id;
  if v_id is null then
    raise exception 'cohort_not_found' using errcode = 'P0001';
  end if;

  delete from public.course_schedule where cohort_id = v_id;
  begin
    insert into public.course_schedule (cohort_id, item_id, opens_at)
    select v_id, e.key, ((e.value #>> '{}')::date)::timestamp at time zone p_timezone
    from jsonb_each(p_items) e;
  exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'invalid_schedule' using errcode = 'P0001';
  end;

  perform public.write_audit('course.schedule', 'course_cohort', v_id::text,
    jsonb_build_object('enabled', coalesce(p_enabled, false),
      'read_ahead', coalesce(p_read_ahead, false), 'items', v_count));
end;
$$;

revoke execute on function public.admin_course_save_schedule(uuid, boolean, boolean, text, jsonb)
  from public, anon;
grant execute on function public.admin_course_save_schedule(uuid, boolean, boolean, text, jsonb)
  to authenticated;
