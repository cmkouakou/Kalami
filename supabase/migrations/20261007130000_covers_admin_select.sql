-- =============================================================
--  Fichier    : 20261007130000_covers_admin_select.sql
--  Projet     : Kalami
--  Description: Droit de lecture des objets du seau « covers » pour l'administrateur.
--               L'API Storage exige SELECT en plus de DELETE pour supprimer un fichier
--               (remplacement d'une couverture ou d'une photo d'auteur). La diffusion
--               publique des images ne dépend pas de cette politique (seau public).
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-07
-- =============================================================

create policy "covers_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'covers' and public.is_admin());
