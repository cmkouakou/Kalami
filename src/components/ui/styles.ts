/**
 * =============================================================
 *  Fichier    : styles.ts
 *  Projet     : Kalami
 *  Description: Classes des composants de la charte (boutons, pastilles, cartes, champs),
 *               partagées par les composants serveur et client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: globals.css (jetons de la charte)
 * =============================================================
 */

// ==================== BOUTONS ====================

const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-label " +
  "transition-colors duration-150 ease-kalami disabled:cursor-not-allowed disabled:opacity-50";

/** Bouton principal : un seul par vue. */
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-encre text-on-encre hover:bg-encre-strong`;

/** Bouton secondaire : contour encre, fond transparent. */
export const BUTTON_SECONDARY =
  `${BUTTON_BASE} border border-encre text-encre hover:bg-encre-soft`;

/** Bouton tertiaire : texte seul, souligné au survol. */
export const BUTTON_TERTIARY =
  "inline-flex min-h-11 items-center gap-2 px-1 text-label text-encre " +
  "underline-offset-4 hover:underline";

/** Bouton d'icône 44 × 44 (barres d'outils, liseuse). */
export const BUTTON_ICON =
  "inline-flex size-11 items-center justify-center rounded-md text-ink-muted " +
  "transition-colors duration-150 ease-kalami hover:bg-sand hover:text-ink " +
  "aria-pressed:bg-encre-soft aria-pressed:text-encre";

// ==================== PASTILLES ====================

const PILL_BASE =
  "inline-flex min-h-11 items-center rounded-full px-4 text-small font-semibold " +
  "transition-colors duration-150 ease-kalami";

/** Pastille de filtre ou de catégorie. */
export const PILL = `${PILL_BASE} bg-sand text-ink hover:bg-encre-soft hover:text-encre`;

/** Pastille sélectionnée. */
export const PILL_ACTIVE = `${PILL_BASE} bg-encre-soft text-encre`;

/** Petit badge non interactif (catégorie sur une fiche, « Gratuit »). */
export const BADGE =
  "inline-flex items-center rounded-full bg-sand px-3 py-1 text-caption uppercase text-ink-muted";

// ==================== SURFACES ====================

/** Carte : surface bordée, sans ombre. */
export const CARD = "rounded-lg border border-line bg-surface";

/** Panneau sable (couvertures, avantages, tuiles de statistiques). */
export const PANEL_SAND = "rounded-lg bg-sand";

// ==================== CHAMPS ====================

/** Contrôle de saisie (input, select, textarea). */
export const CONTROL =
  "min-h-11 rounded-sm border border-line bg-surface px-3 text-body text-ink " +
  "placeholder:text-ink-muted";

/** Largeur et marges d'une page de contenu. */
export const PAGE = "mx-auto w-full max-w-content px-4 sm:px-6";
