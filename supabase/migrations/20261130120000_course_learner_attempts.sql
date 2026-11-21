/*
=============================================================
  Fichier    : 20261130120000_course_learner_attempts.sql
  Projet     : Kalami Stratégie — le cours
  Description: Total des tentatives dans la liste des inscrits (v0.45.0) :
               admin_course_learners renvoie en plus le nombre de tentatives aux
               exercices (m01-l01-e1…) et aux quiz de module (m01-quiz…), examen
               exclu, comme la fiche de l'apprenant (lib/cours/tentatives.ts).
               Le type de retour change : la fonction est supprimée puis recréée,
               avec les mêmes droits.
  Auteur     : Claude Marcel
  Version    : 1.0
  Date       : 2026-11-20
  Dépend de  : 20261125120000_course_admin.sql
=============================================================
*/

drop function if exists public.admin_course_learners(uuid, uuid);

create or replace function public.admin_course_learners(p_cohort_id uuid, p_user_id uuid)
returns table (
  access_id uuid,
  user_id uuid,
  email text,
  display_name text,
  source text,
  cohort_id uuid,
  cohort_name text,
  granted_at timestamptz,
  completed text[],
  started text[],
  seconds integer,
  last_seen_at timestamptz,
  average_score numeric,
  exercises integer,
  attempts_exercises integer,
  attempts_quiz integer
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
    select a.id, a.user_id, u.email::text, pr.display_name, a.source, a.cohort_id, c.name,
      a.created_at,
      coalesce((
        select array_agg(lp.lesson_id order by lp.lesson_id)
        from public.course_lesson_progress lp
        where lp.user_id = a.user_id and lp.completed_at is not null
      ), '{}'::text[]),
      coalesce((
        select array_agg(lp.lesson_id order by lp.lesson_id)
        from public.course_lesson_progress lp
        where lp.user_id = a.user_id and lp.completed_at is null
      ), '{}'::text[]),
      coalesce((
        select sum(ca.seconds) from public.course_activity ca where ca.user_id = a.user_id
      ), 0)::integer,
      (select max(ca.last_seen_at) from public.course_activity ca where ca.user_id = a.user_id),
      (
        select round(avg(b.best), 1) from (
          select max(t.score) as best from public.course_attempts t
          where t.user_id = a.user_id group by t.exercise_id
        ) b
      ),
      (
        select count(distinct t.exercise_id)::integer from public.course_attempts t
        where t.user_id = a.user_id
      ),
      (
        select count(*)::integer from public.course_attempts t
        where t.user_id = a.user_id and t.exercise_id ~ '^m[0-9]{2}-l[0-9]{2}-e[0-9]{1,2}$'
      ),
      (
        select count(*)::integer from public.course_attempts t
        where t.user_id = a.user_id and t.exercise_id ~ '^m[0-9]{2}-quiz$'
      )
    from public.course_access a
    join auth.users u on u.id = a.user_id
    left join public.profiles pr on pr.id = a.user_id
    left join public.course_cohorts c on c.id = a.cohort_id
    where a.revoked_at is null
      and (p_cohort_id is null or a.cohort_id = p_cohort_id)
      and (p_user_id is null or a.user_id = p_user_id)
    order by lower(u.email)
    limit 2000;
end;
$$;

revoke execute on function public.admin_course_learners(uuid, uuid) from public, anon;
grant execute on function public.admin_course_learners(uuid, uuid) to authenticated;
