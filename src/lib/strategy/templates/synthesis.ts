/**
 * =============================================================
 *  Fichier    : synthesis.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 5 (cahier des charges §5.6) : matrice SWOT (quatre listes,
 *               chaque élément avec son origine « É1 » à « É4 » pour la traçabilité),
 *               matrice TOWS (pistes croisant des éléments de la SWOT) et deux ou trois
 *               enjeux. Schéma Zod, lecture tolérante, suppression qui retire aussi les liens
 *               devenus orphelins, et liste de contrôle (miroir de strategy_checklist_ok).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
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

/** Cases de la SWOT : forces, faiblesses (internes), opportunités, menaces (externes). */
export const SWOT_KEYS = ["strengths", "weaknesses", "opportunities", "threats"] as const;

export type SwotKey = (typeof SWOT_KEYS)[number];

/**
 * Quadrants de la TOWS : so (force × opportunité), st (force × menace),
 * wo (faiblesse × opportunité), wt (faiblesse × menace).
 */
export const TOWS_QUADRANTS = ["so", "st", "wo", "wt"] as const;

export type TowsQuadrant = (typeof TOWS_QUADRANTS)[number];

/** Cases de la SWOT croisées par chaque quadrant de la TOWS (interne, puis externe). */
export const TOWS_CROSS: Record<TowsQuadrant, readonly [SwotKey, SwotKey]> = {
  so: ["strengths", "opportunities"],
  st: ["strengths", "threats"],
  wo: ["weaknesses", "opportunities"],
  wt: ["weaknesses", "threats"],
};

/** Étapes dont un élément de la SWOT peut provenir. */
export const SOURCE_STEPS = [1, 2, 3, 4] as const;

export type SourceStep = (typeof SOURCE_STEPS)[number];

export const SWOT_ITEMS_MAX = 30;
export const TOWS_MAX = 40;
/** Nombre d'enjeux attendus (choisi par l'auteur : « deux ou trois »). */
export const ISSUES_MIN = 2;
export const ISSUES_MAX = 3;
export const LINKS_MAX = 20;
export const ITEM_TEXT_MAX = 1000;
export const ISSUE_TITLE_MAX = 200;
export const ISSUE_EXPLANATION_MAX = 1500;

// ==================== SCHÉMAS ====================

/** Origine d'un élément repris : étape et identifiant de l'élément source. */
const originSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  ref: itemId,
});

export type SwotOrigin = z.infer<typeof originSchema>;

const swotItemSchema = z.object({
  id: itemId,
  text: freeText(ITEM_TEXT_MAX),
  /** null : élément ajouté à la main. */
  origin: originSchema.nullable(),
});

export type SwotItem = z.infer<typeof swotItemSchema>;

const towsItemSchema = z.object({
  id: itemId,
  quadrant: z.enum(TOWS_QUADRANTS),
  text: freeText(ITEM_TEXT_MAX),
  /** Éléments de la SWOT croisés par la piste. */
  links: z.array(itemId).max(LINKS_MAX),
});

export type TowsItem = z.infer<typeof towsItemSchema>;

const issueSchema = z.object({
  id: itemId,
  title: freeText(ISSUE_TITLE_MAX),
  explanation: freeText(ISSUE_EXPLANATION_MAX),
  /** Éléments de la SWOT ou pistes TOWS dont l'enjeu découle. */
  links: z.array(itemId).max(LINKS_MAX),
});

export type Issue = z.infer<typeof issueSchema>;

const swotList = z.array(swotItemSchema).max(SWOT_ITEMS_MAX);

export const synthesisSchema = z.object({
  swot: z.object({
    strengths: swotList,
    weaknesses: swotList,
    opportunities: swotList,
    threats: swotList,
  }),
  tows: z.array(towsItemSchema).max(TOWS_MAX),
  issues: z.array(issueSchema).max(ISSUES_MAX),
});

export type SynthesisPayload = z.infer<typeof synthesisSchema>;

// ==================== CONTENU VIDE ====================

/** Gabarit vide (étape jamais enregistrée). */
export function emptySynthesis(): SynthesisPayload {
  return {
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    tows: [],
    issues: [],
  };
}

/**
 * Nouvel élément de la SWOT.
 * @param id     - Identifiant unique (crypto.randomUUID côté navigateur)
 * @param text   - Texte de départ
 * @param origin - Origine de l'élément repris, null s'il est ajouté à la main
 */
export function newSwotItem(id: string, text = "", origin: SwotOrigin | null = null): SwotItem {
  return { id, text, origin };
}

/** Nouvelle piste TOWS vide dans le quadrant donné. */
export function newTowsItem(id: string, quadrant: TowsQuadrant): TowsItem {
  return { id, quadrant, text: "", links: [] };
}

/** Nouvel enjeu vide. */
export function newIssue(id: string): Issue {
  return { id, title: "", explanation: "", links: [] };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; les éléments invalides sont écartés.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readSynthesis(raw: unknown): SynthesisPayload {
  const source = asObject(raw);
  const swot = asObject(source.swot);
  return {
    swot: {
      strengths: readList(swot.strengths, swotItemSchema, SWOT_ITEMS_MAX),
      weaknesses: readList(swot.weaknesses, swotItemSchema, SWOT_ITEMS_MAX),
      opportunities: readList(swot.opportunities, swotItemSchema, SWOT_ITEMS_MAX),
      threats: readList(swot.threats, swotItemSchema, SWOT_ITEMS_MAX),
    },
    tows: readList(source.tows, towsItemSchema, TOWS_MAX),
    issues: readList(source.issues, issueSchema, ISSUES_MAX),
  };
}

// ==================== ÉTIQUETTES ET LIENS ====================

/** Étiquette d'origine affichée : « É1 » à « É4 », ou null pour un ajout manuel. */
export function originLabel(origin: SwotOrigin | null): string | null {
  return origin ? `É${origin.step}` : null;
}

/**
 * Supprime un élément de la SWOT ou une piste TOWS et retire les liens qui le visaient.
 * @param payload - Contenu actuel
 * @param id      - Élément supprimé
 * @returns Nouveau contenu (l'original n'est pas modifié)
 */
export function removeItem(payload: SynthesisPayload, id: string): SynthesisPayload {
  const swot = Object.fromEntries(
    SWOT_KEYS.map((key) => [key, payload.swot[key].filter((item) => item.id !== id)]),
  ) as SynthesisPayload["swot"];
  const unlink = <T extends { id: string; links: string[] }>(item: T): T =>
    item.links.includes(id) ? { ...item, links: item.links.filter((link) => link !== id) } : item;
  return {
    swot,
    tows: payload.tows.filter((item) => item.id !== id).map(unlink),
    issues: payload.issues.map(unlink),
  };
}

/** Élément de la SWOT par identifiant, avec sa case. */
export function swotIndex(payload: SynthesisPayload): Map<string, SwotItem & { key: SwotKey }> {
  const index = new Map<string, SwotItem & { key: SwotKey }>();
  for (const key of SWOT_KEYS) {
    for (const item of payload.swot[key]) index.set(item.id, { ...item, key });
  }
  return index;
}

// ==================== LISTE DE CONTRÔLE ====================

/** Vrai si le texte contient autre chose que des espaces. */
function filled(text: string): boolean {
  return text.trim().length > 0;
}

/** Enjeux nommés (les enjeux sans titre sont ignorés). */
export function namedIssues(payload: SynthesisPayload): Issue[] {
  return payload.issues.filter((issue) => filled(issue.title));
}

export type SynthesisChecklistKey = "swot" | "tows" | "issues";

/**
 * Liste de contrôle : au moins un élément rédigé dans chaque case de la SWOT, au moins une
 * piste TOWS rédigée, et ISSUES_MIN à ISSUES_MAX enjeux nommés.
 */
export function synthesisChecklist(
  payload: SynthesisPayload,
): ChecklistItem<SynthesisChecklistKey>[] {
  const issues = namedIssues(payload).length;
  return [
    {
      key: "swot",
      ok: SWOT_KEYS.every((key) => payload.swot[key].some((item) => filled(item.text))),
    },
    { key: "tows", ok: payload.tows.some((item) => filled(item.text)) },
    { key: "issues", ok: issues >= ISSUES_MIN && issues <= ISSUES_MAX },
  ];
}
