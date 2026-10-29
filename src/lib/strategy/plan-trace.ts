/**
 * =============================================================
 *  Fichier    : plan-trace.ts
 *  Projet     : Kalami Stratégie
 *  Description: Traçabilité du plan stratégique (cahier §3.5) : catalogue des éléments
 *               citables (profil et étapes 5 à 8, avec un libellé « É7 · option retenue :
 *               … »), annexe qui relie chaque paragraphe à ses sources, et filtre des
 *               sources inconnues (une source disparue ou inventée est signalée ou rejetée).
 *               Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: i18n (fr-strategy.ts, plan.trace), plan-assemble.ts, templates/plan.ts,
 *               templates/synthesis.ts
 * =============================================================
 */

import { interpolate } from "@/i18n";
import type { PlanInputs } from "@/lib/strategy/plan-assemble";
import {
  sourceKey,
  type PlanPayload,
  type PlanSectionKey,
  type PlanSource,
  type PlanSourceStep,
} from "@/lib/strategy/templates/plan";
import { SWOT_KEYS } from "@/lib/strategy/templates/synthesis";
import { getStrategyDictionary } from "@/i18n/strategy";

// ==================== TYPES ====================

/** Élément citable : étape, identifiant et libellé lisible. */
export type CatalogEntry = PlanSource & { label: string };

/** Source d'un paragraphe telle qu'affichée dans l'annexe. */
export type TraceSource = PlanSource & { label: string; found: boolean };

/** Ligne de l'annexe : un paragraphe d'une section et ses sources. */
export type TraceRow = {
  section: PlanSectionKey;
  /** Rang du paragraphe dans sa section (à partir de 1). */
  paragraph: number;
  sources: TraceSource[];
};

// ==================== VARIABLES GLOBALES ====================

const s = getStrategyDictionary();
const t = s.plan.trace;

/** Longueur maximale de l'extrait cité dans un libellé. */
const EXCERPT_MAX = 140;

// ==================== FONCTIONS UTILITAIRES ====================

/** Extrait d'un texte sur une ligne, coupé proprement. */
function excerpt(text: string): string {
  const flat = text.trim().replace(/\s+/g, " ");
  return flat.length > EXCERPT_MAX ? `${flat.slice(0, EXCERPT_MAX - 1)}…` : flat;
}

/** Libellé « É{step} · {kind} : {text} » (« Profil » pour l'étape 0). */
function label(step: PlanSourceStep, kind: string, text: string): string {
  const where = step === 0 ? t.profile : `É${step}`;
  const body = excerpt(text);
  return body ? `${where} · ${kind} : ${body}` : `${where} · ${kind}`;
}

// ==================== CATALOGUE ====================

/**
 * Catalogue des éléments citables par le plan : profil (périmètre, question), SWOT, pistes
 * TOWS et enjeux (É5), énoncés, valeurs et objectifs (É6), position, énoncé, options et
 * renoncements (É7), chantiers, indicateurs et risques (É8). Les éléments vides sont omis.
 *
 * @param inputs - Profil et contenu relu des étapes 5 à 8
 * @returns Éléments dans l'ordre des étapes
 *
 * Exemple d'utilisation :
 *   sourceCatalog(inputs).find((entry) => entry.id === "vision")?.label // « É6 · vision : … »
 */
export function sourceCatalog(inputs: PlanInputs): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const add = (step: PlanSourceStep, id: string, kind: string, text: string) => {
    entries.push({ step, id, label: label(step, kind, text) });
  };

  add(0, "scope", t.kinds.scope, inputs.profile.scope === "unit"
    ? interpolate(t.scopeUnit, { name: inputs.companyName, parent: inputs.profile.parentCompany })
    : inputs.companyName);
  if (inputs.question.trim()) add(0, "question", t.kinds.question, inputs.question);

  const { swot, tows, issues } = inputs.synthesis;
  for (const key of SWOT_KEYS) {
    for (const item of swot[key]) {
      if (!item.text.trim()) continue;
      const origin = item.origin
        ? ` ${interpolate(t.from, { step: String(item.origin.step) })}`
        : "";
      add(5, item.id, s.synthesis.keys[key].toLowerCase(), `${item.text}${origin}`);
    }
  }
  for (const item of tows) if (item.text.trim()) add(5, item.id, t.kinds.tows, item.text);
  for (const issue of issues) if (issue.title.trim()) add(5, issue.id, t.kinds.issue, issue.title);

  const { vision, mission, values, objectives } = inputs.direction;
  if (vision.text.trim()) add(6, "vision", t.kinds.vision, vision.text);
  if (mission.text.trim()) add(6, "mission", t.kinds.mission, mission.text);
  for (const value of values) if (value.name.trim()) add(6, value.id, t.kinds.value, value.name);
  for (const objective of objectives) {
    if (objective.text.trim()) add(6, objective.id, t.kinds.objective, objective.text);
  }

  const { generic, statement, options, renunciations } = inputs.choice;
  if (generic.position) {
    add(7, "generic", t.kinds.generic, s.choice.positions[generic.position]);
  }
  if (statement.text.trim()) add(7, "statement", t.kinds.statement, statement.text);
  for (const option of options) {
    if (!option.text.trim()) continue;
    const kind = option.decision === "retained" ? t.kinds.retained : t.kinds.option;
    add(7, option.id, kind, option.text);
  }
  for (const item of renunciations) {
    if (item.text.trim()) add(7, item.id, t.kinds.renunciation, item.text);
  }

  const { workstreams, indicators, risks } = inputs.action;
  for (const item of workstreams) {
    if (item.name.trim()) add(8, item.id, t.kinds.workstream, item.name);
  }
  for (const item of indicators) {
    if (item.name.trim()) add(8, item.id, t.kinds.indicator, item.name);
  }
  for (const item of risks) if (item.text.trim()) add(8, item.id, t.kinds.risk, item.text);
  return entries;
}

/** Index du catalogue par clé de source (« étape:id »). */
export function catalogIndex(catalog: CatalogEntry[]): Map<string, CatalogEntry> {
  return new Map(catalog.map((entry) => [sourceKey(entry), entry]));
}

// ==================== FILTRE ====================

/**
 * Garde les sources présentes dans le catalogue (sans doublon) ; les autres sont rejetées.
 * @param sources - Sources proposées (par le coach, par exemple)
 * @param known   - Index du catalogue
 */
export function knownSources(
  sources: PlanSource[],
  known: Map<string, CatalogEntry>,
): PlanSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = sourceKey(source);
    if (!known.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ==================== ANNEXE ====================

/**
 * Annexe de traçabilité : pour chaque paragraphe qui cite des sources, leur libellé ; une
 * source qui n'existe plus (élément supprimé depuis) est signalée « introuvable ».
 *
 * @param plan    - Plan actuel
 * @param catalog - Catalogue des éléments citables
 * @returns Lignes dans l'ordre des sections et des paragraphes
 */
export function traceRows(plan: PlanPayload, catalog: CatalogEntry[]): TraceRow[] {
  const index = catalogIndex(catalog);
  return plan.sections.flatMap((section) => section.blocks.flatMap((block, position) => {
    if (block.sources.length === 0) return [];
    return [{
      section: section.key,
      paragraph: position + 1,
      sources: block.sources.map((source): TraceSource => {
        const entry = index.get(sourceKey(source));
        return entry
          ? { ...source, label: entry.label, found: true }
          : {
            ...source,
            label: interpolate(t.missing, { step: String(source.step) }),
            found: false,
          };
      }),
    }];
  }));
}
