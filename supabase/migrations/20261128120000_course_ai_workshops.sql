-- =============================================================
--  Fichier    : 20261128120000_course_ai_workshops.sql
--  Projet     : Kalami Stratégie — le cours
--  Description: Ateliers corrigés par l'IA (v0.40.0) : l'apprenant soumet sa propre
--               réponse, Claude la valide ou la corrige. Chaque correction est une
--               demande enregistrée ici ; le nombre de corrections par apprenant et par
--               atelier est plafonné (5), vérifié en SQL sous verrou. Une correction
--               échouée n'est pas comptée ; une demande en cours depuis plus de
--               10 minutes non plus (appel interrompu). Écrit par le serveur seul.
--               Identifiant stable d'un atelier : « m01-l02-a1 ».
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-11-20
--  Dépend de  : 20261124120000_course.sql
-- =============================================================

-- ==================== CORRECTIONS ====================

create table public.course_ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workshop_id text not null check (workshop_id ~ '^m[0-9]{2}-l[0-9]{2}-a[0-9]{1,2}$'),
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  input jsonb not null check (pg_column_size(input) <= 8192),
  output jsonb check (output is null or pg_column_size(output) <= 16384),
  model text check (model is null or char_length(model) <= 100),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  error text check (error is null or char_length(error) <= 500),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index course_ai_feedback_user_idx
  on public.course_ai_feedback (user_id, workshop_id, created_at);

comment on table public.course_ai_feedback is
  'Corrections par l''IA des ateliers du cours : réponse soumise, correction, jetons.';

-- ==================== RÉSERVATION D'UNE CORRECTION ====================

/**
 * Réserve une correction si l'apprenant n'a pas atteint le plafond de l'atelier.
 * Comptées : les corrections terminées et celles en cours depuis moins de 10 minutes.
 * Renvoie l'identifiant de la demande, ou null si le plafond est atteint.
 */
create or replace function public.course_reserve_ai_feedback(
  p_user_id uuid,
  p_workshop text,
  p_input jsonb,
  p_max integer default 5
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_id uuid;
begin
  -- Une réservation à la fois par apprenant et par atelier (deux clics simultanés)
  perform pg_advisory_xact_lock(
    hashtext('course_ai:' || p_user_id::text || ':' || p_workshop)
  );

  select count(*) into v_count
  from public.course_ai_feedback
  where user_id = p_user_id
    and workshop_id = p_workshop
    and (
      status = 'done'
      or (status = 'pending' and created_at > now() - interval '10 minutes')
    );

  if v_count >= p_max then
    return null;
  end if;

  insert into public.course_ai_feedback (user_id, workshop_id, input)
  values (p_user_id, p_workshop, p_input)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.course_reserve_ai_feedback(uuid, text, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.course_reserve_ai_feedback(uuid, text, jsonb, integer)
  to service_role;

-- ==================== SÉCURITÉ ====================

alter table public.course_ai_feedback enable row level security;
revoke all on public.course_ai_feedback from anon;
revoke insert, update, delete on public.course_ai_feedback from authenticated;

create policy "course_ai_feedback_select" on public.course_ai_feedback
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
