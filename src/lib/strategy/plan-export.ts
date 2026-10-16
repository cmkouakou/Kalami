/**
 * =============================================================
 *  Fichier    : plan-export.ts
 *  Projet     : Kalami Stratégie
 *  Description: Modèle d'export du plan stratégique (S8b), commun au PDF et au DOCX : page
 *               de titre (organisation, question, date), huit sections, feuille de route en
 *               Gantt au mois (étape 8), tableau de bord équilibré par perspective et annexe
 *               de traçabilité. Fonctions pures : aucun format de fichier ici.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: i18n (fr-strategy.ts), plan-assemble.ts, plan-trace.ts, slug.ts,
 *               templates/plan.ts, templates/action.ts
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import { slugify } from "@/lib/slug";
import { formatMonth, type PlanInputs } from "@/lib/strategy/plan-assemble";
import { sourceCatalog, traceRows } from "@/lib/strategy/plan-trace";
import {
  ganttLayout,
  monthFromIndex,
  monthIndex,
  PERSPECTIVES,
  type GanttBar,
  type Perspective,
} from "@/lib/strategy/templates/action";
import type { PlanPayload, PlanSectionKey } from "@/lib/strategy/templates/plan";

// ==================== TYPES ====================

export type ExportFormat = "pdf" | "docx";

export const EXPORT_FORMATS: readonly ExportFormat[] = ["pdf", "docx"];

/** Paragraphe imprimé ; son rang (à partir de 1) est celui que cite l'annexe. */
export type ExportParagraph = { no: number; text: string };

/** Section du plan prête à imprimer (paragraphes non vides). */
export type ExportSection = {
  key: PlanSectionKey;
  title: string;
  paragraphs: ExportParagraph[];
};

/** Barre du Gantt avec son libellé et sa période en toutes lettres. */
export type ExportBar = GanttBar & { name: string; period: string };

export type ExportGanttRow = ExportBar & {
  owner: string;
  phases: ExportBar[];
};

export type ExportGantt = {
  /** En-têtes de colonnes : mois abrégé, et l'année au premier mois et en janvier. */
  months: { label: string; year: string }[];
  rows: ExportGanttRow[];
  truncated: boolean;
};

export type ExportIndicator = {
  name: string;
  definition: string;
  target: string;
  frequency: string;
  owner: string;
  kind: string;
};

export type ExportPerspective = {
  key: Perspective;
  title: string;
  indicators: ExportIndicator[];
};

export type ExportTrace = {
  /** « 5. Nos chantiers · § 2 » */
  heading: string;
  sources: { label: string; found: boolean }[];
};

/** Document complet à mettre en forme. */
export type PlanExport = {
  title: string;
  organisation: string;
  question: string;
  exportedOn: string;
  footer: string;
  sections: ExportSection[];
  gantt: ExportGantt;
  scorecard: ExportPerspective[];
  annex: ExportTrace[];
  /** Nom de fichier sans extension. */
  fileName: string;
};

// ==================== VARIABLES GLOBALES ====================

const s = getDictionary().strategy;
const p = s.plan;
const e = p.export;
const a = s.action;

/** Mois abrégé (« janv. ») ; en UTC, comme la vue Gantt de l'écran. */
const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

/** Date d'export (« 15 octobre 2026 »). */
const DATE_FORMAT = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "UTC" });

/** Nom de fichier de secours si le nom de l'organisation ne donne aucun caractère utile. */
const FILE_NAME_FALLBACK = "plan-strategique";

// ==================== FONCTIONS UTILITAIRES ====================

/** Date UTC du premier jour d'un mois AAAA-MM. */
function monthDate(month: string): Date {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value - 1, 1));
}

/**
 * Période d'une barre en toutes lettres (« Offre PME : de janvier 2027 à juin 2027 »).
 * @param bar    - Barre calculée
 * @param origin - Premier mois affiché (AAAA-MM)
 * @param name   - Nom du chantier ou de la phase
 */
function barPeriod(bar: GanttBar, origin: string, name: string): string {
  const first = (monthIndex(origin) as number) + bar.start;
  return interpolate(a.ganttPeriod, {
    name,
    start: formatMonth(monthFromIndex(first)),
    end: formatMonth(monthFromIndex(first + bar.span - 1)),
  });
}

/** Nom de l'organisation étudiée, avec son entreprise mère pour une division. */
function organisationName(inputs: PlanInputs): string {
  const { scope, parentCompany } = inputs.profile;
  if (scope === "unit" && parentCompany.trim()) {
    return interpolate(p.trace.scopeUnit, { name: inputs.companyName, parent: parentCompany });
  }
  return inputs.companyName;
}

// ==================== PARTIES DU DOCUMENT ====================

/** Vue Gantt de l'étape 8 pour l'export (mêmes calculs que l'écran). */
export function exportGantt(inputs: PlanInputs): ExportGantt {
  const layout = ganttLayout(inputs.action.workstreams);
  const origin = layout.months[0];
  return {
    months: layout.months.map((month, index) => ({
      label: MONTH_FORMAT.format(monthDate(month)),
      year: index === 0 || month.endsWith("-01") ? month.slice(0, 4) : "",
    })),
    rows: layout.rows.map((row) => {
      const name = row.name.trim() || a.untitledWorkstream;
      return {
        ...row.bar,
        name,
        owner: row.owner.trim(),
        period: barPeriod(row.bar, origin, name),
        phases: row.phases.map((phase) => {
          const phaseName = phase.name.trim() || a.untitledPhase;
          return {
            start: phase.start,
            span: phase.span,
            name: phaseName,
            period: barPeriod(phase, origin, phaseName),
          };
        }),
      };
    }),
    truncated: layout.truncated,
  };
}

/** Tableau de bord équilibré : indicateurs nommés, regroupés par perspective. */
export function exportScorecard(inputs: PlanInputs): ExportPerspective[] {
  return PERSPECTIVES.map((key) => ({
    key,
    title: a.perspectives[key],
    indicators: inputs.action.indicators
      .filter((item) => item.perspective === key && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        definition: item.definition.trim(),
        target: item.target.trim(),
        frequency: item.frequency ? a.frequencies[item.frequency] : "",
        owner: item.owner.trim(),
        kind: item.kind ? a.kinds[item.kind] : "",
      })),
  }));
}

/**
 * Nom de fichier sans extension (« plan-strategique-atelier-nord »).
 * @param companyName - Nom de l'organisation étudiée
 */
export function exportFileName(companyName: string): string {
  const slug = slugify(companyName);
  return slug ? `${FILE_NAME_FALLBACK}-${slug}` : FILE_NAME_FALLBACK;
}

// ==================== DOCUMENT ====================

/**
 * Prépare le document d'export à partir du plan enregistré et de la matière des étapes.
 *
 * @param plan   - Plan enregistré (étape 9), relu par readPlan
 * @param inputs - Profil et étapes 5 à 8 (Gantt, tableau de bord, libellés de l'annexe)
 * @param now    - Date de l'export
 * @returns Document prêt à mettre en forme en PDF ou en DOCX
 *
 * Exemple d'utilisation :
 *   const doc = buildPlanExport(readPlan(payload), inputs, new Date());
 */
export function buildPlanExport(plan: PlanPayload, inputs: PlanInputs, now: Date): PlanExport {
  const organisation = organisationName(inputs);
  return {
    title: e.documentTitle,
    organisation,
    question: inputs.question.trim(),
    exportedOn: interpolate(e.exportedOn, { date: DATE_FORMAT.format(now) }),
    footer: interpolate(e.footer, { name: inputs.companyName }),
    sections: plan.sections.map((section) => ({
      key: section.key,
      title: p.sections[section.key],
      paragraphs: section.blocks
        .map((block, index) => ({ no: index + 1, text: block.text.trim() }))
        .filter((paragraph) => paragraph.text),
    })),
    gantt: exportGantt(inputs),
    scorecard: exportScorecard(inputs),
    annex: traceRows(plan, sourceCatalog(inputs)).map((row) => ({
      heading: `${p.sections[row.section]} · ${
        interpolate(p.annexParagraph, { no: String(row.paragraph) })
      }`,
      sources: row.sources.map((source) => ({ label: source.label, found: source.found })),
    })),
    fileName: exportFileName(inputs.companyName),
  };
}
