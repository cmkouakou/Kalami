/**
 * =============================================================
 *  Fichier    : synthesis-sources.ts
 *  Projet     : Kalami Stratégie
 *  Description: Reprise des étapes 1 à 3 vers la SWOT de l'étape 5, sans IA : liste des
 *               candidats (facteurs PESTEL, forces d'intensité forte, activités évaluées,
 *               ressources VRIO), chacun avec sa case et son origine, puis ajout des
 *               candidats cochés sans doublon. L'étape 4 (parties prenantes) n'alimente pas
 *               la SWOT automatiquement. Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: templates/synthesis.ts, templates/pestel.ts, templates/forces.ts,
 *               templates/internal.ts
 * =============================================================
 */

import { FORCES, type ForceKey, type ForcesPayload } from "@/lib/strategy/templates/forces";
import {
  vrioResult,
  type InternalPayload,
  type VrioOutcome,
} from "@/lib/strategy/templates/internal";
import type { PestelPayload } from "@/lib/strategy/templates/pestel";
import {
  ITEM_TEXT_MAX,
  newSwotItem,
  SWOT_ITEMS_MAX,
  SWOT_KEYS,
  type SwotKey,
  type SwotOrigin,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

// ==================== TYPES ====================

/** Contenu des étapes sources (déjà relu par les lecteurs des gabarits). */
export type SynthesisSources = {
  pestel: PestelPayload;
  forces: ForcesPayload;
  internal: InternalPayload;
};

/** Élément proposé à la reprise. */
export type SwotCandidate = {
  key: SwotKey;
  origin: SwotOrigin;
  text: string;
  /** Vrai si la case contient déjà un élément de même origine. */
  present: boolean;
};

/** Issues VRIO qui font d'une ressource une force. */
const STRENGTH_OUTCOMES: readonly VrioOutcome[] = ["temporary", "sustained", "unexploited"];

// ==================== OUTILS ====================

/** Texte borné, espaces superflus retirés. */
function clip(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, ITEM_TEXT_MAX);
}

/** « Titre : précision », ou le titre seul si la précision est vide. */
function withDetail(title: string, detail: string): string {
  const head = title.trim();
  const tail = detail.trim();
  return clip(tail ? `${head} : ${tail}` : head);
}

/** Clé unique d'une origine dans une case. */
function originKey(key: SwotKey, origin: SwotOrigin): string {
  return `${key}:${origin.step}:${origin.ref}`;
}

/** Origines déjà présentes dans la SWOT, par case. */
function presentOrigins(payload: SynthesisPayload): Set<string> {
  const keys = new Set<string>();
  for (const key of SWOT_KEYS) {
    for (const item of payload.swot[key]) {
      if (item.origin) keys.add(originKey(key, item.origin));
    }
  }
  return keys;
}

// ==================== CANDIDATS PAR ÉTAPE ====================

type Draft = Omit<SwotCandidate, "present">;

/** Étape 1 : facteurs nommés ; opportunité → O, menace → M, les deux → O et M. */
function pestelDrafts(pestel: PestelPayload): Draft[] {
  return pestel.factors.flatMap((factor) => {
    if (!factor.factor.trim() || !factor.nature) return [];
    const origin: SwotOrigin = { step: 1, ref: factor.id };
    const text = withDetail(factor.factor, factor.effect);
    const keys: SwotKey[] = [];
    if (factor.nature !== "threat") keys.push("opportunities");
    if (factor.nature !== "opportunity") keys.push("threats");
    return keys.map((key) => ({ key, origin, text }));
  });
}

/** Étape 2 : forces d'intensité forte → M. */
function forcesDrafts(forces: ForcesPayload, labels: Record<ForceKey, string>): Draft[] {
  return FORCES.flatMap((force) => {
    const value = forces.forces[force];
    if (value.intensity !== "high") return [];
    return [{
      key: "threats" as const,
      origin: { step: 2 as const, ref: force },
      text: withDetail(labels[force], value.justification),
    }];
  });
}

/** Étape 3 : activités (force → F, faiblesse ou à améliorer → Fb) et ressources VRIO. */
function internalDrafts(internal: InternalPayload): Draft[] {
  const activities = internal.activities.flatMap((activity): Draft[] => {
    if (!activity.name.trim() || !activity.evaluation) return [];
    const origin: SwotOrigin = { step: 3, ref: activity.id };
    const text = withDetail(activity.name, activity.comment);
    if (activity.evaluation === "strength") return [{ key: "strengths", origin, text }];
    if (activity.evaluation === "marginal") return [];
    return [{ key: "weaknesses", origin, text }];
  });
  const resources = internal.resources.flatMap((resource): Draft[] => {
    const result = vrioResult(resource);
    if (!resource.name.trim() || !result) return [];
    const origin: SwotOrigin = { step: 3, ref: resource.id };
    const text = clip(resource.name);
    if (STRENGTH_OUTCOMES.includes(result.outcome)) return [{ key: "strengths", origin, text }];
    if (result.outcome === "disadvantage") return [{ key: "weaknesses", origin, text }];
    return [];
  });
  return [...activities, ...resources];
}

// ==================== API ====================

/**
 * Candidats à la reprise, dans l'ordre F, Fb, O, M puis par étape.
 *
 * @param sources - Contenu relu des étapes 1 à 3
 * @param labels  - Nom affiché de chaque force (étape 2)
 * @param current - SWOT actuelle (pour signaler les éléments déjà repris)
 * @returns Candidats, marqués « present » s'ils sont déjà dans leur case
 *
 * Exemple d'utilisation :
 *   const candidates = swotCandidates({ pestel, forces, internal }, labels, payload);
 */
export function swotCandidates(
  sources: SynthesisSources,
  labels: Record<ForceKey, string>,
  current: SynthesisPayload,
): SwotCandidate[] {
  const present = presentOrigins(current);
  const drafts = [
    ...pestelDrafts(sources.pestel),
    ...forcesDrafts(sources.forces, labels),
    ...internalDrafts(sources.internal),
  ];
  return SWOT_KEYS.flatMap((key) =>
    drafts
      .filter((draft) => draft.key === key)
      .map((draft) => ({ ...draft, present: present.has(originKey(key, draft.origin)) })),
  );
}

/**
 * Ajoute les candidats cochés à la SWOT, sans doublon d'origine et sans dépasser
 * SWOT_ITEMS_MAX par case.
 *
 * @param payload - Contenu actuel
 * @param chosen  - Candidats cochés
 * @param newId   - Fabrique d'identifiants (crypto.randomUUID côté navigateur)
 * @returns Nouveau contenu (l'original n'est pas modifié)
 */
export function importCandidates(
  payload: SynthesisPayload,
  chosen: readonly SwotCandidate[],
  newId: () => string,
): SynthesisPayload {
  const present = presentOrigins(payload);
  const swot = { ...payload.swot };
  for (const candidate of chosen) {
    const id = originKey(candidate.key, candidate.origin);
    const list = swot[candidate.key];
    if (present.has(id) || list.length >= SWOT_ITEMS_MAX) continue;
    present.add(id);
    swot[candidate.key] = [...list, newSwotItem(newId(), candidate.text, candidate.origin)];
  }
  return { ...payload, swot };
}
