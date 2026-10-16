/**
 * =============================================================
 *  Fichier    : plan-export-docx.ts
 *  Projet     : Kalami Stratégie
 *  Description: Mise en forme Word (DOCX) du plan stratégique (S8b) : page de titre,
 *               sommaire, huit sections aux paragraphes numérotés (« § n », cités par
 *               l'annexe), feuille de route en Gantt (tableau aux cellules colorées, section
 *               paysage), tableau de bord équilibré et annexe de traçabilité. Pied de page
 *               numéroté. Le texte saisi est inséré tel quel, jamais interprété.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: docx, plan-export.ts, i18n
 * =============================================================
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  type ISectionOptions,
} from "docx";

import { getDictionary, interpolate } from "@/i18n";
import type {
  ExportBar,
  ExportGantt,
  ExportPerspective,
  ExportSection,
  ExportTrace,
  PlanExport,
} from "@/lib/strategy/plan-export";

// ==================== VARIABLES GLOBALES ====================

const s = getDictionary().strategy;
const e = s.plan.export;
const a = s.action;

/** Couleurs de la charte, sans « # » (format attendu par Word). */
const INK = "1E4D4A";
const INK_SOFT = "8FB3AE";
const MUTED = "6B6156";
const LINE = "E2D8C6";
const HEAD_FILL = "FAF6EF";

const FONT = "Georgia";

/** Page A4 en vingtièmes de point, et marges (2 cm, 1,6 cm en paysage). */
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1134;
const MARGIN_LANDSCAPE = 907;

/** Largeur utile du Gantt en paysage, et part réservée aux libellés. */
const GANTT_WIDTH = A4.height - 2 * MARGIN_LANDSCAPE;
const GANTT_LABEL_WIDTH = 3000;

const THIN = { style: BorderStyle.SINGLE, size: 2, color: LINE };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// ==================== FONCTIONS UTILITAIRES ====================

type RunOptions = { size?: number; color?: string; italics?: boolean; bold?: boolean };

/**
 * Texte saisi, coupé à chaque retour à la ligne (Word ignore les « \n »).
 * @param text    - Texte libre
 * @param options - Mise en forme commune des morceaux
 */
function runs(text: string, options: RunOptions = {}) {
  return text.split("\n").map((line, index) =>
    new TextRun({ text: line, break: index > 0 ? 1 : undefined, ...options }));
}

/** Paragraphe atténué en italique (section vide, note). */
function note(text: string): Paragraph {
  return new Paragraph({ children: runs(text, { italics: true, color: MUTED, size: 18 }) });
}

/** Titre de niveau 1 commençant une nouvelle page au besoin. */
function heading(text: string, pageBreak = false): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: pageBreak,
    keepNext: true,
    children: [new TextRun({ text, color: INK })],
  });
}

/** Cellule de tableau à texte. */
function textCell(text: string, width?: number, header = false): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: HEAD_FILL } : undefined,
    borders: { top: THIN, bottom: THIN, left: THIN, right: THIN },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: runs(text, { size: 17, bold: header }) })],
  });
}

// ==================== PARTIES DU DOCUMENT ====================

/** Page de titre et sommaire. */
function titlePage(doc: PlanExport): Paragraph[] {
  const question = doc.question
    ? [
      new Paragraph({
        spacing: { before: 480 },
        children: [new TextRun({ text: e.question, size: 18, color: MUTED })],
      }),
      new Paragraph({ children: runs(doc.question, { italics: true, size: 24 }) }),
    ]
    : [];
  const contents = [
    ...doc.sections.map((section) => section.title),
    e.ganttTitle,
    e.scorecardTitle,
    e.annexTitle,
  ];
  return [
    new Paragraph({
      spacing: { before: 4000 },
      children: [new TextRun({ text: doc.title.toUpperCase(), size: 20, color: MUTED })],
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: doc.organisation, color: INK })],
    }),
    ...question,
    new Paragraph({
      spacing: { before: 960 },
      children: [
        new TextRun({ text: doc.exportedOn, size: 18, color: MUTED }),
        new TextRun({ text: e.preparedWith, size: 18, color: MUTED, break: 1 }),
      ],
    }),
    heading(e.contents, true),
    ...contents.map((title) => new Paragraph({ spacing: { after: 80 }, text: title })),
  ];
}

/** Section du plan : titre, puis paragraphes précédés de leur rang. */
function sectionBlocks(section: ExportSection, first: boolean): Paragraph[] {
  const body = section.paragraphs.length === 0
    ? [note(e.emptySection)]
    : section.paragraphs.map((paragraph) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
      children: [
        new TextRun({ text: `§ ${paragraph.no}  `, size: 16, color: MUTED }),
        ...runs(paragraph.text),
      ],
    }));
  return [heading(section.title, first), ...body];
}

/**
 * Ligne du Gantt : libellé, puis une cellule par mois, colorée sur la durée de la barre.
 * @param bar   - Barre (colonne de départ et nombre de mois)
 * @param count - Nombre de mois affichés
 * @param phase - Vrai pour une phase (couleur plus claire, libellé en retrait)
 */
function ganttRow(bar: ExportBar, count: number, phase: boolean): TableRow {
  const monthWidth = Math.floor((GANTT_WIDTH - GANTT_LABEL_WIDTH) / count);
  const fill = phase ? INK_SOFT : INK;
  const cells = Array.from({ length: count }, (_, index) => {
    const inside = index >= bar.start && index < bar.start + bar.span;
    return new TableCell({
      width: { size: monthWidth, type: WidthType.DXA },
      shading: inside ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: THIN, right: THIN },
      children: [new Paragraph({ children: [] })],
    });
  });
  return new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: GANTT_LABEL_WIDTH, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: THIN },
        margins: { left: phase ? 240 : 0, right: 80 },
        children: [new Paragraph({
          children: [new TextRun({
            text: bar.name,
            size: 15,
            bold: !phase,
            color: phase ? MUTED : undefined,
          })],
        })],
      }),
      ...cells,
    ],
  });
}

/** Annexe A : Gantt en tableau, puis les périodes en toutes lettres. */
function ganttBlocks(gantt: ExportGantt): (Paragraph | Table)[] {
  if (gantt.rows.length === 0) return [heading(e.ganttTitle), note(e.ganttEmpty)];
  const count = gantt.months.length;
  const monthWidth = Math.floor((GANTT_WIDTH - GANTT_LABEL_WIDTH) / count);
  const header = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: GANTT_LABEL_WIDTH, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: THIN },
        children: [new Paragraph({ children: [] })],
      }),
      ...gantt.months.map((month) => new TableCell({
        width: { size: monthWidth, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: THIN, left: THIN, right: THIN },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: month.year, size: 12, bold: true }),
            new TextRun({ text: month.label, size: 12, color: MUTED, break: 1 }),
          ],
        })],
      })),
    ],
  });
  const rows = gantt.rows.flatMap((row) => [
    ganttRow(row, count, false),
    ...row.phases.map((phase) => ganttRow(phase, count, true)),
  ]);
  const truncated = gantt.truncated
    ? [note(interpolate(a.ganttTruncated, { max: String(count) }))]
    : [];
  return [
    heading(e.ganttTitle),
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: GANTT_LABEL_WIDTH + monthWidth * count, type: WidthType.DXA },
      columnWidths: [GANTT_LABEL_WIDTH, ...Array<number>(count).fill(monthWidth)],
      rows: [header, ...rows],
    }),
    ...truncated,
    new Paragraph({ spacing: { before: 240 }, children: [] }),
    ...gantt.rows.map((row) => new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({
        text: row.owner ? `${row.period} (${row.owner})` : row.period,
        size: 17,
        color: MUTED,
      })],
    })),
  ];
}

/** Annexe B : un tableau par perspective du tableau de bord. */
function scorecardBlocks(scorecard: ExportPerspective[]): (Paragraph | Table)[] {
  const columns = [a.indicatorName, a.definition, a.target, a.frequency, a.owner, a.kind];
  return [
    heading(e.scorecardTitle),
    ...scorecard.flatMap((perspective) => {
      const title = new Paragraph({
        heading: HeadingLevel.HEADING_2,
        keepNext: true,
        children: [new TextRun({ text: perspective.title, color: INK })],
      });
      if (perspective.indicators.length === 0) return [title, note(e.scorecardEmpty)];
      return [title, new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: columns.map((label) => textCell(label, undefined, true)),
          }),
          ...perspective.indicators.map((item) => new TableRow({
            cantSplit: true,
            children: [item.name, item.definition, item.target, item.frequency, item.owner,
              item.kind].map((value) => textCell(value || e.none)),
          })),
        ],
      })];
    }),
  ];
}

/** Annexe C : traçabilité, paragraphe par paragraphe. */
function annexBlocks(annex: ExportTrace[]): Paragraph[] {
  const body = annex.length === 0
    ? [note(s.plan.annexEmpty)]
    : annex.flatMap((row) => [
      new Paragraph({
        keepNext: true,
        spacing: { before: 160 },
        children: [new TextRun({ text: row.heading, bold: true, size: 18 })],
      }),
      ...row.sources.map((source) => new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({
          text: source.label,
          size: 17,
          color: source.found ? MUTED : "9A5B00",
        })],
      })),
    ]);
  return [heading(e.annexTitle, true), note(s.plan.annexIntro), ...body];
}

// ==================== DOCUMENT ====================

/** Pied de page commun : « Plan stratégique — Nom · page / pages ». */
function footer(text: string): Footer {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        size: 15,
        color: MUTED,
        children: [`${text}  —  `, PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES],
      })],
    })],
  });
}

/**
 * Construit le fichier DOCX du plan stratégique.
 * @param doc - Document d'export (plan-export.ts)
 * @returns Contenu du fichier .docx
 *
 * Exemple d'utilisation :
 *   const bytes = await buildPlanDocx(buildPlanExport(plan, inputs, new Date()));
 */
export async function buildPlanDocx(doc: PlanExport): Promise<Uint8Array> {
  const footers = { default: footer(doc.footer) };
  const portrait = (children: ISectionOptions["children"]): ISectionOptions => ({
    properties: { page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN,
      right: MARGIN } } },
    footers,
    children,
  });

  const file = new Document({
    creator: "Kalami Stratégie",
    title: `${doc.title} — ${doc.organisation}`,
    description: doc.question,
    styles: {
      default: {
        document: { run: { font: FONT, size: 21 }, paragraph: { spacing: { line: 300 } } },
        heading1: { run: { font: FONT, size: 30, bold: true }, paragraph: { spacing:
          { before: 360, after: 200 } } },
        heading2: { run: { font: FONT, size: 23, bold: true }, paragraph: { spacing:
          { before: 240, after: 120 } } },
        title: { run: { font: FONT, size: 52, bold: true }, paragraph: { spacing:
          { after: 240 } } },
      },
    },
    sections: [
      portrait([
        ...titlePage(doc),
        ...doc.sections.flatMap((section, index) => sectionBlocks(section, index === 0)),
      ]),
      {
        properties: {
          page: {
            size: { ...A4, orientation: PageOrientation.LANDSCAPE },
            margin: { top: MARGIN_LANDSCAPE, bottom: MARGIN_LANDSCAPE,
              left: MARGIN_LANDSCAPE, right: MARGIN_LANDSCAPE },
          },
        },
        footers,
        children: ganttBlocks(doc.gantt),
      },
      portrait([...scorecardBlocks(doc.scorecard), ...annexBlocks(doc.annex)]),
    ],
  });
  return new Uint8Array(await Packer.toBuffer(file));
}
