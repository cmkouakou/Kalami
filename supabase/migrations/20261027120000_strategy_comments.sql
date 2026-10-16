-- =============================================================
--  Fichier    : 20261027120000_strategy_comments.sql
--  Projet     : Kalami Stratégie
--  Description: Sprint S9b, discussion d'équipe (cahier §3.4 et §6) : commentaires par
--               étape, en fils, visant au besoin un élément du gabarit ; mentions de
--               membres ; notifications (mention, réponse à un fil, commentaire sur une
--               étape dont on est responsable) ; préférence « recevoir les courriels ».
--               Tout membre commente, observateur compris. Écritures par fonctions
--               seulement ; chaque commentaire entre au journal d'activité.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-15
--  Dépend de  : 20261026120000_strategy_team.sql
-- =============================================================

-- ==================== COMMENTAIRES ====================

-- Un fil = un commentaire racine (parent_id null) et ses réponses (un seul niveau).
-- L'élément visé (target_id) est un identifiant du gabarit ; son libellé est figé pour
-- rester lisible si l'élément disparaît.
create table public.study_comments (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  step_no smallint not null check (step_no between 1 and 9),
  parent_id uuid references public.study_comments (id) on delete cascade,
  target_id text check (target_id ~ '^[A-Za-z0-9-]{1,40}$'),
  target_label text check (char_length(target_label) <= 200),
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  -- Racine supprimée alors qu'elle a des réponses : le fil reste, le texte est effacé
  deleted_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null
);

create index study_comments_step_idx on public.study_comments (study_id, step_no, created_at);
create index study_comments_parent_idx on public.study_comments (parent_id);
create index study_comments_author_idx on public.study_comments (author_id, created_at);

-- Membres mentionnés dans un commentaire
create table public.study_comment_mentions (
  comment_id uuid not null references public.study_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (comment_id, user_id)
);

-- ==================== NOTIFICATIONS ====================

-- Une notification au plus par personne et par commentaire (la mention l'emporte sur la
-- réponse, qui l'emporte sur l'étape confiée)
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  study_id uuid not null references public.studies (id) on delete cascade,
  step_no smallint not null check (step_no between 1 and 9),
  comment_id uuid not null references public.study_comments (id) on delete cascade,
  kind text not null check (kind in ('mention', 'reply', 'step_comment')),
  actor_id uuid references auth.users (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, comment_id)
);

create index notifications_user_idx on public.notifications (user_id, id desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ==================== PRÉFÉRENCE DE COURRIEL ====================

-- Courriel immédiat quand on est mentionné (les autres notifications restent dans la cloche)
alter table public.profiles add column notify_email boolean not null default true;

grant update (notify_email) on public.profiles to authenticated;

-- ==================== JOURNAL D'ACTIVITÉ ====================

alter table public.study_activity drop constraint study_activity_action_check;
alter table public.study_activity add constraint study_activity_action_check check (action in (
  'invitation_sent', 'invitation_renewed', 'invitation_revoked', 'invitation_declined',
  'member_joined', 'member_role_changed', 'member_removed', 'member_left',
  'step_assigned', 'step_unassigned',
  'step_started', 'step_validated', 'step_reopened', 'step_needs_review',
  'comment_added'
));

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.study_comments enable row level security;
alter table public.study_comment_mentions enable row level security;
alter table public.notifications enable row level security;

-- Lecture directe réservée aux membres (les pages passent par strategy_step_comments)
create policy "study_comments_select_member" on public.study_comments
  for select to authenticated
  using ((select public.study_role(study_id)) is not null);

revoke all on public.study_comments from anon;
revoke insert, update, delete on public.study_comments from authenticated;
revoke all on public.study_comment_mentions from anon, authenticated;
revoke all on public.notifications from anon, authenticated;

-- ==================== FONCTIONS UTILITAIRES ====================

-- Texte d'un commentaire validé (espaces de bord retirés, 1 à 2 000 caractères)
create or replace function public.strategy_comment_body(p_body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
begin
  if char_length(v_body) not between 1 and 2000 then
    raise exception 'invalid_comment' using errcode = 'P0001';
  end if;
  return v_body;
end;
$$;

revoke execute on function public.strategy_comment_body(text) from public, anon, authenticated;

-- ==================== FONCTIONS : COMMENTAIRES ====================

-- Ajoute un commentaire (p_parent_id null) ou une réponse à un fil. Une réponse reprend
-- l'élément visé par le fil. Les mentions qui ne visent pas un membre sont ignorées.
-- Retourne { id, emails } : emails = membres mentionnés qui acceptent les courriels.
create or replace function public.strategy_add_comment(
  p_study_id uuid,
  p_step_no smallint,
  p_body text,
  p_parent_id uuid default null,
  p_target_id text default null,
  p_target_label text default null,
  p_mentions uuid[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text;
  v_parent public.study_comments;
  v_target text := nullif(btrim(coalesce(p_target_id, '')), '');
  v_label text;
  v_mentions uuid[];
  v_assignee uuid;
  v_id uuid;
  v_emails jsonb;
begin
  if public.study_role(p_study_id) is null then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_step_no is null or p_step_no not between 1 and 9 then
    raise exception 'invalid_step' using errcode = 'P0001';
  end if;
  v_body := public.strategy_comment_body(p_body);
  if cardinality(coalesce(p_mentions, '{}')) > 10 then
    raise exception 'too_many_mentions' using errcode = 'P0001';
  end if;
  if (select count(*) from public.study_comments
      where author_id = auth.uid() and study_id = p_study_id
        and created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'comment_rate_limited' using errcode = 'P0001';
  end if;

  if p_parent_id is not null then
    select * into v_parent from public.study_comments
    where id = p_parent_id and study_id = p_study_id and step_no = p_step_no;
    if not found or v_parent.deleted_at is not null then
      raise exception 'comment_not_found' using errcode = 'P0001';
    end if;
    if v_parent.parent_id is not null then
      raise exception 'invalid_parent' using errcode = 'P0001';
    end if;
    v_target := v_parent.target_id;
    v_label := v_parent.target_label;
  elsif v_target is not null then
    if v_target !~ '^[A-Za-z0-9-]{1,40}$' then
      raise exception 'invalid_target' using errcode = 'P0001';
    end if;
    v_label := left(btrim(coalesce(p_target_label, '')), 200);
  end if;

  -- Mentions : membres de l'étude, sauf l'auteur
  select coalesce(array_agg(distinct m.user_id), '{}') into v_mentions
  from public.study_members m
  where m.study_id = p_study_id
    and m.user_id = any(coalesce(p_mentions, '{}'))
    and m.user_id <> auth.uid();

  insert into public.study_comments
    (study_id, step_no, parent_id, target_id, target_label, author_id, body)
  values (p_study_id, p_step_no, v_parent.id, v_target, v_label, auth.uid(), v_body)
  returning id into v_id;

  insert into public.study_comment_mentions (comment_id, user_id)
  select v_id, unnest(v_mentions);

  -- Notifications, par ordre de priorité (une seule par personne)
  insert into public.notifications (user_id, study_id, step_no, comment_id, kind, actor_id)
  select unnest(v_mentions), p_study_id, p_step_no, v_id, 'mention', auth.uid()
  on conflict (user_id, comment_id) do nothing;

  if v_parent.id is not null then
    insert into public.notifications (user_id, study_id, step_no, comment_id, kind, actor_id)
    select distinct c.author_id, p_study_id, p_step_no, v_id, 'reply', auth.uid()
    from public.study_comments c
    join public.study_members m on m.study_id = p_study_id and m.user_id = c.author_id
    where (c.id = v_parent.id or c.parent_id = v_parent.id)
      and c.author_id <> auth.uid()
    on conflict (user_id, comment_id) do nothing;
  end if;

  select st.assignee_id into v_assignee from public.study_steps st
  where st.study_id = p_study_id and st.step_no = p_step_no;
  if v_assignee is not null and v_assignee <> auth.uid() and exists (
    select 1 from public.study_members
    where study_id = p_study_id and user_id = v_assignee
  ) then
    insert into public.notifications (user_id, study_id, step_no, comment_id, kind, actor_id)
    values (v_assignee, p_study_id, p_step_no, v_id, 'step_comment', auth.uid())
    on conflict (user_id, comment_id) do nothing;
  end if;

  perform public.strategy_log(p_study_id, 'comment_added', p_step_no, null,
                              jsonb_build_object('reply', p_parent_id is not null));

  select coalesce(jsonb_agg(u.email), '[]'::jsonb) into v_emails
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = any(v_mentions) and u.email is not null and coalesce(p.notify_email, true);

  return jsonb_build_object('id', v_id, 'emails', v_emails);
end;
$$;

revoke execute on function public.strategy_add_comment(uuid, smallint, text, uuid, text, text,
  uuid[]) from public, anon;
grant execute on function public.strategy_add_comment(uuid, smallint, text, uuid, text, text,
  uuid[]) to authenticated;

-- Modifie le texte de son propre commentaire (les mentions d'origine sont gardées)
create or replace function public.strategy_edit_comment(p_comment_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment public.study_comments;
begin
  select * into v_comment from public.study_comments where id = p_comment_id for update;
  if not found or v_comment.deleted_at is not null
     or public.study_role(v_comment.study_id) is null then
    raise exception 'comment_not_found' using errcode = 'P0001';
  end if;
  if v_comment.author_id is distinct from auth.uid() then
    raise exception 'not_author' using errcode = '42501';
  end if;

  update public.study_comments
  set body = public.strategy_comment_body(p_body), edited_at = now()
  where id = p_comment_id;
end;
$$;

revoke execute on function public.strategy_edit_comment(uuid, text) from public, anon;
grant execute on function public.strategy_edit_comment(uuid, text) to authenticated;

-- Supprime un commentaire (son auteur ou le propriétaire). Une racine qui a des réponses
-- est vidée plutôt que supprimée ; une racine vidée disparaît avec sa dernière réponse.
create or replace function public.strategy_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment public.study_comments;
begin
  select * into v_comment from public.study_comments where id = p_comment_id for update;
  if not found or v_comment.deleted_at is not null
     or public.study_role(v_comment.study_id) is null then
    raise exception 'comment_not_found' using errcode = 'P0001';
  end if;
  if v_comment.author_id is distinct from auth.uid()
     and public.study_role(v_comment.study_id) <> 'owner' then
    raise exception 'not_author' using errcode = '42501';
  end if;

  if v_comment.parent_id is null
     and exists (select 1 from public.study_comments where parent_id = p_comment_id) then
    update public.study_comments set body = '', deleted_at = now() where id = p_comment_id;
    delete from public.study_comment_mentions where comment_id = p_comment_id;
    delete from public.notifications where comment_id = p_comment_id;
    return;
  end if;

  delete from public.study_comments where id = p_comment_id;
  if v_comment.parent_id is not null then
    delete from public.study_comments r
    where r.id = v_comment.parent_id and r.deleted_at is not null
      and not exists (select 1 from public.study_comments c where c.parent_id = r.id);
  end if;
end;
$$;

revoke execute on function public.strategy_delete_comment(uuid) from public, anon;
grant execute on function public.strategy_delete_comment(uuid) to authenticated;

-- Marque un fil résolu ou le rouvre (auteur du fil ou propriétaire)
create or replace function public.strategy_resolve_thread(p_comment_id uuid, p_resolved boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment public.study_comments;
begin
  select * into v_comment from public.study_comments where id = p_comment_id for update;
  if not found or public.study_role(v_comment.study_id) is null then
    raise exception 'comment_not_found' using errcode = 'P0001';
  end if;
  if v_comment.parent_id is not null then
    raise exception 'invalid_parent' using errcode = 'P0001';
  end if;
  if v_comment.author_id is distinct from auth.uid()
     and public.study_role(v_comment.study_id) <> 'owner' then
    raise exception 'not_author' using errcode = '42501';
  end if;

  update public.study_comments
  set resolved_at = case when p_resolved then now() end,
      resolved_by = case when p_resolved then auth.uid() end
  where id = p_comment_id;
end;
$$;

revoke execute on function public.strategy_resolve_thread(uuid, boolean) from public, anon;
grant execute on function public.strategy_resolve_thread(uuid, boolean) to authenticated;

-- Commentaires d'une étape, du plus ancien au plus récent, avec le nom des auteurs
create or replace function public.strategy_step_comments(p_study_id uuid, p_step_no smallint)
returns table (
  id uuid,
  parent_id uuid,
  target_id text,
  target_label text,
  author_id uuid,
  author_name text,
  body text,
  mentions uuid[],
  created_at timestamptz,
  edited_at timestamptz,
  deleted boolean,
  resolved_at timestamptz,
  resolver_name text
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
    select c.id, c.parent_id, c.target_id, c.target_label, c.author_id,
           public.strategy_member_name(c.author_id), c.body,
           coalesce((select array_agg(m.user_id) from public.study_comment_mentions m
                     where m.comment_id = c.id), '{}'),
           c.created_at, c.edited_at, c.deleted_at is not null, c.resolved_at,
           public.strategy_member_name(c.resolved_by)
    from public.study_comments c
    where c.study_id = p_study_id and c.step_no = p_step_no
    order by c.created_at, c.id;
end;
$$;

revoke execute on function public.strategy_step_comments(uuid, smallint) from public, anon;
grant execute on function public.strategy_step_comments(uuid, smallint) to authenticated;

-- ==================== FONCTIONS : NOTIFICATIONS ====================

-- Notifications de la personne connectée, des études dont elle est encore membre, de la
-- plus récente à la plus ancienne, par pages (p_before : dernier identifiant affiché)
create or replace function public.strategy_my_notifications(
  p_before bigint default null,
  p_limit integer default 30
)
returns table (
  id bigint,
  kind text,
  study_id uuid,
  company_name text,
  step_no smallint,
  comment_id uuid,
  actor_name text,
  excerpt text,
  target_label text,
  read_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.kind, n.study_id, s.company_name, n.step_no, n.comment_id,
         public.strategy_member_name(n.actor_id), left(c.body, 200), c.target_label,
         n.read_at, n.created_at
  from public.notifications n
  join public.studies s on s.id = n.study_id
  join public.study_comments c on c.id = n.comment_id
  join public.study_members m on m.study_id = n.study_id and m.user_id = n.user_id
  where n.user_id = auth.uid() and (p_before is null or n.id < p_before)
  order by n.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

revoke execute on function public.strategy_my_notifications(bigint, integer) from public, anon;
grant execute on function public.strategy_my_notifications(bigint, integer) to authenticated;

-- Nombre de notifications non lues (cloche de l'en-tête)
create or replace function public.strategy_unread_notifications()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.notifications n
  join public.study_members m on m.study_id = n.study_id and m.user_id = n.user_id
  where n.user_id = auth.uid() and n.read_at is null;
$$;

revoke execute on function public.strategy_unread_notifications() from public, anon;
grant execute on function public.strategy_unread_notifications() to authenticated;

-- Marque lues des notifications de la personne connectée (p_ids null : toutes)
create or replace function public.strategy_mark_notifications_read(p_ids bigint[] default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null
    and (p_ids is null or id = any(p_ids));
$$;

revoke execute on function public.strategy_mark_notifications_read(bigint[]) from public, anon;
grant execute on function public.strategy_mark_notifications_read(bigint[]) to authenticated;
