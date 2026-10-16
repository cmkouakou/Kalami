/**
 * =============================================================
 *  Fichier    : direction.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 6, « Cap » (cahier des charges §5.7) : vision avec le
 *               test du remplacement du nom, mission, valeurs (chacune avec un geste
 *               concret) et objectifs SMART vérifiés critère par critère, liés aux enjeux
 *               de l'étape 5. Schéma Zod, lecture tolérante, réécriture de la vision avec le
 *               nom d'un concurrent, et liste de contrôle (miroir de strategy_checklist_ok).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
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

/** Critères SMART, dans l'ordre de l'acronyme. */
export const SMART_KEYS = [
  "specific",
  "measurable",
  "achievable",
  "realistic",
  "timeBound",
] as const;

export type SmartKey = (typeof SMART_KEYS)[number];

/** Réponse à « la phrase reste-t-elle vraie avec le nom d'un concurrent ? ». */
export const NAME_TEST_ANSWERS = ["yes", "no"] as const;

export type NameTestAnswer = (typeof NAME_TEST_ANSWERS)[number];

export const STATEMENT_MAX = 1000;
export const COMPETITOR_MAX = 200;
export const VALUES_MAX = 10;
/** Nombre de valeurs attendues (choisi par l'auteur). */
export const VALUES_MIN = 2;
export const VALUE_NAME_MAX = 120;
export const GESTURE_MAX = 500;
export const OBJECTIVES_MAX = 15;
export const OBJECTIVE_TEXT_MAX = 500;
export const OBJECTIVE_FIELD_MAX = 200;
export const ISSUE_LINKS_MAX = 3;

/** Échéance au mois (AAAA-MM), ou vide. */
const monthField = z.union([z.literal(""), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]);

// ==================== SCHÉMAS ====================

/** Énoncé unique (vision, mission) : l'id fixe permet au coach d'en proposer une reformulation. */
function statementSchema<const T extends string>(id: T) {
  return z.object({ id: z.literal(id), text: freeText(STATEMENT_MAX) });
}

const nameTestSchema = z.object({
  /** Concurrent (du profil ou saisi) dont le nom remplace celui de l'organisation. */
  competitor: freeText(COMPETITOR_MAX),
  answer: z.enum(NAME_TEST_ANSWERS).nullable(),
  /** Vision au moment de la réponse : si elle change ensuite, le test est à refaire. */
  testedVision: freeText(STATEMENT_MAX),
});

export type NameTest = z.infer<typeof nameTestSchema>;

const valueSchema = z.object({
  id: itemId,
  name: freeText(VALUE_NAME_MAX),
  /** Geste concret qui montre la valeur au quotidien. */
  gesture: freeText(GESTURE_MAX),
});

export type CoreValue = z.infer<typeof valueSchema>;

const smartSchema = z.object({
  specific: z.boolean(),
  measurable: z.boolean(),
  achievable: z.boolean(),
  realistic: z.boolean(),
  timeBound: z.boolean(),
});

export type SmartChecks = z.infer<typeof smartSchema>;

const objectiveSchema = z.object({
  id: itemId,
  text: freeText(OBJECTIVE_TEXT_MAX),
  indicator: freeText(OBJECTIVE_FIELD_MAX),
  target: freeText(OBJECTIVE_FIELD_MAX),
  deadline: monthField,
  smart: smartSchema,
  /** Enjeux de l'étape 5 auxquels l'objectif répond. */
  issueLinks: z.array(itemId).max(ISSUE_LINKS_MAX),
});

export type Objective = z.infer<typeof objectiveSchema>;

export const directionSchema = z.object({
  vision: statementSchema("vision"),
  nameTest: nameTestSchema,
  mission: statementSchema("mission"),
  values: z.array(valueSchema).max(VALUES_MAX),
  objectives: z.array(objectiveSchema).max(OBJECTIVES_MAX),
});

export type DirectionPayload = z.infer<typeof directionSchema>;

// ==================== CONTENU VIDE ====================

/** Aucun critère SMART coché. */
function noSmart(): SmartChecks {
  return {
    specific: false,
    measurable: false,
    achievable: false,
    realistic: false,
    timeBound: false,
  };
}

/** Test du nom pas encore fait. */
function emptyNameTest(): NameTest {
  return { competitor: "", answer: null, testedVision: "" };
}

/** Gabarit vide (étape jamais enregistrée). */
export function emptyDirection(): DirectionPayload {
  return {
    vision: { id: "vision", text: "" },
    nameTest: emptyNameTest(),
    mission: { id: "mission", text: "" },
    values: [],
    objectives: [],
  };
}

/** Nouvelle valeur vide. */
export function newValue(id: string): CoreValue {
  return { id, name: "", gesture: "" };
}

/** Nouvel objectif vide, aucun critère SMART coché. */
export function newObjective(id: string): Objective {
  return {
    id,
    text: "",
    indicator: "",
    target: "",
    deadline: "",
    smart: noSmart(),
    issueLinks: [],
  };
}

// ==================== LECTURE ====================

/** Texte d'un énoncé enregistré, ou vide. */
function readStatement(raw: unknown): string {
  const text = asObject(raw).text;
  return typeof text === "string" ? text.slice(0, STATEMENT_MAX) : "";
}

/**
 * Relit le contenu enregistré ; les éléments invalides sont écartés.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readDirection(raw: unknown): DirectionPayload {
  const source = asObject(raw);
  const nameTest = nameTestSchema.safeParse(source.nameTest);
  return {
    vision: { id: "vision", text: readStatement(source.vision) },
    nameTest: nameTest.success ? nameTest.data : emptyNameTest(),
    mission: { id: "mission", text: readStatement(source.mission) },
    values: readList(source.values, valueSchema, VALUES_MAX),
    objectives: readList(source.objectives, objectiveSchema, OBJECTIVES_MAX),
  };
}

// ==================== TEST DU REMPLACEMENT DU NOM ====================

/** Échappe les caractères spéciaux d'une expression régulière. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Réécrit la vision avec le nom d'un concurrent.
 *
 * Chaque mention du nom de l'organisation (sans tenir compte de la casse) est remplacée ;
 * si la vision ne le cite pas, le concurrent devient le sujet de la phrase.
 *
 * @param vision      - Vision rédigée par l'équipe
 * @param companyName - Nom de l'organisation étudiée
 * @param competitor  - Nom du concurrent
 * @returns Vision réécrite, ou vide si la vision ou le concurrent manque
 *
 * Exemple d'utilisation :
 *   swapName("Infosystem sera le partenaire…", "Infosystem", "Alpha") // « Alpha sera… »
 */
export function swapName(vision: string, companyName: string, competitor: string): string {
  const text = vision.trim();
  const rival = competitor.trim();
  if (!text || !rival) return "";
  const name = companyName.trim();
  if (name) {
    const pattern = new RegExp(escapeRegExp(name), "gi");
    if (pattern.test(text)) return text.replace(pattern, rival);
  }
  return `${rival} : « ${text} »`;
}

/** État du test : pas fait, à refaire (vision changée depuis), réussi ou échoué. */
export type NameTestState = "pending" | "stale" | "passed" | "failed";

/** État du test du nom pour le contenu actuel. */
export function nameTestState(payload: DirectionPayload): NameTestState {
  const { answer, testedVision } = payload.nameTest;
  if (answer === null) return "pending";
  if (testedVision !== payload.vision.text) return "stale";
  return answer === "no" ? "passed" : "failed";
}

// ==================== LISTE DE CONTRÔLE ====================

/** Vrai si le texte contient autre chose que des espaces. */
function filled(text: string): boolean {
  return text.trim().length > 0;
}

/** Vrai si l'objectif est rédigé et coché sur les cinq critères SMART. */
export function isSmart(objective: Objective): boolean {
  return filled(objective.text) && SMART_KEYS.every((key) => objective.smart[key]);
}

export type DirectionChecklistKey = "vision" | "nameTest" | "mission" | "values" | "objectives";

/**
 * Liste de contrôle : vision rédigée et test du nom réussi sur la vision actuelle, mission
 * rédigée, au moins VALUES_MIN valeurs avec leur geste, au moins un objectif SMART.
 */
export function directionChecklist(
  payload: DirectionPayload,
): ChecklistItem<DirectionChecklistKey>[] {
  const values = payload.values.filter((value) => filled(value.name) && filled(value.gesture));
  return [
    { key: "vision", ok: filled(payload.vision.text) },
    {
      key: "nameTest",
      ok: filled(payload.vision.text) && nameTestState(payload) === "passed",
    },
    { key: "mission", ok: filled(payload.mission.text) },
    { key: "values", ok: values.length >= VALUES_MIN },
    { key: "objectives", ok: payload.objectives.some(isSmart) },
  ];
}
