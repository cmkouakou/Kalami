-- =============================================================
--  Fichier    : 20261107120000_fix_teacher_discount.sql
--  Projet     : Kalami
--  Description: Correctif v0.10.4 : remise enseignant de 20 % sur le Forfait Essentiel.
--               La migration 20261105 filtrait sur un nom commençant par « essentiel »,
--               alors que le forfait s'appelle « Forfait Essentiel » : aucune ligne
--               n'avait été modifiée.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-19
--  Dépendances: 20261105120000_strategy_orders.sql
-- =============================================================

update public.coach_packs set teacher_discount_pct = 20
where lower(name) like '%essentiel%';
