/**
 * =============================================================
 *  Fichier    : patch.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Application d'une suggestion du coach au contenu d'un gabarit, sans
 *               mutation : l'élément visé (id) voit un de ses champs texte remplacé, puis
 *               le contenu entier est revalidé avec le schéma strict du gabarit. Si le
 *               résultat est invalide (champ inconnu, valeur hors liste, texte trop long),
 *               la suggestion n'est pas applicable. Fonctions pures (client et serveur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: templates/index.ts, coach/schemas.ts
 * =============================================================
 */

import type { Suggestion } from "@/lib/strategy/coach/schemas";
import { parsePayload, type TemplateStep } from "@/lib/strategy/templates";

// ==================== CONSTANTES ====================

/** Champs jamais remplacés : identifiants et liens entre éléments. */
const PROTECTED_FIELDS = new Set(["id", "factorId"]);

/** Profondeur maximale explorée (les gabarits en ont 4 au plus). */
const MAX_DEPTH = 8;

// ==================== RECHERCHE ====================

/**
 * Lit la valeur actuelle du champ visé, ou null si l'élément ou le champ texte est absent.
 * @param value    - Contenu (ou sous-partie) du gabarit
 * @param targetId - Identifiant de l'élément visé
 * @param field    - Champ texte visé
 */
export function findField(
  value: unknown,
  targetId: string,
  field: string,
  depth = 0,
): string | null {
  if (depth > MAX_DEPTH || !value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findField(item, targetId, field, depth + 1);
      if (found !== null) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.id === targetId) {
    const current = record[field];
    return typeof current === "string" ? current : null;
  }
  for (const child of Object.values(record)) {
    const found = findField(child, targetId, field, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

/** Copie immuable où le champ de l'élément visé reçoit le nouveau texte. */
function replaceField(
  value: unknown,
  targetId: string,
  field: string,
  text: string,
  depth: number,
): unknown {
  if (depth > MAX_DEPTH || !value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => replaceField(item, targetId, field, text, depth + 1));
  }
  const record = value as Record<string, unknown>;
  if (record.id === targetId) return { ...record, [field]: text };
  return Object.fromEntries(
    Object.entries(record).map(([key, child]) => [
      key,
      replaceField(child, targetId, field, text, depth + 1),
    ]),
  );
}

// ==================== APPLICATION ====================

/**
 * Applique la proposition d'une suggestion (ou un texte modifié par l'utilisateur).
 *
 * @param stepNo     - Étape du gabarit
 * @param payload    - Contenu actuel du gabarit
 * @param suggestion - Suggestion visant un élément et un champ
 * @param text       - Texte à poser (par défaut la proposition du coach)
 * @returns Nouveau contenu validé, ou null si la suggestion n'est pas applicable
 *
 * Exemple d'utilisation :
 *   const next = applySuggestion(1, value, suggestion);
 *   if (next) update(() => next);
 */
export function applySuggestion<T>(
  stepNo: TemplateStep,
  payload: T,
  suggestion: Suggestion,
  text: string | null = suggestion.proposal,
): T | null {
  const { targetId, field } = suggestion;
  if (!targetId || !field || text === null || PROTECTED_FIELDS.has(field)) return null;
  if (findField(payload, targetId, field) === null) return null;

  const next = replaceField(payload, targetId, field, text.trim(), 0);
  return parsePayload(stepNo, next) ? (next as T) : null;
}

/** Vrai si la suggestion peut être appliquée telle quelle au contenu actuel. */
export function isApplicable(stepNo: TemplateStep, payload: unknown, suggestion: Suggestion) {
  return applySuggestion(stepNo, payload, suggestion) !== null;
}
