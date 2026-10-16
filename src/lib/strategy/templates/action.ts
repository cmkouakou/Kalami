/**
 * =============================================================
 *  Fichier    : action.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 8, « Action » (cahier des charges §5.9) : feuille de route
 *               (chantiers avec responsable, début et fin au mois, phases facultatives, liens
 *               aux options retenues et aux objectifs), calcul de la vue Gantt au mois,
 *               tableau de bord équilibré (quatre perspectives, indicateurs de résultat ou
 *               avancés) et risques (signal d'alerte, réponse prévue). Schéma Zod, lecture
 *               tolérante, alertes et liste de contrôle (miroir de strategy_checklist_ok).
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

/** Perspectives du tableau de bord équilibré, dans l'ordre de Kaplan et Norton. */
export const PERSPECTIVES = ["financial", "customer", "internal", "learning"] as const;

export type Perspective = (typeof PERSPECTIVES)[number];

/** Indicateur de résultat (constate) ou avancé (annonce). */
export const INDICATOR_KINDS = ["lagging", "leading"] as const;

export type IndicatorKind = (typeof INDICATOR_KINDS)[number];

export const FREQUENCIES = ["monthly", "quarterly", "semiannual", "annual"] as const;

export type Frequency = (typeof FREQUENCIES)[number];

export const WORKSTREAMS_MAX = 15;
export const PHASES_MAX = 8;
export const INDICATORS_MAX = 24;
export const RISKS_MAX = 15;
export const NAME_MAX = 300;
export const OWNER_MAX = 200;
export const FIELD_MAX = 200;
export const DEFINITION_MAX = 1000;
export const RISK_TEXT_MAX = 500;
export const LINKS_MAX = 3;
/** Au-delà, la vue Gantt est coupée (cinq ans). */
export const GANTT_MONTHS_MAX = 60;

/** Mois au format AAAA-MM, ou vide. */
const monthField = z.union([z.literal(""), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]);

// ==================== SCHÉMAS ====================

const phaseSchema = z.object({
  id: itemId,
  name: freeText(NAME_MAX),
  start: monthField,
  end: monthField,
});

export type Phase = z.infer<typeof phaseSchema>;

const workstreamSchema = z.object({
  id: itemId,
  name: freeText(NAME_MAX),
  owner: freeText(OWNER_MAX),
  start: monthField,
  end: monthField,
  phases: z.array(phaseSchema).max(PHASES_MAX),
  /** Options retenues à l'étape 7 que le chantier met en œuvre. */
  optionLinks: z.array(itemId).max(LINKS_MAX),
  /** Objectifs de l'étape 6 auxquels le chantier contribue. */
  objectiveLinks: z.array(itemId).max(LINKS_MAX),
});

export type Workstream = z.infer<typeof workstreamSchema>;

const indicatorSchema = z.object({
  id: itemId,
  perspective: z.enum(PERSPECTIVES),
  name: freeText(FIELD_MAX),
  definition: freeText(DEFINITION_MAX),
  target: freeText(FIELD_MAX),
  frequency: z.enum(FREQUENCIES).nullable(),
  owner: freeText(OWNER_MAX),
  kind: z.enum(INDICATOR_KINDS).nullable(),
  /** Objectifs de l'étape 6 que l'indicateur suit. */
  objectiveLinks: z.array(itemId).max(LINKS_MAX),
});

export type Indicator = z.infer<typeof indicatorSchema>;

const riskSchema = z.object({
  id: itemId,
  text: freeText(RISK_TEXT_MAX),
  signal: freeText(RISK_TEXT_MAX),
  response: freeText(RISK_TEXT_MAX),
  /** Chantier exposé au risque (id d'un chantier), ou vide. */
  workstream: z.union([z.literal(""), itemId]),
});

export type Risk = z.infer<typeof riskSchema>;

export const actionSchema = z.object({
  workstreams: z.array(workstreamSchema).max(WORKSTREAMS_MAX),
  indicators: z.array(indicatorSchema).max(INDICATORS_MAX),
  risks: z.array(riskSchema).max(RISKS_MAX),
});

export type ActionPayload = z.infer<typeof actionSchema>;

// ==================== CONTENU VIDE ====================

/** Gabarit vide (étape jamais enregistrée). */
export function emptyAction(): ActionPayload {
  return { workstreams: [], indicators: [], risks: [] };
}

/** Nouveau chantier vide. */
export function newWorkstream(id: string): Workstream {
  return {
    id,
    name: "",
    owner: "",
    start: "",
    end: "",
    phases: [],
    optionLinks: [],
    objectiveLinks: [],
  };
}

/** Nouvelle phase vide. */
export function newPhase(id: string): Phase {
  return { id, name: "", start: "", end: "" };
}

/** Nouvel indicateur vide dans une perspective. */
export function newIndicator(id: string, perspective: Perspective): Indicator {
  return {
    id,
    perspective,
    name: "",
    definition: "",
    target: "",
    frequency: null,
    owner: "",
    kind: null,
    objectiveLinks: [],
  };
}

/** Nouveau risque vide. */
export function newRisk(id: string): Risk {
  return { id, text: "", signal: "", response: "", workstream: "" };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; les éléments invalides sont écartés.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readAction(raw: unknown): ActionPayload {
  const source = asObject(raw);
  return {
    workstreams: readList(source.workstreams, workstreamSchema, WORKSTREAMS_MAX),
    indicators: readList(source.indicators, indicatorSchema, INDICATORS_MAX),
    risks: readList(source.risks, riskSchema, RISKS_MAX),
  };
}

// ==================== MOIS ====================

/**
 * Rang d'un mois AAAA-MM (nombre de mois depuis l'an 0), ou null s'il est vide.
 * @param month - Mois au format AAAA-MM
 */
export function monthIndex(month: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

/** Mois AAAA-MM correspondant à un rang. */
export function monthFromIndex(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Vrai si début et fin sont saisis et dans l'ordre. */
function validRange(start: string, end: string): boolean {
  const from = monthIndex(start);
  const to = monthIndex(end);
  return from !== null && to !== null && to >= from;
}

// ==================== ÉVALUATION ====================

/** Vrai si le texte contient autre chose que des espaces. */
function filled(text: string): boolean {
  return text.trim().length > 0;
}

/** Vrai si le chantier est nommé, a un responsable et des dates dans l'ordre. */
export function isComplete(workstream: Workstream): boolean {
  return filled(workstream.name)
    && filled(workstream.owner)
    && validRange(workstream.start, workstream.end);
}

/** Alerte d'un chantier : dates inversées, phase hors du chantier, aucune option liée. */
export type WorkstreamWarning = "badDates" | "phaseOutside" | "noOption";

/**
 * Alertes d'un chantier nommé (l'équipe reste libre ; la validation n'est pas bloquée).
 * @param workstream - Chantier saisi
 * @returns Alertes, vide si le chantier n'est pas nommé
 */
export function workstreamWarnings(workstream: Workstream): WorkstreamWarning[] {
  if (!filled(workstream.name)) return [];
  const warnings: WorkstreamWarning[] = [];
  const from = monthIndex(workstream.start);
  const to = monthIndex(workstream.end);
  if (from !== null && to !== null && to < from) warnings.push("badDates");
  const outside = workstream.phases.some((phase) => {
    const start = monthIndex(phase.start);
    const end = monthIndex(phase.end);
    if (start !== null && end !== null && end < start) return true;
    if (from === null || to === null) return false;
    return (start !== null && (start < from || start > to))
      || (end !== null && (end < from || end > to));
  });
  if (outside) warnings.push("phaseOutside");
  if (workstream.optionLinks.length === 0) warnings.push("noOption");
  return warnings;
}

// ==================== VUE GANTT ====================

/** Barre de la vue Gantt : colonne de départ (0 = premier mois affiché) et nombre de mois. */
export type GanttBar = { start: number; span: number };

export type GanttRow = {
  id: string;
  name: string;
  owner: string;
  bar: GanttBar;
  phases: (GanttBar & { id: string; name: string })[];
};

export type GanttLayout = {
  /** Mois affichés, AAAA-MM. */
  months: string[];
  rows: GanttRow[];
  /** Vrai si la période dépassait GANTT_MONTHS_MAX et a été coupée. */
  truncated: boolean;
};

/**
 * Barre bornée aux mois affichés, ou null si elle tombe entièrement en dehors.
 * @param start  - Mois de début AAAA-MM
 * @param end    - Mois de fin AAAA-MM
 * @param origin - Rang du premier mois affiché
 * @param count  - Nombre de mois affichés
 */
function clipBar(start: string, end: string, origin: number, count: number): GanttBar | null {
  const from = monthIndex(start);
  const to = monthIndex(end);
  if (from === null || to === null || to < from) return null;
  const first = Math.max(from, origin) - origin;
  const last = Math.min(to, origin + count - 1) - origin;
  return last < first ? null : { start: first, span: last - first + 1 };
}

/**
 * Calcule la vue Gantt au mois : de la plus petite date de début à la plus grande date de
 * fin des chantiers datés, coupée à GANTT_MONTHS_MAX mois.
 *
 * @param workstreams - Chantiers saisis
 * @returns Mois affichés et barres ; aucune ligne si aucun chantier n'a de dates valides
 *
 * Exemple d'utilisation :
 *   ganttLayout([{ ...w, start: "2027-01", end: "2027-03" }]).months // 3 mois
 */
export function ganttLayout(workstreams: Workstream[]): GanttLayout {
  const dated = workstreams.filter((item) => validRange(item.start, item.end));
  if (dated.length === 0) return { months: [], rows: [], truncated: false };
  const origin = Math.min(...dated.map((item) => monthIndex(item.start) as number));
  const finish = Math.max(...dated.map((item) => monthIndex(item.end) as number));
  const total = finish - origin + 1;
  const count = Math.min(total, GANTT_MONTHS_MAX);
  const months = Array.from({ length: count }, (_, index) => monthFromIndex(origin + index));
  const rows = dated.flatMap((item) => {
    const bar = clipBar(item.start, item.end, origin, count);
    if (!bar) return [];
    const phases = item.phases.flatMap((phase) => {
      const phaseBar = clipBar(phase.start, phase.end, origin, count);
      return phaseBar ? [{ ...phaseBar, id: phase.id, name: phase.name }] : [];
    });
    return [{ id: item.id, name: item.name, owner: item.owner, bar, phases }];
  });
  return { months, rows, truncated: total > count };
}

// ==================== LISTE DE CONTRÔLE ====================

export type ActionChecklistKey = "workstream" | "scorecard";

/** Vrai si la perspective a au moins un indicateur nommé. */
export function perspectiveCovered(payload: ActionPayload, perspective: Perspective): boolean {
  return payload.indicators.some(
    (item) => item.perspective === perspective && filled(item.name),
  );
}

/**
 * Liste de contrôle : au moins un chantier complet (nom, responsable, début et fin dans
 * l'ordre) et au moins un indicateur nommé dans chacune des quatre perspectives. Les risques
 * restent facultatifs.
 */
export function actionChecklist(payload: ActionPayload): ChecklistItem<ActionChecklistKey>[] {
  return [
    { key: "workstream", ok: payload.workstreams.some(isComplete) },
    {
      key: "scorecard",
      ok: PERSPECTIVES.every((perspective) => perspectiveCovered(payload, perspective)),
    },
  ];
}
