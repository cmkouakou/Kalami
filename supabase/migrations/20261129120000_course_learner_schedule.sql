/*
=============================================================
  Fichier    : 20261129120000_course_learner_schedule.sql
  Projet     : Kalami Stratégie — le cours
  Description: Dates individuelles (v0.42.0) : l'administration ouvre ou ferme des
               modules et des leçons pour des apprenants choisis, à une date donnée.
               Les dates individuelles l'emportent sur le calendrier de la cohorte,
               champ par champ : leçon de l'apprenant, module de l'apprenant, leçon de
               la cohorte, module de la cohorte. La fermeture n'existe qu'en individuel.
               Mises à jour : calendrier de l'apprenant (course_my_calendar), fenêtre
               d'une leçon (course_lesson_window, avec la fermeture), battement de
               présence et leçon terminée (refusés sur une leçon fermée).
  Auteur     : Claude Marcel
  Version    : 1.0
  Date       : 2026-11-20
  Dépend de  : 20261124120000_course.sql, 20261126120000_course_schedule.sql
=============================================================
*/

-- ==================== DATES INDIVIDUELLES ====================

create table public.course_learner_schedule (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Module « m05 » ou leçon « m05-l02 »
  item_id text not null check (item_id ~ '^m[0-9]{2}(-l[0-9]{2})?$'),
  opens_at timestamptz,
  closes_at timestamptz,
  -- Fuseau dans lequel l'administration a saisi les dates (affichage à l'apprenant)
  timezone text not null default 'Africa/Abidjan'
    check (timezone in ('Africa/Abidjan', 'America/Toronto')),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id),
  check (opens_at is not null or closes_at is not null),
  check (opens_at is null or closes_at is null or closes_at > opens_at)
);

comment on table public.course_learner_schedule is
  'Dates d''ouverture et de fermeture propres à un apprenant, par module ou leçon.';

alter table public.course_learner_schedule enable row level security;

revoke all on public.course_learner_schedule from anon;
revoke insert, update, delete on public.course_learner_schedule from authenticated;

-- Lecture : administrateurs (l'apprenant passe par course_my_calendar)
create policy "course_learner_schedule_select_admin" on public.course_learner_schedule
  for select to authenticated using (public.is_admin());

-- ==================== CALENDRIER DE L'APPRENANT ====================

/**
 * Calendrier de l'utilisateur courant :
 * { timezone, read_ahead, items: { "m05": ouverture cohorte },
 *   personal: { "m05-l02": { opens, closes } } }.
 * Null : aucune restriction (ni cohorte programmée, ni date individuelle, ni accès).
 */
create or replace function public.course_my_calendar()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with acces as (
    select a.user_id, c.id as cohort_id, c.timezone, c.read_ahead
    from public.course_access a
    left join public.course_cohorts c on c.id = a.cohort_id and c.schedule_enabled
    where a.user_id = auth.uid() and a.revoked_at is null
    limit 1
  ),
  perso as (
    select ls.item_id, ls.opens_at, ls.closes_at, ls.timezone, ls.updated_at
    from public.course_learner_schedule ls
    where ls.user_id = auth.uid()
  )
  select case
    when x.cohort_id is null and not exists (select 1 from perso) then null
    else jsonb_build_object(
      'timezone', coalesce(
        x.timezone,
        (select p.timezone from perso p order by p.updated_at desc limit 1),
        'Africa/Abidjan'
      ),
      'read_ahead', coalesce(x.read_ahead, false),
      'items', coalesce(
        (select jsonb_object_agg(s.item_id, s.opens_at)
         from public.course_schedule s where s.cohort_id = x.cohort_id),
        '{}'::jsonb
      ),
      'personal', coalesce(
        (select jsonb_object_agg(
           p.item_id, jsonb_build_object('opens', p.opens_at, 'closes', p.closes_at))
         from perso p),
        '{}'::jsonb
      )
    )
  end
  from acces x;
$$;

revoke execute on function public.course_my_calendar() from public, anon;
grant execute on function public.course_my_calendar() to authenticated;

/**
 * Fenêtre d'une leçon pour l'utilisateur courant : ouverture (leçon puis module de
 * l'apprenant, puis de la cohorte), fermeture (leçon puis module de l'apprenant) et
 * lecture en avance de la cohorte. Aucune ligne : pas d'accès.
 * Usage interne (fonctions du cours). Le type de retour change : suppression d'abord.
 */
drop function if exists public.course_lesson_window(text);

create function public.course_lesson_window(p_lesson text)
returns table (opens_at timestamptz, closes_at timestamptz, read_ahead boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(pl.opens_at, pm.opens_at, sl.opens_at, sm.opens_at),
    coalesce(pl.closes_at, pm.closes_at),
    coalesce(c.read_ahead, false)
  from public.course_access a
  left join public.course_cohorts c on c.id = a.cohort_id and c.schedule_enabled
  left join public.course_schedule sl
    on sl.cohort_id = c.id and sl.item_id = p_lesson
  left join public.course_schedule sm
    on sm.cohort_id = c.id and sm.item_id = left(p_lesson, 3)
  left join public.course_learner_schedule pl
    on pl.user_id = a.user_id and pl.item_id = p_lesson
  left join public.course_learner_schedule pm
    on pm.user_id = a.user_id and pm.item_id = left(p_lesson, 3)
  where a.user_id = auth.uid() and a.revoked_at is null;
$$;

revoke execute on function public.course_lesson_window(text)
  from public, anon, authenticated;

-- ==================== CONTRÔLE DANS LES FONCTIONS DU COURS ====================

/**
 * Battement de présence. Refusé sur une leçon pas encore ouverte (sauf lecture en
 * avance de la cohorte) et, depuis la v0.42.0, sur une leçon fermée.
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
  v_closes timestamptz;
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
  select w.opens_at, w.closes_at, w.read_ahead into v_opens, v_closes, v_ahead
  from public.course_lesson_window(p_lesson) w;
  if v_closes is not null and v_closes <= now() then
    raise exception 'lesson_closed' using errcode = 'P0001';
  end if;
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

/** Leçon terminée : refusé tant que la leçon n'est pas ouverte, ou une fois fermée. */
create or replace function public.complete_course_lesson(p_lesson text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_opens timestamptz;
  v_closes timestamptz;
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
  select w.opens_at, w.closes_at into v_opens, v_closes
  from public.course_lesson_window(p_lesson) w;
  if v_closes is not null and v_closes <= now() then
    raise exception 'lesson_closed' using errcode = 'P0001';
  end if;
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
 * Pose des dates individuelles : pour chaque apprenant (accès actif) et chaque module
 * ou leçon, ouverture et/ou fermeture à minuit dans le fuseau choisi. Remplace les
 * dates déjà posées sur ces éléments. 500 apprenants et 200 éléments au plus.
 * Renvoie le nombre de dates écrites.
 */
create or replace function public.admin_course_set_learner_schedule(
  p_user_ids uuid[],
  p_items text[],
  p_opens date,
  p_closes date,
  p_timezone text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_timezone is null or p_timezone not in ('Africa/Abidjan', 'America/Toronto') then
    raise exception 'invalid_timezone' using errcode = 'P0001';
  end if;
  if p_user_ids is null or cardinality(p_user_ids) = 0 or cardinality(p_user_ids) > 500 then
    raise exception 'no_learners' using errcode = 'P0001';
  end if;
  if p_items is null or cardinality(p_items) = 0 or cardinality(p_items) > 200
    or exists (select 1 from unnest(p_items) i where i !~ '^m[0-9]{2}(-l[0-9]{2})?$') then
    raise exception 'no_items' using errcode = 'P0001';
  end if;
  if p_opens is null and p_closes is null then
    raise exception 'no_dates' using errcode = 'P0001';
  end if;
  if p_opens is not null and p_closes is not null and p_closes <= p_opens then
    raise exception 'invalid_window' using errcode = 'P0001';
  end if;

  insert into public.course_learner_schedule as s
    (user_id, item_id, opens_at, closes_at, timezone, updated_at)
  select u.user_id, i.item_id,
    p_opens::timestamp at time zone p_timezone,
    p_closes::timestamp at time zone p_timezone,
    p_timezone, now()
  from (
    select distinct a.user_id from public.course_access a
    where a.user_id = any(p_user_ids) and a.revoked_at is null
  ) u
  cross join (select distinct x as item_id from unnest(p_items) x) i
  on conflict (user_id, item_id) do update set
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at,
    timezone = excluded.timezone,
    updated_at = now();
  get diagnostics v_count = row_count;

  perform public.write_audit('course.learner_schedule', 'course_access', null,
    jsonb_build_object('learners', cardinality(p_user_ids), 'items', p_items,
      'opens', p_opens, 'closes', p_closes, 'written', v_count));
  return v_count;
end;
$$;

revoke execute on function public.admin_course_set_learner_schedule(
  uuid[], text[], date, date, text) from public, anon;
grant execute on function public.admin_course_set_learner_schedule(
  uuid[], text[], date, date, text) to authenticated;

/**
 * Retire des dates individuelles : celles des éléments donnés, ou toutes (p_items
 * null ou vide) pour les apprenants donnés. Renvoie le nombre de dates retirées.
 */
create or replace function public.admin_course_clear_learner_schedule(
  p_user_ids uuid[],
  p_items text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_user_ids is null or cardinality(p_user_ids) = 0 or cardinality(p_user_ids) > 500 then
    raise exception 'no_learners' using errcode = 'P0001';
  end if;

  delete from public.course_learner_schedule s
  where s.user_id = any(p_user_ids)
    and (p_items is null or cardinality(p_items) = 0 or s.item_id = any(p_items));
  get diagnostics v_count = row_count;

  perform public.write_audit('course.learner_schedule_clear', 'course_access', null,
    jsonb_build_object('learners', cardinality(p_user_ids),
      'items', coalesce(p_items, '{}'::text[]), 'removed', v_count));
  return v_count;
end;
$$;

revoke execute on function public.admin_course_clear_learner_schedule(uuid[], text[])
  from public, anon;
grant execute on function public.admin_course_clear_learner_schedule(uuid[], text[])
  to authenticated;
