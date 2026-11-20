-- =============================================================
--  Fichier    : 20261127120000_course_diplomas.sql
--  Projet     : Kalami Stratégie — le cours
--  Description: Cours de stratégie (v0.38.0, Sprint 8b2) : réglages d'évaluation (seuils,
--               pondération de la note finale, mentions), enregistrement verrouillé des
--               essais d'examen (3 essais espacés de 24 h), diplômes délivrés (numéro
--               unique, nom imprimé, notes, mention), vérification publique d'un numéro
--               (nom, date, mention — jamais la note) et correction du nom par l'admin.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-20
--  Dépend de  : 20261124120000_course.sql, 20261125120000_course_admin.sql
-- =============================================================

-- ==================== RÉGLAGES D'ÉVALUATION ====================

alter table public.course_settings
  add column quiz_threshold smallint not null default 70
    check (quiz_threshold between 50 and 100),
  add column exam_threshold smallint not null default 70
    check (exam_threshold between 50 and 100),
  add column weight_quizzes smallint not null default 40
    check (weight_quizzes between 0 and 100),
  add column weight_exercises smallint not null default 20
    check (weight_exercises between 0 and 100),
  add column weight_exam smallint not null default 40
    check (weight_exam between 0 and 100),
  add column honours_good smallint not null default 80
    check (honours_good between 50 and 100),
  add column honours_very_good smallint not null default 90
    check (honours_very_good between 50 and 100),
  add constraint course_settings_weights_check
    check (weight_quizzes + weight_exercises + weight_exam = 100),
  add constraint course_settings_honours_check
    check (honours_good < honours_very_good);

-- Enregistre les réglages d'évaluation (administrateur)
create or replace function public.admin_course_save_evaluation(
  p_quiz_threshold integer,
  p_exam_threshold integer,
  p_weight_quizzes integer,
  p_weight_exercises integer,
  p_weight_exam integer,
  p_honours_good integer,
  p_honours_very_good integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_quiz_threshold not between 50 and 100
    or p_exam_threshold not between 50 and 100
    or p_honours_good not between 50 and 100
    or p_honours_very_good not between 50 and 100
    or p_honours_good >= p_honours_very_good then
    raise exception 'invalid_threshold' using errcode = 'P0001';
  end if;
  if least(p_weight_quizzes, p_weight_exercises, p_weight_exam) < 0
    or p_weight_quizzes + p_weight_exercises + p_weight_exam <> 100 then
    raise exception 'invalid_weights' using errcode = 'P0001';
  end if;

  update public.course_settings set
    quiz_threshold = p_quiz_threshold,
    exam_threshold = p_exam_threshold,
    weight_quizzes = p_weight_quizzes,
    weight_exercises = p_weight_exercises,
    weight_exam = p_weight_exam,
    honours_good = p_honours_good,
    honours_very_good = p_honours_very_good
  where id;

  perform public.write_audit('course.evaluation', 'course', null,
    jsonb_build_object('quiz', p_quiz_threshold, 'exam', p_exam_threshold,
      'weights', jsonb_build_array(p_weight_quizzes, p_weight_exercises, p_weight_exam),
      'honours', jsonb_build_array(p_honours_good, p_honours_very_good)));
end;
$$;

revoke execute on function public.admin_course_save_evaluation(integer, integer, integer,
  integer, integer, integer, integer) from public, anon;
grant execute on function public.admin_course_save_evaluation(integer, integer, integer,
  integer, integer, integer, integer) to authenticated;

-- ==================== ESSAIS D'EXAMEN ====================

-- Enregistre un essai d'examen déjà corrigé par le serveur, sous verrou par apprenant :
-- au plus p_max essais, espacés d'au moins p_gap_hours heures. Appelée avec la clé
-- secrète seulement. Renvoie 'ok', 'max_attempts' ou 'too_soon'.
create or replace function public.course_record_exam_attempt(
  p_user_id uuid,
  p_score numeric,
  p_answers jsonb,
  p_max integer default 3,
  p_gap_hours integer default 24
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_last timestamptz;
begin
  -- Un seul essai à la fois par apprenant (deux envois simultanés)
  perform pg_advisory_xact_lock(hashtext('course_exam:' || p_user_id::text));

  select count(*), max(created_at) into v_count, v_last
  from public.course_attempts
  where user_id = p_user_id and exercise_id = 'examen';

  if v_count >= p_max then
    return 'max_attempts';
  end if;
  if v_last is not null and v_last > now() - make_interval(hours => p_gap_hours) then
    return 'too_soon';
  end if;

  insert into public.course_attempts (user_id, exercise_id, score, answers)
  values (p_user_id, 'examen', p_score, p_answers);
  return 'ok';
end;
$$;

revoke execute on function public.course_record_exam_attempt(uuid, numeric, jsonb, integer,
  integer) from public, anon, authenticated;
grant execute on function public.course_record_exam_attempt(uuid, numeric, jsonb, integer,
  integer) to service_role;

-- ==================== DIPLÔMES ====================

-- Un diplôme par apprenant, délivré par le serveur (clé secrète) après vérification
create table public.course_diplomas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  number text not null unique check (number ~ '^KS-[0-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  printed_name text not null check (char_length(btrim(printed_name)) between 2 and 120),
  final_score numeric(5, 2) not null check (final_score between 0 and 100),
  honours text not null check (honours in ('reussite', 'bien', 'tres_bien')),
  quiz_score numeric(5, 2) not null check (quiz_score between 0 and 100),
  exercises_score numeric(5, 2) not null check (exercises_score between 0 and 100),
  exam_score numeric(5, 2) not null check (exam_score between 0 and 100),
  issued_at timestamptz not null default now(),
  name_corrected_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger course_diplomas_set_updated_at
  before update on public.course_diplomas
  for each row execute function public.set_updated_at();

alter table public.course_diplomas enable row level security;
revoke all on public.course_diplomas from anon;
revoke insert, update, delete on public.course_diplomas from authenticated;

-- L'apprenant lit son diplôme ; l'administrateur les lit tous
create policy "course_diplomas_select" on public.course_diplomas
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

-- Vérification publique d'un numéro : nom, date et mention seulement (jamais la note)
create or replace function public.verify_course_diploma(p_number text)
returns table (printed_name text, issued_at timestamptz, honours text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.printed_name, d.issued_at, d.honours
  from public.course_diplomas d
  where d.number = upper(btrim(p_number));
$$;

revoke execute on function public.verify_course_diploma(text) from public;
grant execute on function public.verify_course_diploma(text) to anon, authenticated;

-- Correction du nom imprimé (administrateur)
create or replace function public.admin_course_rename_diploma(p_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  update public.course_diplomas
  set printed_name = v_name, name_corrected_at = now()
  where id = p_id;
  if not found then
    raise exception 'diploma_not_found' using errcode = 'P0001';
  end if;

  perform public.write_audit('course.diploma_rename', 'course_diploma', p_id::text,
    jsonb_build_object('name', v_name));
end;
$$;

revoke execute on function public.admin_course_rename_diploma(uuid, text) from public, anon;
grant execute on function public.admin_course_rename_diploma(uuid, text) to authenticated;
