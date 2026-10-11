/**
 * =============================================================
 *  Fichier    : internal.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 3 (cahier des charges §5.3) : chaîne de valeur (modèle de
 *               Porter, activités modifiables) avec évaluation de chaque activité, puis
 *               analyse VRIO des ressources et arbre de décision (« partiel » compte comme
 *               « non » et rend le résultat « à confirmer »). Schéma Zod, contenu de départ,
 *               lecture tolérante et liste de contrôle (miroir de strategy_checklist_ok).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: zod, templates/common.ts
 * =============================================================
 */

import { z } from "zod";

import {
  asObject,
  freeText,
  itemId,
  readList,
  type ChecklistItem,
} from "@/lib/strategy/templates/common";

// ==================== RÉFÉRENCES ====================

/** Modèles de chaîne de valeur ; « services » viendra avec la liste fournie par l'auteur. */
export const VALUE_CHAIN_MODELS = ["porter"] as const;

export type ValueChainModel = (typeof VALUE_CHAIN_MODELS)[number];

export const ACTIVITY_KINDS = ["primary", "support"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Évaluation d'une activité : point fort, à renforcer, faible, marginale. */
export const EVALUATIONS = ["strength", "improve", "weakness", "marginal"] as const;

export type Evaluation = (typeof EVALUATIONS)[number];

/** Les quatre questions VRIO, dans l'ordre de l'arbre de décision. */
export const VRIO_TESTS = ["value", "rarity", "imitability", "organization"] as const;

export type VrioTest = (typeof VRIO_TESTS)[number];

export const ANSWERS = ["yes", "no", "partial"] as const;

export type Answer = (typeof ANSWERS)[number];

/** Issues de l'arbre de décision VRIO. */
export const VRIO_OUTCOMES = [
  "disadvantage",
  "parity",
  "temporary",
  "unexploited",
  "sustained",
] as const;

export type VrioOutcome = (typeof VRIO_OUTCOMES)[number];

export const ACTIVITIES_MAX = 30;
export const RESOURCES_MAX = 30;
const NAME_MAX = 200;
const DESCRIPTION_MAX = 1500;
const COMMENT_MAX = 1000;
const CATEGORY_MAX = 100;
const JUSTIFICATION_MAX = 1000;

/** Activités du modèle de Porter : clé de libellé (fr-strategy.ts) et type. */
export const PORTER_ACTIVITIES: readonly { key: string; kind: ActivityKind }[] = [
  { key: "inboundLogistics", kind: "primary" },
  { key: "operations", kind: "primary" },
  { key: "outboundLogistics", kind: "primary" },
  { key: "marketingSales", kind: "primary" },
  { key: "service", kind: "primary" },
  { key: "infrastructure", kind: "support" },
  { key: "humanResources", kind: "support" },
  { key: "technology", kind: "support" },
  { key: "procurement", kind: "support" },
];

// ==================== SCHÉMAS ====================

const activitySchema = z.object({
  id: itemId,
  kind: z.enum(ACTIVITY_KINDS),
  name: freeText(NAME_MAX),
  description: freeText(DESCRIPTION_MAX),
  evaluation: z.enum(EVALUATIONS).nullable(),
  comment: freeText(COMMENT_MAX),
});

export type Activity = z.infer<typeof activitySchema>;

const testSchema = z.object({
  answer: z.enum(ANSWERS).nullable(),
  justification: freeText(JUSTIFICATION_MAX),
});

export type TestAnswer = z.infer<typeof testSchema>;

const resourceSchema = z.object({
  id: itemId,
  name: freeText(NAME_MAX),
  category: freeText(CATEGORY_MAX),
  tests: z.object({
    value: testSchema,
    rarity: testSchema,
    imitability: testSchema,
    organization: testSchema,
  }),
});

export type Resource = z.infer<typeof resourceSchema>;

export const internalSchema = z.object({
  model: z.enum(VALUE_CHAIN_MODELS),
  activities: z.array(activitySchema).max(ACTIVITIES_MAX),
  resources: z.array(resourceSchema).max(RESOURCES_MAX),
});

export type InternalPayload = z.infer<typeof internalSchema>;

// ==================== CONTENU DE DÉPART ====================

/**
 * Nouvelle activité vide.
 * @param id   - Identifiant unique
 * @param kind - Activité principale ou de soutien
 * @param name - Nom de départ (vide pour une activité ajoutée)
 */
export function newActivity(id: string, kind: ActivityKind, name = ""): Activity {
  return { id, kind, name, description: "", evaluation: null, comment: "" };
}

/**
 * Activités du modèle de Porter, nommées avec les libellés donnés.
 * @param labels - Libellé de chaque activité, indexé par sa clé
 */
export function porterActivities(labels: Record<string, string>): Activity[] {
  return PORTER_ACTIVITIES.map(({ key, kind }) => newActivity(key, kind, labels[key] ?? ""));
}

/**
 * Gabarit de départ : les activités du modèle de Porter, aucune ressource.
 * @param labels - Libellés des activités (dictionnaire de l'interface)
 */
export function initialInternal(labels: Record<string, string>): InternalPayload {
  return { model: "porter", activities: porterActivities(labels), resources: [] };
}

const EMPTY_TEST: TestAnswer = { answer: null, justification: "" };

/**
 * Nouvelle ressource sans réponse aux questions VRIO.
 * @param id - Identifiant unique
 */
export function newResource(id: string): Resource {
  return {
    id,
    name: "",
    category: "",
    tests: {
      value: { ...EMPTY_TEST },
      rarity: { ...EMPTY_TEST },
      imitability: { ...EMPTY_TEST },
      organization: { ...EMPTY_TEST },
    },
  };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; part du modèle de Porter si rien n'a été enregistré.
 * @param raw    - Contenu JSON de study_steps.payload
 * @param labels - Libellés des activités de Porter
 */
export function readInternal(raw: unknown, labels: Record<string, string>): InternalPayload {
  const source = asObject(raw);
  if (!Array.isArray(source.activities)) return initialInternal(labels);
  return {
    model: "porter",
    activities: readList(source.activities, activitySchema, ACTIVITIES_MAX),
    resources: readList(source.resources, resourceSchema, RESOURCES_MAX),
  };
}

// ==================== ARBRE DE DÉCISION VRIO ====================

export type VrioResult = { outcome: VrioOutcome; tentative: boolean };

/** Issue quand la question de rang i (0 à 3) reçoit « non ». */
const STOP_AT: readonly VrioOutcome[] = ["disadvantage", "parity", "temporary", "unexploited"];

/**
 * Applique l'arbre de décision VRIO : la première réponse « non » (ou « partiel ») fixe
 * l'issue ; quatre « oui » donnent un avantage durable. Une réponse « partiel » rend le
 * résultat « à confirmer ».
 * @param resource - Ressource évaluée
 * @returns Issue, ou null tant qu'une question nécessaire n'a pas de réponse
 */
export function vrioResult(resource: Resource): VrioResult | null {
  let tentative = false;
  for (const [index, test] of VRIO_TESTS.entries()) {
    const answer = resource.tests[test].answer;
    if (answer === null) return null;
    if (answer === "partial") tentative = true;
    if (answer !== "yes") return { outcome: STOP_AT[index], tentative };
  }
  return { outcome: "sustained", tentative };
}

// ==================== LISTE DE CONTRÔLE ====================

/** Élément nommé (le nom n'est pas vide). */
function named(item: { name: string }): boolean {
  return item.name.trim().length > 0;
}

export type InternalChecklistKey = "activities" | "evaluated" | "resource";

/**
 * Liste de contrôle : au moins une activité, toutes les activités nommées évaluées, au
 * moins une ressource nommée dont les quatre questions ont une réponse.
 */
export function internalChecklist(
  payload: InternalPayload,
): ChecklistItem<InternalChecklistKey>[] {
  const activities = payload.activities.filter(named);
  return [
    { key: "activities", ok: activities.length > 0 },
    {
      key: "evaluated",
      ok: activities.length > 0 && activities.every((a) => a.evaluation !== null),
    },
    {
      key: "resource",
      ok: payload.resources
        .filter(named)
        .some((r) => VRIO_TESTS.every((test) => r.tests[test].answer !== null)),
    },
  ];
}
