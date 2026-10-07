-- =============================================================
--  Fichier    : 20261009120000_reader.sql
--  Projet     : Kalami
--  Description: Liseuse (Sprint 4) : marque-page automatique (une position par lecteur et
--               par livre, synchronisée entre appareils) et signets nommés.
--               Une position = chapitre + bloc + décalage de caractères dans le texte du
--               bloc : elle reste juste quand la pagination change (police, écran), et
--               servira d'ancrage aux annotations du Sprint 7.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-09
--  Dépend de  : 20261007120000_catalog.sql, 20261008120000_content.sql
-- =============================================================

-- ==================== MARQUE-PAGE AUTOMATIQUE ====================

create table public.reading_positions (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_position integer not null check (chapter_position between 1 and 1000),
  block_index integer not null default 0 check (block_index >= 0),
  char_offset integer not null default 0 check (char_offset >= 0),
  -- Avancement dans le livre, de 0 à 1 (affichage « Reprendre à 42 % »)
  progress numeric(5, 4) not null default 0 check (progress between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index reading_positions_recent_idx
  on public.reading_positions (user_id, updated_at desc);

create trigger reading_positions_set_updated_at
  before update on public.reading_positions
  for each row execute function public.set_updated_at();

-- ==================== SIGNETS NOMMÉS ====================

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_position integer not null check (chapter_position between 1 and 1000),
  block_index integer not null default 0 check (block_index >= 0),
  char_offset integer not null default 0 check (char_offset >= 0),
  label text not null check (char_length(trim(label)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookmarks_user_book_idx
  on public.bookmarks (user_id, book_id, chapter_position, block_index);

create trigger bookmarks_set_updated_at
  before update on public.bookmarks
  for each row execute function public.set_updated_at();

-- Plafond de signets par lecteur et par livre (protège la base contre les abus)
create or replace function public.bookmarks_enforce_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*) from public.bookmarks
    where user_id = new.user_id and book_id = new.book_id
  ) >= 200 then
    raise exception 'trop de signets pour ce livre' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger bookmarks_limit
  before insert on public.bookmarks
  for each row execute function public.bookmarks_enforce_limit();

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.reading_positions enable row level security;
alter table public.bookmarks enable row level security;

-- Chaque lecteur ne lit et n'écrit que ses propres lignes ; aucun accès visiteur
revoke all on public.reading_positions from anon;
revoke all on public.bookmarks from anon;

create policy "reading_positions_select_own" on public.reading_positions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reading_positions_insert_own" on public.reading_positions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reading_positions_update_own" on public.reading_positions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "reading_positions_delete_own" on public.reading_positions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "bookmarks_select_own" on public.bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "bookmarks_insert_own" on public.bookmarks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "bookmarks_update_own" on public.bookmarks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "bookmarks_delete_own" on public.bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);
