-- =============================================================
--  Fichier    : 20261008120000_content.sql
--  Projet     : Kalami
--  Description: Contenu protégé (Sprint 3) : versions converties des livres, chapitres,
--               règles de l'extrait gratuit, droits de lecture, limitation de débit et
--               seau privé des manuscrits.
--               Les chapitres ne sont lisibles par AUCUN rôle client : seule la route
--               serveur (clé secrète) les sert, après vérification du droit d'accès.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-08
--  Dépend de  : 20261006120000_profiles_roles.sql, 20261007120000_catalog.sql
-- =============================================================

-- ==================== VERSIONS CONVERTIES ====================

-- Une version = un fichier source (DOCX ou EPUB) converti avec succès en chapitres
create table public.book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  source_format text not null check (source_format in ('docx', 'epub')),
  source_path text not null,
  chapter_count integer not null check (chapter_count > 0),
  word_count integer not null default 0 check (word_count >= 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, version_number)
);

create index book_versions_book_idx on public.book_versions (book_id, version_number desc);

create trigger book_versions_set_updated_at
  before update on public.book_versions
  for each row execute function public.set_updated_at();

-- ==================== CHAPITRES ====================

-- Contenu HTML nettoyé, découpé en blocs de premier niveau (paragraphes, titres, listes…) :
-- la coupure de l'extrait se fait au bloc près, sans analyser le HTML à chaque requête
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.book_versions (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (char_length(title) between 1 and 300),
  blocks text[] not null,
  word_count integer not null default 0 check (word_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (version_id, position)
);

create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

-- ==================== RÈGLES DE L'EXTRAIT ====================

-- Extrait gratuit : les « preview_chapters » premiers chapitres ; dans le dernier d'entre
-- eux, seuls les « preview_cut_block » premiers blocs si la coupure est renseignée
alter table public.books
  add column current_version_id uuid references public.book_versions (id) on delete set null,
  add column preview_chapters integer not null default 1
    check (preview_chapters between 0 and 1000),
  add column preview_cut_block integer check (preview_cut_block > 0);

-- ==================== DROITS DE LECTURE ====================

-- Accordés par un paiement (Sprints 5 et 6) ou manuellement par un administrateur
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  source text not null check (source in ('purchase', 'admin_grant')),
  -- Clé étrangère vers « orders » ajoutée au Sprint 5
  order_id uuid,
  granted_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul droit actif par lecteur et par livre
create unique index entitlements_active_unique
  on public.entitlements (user_id, book_id) where revoked_at is null;
create index entitlements_book_idx on public.entitlements (book_id);

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ==================== JOURNAL D'ACCÈS AU CONTENU ====================

-- Sujet : « user:{uuid} » si connecté, sinon « ip:{adresse} ». Purgé après 24 h.
create table public.content_access_log (
  id bigint generated always as identity primary key,
  subject text not null,
  book_id uuid not null,
  position integer not null,
  created_at timestamptz not null default now()
);

create index content_access_log_subject_idx
  on public.content_access_log (subject, created_at desc);

-- ==================== FONCTIONS : SOMMAIRE PUBLIC ====================

-- Sommaire de la version courante, sans le contenu : livre publié, ou administrateur,
-- ou auteur du livre. Le nombre de blocs sert à régler la coupure de l'extrait.
create or replace function public.get_book_toc(p_book_id uuid)
returns table (
  chapter_position integer,
  title text,
  word_count integer,
  block_count integer,
  is_preview boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.position, c.title, c.word_count, coalesce(cardinality(c.blocks), 0),
    c.position <= b.preview_chapters
  from public.books b
  join public.chapters c on c.version_id = b.current_version_id
  where b.id = p_book_id
    and (b.status = 'published' or public.is_admin() or public.is_book_author(b.id))
  order by c.position;
$$;

revoke execute on function public.get_book_toc(uuid) from public;
grant execute on function public.get_book_toc(uuid) to anon, authenticated;

-- ==================== FONCTIONS : ENREGISTREMENT D'UNE VERSION ====================

-- Enregistre une conversion en une seule transaction : version, chapitres, version courante
-- du livre, nombre de chapitres et journal d'audit. Réservé aux administrateurs (aal2).
-- p_chapters : [{ "title": text, "blocks": [text], "word_count": int }, …]
create or replace function public.admin_save_book_version(
  p_book_id uuid,
  p_source_format text,
  p_source_path text,
  p_chapters jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version_id uuid;
  v_number integer;
  v_count integer;
  v_words integer;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if jsonb_typeof(p_chapters) <> 'array' or jsonb_array_length(p_chapters) = 0 then
    raise exception 'aucun chapitre' using errcode = '22023';
  end if;

  -- Verrou sur le livre : deux conversions simultanées ne prennent pas le même numéro
  perform 1 from public.books where id = p_book_id for update;
  if not found then
    raise exception 'livre introuvable' using errcode = 'P0002';
  end if;

  select coalesce(max(version_number), 0) + 1 into v_number
  from public.book_versions where book_id = p_book_id;

  v_count := jsonb_array_length(p_chapters);
  select coalesce(sum((c ->> 'word_count')::integer), 0) into v_words
  from jsonb_array_elements(p_chapters) c;

  insert into public.book_versions (
    book_id, version_number, source_format, source_path, chapter_count, word_count, created_by
  )
  values (p_book_id, v_number, p_source_format, p_source_path, v_count, v_words, auth.uid())
  returning id into v_version_id;

  insert into public.chapters (version_id, position, title, blocks, word_count)
  select
    v_version_id,
    c.ordinality::integer,
    c.value ->> 'title',
    array(select jsonb_array_elements_text(c.value -> 'blocks')),
    coalesce((c.value ->> 'word_count')::integer, 0)
  from jsonb_array_elements(p_chapters) with ordinality c;

  update public.books
  set current_version_id = v_version_id, chapter_count = v_count
  where id = p_book_id;

  perform public.write_audit(
    'book.version_created', 'book', p_book_id::text,
    jsonb_build_object(
      'version_id', v_version_id, 'version_number', v_number,
      'format', p_source_format, 'chapters', v_count, 'words', v_words
    )
  );
  return v_version_id;
end;
$$;

revoke execute on function public.admin_save_book_version(uuid, text, text, jsonb)
  from public, anon;
grant execute on function public.admin_save_book_version(uuid, text, text, jsonb)
  to authenticated;

-- ==================== FONCTIONS : DROITS ACCORDÉS PAR L'ADMINISTRATEUR ====================

-- Accorde un droit de lecture au compte portant ce courriel ; renvoie l'identifiant du droit
create or replace function public.admin_grant_entitlement(
  p_book_id uuid,
  p_email text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'compte introuvable' using errcode = 'P0002';
  end if;

  insert into public.entitlements (user_id, book_id, source, granted_by, note)
  values (v_user_id, p_book_id, 'admin_grant', auth.uid(), nullif(trim(p_note), ''))
  returning id into v_id;

  perform public.write_audit(
    'entitlement.granted', 'entitlement', v_id::text,
    jsonb_build_object('book_id', p_book_id, 'user_id', v_user_id, 'source', 'admin_grant')
  );
  return v_id;
end;
$$;

-- Révoque un droit actif (conservé pour l'historique)
create or replace function public.admin_revoke_entitlement(p_entitlement_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  update public.entitlements set revoked_at = now()
  where id = p_entitlement_id and revoked_at is null;
  if not found then
    raise exception 'droit introuvable' using errcode = 'P0002';
  end if;

  perform public.write_audit('entitlement.revoked', 'entitlement', p_entitlement_id::text);
end;
$$;

-- Droits d'un livre avec le courriel du lecteur (auth.users n'est pas lisible par le client)
create or replace function public.admin_list_entitlements(p_book_id uuid)
returns table (
  id uuid,
  email text,
  source text,
  note text,
  created_at timestamptz,
  revoked_at timestamptz
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
    select e.id, u.email::text, e.source, e.note, e.created_at, e.revoked_at
    from public.entitlements e
    join auth.users u on u.id = e.user_id
    where e.book_id = p_book_id
    order by e.revoked_at is not null, e.created_at desc;
end;
$$;

revoke execute on function public.admin_list_entitlements(uuid) from public, anon;
grant execute on function public.admin_list_entitlements(uuid) to authenticated;
revoke execute on function public.admin_grant_entitlement(uuid, text, text) from public, anon;
grant execute on function public.admin_grant_entitlement(uuid, text, text) to authenticated;
revoke execute on function public.admin_revoke_entitlement(uuid) from public, anon;
grant execute on function public.admin_revoke_entitlement(uuid) to authenticated;

-- ==================== FONCTIONS : LIMITATION DE DÉBIT ====================

-- Inscrit un accès à un chapitre et indique s'il est autorisé.
-- - Au-delà de p_limit accès sur p_window_seconds : refus (la route répond 429) et
--   entrée « content.rate_limited » au journal d'audit (une par fenêtre et par sujet).
-- - Lecture rapide d'un même livre (10 chapitres distincts en 10 s) : accès autorisé mais
--   signalé « content.burst » au journal (cahier §3.5 : accès anormaux).
-- Réservé au rôle service (route serveur).
create or replace function public.register_content_access(
  p_subject text,
  p_book_id uuid,
  p_position integer,
  p_limit integer default 30,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_count integer;
  v_distinct integer;
begin
  -- Sérialise les accès d'un même sujet : le comptage reste exact sous concurrence
  perform pg_advisory_xact_lock(hashtext('content:' || p_subject));

  select count(*) into v_count
  from public.content_access_log
  where subject = p_subject and created_at > now() - v_window;

  if v_count >= p_limit then
    if not exists (
      select 1 from public.audit_logs
      where action = 'content.rate_limited' and target_id = p_subject
        and created_at > now() - v_window
    ) then
      insert into public.audit_logs (action, target_type, target_id, details)
      values (
        'content.rate_limited', 'subject', p_subject,
        jsonb_build_object('book_id', p_book_id, 'position', p_position, 'count', v_count)
      );
    end if;
    return false;
  end if;

  insert into public.content_access_log (subject, book_id, position)
  values (p_subject, p_book_id, p_position);

  select count(distinct position) into v_distinct
  from public.content_access_log
  where subject = p_subject and book_id = p_book_id
    and created_at > now() - interval '10 seconds';

  if v_distinct >= 10 and not exists (
    select 1 from public.audit_logs
    where action = 'content.burst' and target_id = p_subject
      and created_at > now() - interval '1 minute'
  ) then
    insert into public.audit_logs (action, target_type, target_id, details)
    values (
      'content.burst', 'subject', p_subject,
      jsonb_build_object('book_id', p_book_id, 'chapters', v_distinct)
    );
  end if;

  -- Purge des entrées de plus de 24 h de ce sujet
  delete from public.content_access_log
  where subject = p_subject and created_at < now() - interval '1 day';

  return true;
end;
$$;

revoke execute on function public.register_content_access(text, uuid, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.register_content_access(text, uuid, integer, integer, integer)
  to service_role;

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.book_versions enable row level security;
alter table public.chapters enable row level security;
alter table public.entitlements enable row level security;
alter table public.content_access_log enable row level security;

-- Versions : lecture administrateur ; écriture par admin_save_book_version uniquement
create policy "book_versions_select_admin" on public.book_versions
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.book_versions from anon, authenticated;

-- Chapitres et journal d'accès : aucune politique = aucun accès client, même administrateur
revoke all on public.chapters from anon, authenticated;
revoke all on public.content_access_log from anon, authenticated;

-- Droits : chacun voit les siens ; l'administrateur voit tout ; écriture par fonctions
create policy "entitlements_select_own_or_admin" on public.entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
revoke insert, update, delete on public.entitlements from anon, authenticated;

-- ==================== STOCKAGE : MANUSCRITS (PRIVÉ) ====================

-- Seau privé : aucune URL publique ; 20 Mo maximum ; DOCX et EPUB seulement
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manuscripts', 'manuscripts', false, 20971520,
  array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip'
  ]
)
on conflict (id) do nothing;

-- Dépôt et lecture par l'administrateur (l'espace auteur arrive au Sprint 9)
create policy "manuscripts_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'manuscripts' and (select public.is_admin()));
create policy "manuscripts_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'manuscripts' and (select public.is_admin()));
create policy "manuscripts_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'manuscripts' and (select public.is_admin()));
