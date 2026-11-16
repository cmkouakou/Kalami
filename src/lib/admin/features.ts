/**
 * =============================================================
 *  Fichier    : features.ts (lib/admin)
 *  Projet     : Kalami
 *  Description: Types d'offres que la page « Fonctionnalités » (v0.24.0) peut afficher
 *               ou masquer, partagés entre l'action serveur et la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Types reconnus par la fonction SQL admin_set_feature. */
export const FEATURE_KINDS = [
  "study_offer",
  "coach_pack",
  "practice_case",
  "workshop_pack",
] as const;

export type FeatureKind = (typeof FEATURE_KINDS)[number];
