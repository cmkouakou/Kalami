-- =============================================================
--  Fichier    : 20261103120000_back_cover.sql
--  Projet     : Kalami
--  Description: Quatrième de couverture d'un livre (v0.9.8) : image facultative, envoyée
--               dans le seau « covers » comme la couverture (mêmes politiques, même dossier
--               livres/{id}/), affichée en dernière page de la liseuse.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-17
--  Dépendances: 20261007120000_catalog.sql
-- =============================================================

-- ==================== LIVRES : QUATRIÈME DE COUVERTURE ====================

alter table public.books add column back_cover_path text;

comment on column public.books.back_cover_path is
  'Chemin de la quatrième de couverture dans le seau « covers » (livres/{id}/…), ou null.';
