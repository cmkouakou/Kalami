/**
 * =============================================================
 *  Fichier    : pestel.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 1 (cahier des charges §5.1) : facteurs PESTEL, place de
 *               chaque facteur dans la grille impact-incertitude, matrice de scénarios 2×2
 *               construite sur deux variables pivots. Schéma Zod, contenu vide, lecture
 *               tolérante et liste de contrôle (miroir de strategy_checklist_ok en SQL).
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

export const PESTEL_DIMENSIONS = [
  "political",
  "economic",
  "social",
  "technological",
  "environmental",
  "legal",
] as const;

export type PestelDimension = (typeof PESTEL_DIMENSIONS)[number];

/** Effet sur l'entreprise : opportunité, menace, ou les deux selon la réponse donnée. */
export const NATURES = ["opportunity", "threat", "both"] as const;

export type Nature = (typeof NATURES)[number];

/**
 * Cases de la grille impact-incertitude :
 * pivot (impact fort, incertitude forte), trend (impact fort, incertitude faible),
 * watch (impact faible, incertitude forte), minor (impact faible, incertitude faible).
 */
export const QUADRANTS = ["pivot", "trend", "watch", "minor"] as const;

export type Quadrant = (typeof QUADRANTS)[number];

/** Cases de la matrice de scénarios : pôle de l'axe 1 puis pôle de l'axe 2 (l = bas, h = haut). */
export const SCENARIO_CELLS = ["hh", "hl", "lh", "ll"] as const;

export type ScenarioCell = (typeof SCENARIO_CELLS)[number];

export const FACTORS_MAX = 60;
const FACTOR_MAX = 300;
const EFFECT_MAX = 1000;
const SOURCE_MAX = 500;
const POLE_MAX = 200;
const NAME_MAX = 120;
const DESCRIPTION_MAX = 1500;

// ==================== SCHÉMAS ====================

const factorSchema = z.object({
  id: itemId,
  dimension: z.enum(PESTEL_DIMENSIONS),
  factor: freeText(FACTOR_MAX),
  effect: freeText(EFFECT_MAX),
  nature: z.enum(NATURES).nullable(),
  source: freeText(SOURCE_MAX),
  quadrant: z.enum(QUADRANTS).nullable(),
});

export type PestelFactor = z.infer<typeof factorSchema>;

/** Axe de la matrice : un facteur pivot et ses deux pôles (hypothèse basse, haute). */
const axisSchema = z.object({
  factorId: itemId.nullable(),
  low: freeText(POLE_MAX),
  high: freeText(POLE_MAX),
});

export type ScenarioAxis = z.infer<typeof axisSchema>;

const scenarioSchema = z.object({
  name: freeText(NAME_MAX),
  description: freeText(DESCRIPTION_MAX),
});

export type Scenario = z.infer<typeof scenarioSchema>;

export const pestelSchema = z.object({
  factors: z.array(factorSchema).max(FACTORS_MAX),
  scenarios: z.object({
    axes: z.tuple([axisSchema, axisSchema]),
    cells: z.object({
      hh: scenarioSchema,
      hl: scenarioSchema,
      lh: scenarioSchema,
      ll: scenarioSchema,
    }),
  }),
});

export type PestelPayload = z.infer<typeof pestelSchema>;

// ==================== CONTENU VIDE ====================

const EMPTY_AXIS: ScenarioAxis = { factorId: null, low: "", high: "" };
const EMPTY_SCENARIO: Scenario = { name: "", description: "" };

/** Gabarit vide (étape jamais enregistrée). */
export function emptyPestel(): PestelPayload {
  return {
    factors: [],
    scenarios: {
      axes: [{ ...EMPTY_AXIS }, { ...EMPTY_AXIS }],
      cells: {
        hh: { ...EMPTY_SCENARIO },
        hl: { ...EMPTY_SCENARIO },
        lh: { ...EMPTY_SCENARIO },
        ll: { ...EMPTY_SCENARIO },
      },
    },
  };
}

/**
 * Nouveau facteur vide dans une dimension.
 * @param id        - Identifiant unique (crypto.randomUUID côté navigateur)
 * @param dimension - Dimension PESTEL choisie
 */
export function newFactor(id: string, dimension: PestelDimension): PestelFactor {
  return { id, dimension, factor: "", effect: "", nature: null, source: "", quadrant: null };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; les parties invalides prennent la valeur vide.
 * Un axe qui pointe vers un facteur supprimé est remis à zéro.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readPestel(raw: unknown): PestelPayload {
  const source = asObject(raw);
  const result = emptyPestel();
  result.factors = readList(source.factors, factorSchema, FACTORS_MAX);

  const scenarios = asObject(source.scenarios);
  const axes = Array.isArray(scenarios.axes) ? scenarios.axes : [];
  const ids = new Set(result.factors.map((factor) => factor.id));
  for (const index of [0, 1] as const) {
    const parsed = axisSchema.safeParse(axes[index]);
    if (!parsed.success) continue;
    const axis = parsed.data;
    result.scenarios.axes[index] =
      axis.factorId && !ids.has(axis.factorId) ? { ...axis, factorId: null } : axis;
  }

  const cells = asObject(scenarios.cells);
  for (const cell of SCENARIO_CELLS) {
    const parsed = scenarioSchema.safeParse(cells[cell]);
    if (parsed.success) result.scenarios.cells[cell] = parsed.data;
  }
  return result;
}

// ==================== RÈGLES ====================

/** Facteur nommé (le texte du facteur n'est pas vide). */
function named(factor: PestelFactor): boolean {
  return factor.factor.trim().length > 0;
}

/** Facteurs candidats aux axes des scénarios : les pivots, ou tous s'il n'y en a aucun. */
export function pivotCandidates(payload: PestelPayload): PestelFactor[] {
  const namedFactors = payload.factors.filter(named);
  const pivots = namedFactors.filter((factor) => factor.quadrant === "pivot");
  return pivots.length > 0 ? pivots : namedFactors;
}

export type PestelChecklistKey = "opportunity" | "threat";

/**
 * Liste de contrôle : au moins une opportunité et une menace (« les deux » compte pour
 * chacune).
 */
export function pestelChecklist(payload: PestelPayload): ChecklistItem<PestelChecklistKey>[] {
  const factors = payload.factors.filter(named);
  return [
    {
      key: "opportunity",
      ok: factors.some((f) => f.nature === "opportunity" || f.nature === "both"),
    },
    { key: "threat", ok: factors.some((f) => f.nature === "threat" || f.nature === "both") },
  ];
}
