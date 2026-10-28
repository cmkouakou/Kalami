-- =============================================================
--  Fichier    : 20261118120000_admins.sql
--  Projet     : Kalami
--  Description: Administrateurs du site (v0.15.6) : clodiomarcel@gmail.com et
--               graphfuzion@gmail.com, et seulement eux. L'accès à /admin exige
--               toujours la double authentification (aal2, voir is_admin()).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-28
-- =============================================================

-- ==================== ADMINISTRATEURS ====================

update public.profiles p
set is_admin = (lower(u.email) in ('clodiomarcel@gmail.com', 'graphfuzion@gmail.com'))
from auth.users u
where u.id = p.id
  and p.is_admin is distinct from (lower(u.email) in ('clodiomarcel@gmail.com', 'graphfuzion@gmail.com'));
