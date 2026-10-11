/**
 * =============================================================
 *  Fichier    : internal.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 3 (cahier des charges §5.3) : chaîne de valeur (modèle de
 *               Porter ou modèle services de l'auteur d'après Stabell et Fjeldstad, choisi au
 *               début, activités modifiables) avec évaluation de chaque activité, puis
 *               analyse VRIO des ressources et arbre de décision (« partiel » compte comme
 *               « non » et rend le résultat « à confirmer »). Schéma Zod, contenu de départ,
 *               lecture tolérante et liste de contrôle (miroir de strategy_checklist_ok).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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

/** Modèles de chaîne de valeur : Porter (industrie) ou services (liste fournie par l'auteur). */
export const VALUE_CHAIN_MODELS = ["porter", "services"] as const;

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
/** Minimums de la liste de contrôle (choisis par l'auteur). */
export const ACTIVITIES_MIN = 4;
export const RESOURCES_MIN = 3;
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

/** Activités du modèle services (parcours du client, puis soutien), fournies par l'auteur. */
export const SERVICES_ACTIVITIES: readonly { key: string; kind: ActivityKind }[] = [
  { key: "attract", kind: "primary" },
  { key: "diagnose", kind: "primary" },
  { key: "deliver", kind: "primary" },
  { key: "dailySupport", kind: "primary" },
  { key: "emergency", kind: "primary" },
  { key: "administration", kind: "support" },
  { key: "humanResources", kind: "support" },
  { key: "technology", kind: "support" },
  { key: "procurement", kind: "support" },
];

/** Activités de départ de chaque modèle. */
export const MODEL_ACTIVITIES: Record<ValueChainModel, typeof PORTER_ACTIVITIES> = {
  porter: PORTER_ACTIVITIES,
  services: SERVICES_ACTIVITIES,
};

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
  /** Modèle choisi au début de l'étape ; null tant que l'utilisateur n'a pas choisi. */
  model: z.enum(VALUE_CHAIN_MODELS).nullable(),
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
 * Activités de départ d'un modèle, nommées avec les libellés donnés.
 * @param model  - Modèle de chaîne de valeur
 * @param labels - Libellé de chaque activité, indexé par sa clé
 */
export function modelActivities(
  model: ValueChainModel,
  labels: Record<string, string>,
): Activity[] {
  return MODEL_ACTIVITIES[model].map(({ key, kind }) =>
    newActivity(key, kind, labels[key] ?? ""),
  );
}

/** Gabarit vide : aucun modèle choisi, aucune activité ni ressource. */
export function emptyInternal(): InternalPayload {
  return { model: null, activities: [], resources: [] };
}

/**
 * Choisit (ou change) le modèle : les activités sont remplacées par celles du modèle, les
 * ressources sont gardées.
 * @param payload - Contenu actuel
 * @param model   - Modèle choisi
 * @param labels  - Libellés des activités du modèle
 */
export function withModel(
  payload: InternalPayload,
  model: ValueChainModel,
  labels: Record<string, string>,
): InternalPayload {
  return { ...payload, model, activities: modelActivities(model, labels) };
}

/**
 * Vrai si les activités sont encore celles de départ du modèle (rien d'évalué ni décrit) :
 * changer de modèle ne fait alors rien perdre.
 */
export function untouchedActivities(payload: InternalPayload): boolean {
  return payload.activities.every(
    (a) => a.evaluation === null && !a.description.trim() && !a.comment.trim(),
  );
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
 * Relit le contenu enregistré ; sans modèle valide, l'utilisateur choisira le sien (un
 * ancien contenu avec des activités mais sans modèle reste sur Porter).
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readInternal(raw: unknown): InternalPayload {
  const source = asObject(raw);
  const parsed = z.enum(VALUE_CHAIN_MODELS).safeParse(source.model);
  const activities = readList(source.activities, activitySchema, ACTIVITIES_MAX);
  const model = parsed.success ? parsed.data : activities.length > 0 ? "porter" : null;
  return {
    model,
    activities,
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

/** Ressource dont les quatre questions VRIO ont une réponse. */
function vrioComplete(resource: Resource): boolean {
  return VRIO_TESTS.every((test) => resource.tests[test].answer !== null);
}

export type InternalChecklistKey = "model" | "activities" | "resources" | "complete";

/**
 * Liste de contrôle : modèle choisi, au moins ACTIVITIES_MIN activités nommées et évaluées,
 * au moins RESOURCES_MIN ressources nommées passées au VRIO, et les quatre réponses pour
 * chaque ressource nommée.
 */
export function internalChecklist(
  payload: InternalPayload,
): ChecklistItem<InternalChecklistKey>[] {
  const evaluated = payload.activities.filter((a) => named(a) && a.evaluation !== null);
  const resources = payload.resources.filter(named);
  return [
    { key: "model", ok: payload.model !== null },
    { key: "activities", ok: evaluated.length >= ACTIVITIES_MIN },
    { key: "resources", ok: resources.filter(vrioComplete).length >= RESOURCES_MIN },
    { key: "complete", ok: resources.length > 0 && resources.every(vrioComplete) },
  ];
}
