-- =============================================================
--  Fichier    : 20261117120000_more_categories.sql
--  Projet     : Kalami
--  Description: Nouvelles catégories du catalogue (v0.15.5) : Romance, Motivation,
--               Enfance, Aventure, Histoire d'amour, Diaspora. Placées après les
--               catégories existantes ; sans effet si un slug existe déjà.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-28
-- =============================================================

-- ==================== CATÉGORIES ====================

insert into public.categories (slug, name, position)
select v.slug, v.name, coalesce((select max(position) from public.categories), 0) + v.rang
from (values
  ('romance', 'Romance', 1),
  ('motivation', 'Motivation', 2),
  ('enfance', 'Enfance', 3),
  ('aventure', 'Aventure', 4),
  ('histoire-d-amour', 'Histoire d''amour', 5),
  ('diaspora', 'Diaspora', 6)
) as v(slug, name, rang)
on conflict (slug) do nothing;
