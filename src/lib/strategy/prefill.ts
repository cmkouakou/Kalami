/**
 * =============================================================
 *  Fichier    : prefill.ts
 *  Projet     : Kalami Stratégie
 *  Description: Préremplissage du profil depuis une pièce jointe (S5b) : schéma de la sortie
 *               du coach (fonction « extract » : résumé et propositions), nettoyage, relecture
 *               de la sortie enregistrée et fusion des propositions retenues dans le profil.
 *               Fusion : champs simples remplacés, listes complétées sans doublon (casse
 *               ignorée) dans la limite de LIST_MAX, équipe ajoutée si son nom est nouveau.
 *               Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: zod, lib/strategy/profile.ts
 * =============================================================
 */

import { z } from "zod";

import { ITEM_MAX, LIST_MAX, TEXT_MAX, type ProfileData } from "@/lib/strategy/profile";

// ==================== LIMITES ====================

/** Longueur maximale du résumé (colonne study_attachments.summary). */
export const EXTRACT_SUMMARY_MAX = 4000;

/** Nombre maximal de propositions conservées. */
export const MAX_PROPOSALS = 40;

const MAX_EMPLOYEES = 10_000_000;
const MAX_HEADCOUNT = 1_000_000;
const MIN_YEAR = 1800;

// ==================== SCHÉMAS ====================

/** Champs du profil que le coach peut proposer (ordre d'affichage). */
export const PREFILL_FIELDS = [
  "sector",
  "employees",
  "revenueRange",
  "foundedYear",
  "countries",
  "cities",
  "markets",
  "teams",
  "offers",
  "clients",
  "competitors",
] as const;
export type PrefillField = (typeof PREFILL_FIELDS)[number];

/** Champs à valeur unique : la proposition retenue remplace la valeur du profil. */
const SCALAR_FIELDS = ["sector", "employees", "revenueRange", "foundedYear"] as const;
type ScalarField = (typeof SCALAR_FIELDS)[number];

/** Champs en liste de textes : la proposition s'ajoute à la liste. */
type ListField = Exclude<PrefillField, ScalarField | "teams">;

/**
 * Réponse brute attendue du modèle (sans bornes : les limites sont appliquées au
 * nettoyage, l'API n'acceptant pas toutes les contraintes de schéma).
 */
export const extractOutputSchema = z.object({
  summary: z.string(),
  proposals: z.array(
    z.object({
      field: z.enum(PREFILL_FIELDS),
      value: z.string(),
      headcount: z.number().int().nullable(),
    }),
  ),
});

export type ExtractOutput = z.infer<typeof extractOutputSchema>;

/** Proposition nettoyée : valeur prête à enregistrer (nombre en chiffres pour employees). */
export type Proposal = { field: PrefillField; value: string; headcount: number | null };

/** Résumé et propositions nettoyés (colonne coach_requests.output). */
export type Extract = { summary: string; proposals: Proposal[] };

// ==================== NETTOYAGE ====================

/** Coupe un texte trop long et retire les espaces superflus. */
function clip(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/** Entier écrit avec ou sans séparateurs (« 12 500 », « 12,500 ») ; null sinon. */
function parseInteger(value: string): number | null {
  const digits = value.trim().replace(/[\s  .,']/g, "");
  return /^\d{1,9}$/.test(digits) ? Number(digits) : null;
}

/**
 * Valeur nettoyée d'une proposition selon son champ ; null si elle est inutilisable.
 * @param field - Champ visé
 * @param value - Valeur proposée
 */
function cleanValue(field: PrefillField, value: string): string | null {
  if (field === "employees") {
    const count = parseInteger(value);
    return count !== null && count <= MAX_EMPLOYEES ? String(count) : null;
  }
  if (field === "foundedYear") {
    const year = /^\d{4}$/.test(value.trim()) ? Number(value.trim()) : NaN;
    return year >= MIN_YEAR && year <= new Date().getFullYear() ? String(year) : null;
  }
  const max = field === "sector" || field === "revenueRange" || field === "teams"
    ? TEXT_MAX : ITEM_MAX;
  return clip(value, max) || null;
}

/**
 * Nettoie la sortie du modèle : valeurs bornées, nombres vérifiés, doublons et valeurs
 * vides écartés, effectif conservé pour les équipes seulement.
 * @param raw - Réponse validée par extractOutputSchema
 * @returns Résumé et propositions prêts à enregistrer
 */
export function sanitizeExtract(raw: ExtractOutput): Extract {
  const seen = new Set<string>();
  const proposals: Proposal[] = [];
  for (const item of raw.proposals) {
    const value = cleanValue(item.field, item.value);
    const key = `${item.field}:${value?.toLowerCase()}`;
    if (value === null || seen.has(key)) continue;
    seen.add(key);
    const headcount = item.field === "teams" && item.headcount !== null
      && item.headcount >= 0 && item.headcount <= MAX_HEADCOUNT ? item.headcount : null;
    proposals.push({ field: item.field, value, headcount });
    if (proposals.length === MAX_PROPOSALS) break;
  }
  return { summary: clip(raw.summary, EXTRACT_SUMMARY_MAX), proposals };
}

/** Forme enregistrée d'une extraction nettoyée. */
const storedExtractSchema = z.object({
  summary: z.string(),
  proposals: z.array(
    z.object({
      field: z.enum(PREFILL_FIELDS),
      value: z.string(),
      headcount: z.number().int().nullable(),
    }),
  ),
});

/**
 * Relit une extraction enregistrée en base ; null si elle est illisible.
 * @param raw - Valeur JSON lue en base (colonne output)
 */
export function readExtract(raw: unknown): Extract | null {
  const parsed = storedExtractSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// ==================== FUSION ====================

/** Vrai si la liste contient déjà la valeur (casse et espaces ignorés). */
function hasValue(values: readonly string[], value: string): boolean {
  const key = value.trim().toLowerCase();
  return values.some((item) => item.trim().toLowerCase() === key);
}

/** Vrai si le champ est à valeur unique. */
function isScalar(field: PrefillField): field is ScalarField {
  return (SCALAR_FIELDS as readonly string[]).includes(field);
}

/**
 * Vrai si la proposition n'apporte rien au profil (valeur identique ou déjà listée).
 * @param profile  - Profil actuel
 * @param proposal - Proposition nettoyée
 */
export function isAlreadyInProfile(profile: ProfileData, proposal: Proposal): boolean {
  const { field, value } = proposal;
  if (field === "employees" || field === "foundedYear") return String(profile[field]) === value;
  if (field === "sector" || field === "revenueRange") return hasValue([profile[field]], value);
  if (field === "teams") return hasValue(profile.teams.map((team) => team.role), value);
  return hasValue(profile[field], value);
}

/**
 * Applique les propositions retenues au profil, sans le modifier en place.
 * Champs simples : la dernière proposition retenue l'emporte. Listes : ajout en fin de
 * liste, sans doublon, dans la limite de LIST_MAX (le surplus est ignoré).
 *
 * @param profile   - Profil actuel
 * @param proposals - Propositions retenues
 * @returns Nouveau profil
 *
 * Exemple d'utilisation :
 *   const next = mergeProposals(profile, [{ field: "cities", value: "Laval", headcount: null }]);
 */
export function mergeProposals(profile: ProfileData, proposals: readonly Proposal[]): ProfileData {
  const next: ProfileData = {
    ...profile,
    countries: [...profile.countries],
    cities: [...profile.cities],
    markets: [...profile.markets],
    teams: [...profile.teams],
    offers: [...profile.offers],
    clients: [...profile.clients],
    competitors: [...profile.competitors],
  };
  for (const { field, value, headcount } of proposals) {
    if (field === "employees" || field === "foundedYear") {
      next[field] = Number(value);
    } else if (isScalar(field)) {
      next[field] = value;
    } else if (field === "teams") {
      const roles = next.teams.map((team) => team.role);
      if (!hasValue(roles, value) && next.teams.length < LIST_MAX) {
        next.teams.push({ role: value, headcount });
      }
    } else {
      const list: string[] = next[field as ListField];
      if (!hasValue(list, value) && list.length < LIST_MAX) list.push(value);
    }
  }
  return next;
}
