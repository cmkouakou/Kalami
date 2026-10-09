-- =============================================================
--  Fichier    : 20261010120000_annotations.sql
--  Projet     : Kalami
--  Description: Annotations (Sprint 7) : surlignages en 5 couleurs, avec une note
--               facultative attachée au passage. Un surlignage est ancré par chapitre +
--               bloc + décalage de caractères (début et fin), comme la position de lecture :
--               il reste en place quand la pagination change (police, taille, écran).
--               Le texte cité est conservé (≤ 1000 caractères) pour la liste des annotations.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-10
--  Dépend de  : 20261007120000_catalog.sql, 20261009120000_reader.sql
-- =============================================================

-- ==================== SURLIGNAGES ET NOTES ====================

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_position integer not null check (chapter_position between 1 and 1000),
  start_block integer not null check (start_block >= 0),
  start_offset integer not null check (start_offset >= 0),
  end_block integer not null check (end_block >= 0),
  end_offset integer not null check (end_offset >= 0),
  color text not null default 'jaune'
    check (color in ('jaune', 'vert', 'bleu', 'rose', 'orange')),
  -- Passage cité (texte brut) et note du lecteur (facultative)
  quote text not null check (char_length(quote) between 1 and 1000),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- La fin vient après le début
  check (
    end_block > start_block
    or (end_block = start_block and end_offset > start_offset)
  )
);

create index highlights_user_book_idx
  on public.highlights (user_id, book_id, chapter_position, start_block, start_offset);

create trigger highlights_set_updated_at
  before update on public.highlights
  for each row execute function public.set_updated_at();

-- Plafond d'annotations par lecteur et par livre (protège la base contre les abus)
create or replace function public.highlights_enforce_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*) from public.highlights
    where user_id = new.user_id and book_id = new.book_id
  ) >= 2000 then
    raise exception 'trop d''annotations pour ce livre' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger highlights_limit
  before insert on public.highlights
  for each row execute function public.highlights_enforce_limit();

-- ==================== SÉCURITÉ (RLS) ====================

alter table public.highlights enable row level security;

-- Chaque lecteur ne lit et n'écrit que ses propres annotations ; aucun accès visiteur
revoke all on public.highlights from anon;

create policy "highlights_select_own" on public.highlights
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "highlights_insert_own" on public.highlights
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "highlights_update_own" on public.highlights
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "highlights_delete_own" on public.highlights
  for delete to authenticated using ((select auth.uid()) = user_id);
