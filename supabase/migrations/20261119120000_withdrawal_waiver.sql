-- =============================================================
--  Fichier    : 20261119120000_withdrawal_waiver.sql
--  Projet     : Kalami
--  Description: Renonciation au droit de rétractation (v0.15.7). L'acheteur coche, avant
--               de payer, une case par laquelle il demande l'accès immédiat au contenu
--               numérique et reconnaît perdre son droit de rétractation dès le début de
--               l'exécution. La date de cet accord est conservée sur la commande (preuve).
--               Écrite par le serveur (rôle service) à la création de la commande.
--  Auteur     : Claude Marcel
--  Version    : 1.0
--  Date       : 2026-10-28
-- =============================================================

-- ==================== COMMANDES ====================

alter table public.orders
  add column withdrawal_waiver_at timestamptz;

comment on column public.orders.withdrawal_waiver_at is
  'Date à laquelle l''acheteur a demandé l''accès immédiat et renoncé à son droit de '
  'rétractation (case cochée avant le paiement). Null pour les commandes antérieures.';
