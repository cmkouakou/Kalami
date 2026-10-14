/**
 * =============================================================
 *  Fichier    : patch.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Application d'une suggestion du coach au contenu d'un gabarit, sans
 *               mutation : l'élément visé (id) voit un de ses champs texte remplacé, puis
 *               le contenu entier est revalidé avec le schéma strict du gabarit. Si le
 *               résultat est invalide (champ inconnu, valeur hors liste, texte trop long),
 *               la suggestion n'est pas applicable. Ajout d'un fait de la recherche Web :
 *               nouveau facteur PESTEL (source remplie) à l'étape 1, ajout à la justification
 *               de la force visée à l'étape 2, avec la même revalidation.
 *               Fonctions pures (client et serveur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-13
 *  Dépendances: templates/index.ts, templates/pestel.ts, templates/forces.ts, coach/schemas.ts
 * =============================================================
 */

import type { ResearchFact, Suggestion, WebSource } from "@/lib/strategy/coach/schemas";
import { parsePayload, type TemplateStep } from "@/lib/strategy/templates";
import { FORCES, type ForceKey, type ForcesPayload } from "@/lib/strategy/templates/forces";
import {
  FACTORS_MAX,
  newFactor,
  PESTEL_DIMENSIONS,
  type PestelDimension,
  type PestelPayload,
} from "@/lib/strategy/templates/pestel";

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

// ==================== FAITS DE LA RECHERCHE WEB ====================

/** Longueurs des champs d'un facteur PESTEL (le gabarit revalide de toute façon). */
const FACTOR_TEXT_MAX = 300;
const SOURCE_TEXT_MAX = 500;

/** Coupe un texte trop long en terminant par « … ». */
function clipText(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Référence lisible d'une source : « titre, site, date, lien ».
 * @param source - Source vérifiée d'un fait
 */
export function formatSource(source: WebSource): string {
  return [source.title, source.site, source.pageAge, source.url]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
}

/**
 * Ajoute un fait trouvé par la recherche Web au gabarit de l'étape 1 ou 2.
 *
 * Étape 1 : nouveau facteur dans la dimension visée ; le texte du fait devient le facteur
 * (texte complet repris dans l'effet s'il a fallu le couper), la nature est reprise et la
 * source remplie (« titre, site, date, lien »), ou noSource si le fait n'a pas de source.
 * Étape 2 : le fait et sa source sont ajoutés à la justification de la force visée.
 *
 * @param stepNo   - Étape du gabarit (1 ou 2)
 * @param payload  - Contenu actuel du gabarit
 * @param fact     - Fait nettoyé de la recherche
 * @param id       - Identifiant du nouveau facteur (étape 1)
 * @param noSource - Mention d'un fait sans source (hypothèse à vérifier)
 * @returns Nouveau contenu validé, ou null si le fait ne peut pas être ajouté
 *
 * Exemple d'utilisation :
 *   const next = applyFact(1, value, fact, crypto.randomUUID(), t.hypothesis);
 */
export function applyFact<T>(
  stepNo: TemplateStep,
  payload: T,
  fact: ResearchFact,
  id: string,
  noSource: string,
): T | null {
  const text = fact.text.trim();
  if (!text) return null;
  const sources = fact.sources.map(formatSource);
  let next: unknown = null;

  if (stepNo === 1 && PESTEL_DIMENSIONS.includes(fact.target as PestelDimension)) {
    const pestel = payload as PestelPayload;
    if (!Array.isArray(pestel?.factors) || pestel.factors.length >= FACTORS_MAX) return null;
    const factor = {
      ...newFactor(id, fact.target as PestelDimension),
      factor: clipText(text, FACTOR_TEXT_MAX),
      effect: text.length > FACTOR_TEXT_MAX ? text : "",
      nature: fact.nature,
      source: clipText(sources.length > 0 ? sources.join(" ; ") : noSource, SOURCE_TEXT_MAX),
    };
    next = { ...pestel, factors: [...pestel.factors, factor] };
  } else if (stepNo === 2 && FORCES.includes(fact.target as ForceKey)) {
    const forces = payload as ForcesPayload;
    const key = fact.target as ForceKey;
    const current = forces?.forces?.[key];
    if (!current) return null;
    const reference = sources.length > 0 ? `(source : ${sources.join(" ; ")})` : `(${noSource})`;
    const addition = `${text} ${reference}`;
    const justification = current.justification.trim()
      ? `${current.justification.trimEnd()}\n${addition}` : addition;
    next = { ...forces, forces: { ...forces.forces, [key]: { ...current, justification } } };
  }

  return next !== null && parsePayload(stepNo, next) ? (next as T) : null;
}
