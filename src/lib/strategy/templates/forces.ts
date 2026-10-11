/**
 * =============================================================
 *  Fichier    : forces.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 2 (cahier des charges §5.2) : intensité et justification
 *               des cinq forces, tableau de comparaison avec les concurrents (critères ×
 *               acteurs, note de 1 à 5 et commentaire facultatif). Schéma Zod, contenu de
 *               départ tiré du profil, lecture tolérante et liste de contrôle (miroir de
 *               strategy_checklist_ok en SQL).
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

export const FORCES = ["rivalry", "newEntrants", "substitutes", "buyers", "suppliers"] as const;

export type ForceKey = (typeof FORCES)[number];

export const INTENSITIES = ["low", "medium", "high"] as const;

export type Intensity = (typeof INTENSITIES)[number];

export const SCORE_MIN = 1;
export const SCORE_MAX = 5;
export const ACTORS_MAX = 12;
export const CRITERIA_MAX = 20;
const JUSTIFICATION_MAX = 2000;
const NAME_MAX = 120;
const NOTE_MAX = 300;

// ==================== SCHÉMAS ====================

const forceSchema = z.object({
  intensity: z.enum(INTENSITIES).nullable(),
  justification: freeText(JUSTIFICATION_MAX),
});

export type Force = z.infer<typeof forceSchema>;

const actorSchema = z.object({ id: itemId, name: freeText(NAME_MAX) });

export type Actor = z.infer<typeof actorSchema>;

const cellSchema = z.object({
  score: z.number().int().min(SCORE_MIN).max(SCORE_MAX).nullable(),
  note: freeText(NOTE_MAX),
});

export type ScoreCell = z.infer<typeof cellSchema>;

const criterionSchema = z.object({
  id: itemId,
  name: freeText(NAME_MAX),
  /** Note de chaque acteur, indexée par l'identifiant de l'acteur. */
  scores: z.record(itemId, cellSchema),
});

export type Criterion = z.infer<typeof criterionSchema>;

export const forcesSchema = z.object({
  forces: z.object({
    rivalry: forceSchema,
    newEntrants: forceSchema,
    substitutes: forceSchema,
    buyers: forceSchema,
    suppliers: forceSchema,
  }),
  comparison: z.object({
    actors: z.array(actorSchema).max(ACTORS_MAX),
    criteria: z.array(criterionSchema).max(CRITERIA_MAX),
  }),
});

export type ForcesPayload = z.infer<typeof forcesSchema>;

// ==================== CONTENU DE DÉPART ====================

const EMPTY_FORCE: Force = { intensity: null, justification: "" };

/** Cinq forces vides. */
function emptyForces(): ForcesPayload["forces"] {
  return {
    rivalry: { ...EMPTY_FORCE },
    newEntrants: { ...EMPTY_FORCE },
    substitutes: { ...EMPTY_FORCE },
    buyers: { ...EMPTY_FORCE },
    suppliers: { ...EMPTY_FORCE },
  };
}

/**
 * Gabarit de départ : l'entreprise puis ses concurrents connus (profil) comme acteurs.
 * Les identifiants sont stables (« a0 », « a1 »…) pour que le rendu serveur et client
 * produisent le même contenu.
 * @param companyName - Nom de l'entreprise étudiée
 * @param competitors - Concurrents connus du profil
 */
export function initialForces(companyName: string, competitors: string[]): ForcesPayload {
  const names = [companyName, ...competitors].slice(0, ACTORS_MAX);
  return {
    forces: emptyForces(),
    comparison: {
      actors: names.map((name, i) => ({ id: `a${i}`, name: name.slice(0, NAME_MAX) })),
      criteria: [],
    },
  };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; un contenu jamais enregistré part du profil. Les notes
 * d'acteurs supprimés sont retirées.
 * @param raw         - Contenu JSON de study_steps.payload
 * @param companyName - Nom de l'entreprise (contenu de départ)
 * @param competitors - Concurrents connus du profil (contenu de départ)
 */
export function readForces(
  raw: unknown,
  companyName: string,
  competitors: string[],
): ForcesPayload {
  const source = asObject(raw);
  if (Object.keys(source).length === 0) return initialForces(companyName, competitors);

  const forces = emptyForces();
  const rawForces = asObject(source.forces);
  for (const key of FORCES) {
    const parsed = forceSchema.safeParse(rawForces[key]);
    if (parsed.success) forces[key] = parsed.data;
  }

  const comparison = asObject(source.comparison);
  const actors = readList(comparison.actors, actorSchema, ACTORS_MAX);
  const ids = new Set(actors.map((actor) => actor.id));
  const criteria = readList(comparison.criteria, criterionSchema, CRITERIA_MAX).map((c) => ({
    ...c,
    scores: Object.fromEntries(Object.entries(c.scores).filter(([id]) => ids.has(id))),
  }));
  return { forces, comparison: { actors, criteria } };
}

// ==================== RÈGLES ====================

/** Liste de contrôle : chacune des cinq forces a une intensité et une justification. */
export function forcesChecklist(payload: ForcesPayload): ChecklistItem<ForceKey>[] {
  return FORCES.map((key) => {
    const force = payload.forces[key];
    return { key, ok: force.intensity !== null && force.justification.trim().length > 0 };
  });
}

/**
 * Moyenne des notes d'un acteur sur les critères notés ; null si aucune note.
 * @param payload - Contenu du gabarit
 * @param actorId - Acteur concerné
 */
export function actorAverage(payload: ForcesPayload, actorId: string): number | null {
  const scores = payload.comparison.criteria
    .map((criterion) => criterion.scores[actorId]?.score)
    .filter((score): score is number => typeof score === "number");
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
