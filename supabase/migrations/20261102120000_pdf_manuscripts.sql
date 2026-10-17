-- =============================================================
--  Fichier    : 20261102120000_pdf_manuscripts.sql
--  Projet     : Kalami
--  Description: Manuscrits PDF acceptés (v0.9.3) : le format « pdf » est admis pour une
--               version de livre et le seau privé « manuscripts » accepte application/pdf.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-16
--  Dépendances: 20261008120000_content.sql
-- =============================================================

-- ==================== VERSIONS : FORMAT SOURCE ====================

alter table public.book_versions
  drop constraint if exists book_versions_source_format_check;
alter table public.book_versions
  add constraint book_versions_source_format_check
  check (source_format in ('docx', 'pdf', 'epub'));

-- ==================== STOCKAGE : TYPES ADMIS ====================

update storage.buckets
set allowed_mime_types = array[
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'application/epub+zip'
]
where id = 'manuscripts';
