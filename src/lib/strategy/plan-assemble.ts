/**
 * =============================================================
 *  Fichier    : plan-assemble.ts
 *  Projet     : Kalami Stratégie
 *  Description: Assemblage du plan stratégique sans IA (cahier §3.5) : chaque section est
 *               rédigée à partir du profil et des étapes 5 à 8 validées, et chaque
 *               paragraphe garde ses sources pour l'annexe de traçabilité. Rien n'est
 *               inventé : une section sans matière le dit. Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: i18n (fr-strategy.ts, plan.assembled), templates/plan.ts, synthesis.ts,
 *               direction.ts, choice.ts, action.ts, profile.ts
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import type { ProfileData } from "@/lib/strategy/profile";
import {
  FREQUENCIES,
  PERSPECTIVES,
  monthIndex,
  type ActionPayload,
} from "@/lib/strategy/templates/action";
import type { ChoicePayload } from "@/lib/strategy/templates/choice";
import type { DirectionPayload } from "@/lib/strategy/templates/direction";
import {
  BLOCK_TEXT_MAX,
  BLOCKS_MAX,
  PLAN_SECTIONS,
  SOURCES_MAX,
  sourceKey,
  type PlanBlock,
  type PlanPayload,
  type PlanSection,
  type PlanSectionKey,
  type PlanSource,
} from "@/lib/strategy/templates/plan";
import {
  namedIssues,
  SWOT_KEYS,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

// ==================== TYPES ====================

/** Matière du plan : profil de l'étude et contenu relu des étapes 5 à 8. */
export type PlanInputs = {
  companyName: string;
  question: string;
  profile: ProfileData;
  synthesis: SynthesisPayload;
  direction: DirectionPayload;
  choice: ChoicePayload;
  action: ActionPayload;
};

/** Paragraphe en cours d'assemblage (l'identifiant est attribué à la fin). */
type Draft = { text: string; sources: PlanSource[] };

// ==================== VARIABLES GLOBALES ====================

const s = getDictionary().strategy;
const t = s.plan.assembled;

/** Identifiants du profil citables (étape 0). */
export const PROFILE_SOURCE_IDS = ["question", "scope"] as const;

// ==================== FONCTIONS UTILITAIRES ====================

/** Vrai si le texte contient autre chose que des espaces. */
function filled(text: string): boolean {
  return text.trim().length > 0;
}

/** Texte d'une ligne de liste, sans espaces superflus. */
function clean(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Mois AAAA-MM écrit en toutes lettres (« mars 2027 »), ou le texte d'origine s'il est vide
 * ou mal formé.
 * @param month - Mois au format AAAA-MM
 */
export function formatMonth(month: string): string {
  const index = monthIndex(month);
  if (index === null) return month;
  const date = new Date(Date.UTC(Math.floor(index / 12), index % 12, 1));
  return new Intl.DateTimeFormat("fr-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Paragraphe titré suivi d'une liste à puces. */
function listBlock(title: string, lines: string[], sources: PlanSource[]): Draft {
  return { text: [title, ...lines.map((line) => `- ${line}`)].join("\n"), sources };
}

/** Phrase « clé : valeur » assemblée seulement avec les valeurs saisies. */
function details(parts: [string, string][]): string {
  return parts
    .filter(([, value]) => filled(value))
    .map(([label, value]) => `${label} : ${clean(value)}`)
    .join(" ; ");
}

/** Ligne de liste suivie de ses précisions entre parenthèses, s'il y en a. */
function withDetails(text: string, parts: [string, string][]): string {
  const extra = details(parts);
  return extra ? `${clean(text)} (${extra})` : clean(text);
}

// ==================== SECTIONS ====================

/** 1. Où en sommes-nous : périmètre, question et SWOT. */
function situation(inputs: PlanInputs): Draft[] {
  const { profile } = inputs;
  const name = clean(inputs.companyName);
  const scope = profile.scope === "unit" && filled(profile.parentCompany)
    ? interpolate(t.scopeUnit, { name, parent: clean(profile.parentCompany) })
    : interpolate(t.scopeCompany, { name });
  const drafts: Draft[] = [{ text: scope, sources: [{ step: 0, id: "scope" }] }];
  if (filled(inputs.question)) {
    drafts.push({
      text: interpolate(t.question, { question: clean(inputs.question) }),
      sources: [{ step: 0, id: "question" }],
    });
  }
  for (const key of SWOT_KEYS) {
    const items = inputs.synthesis.swot[key].filter((item) => filled(item.text));
    if (items.length === 0) continue;
    drafts.push(listBlock(
      `${s.synthesis.keys[key]} :`,
      items.map((item) => clean(item.text)),
      items.map((item) => ({ step: 5, id: item.id })),
    ));
  }
  return drafts;
}

/** 2. Nos enjeux : les enjeux nommés de la synthèse et les éléments qui les fondent. */
function issues(inputs: PlanInputs): Draft[] {
  const drafts = namedIssues(inputs.synthesis).map((issue): Draft => ({
    text: filled(issue.explanation)
      ? `${clean(issue.title)} : ${clean(issue.explanation)}`
      : clean(issue.title),
    sources: [
      { step: 5, id: issue.id },
      ...issue.links.map((id): PlanSource => ({ step: 5, id })),
    ],
  }));
  return drafts.length > 0 ? drafts : [{ text: t.noIssues, sources: [] }];
}

/** 3. Notre cap : vision, mission, valeurs et objectifs. */
function direction(inputs: PlanInputs): Draft[] {
  const { vision, mission, values, objectives } = inputs.direction;
  const drafts: Draft[] = [];
  if (filled(vision.text)) {
    drafts.push({
      text: interpolate(t.vision, { text: clean(vision.text) }),
      sources: [{ step: 6, id: "vision" }],
    });
  }
  if (filled(mission.text)) {
    drafts.push({
      text: interpolate(t.mission, { text: clean(mission.text) }),
      sources: [{ step: 6, id: "mission" }],
    });
  }
  const named = values.filter((value) => filled(value.name));
  if (named.length > 0) {
    drafts.push(listBlock(
      t.values,
      named.map((value) => withDetails(value.name, [[t.gesture, value.gesture]])),
      named.map((value) => ({ step: 6, id: value.id })),
    ));
  }
  const goals = objectives.filter((objective) => filled(objective.text));
  if (goals.length > 0) {
    drafts.push(listBlock(
      t.objectives,
      goals.map((objective) => clean(objective.text)),
      goals.map((objective) => ({ step: 6, id: objective.id })),
    ));
  }
  return drafts;
}

/** 4. Notre stratégie et ce que nous ne ferons pas. */
function strategy(inputs: PlanInputs): Draft[] {
  const { generic, statement, options, renunciations } = inputs.choice;
  const drafts: Draft[] = [];
  if (generic.position) {
    const position = interpolate(t.position, { position: s.choice.positions[generic.position] });
    drafts.push({
      text: filled(generic.justification)
        ? `${position} ${clean(generic.justification)}`
        : position,
      sources: [{ step: 7, id: "generic" }],
    });
  }
  if (filled(statement.text)) {
    drafts.push({ text: clean(statement.text), sources: [{ step: 7, id: "statement" }] });
  }
  const retained = options.filter((option) => option.decision === "retained"
    && filled(option.text));
  if (retained.length > 0) {
    drafts.push(listBlock(
      t.retained,
      retained.map((option) => clean(option.text)),
      retained.map((option) => ({ step: 7, id: option.id })),
    ));
  }
  const refused = renunciations.filter((item) => filled(item.text));
  drafts.push(refused.length > 0
    ? listBlock(
      t.renunciations,
      refused.map((item) => clean(item.text)),
      refused.map((item) => ({ step: 7, id: item.id })),
    )
    : { text: t.noRenunciations, sources: [] });
  return drafts;
}

/** 5. Nos chantiers : responsable, période, options et objectifs servis. */
function workstreams(inputs: PlanInputs): Draft[] {
  const drafts = inputs.action.workstreams
    .filter((item) => filled(item.name))
    .map((item): Draft => ({
      text: withDetails(item.name, [
        [t.owner, item.owner],
        [t.period, filled(item.start) && filled(item.end)
          ? interpolate(t.range, { start: formatMonth(item.start), end: formatMonth(item.end) })
          : ""],
      ]),
      sources: [
        { step: 8, id: item.id },
        ...item.optionLinks.map((id): PlanSource => ({ step: 7, id })),
        ...item.objectiveLinks.map((id): PlanSource => ({ step: 6, id })),
      ],
    }));
  return drafts.length > 0 ? drafts : [{ text: t.noWorkstreams, sources: [] }];
}

/** 6. Nos objectifs et indicateurs : objectifs mesurés, puis tableau de bord. */
function objectives(inputs: PlanInputs): Draft[] {
  const drafts: Draft[] = [];
  const goals = inputs.direction.objectives.filter((objective) => filled(objective.text));
  if (goals.length > 0) {
    drafts.push(listBlock(
      t.measuredObjectives,
      goals.map((objective) => withDetails(objective.text, [
        [t.indicator, objective.indicator],
        [t.target, objective.target],
        [t.deadline, filled(objective.deadline) ? formatMonth(objective.deadline) : ""],
      ])),
      goals.map((objective) => ({ step: 6, id: objective.id })),
    ));
  }
  for (const perspective of PERSPECTIVES) {
    const indicators = inputs.action.indicators.filter((item) => item.perspective === perspective
      && filled(item.name));
    if (indicators.length === 0) continue;
    drafts.push(listBlock(
      `${s.action.perspectives[perspective]} :`,
      indicators.map((item) => withDetails(item.name, [[t.target, item.target]])),
      indicators.map((item) => ({ step: 8, id: item.id })),
    ));
  }
  return drafts;
}

/** 7. Nos risques : signal d'alerte et réponse prévue ; rien n'est inventé s'il n'y en a pas. */
function risks(inputs: PlanInputs): Draft[] {
  const drafts = inputs.action.risks
    .filter((risk) => filled(risk.text))
    .map((risk): Draft => ({
      text: withDetails(risk.text, [[t.signal, risk.signal], [t.response, risk.response]]),
      sources: [{ step: 8, id: risk.id }],
    }));
  return drafts.length > 0 ? drafts : [{ text: t.noRisks, sources: [] }];
}

/** 8. Notre suivi : rythme de suivi des indicateurs et jalons (fins de chantiers). */
function monitoring(inputs: PlanInputs): Draft[] {
  const drafts: Draft[] = [];
  for (const frequency of FREQUENCIES) {
    const indicators = inputs.action.indicators.filter((item) => item.frequency === frequency
      && filled(item.name));
    if (indicators.length === 0) continue;
    drafts.push(listBlock(
      interpolate(t.frequency, { frequency: s.action.frequencies[frequency].toLowerCase() }),
      indicators.map((item) => withDetails(item.name, [[t.owner, item.owner]])),
      indicators.map((item) => ({ step: 8, id: item.id })),
    ));
  }
  const milestones = inputs.action.workstreams
    .filter((item) => filled(item.name) && monthIndex(item.end) !== null)
    .sort((a, b) => (monthIndex(a.end) as number) - (monthIndex(b.end) as number));
  if (milestones.length > 0) {
    drafts.push(listBlock(
      t.milestones,
      milestones.map((item) => interpolate(t.milestone, {
        name: clean(item.name),
        date: formatMonth(item.end),
      })),
      milestones.map((item) => ({ step: 8, id: item.id })),
    ));
  }
  return drafts.length > 0 ? drafts : [{ text: t.noMonitoring, sources: [] }];
}

const BUILDERS: Record<PlanSectionKey, (inputs: PlanInputs) => Draft[]> = {
  situation,
  issues,
  direction,
  strategy,
  workstreams,
  objectives,
  risks,
  monitoring,
};

// ==================== ASSEMBLAGE ====================

/** Sources sans doublon, bornées à SOURCES_MAX. */
function uniqueSources(sources: PlanSource[]): PlanSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = sourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, SOURCES_MAX);
}

/**
 * Assemble une section du plan à partir des étapes.
 *
 * @param key    - Section assemblée
 * @param inputs - Profil et contenu relu des étapes 5 à 8
 * @returns Section d'origine « assemblée », paragraphes bornés et sources dédoublonnées
 *
 * Exemple d'utilisation :
 *   assembleSection("risks", inputs).blocks[0].text // « Aucun risque… » si l'étape 8 n'en a pas
 */
export function assembleSection(key: PlanSectionKey, inputs: PlanInputs): PlanSection {
  const blocks = BUILDERS[key](inputs).slice(0, BLOCKS_MAX).map((draft, index): PlanBlock => ({
    id: `${key}-${index + 1}`,
    text: draft.text.slice(0, BLOCK_TEXT_MAX),
    sources: uniqueSources(draft.sources),
  }));
  return { key, origin: "assembled", blocks };
}

/**
 * Assemble le plan complet (première génération ou régénération complète).
 * @param inputs - Profil et contenu relu des étapes 5 à 8
 * @param now    - Date de génération
 */
export function assemblePlan(inputs: PlanInputs, now: Date): PlanPayload {
  return {
    generatedAt: now.toISOString(),
    sections: PLAN_SECTIONS.map((key) => assembleSection(key, inputs)),
  };
}
