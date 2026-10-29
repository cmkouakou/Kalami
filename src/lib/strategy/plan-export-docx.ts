/**
 * =============================================================
 *  Fichier    : plan-export-docx.ts
 *  Projet     : Kalami Stratégie
 *  Description: Mise en forme Word (DOCX) du plan stratégique : couverture à bandeau,
 *               sommaire Word (champ TOC), titres numérotés, listes à puces, précisions
 *               en retrait, encadrés (vision, mission, énoncé, renoncements), grille SWOT,
 *               feuille de route en Gantt (page paysage), tableau de bord équilibré (vue
 *               d'ensemble 2 × 2 et détail) et annexe de traçabilité. En-tête et pied de
 *               page « Page X sur Y ». Le texte saisi est inséré tel quel, jamais interprété.
 *  Auteur     : Claude Marcel
 *  Version    : 2.0
 *  Date       : 2026-10-16
 *  Dépendances: docx, plan-export.ts, i18n
 * =============================================================
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  HeightRule,
  LevelFormat,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type ISectionOptions,
  type ITableCellBorders,
} from "docx";

import { interpolate } from "@/i18n";
import type {
  ExportBar,
  ExportGantt,
  ExportLine,
  ExportParagraph,
  ExportPerspective,
  ExportSection,
  ExportTrace,
  PlanExport,
} from "@/lib/strategy/plan-export";
import { getStrategyDictionary } from "@/i18n/strategy";

// ==================== VARIABLES GLOBALES ====================

const s = getStrategyDictionary();
const e = s.plan.export;
const a = s.action;

/** Couleurs de la charte (globals.css), sans « # » (format attendu par Word). */
const INK = "1E4D4A";
const INK_SOFT = "8FB3AE";
const INK_PALE = "DCE9E6";
const OCRE = "B8622F";
const OCRE_PALE = "F6E9DF";
const TEXT = "2A2520";
const MUTED = "6B6156";
const LINE = "E2D8C6";
const PAPER = "FAF6EF";
const WHITE = "FFFFFF";
const WARNING = "8A5A00";

/** Couleur d'en-tête de chaque case de la grille SWOT (forces, faiblesses, etc.). */
const SWOT_COLORS = ["2E6B47", OCRE, INK, "A1291F"];

const HEAD_FONT = "Georgia";
const BODY_FONT = "Calibri";

/** Page A4 en vingtièmes de point, marges (2 cm, 1,6 cm en paysage) et largeurs utiles. */
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1134;
const MARGIN_LANDSCAPE = 907;
const WIDTH = A4.width - 2 * MARGIN;
const WIDTH_LANDSCAPE = A4.height - 2 * MARGIN_LANDSCAPE;

/** Largeur des libellés du Gantt. */
const GANTT_LABEL_WIDTH = 3400;

/** Référence de la liste à puces déclarée dans le document. */
const BULLETS = "puces";

const NONE = { style: BorderStyle.NONE, size: 0, color: WHITE };
const THIN = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const THIN_BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

// ==================== FONCTIONS UTILITAIRES ====================

type RunOptions = {
  size?: number;
  color?: string;
  italics?: boolean;
  bold?: boolean;
  font?: string;
};

/** Fond uni d'une cellule ou d'un paragraphe. */
function fill(color: string) {
  return { type: ShadingType.CLEAR, color: "auto", fill: color };
}

/** Morceau de texte. */
function run(text: string, options: RunOptions = {}): TextRun {
  return new TextRun({ text, ...options });
}

/** Première lettre en majuscule (libellés de précisions : « cible » → « Cible »). */
function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);
}

/** Paragraphe atténué en italique (section vide, note). */
function note(text: string): Paragraph {
  return new Paragraph({ children: [run(text, { italics: true, color: MUTED, size: 18 })] });
}

/** Repère « § n » cité par l'annexe de traçabilité. */
function marker(no: number): TextRun {
  return run(`§ ${no}   `, { size: 15, color: INK_SOFT, bold: true });
}

/**
 * Titre de niveau 1 : le préfixe (« 3. », « Annexe B ») en ocre, le reste à l'encre.
 * @param text      - Titre complet
 * @param pageBreak - Vrai pour commencer une nouvelle page
 */
function heading(text: string, pageBreak = false): Paragraph {
  const match = /^(\d+\.|Annexe \p{Lu})(.*)$/u.exec(text);
  const children = match
    ? [run(match[1], { color: OCRE }), run(match[2], { color: INK })]
    : [run(text, { color: INK })];
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: pageBreak,
    keepNext: true,
    children,
  });
}

/** Titre de niveau 2 (perspective, vue d'ensemble). */
function subheading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    children: [run(text, { color: INK })],
  });
}

/**
 * Cellule de tableau simple.
 * @param children - Paragraphes de la cellule
 * @param options  - Largeur, fond, bordures et marges
 */
function cell(children: Paragraph[], options: {
  width?: number;
  color?: string;
  borders?: ITableCellBorders;
  columnSpan?: number;
  margins?: number;
} = {}): TableCell {
  const margin = options.margins ?? 100;
  return new TableCell({
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    shading: options.color ? fill(options.color) : undefined,
    borders: options.borders ?? THIN_BORDERS,
    columnSpan: options.columnSpan,
    margins: { top: margin / 2, bottom: margin / 2, left: margin, right: margin },
    children,
  });
}

// ==================== PARAGRAPHES DU PLAN ====================

/**
 * Précisions d'une ligne (« Cible  80 % »), une par ligne, en retrait sous le texte.
 * @param line   - Ligne mise en page
 * @param indent - Retrait gauche (aligné sur le texte des puces)
 * @param size   - Taille du texte, en demi-points
 */
function detailParagraph(line: ExportLine, indent: number, size: number): Paragraph[] {
  if (line.details.length === 0) return [];
  return [new Paragraph({
    indent: { left: indent },
    spacing: { before: 20, after: 100, line: 260 },
    children: line.details.flatMap((detail, index) => [
      new TextRun({
        text: `${capitalize(detail.label)}  `,
        bold: true,
        color: INK,
        size: size - 2,
        break: index > 0 ? 1 : undefined,
      }),
      run(detail.value, { color: MUTED, size: size - 1 }),
    ]),
  })];
}

/**
 * Puces d'une liste, chacune suivie de ses précisions.
 * @param items - Lignes de la liste
 * @param size  - Taille du texte, en demi-points
 */
function bulletParagraphs(items: ExportLine[], size = 21): Paragraph[] {
  return items.flatMap((item) => [
    new Paragraph({
      numbering: { reference: BULLETS, level: 0 },
      spacing: { after: item.details.length > 0 ? 0 : 60 },
      children: [run(item.text, { size })],
    }),
    ...detailParagraph(item, 360, size),
  ]);
}

/**
 * Paragraphe du plan : titre de liste ou libellé de tête, texte justifié, puces et précisions.
 * @param paragraph - Paragraphe numéroté de l'export
 * @param boxed     - Vrai dans un encadré (libellé en petites capitales)
 */
function paragraphContent(paragraph: ExportParagraph, boxed: boolean): Paragraph[] {
  const { title, lines, items } = paragraph.layout;
  const blocks: Paragraph[] = [];
  let numbered = false;
  /** Repère « § n » placé une seule fois, devant le premier élément. */
  const lead = () => {
    if (numbered) return [];
    numbered = true;
    return [marker(paragraph.no)];
  };

  if (title) {
    blocks.push(new Paragraph({
      keepNext: true,
      spacing: { before: 120, after: 80 },
      children: [...lead(), run(title, { font: HEAD_FONT, bold: true, color: INK, size: 23 })],
    }));
  }
  for (const line of lines) {
    if (line.label) {
      blocks.push(new Paragraph({
        keepNext: true,
        spacing: { before: 60, after: 40 },
        children: [
          ...lead(),
          boxed
            ? new TextRun({ text: line.label.toUpperCase(), bold: true, color: INK, size: 16,
              characterSpacing: 30 })
            : run(line.label, { font: HEAD_FONT, bold: true, color: INK, size: 22 }),
        ],
      }));
    }
    blocks.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: line.details.length > 0 ? 0 : 120 },
      children: [
        ...lead(),
        boxed ? run(line.text, { font: HEAD_FONT, italics: true, size: 22 }) : run(line.text),
      ],
    }));
    blocks.push(...detailParagraph(line, 0, 21));
  }
  if (items.length > 0) {
    if (!numbered) blocks.push(new Paragraph({ keepNext: true, children: lead() }));
    blocks.push(...bulletParagraphs(items));
  }
  return blocks;
}

/**
 * Paragraphe placé dans un encadré coloré (vision, mission, énoncé, renoncements).
 * @param paragraph - Paragraphe de l'export (ton « highlight » ou « caution »)
 */
function boxedParagraph(paragraph: ExportParagraph): (Paragraph | Table)[] {
  const caution = paragraph.tone === "caution";
  const accent = caution ? OCRE : INK;
  return [
    new Table({
      width: { size: WIDTH, type: WidthType.DXA },
      columnWidths: [WIDTH],
      rows: [new TableRow({
        cantSplit: !caution,
        children: [cell(paragraphContent(paragraph, !caution), {
          width: WIDTH,
          color: caution ? OCRE_PALE : INK_PALE,
          borders: { ...NO_BORDERS, left: { style: BorderStyle.SINGLE, size: 24, color: accent } },
          margins: 240,
        })],
      })],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];
}

/**
 * Grille SWOT 2 × 2 : chaque case reprend un paragraphe (son « § n » reste cité).
 * @param paragraphs - Paragraphes Forces, Faiblesses, Opportunités et Menaces
 * @param labels     - Libellés SWOT, dans l'ordre des couleurs
 */
function swotGrid(paragraphs: ExportParagraph[], labels: string[]): (Paragraph | Table)[] {
  const half = WIDTH / 2;
  const rows: TableRow[] = [];
  for (let index = 0; index < paragraphs.length; index += 2) {
    const pair = paragraphs.slice(index, index + 2);
    const color = (p: ExportParagraph) => SWOT_COLORS[labels.indexOf(p.layout.title)] ?? INK;
    rows.push(new TableRow({
      cantSplit: true,
      children: pair.map((p) => cell([new Paragraph({ children: [
        run(`§ ${p.no}   `, { size: 15, color: WHITE }),
        run(p.layout.title.toUpperCase(), { bold: true, color: WHITE, size: 18 }),
      ] })], { width: half, color: color(p), borders: NO_BORDERS, margins: 140 })),
    }));
    rows.push(new TableRow({
      children: pair.map((p) => cell(bulletParagraphs(p.layout.items, 18), {
        width: half,
        color: PAPER,
        borders: { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 24, color: WHITE } },
        margins: 140,
      })),
    }));
  }
  return [
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: WIDTH, type: WidthType.DXA },
      columnWidths: [half, half],
      rows,
    }),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ];
}

/** Section du plan : titre, grille SWOT éventuelle, puis paragraphes et encadrés. */
function sectionBlocks(section: ExportSection, first: boolean): (Paragraph | Table)[] {
  if (section.paragraphs.length === 0) return [heading(section.title, first),
    note(e.emptySection)];
  const labels = Object.values(s.synthesis.keys) as string[];
  const isSwot = (p: ExportParagraph) => section.key === "situation"
    && labels.includes(p.layout.title) && p.layout.items.length > 0 && p.layout.lines.length === 0;
  const swot = section.paragraphs.filter(isSwot);
  const blocks: (Paragraph | Table)[] = [heading(section.title, first)];
  let swotDone = false;
  for (const paragraph of section.paragraphs) {
    if (swot.length >= 2 && isSwot(paragraph)) {
      if (!swotDone) blocks.push(...swotGrid(swot, labels));
      swotDone = true;
    } else if (paragraph.tone === "plain") {
      blocks.push(...paragraphContent(paragraph, false));
    } else {
      blocks.push(...boxedParagraph(paragraph));
    }
  }
  return blocks;
}

// ==================== COUVERTURE ET SOMMAIRE ====================

/** Couverture : bandeau pleine largeur, question stratégique, date. */
function coverPage(doc: PlanExport): (Paragraph | Table)[] {
  const inset = { left: MARGIN * 1.5, right: MARGIN * 1.5 };
  const band = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: A4.width, type: WidthType.DXA },
    columnWidths: [A4.width],
    rows: [new TableRow({
      height: { value: 7600, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        width: { size: A4.width, type: WidthType.DXA },
        shading: fill(INK),
        borders: NO_BORDERS,
        verticalAlign: VerticalAlign.BOTTOM,
        margins: { top: 1200, bottom: 900, left: inset.left, right: inset.right },
        children: [
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: doc.title.toUpperCase(), color: INK_SOFT, size: 20,
              bold: true, characterSpacing: 60 })],
          }),
          new Paragraph({
            spacing: { after: 320, line: 240 },
            children: [run(capitalize(doc.organisation), { font: HEAD_FONT, bold: true,
              color: WHITE, size: 56 })],
          }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 12, color: OCRE, space: 12 } },
            indent: { right: 7000 },
            children: [run(e.brand, { color: INK_PALE, size: 18 })],
          }),
        ],
      })],
    })],
  });
  const question = doc.question
    ? [
      new Paragraph({
        indent: inset,
        spacing: { before: 1000, after: 120 },
        children: [new TextRun({ text: e.question.toUpperCase(), bold: true, color: OCRE,
          size: 17, characterSpacing: 40 })],
      }),
      new Paragraph({
        indent: inset,
        border: { left: { style: BorderStyle.SINGLE, size: 24, color: OCRE, space: 14 } },
        spacing: { line: 320 },
        children: [run(doc.question, { font: HEAD_FONT, italics: true, size: 27, color: TEXT })],
      }),
    ]
    : [];
  return [
    band,
    ...question,
    new Paragraph({
      indent: inset,
      spacing: { before: doc.question ? 1600 : 3200 },
      children: [
        run(doc.exportedOn, { color: MUTED, size: 18 }),
        new TextRun({ text: e.preparedWith, color: MUTED, size: 18, break: 1 }),
      ],
    }),
  ];
}

/** Sommaire Word : entrées pré-remplies, numéros de page ajoutés par « Mettre à jour ». */
function contents(doc: PlanExport): (Paragraph | TableOfContents)[] {
  const titles = [
    ...doc.sections.map((section) => section.title),
    e.ganttTitle,
    e.scorecardTitle,
    e.annexTitle,
  ];
  return [
    new Paragraph({
      spacing: { after: 360 },
      children: [run(e.contents, { font: HEAD_FONT, bold: true, color: INK, size: 40 })],
    }),
    new TableOfContents(e.contents, {
      hyperlink: true,
      headingStyleRange: "1-1",
      cachedEntries: titles.map((title) => ({ title, level: 1 })),
    }),
  ];
}

// ==================== ANNEXES ====================

/**
 * Ligne du Gantt : libellé, puis une cellule par mois, colorée sur la durée de la barre.
 * @param bar   - Barre (colonne de départ et nombre de mois)
 * @param count - Nombre de mois affichés
 * @param owner - Responsable du chantier (vide pour une phase)
 * @param phase - Vrai pour une phase (couleur plus claire, libellé en retrait)
 */
function ganttRow(bar: ExportBar, count: number, owner: string, phase: boolean): TableRow {
  const monthWidth = Math.floor((WIDTH_LANDSCAPE - GANTT_LABEL_WIDTH) / count);
  const gap = { style: BorderStyle.SINGLE, size: 12, color: WHITE };
  const cells = Array.from({ length: count }, (_, index) => {
    const inside = index >= bar.start && index < bar.start + bar.span;
    return new TableCell({
      width: { size: monthWidth, type: WidthType.DXA },
      shading: inside ? fill(phase ? INK_SOFT : INK) : undefined,
      borders: { top: gap, bottom: gap, left: THIN, right: THIN },
      children: [new Paragraph({ children: [] })],
    });
  });
  const label = phase
    ? [run(bar.name, { size: 14, color: MUTED })]
    : [
      run(bar.name, { size: 15, bold: true, color: INK }),
      ...(owner ? [new TextRun({ text: owner, size: 13, color: MUTED, break: 1 })] : []),
    ];
  return new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: GANTT_LABEL_WIDTH, type: WidthType.DXA },
        borders: { ...NO_BORDERS, right: THIN, top: phase ? NONE : THIN },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 30, bottom: 30, left: phase ? 220 : 0, right: 100 },
        children: [new Paragraph({ spacing: { line: 220 }, children: label })],
      }),
      ...cells,
    ],
  });
}

/**
 * En-têtes du Gantt : une ligne d'années (fusionnées sur leurs mois), une ligne de mois.
 * @param gantt      - Vue Gantt de l'export
 * @param monthWidth - Largeur d'une colonne de mois
 */
function ganttHeader(gantt: ExportGantt, monthWidth: number): TableRow[] {
  const years: { year: string; span: number }[] = [];
  for (const month of gantt.months) {
    if (month.year || years.length === 0) years.push({ year: month.year, span: 0 });
    years[years.length - 1].span += 1;
  }
  const empty = () => new TableCell({
    width: { size: GANTT_LABEL_WIDTH, type: WidthType.DXA },
    borders: { ...NO_BORDERS, right: THIN },
    children: [new Paragraph({ children: [] })],
  });
  return [
    new TableRow({
      tableHeader: true,
      children: [empty(), ...years.map((group) => cell([new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run(group.year, { size: 15, bold: true, color: WHITE })],
      })], {
        width: monthWidth * group.span,
        color: INK,
        columnSpan: group.span,
        borders: { ...NO_BORDERS, left: { style: BorderStyle.SINGLE, size: 8, color: WHITE } },
        margins: 20,
      }))],
    }),
    new TableRow({
      tableHeader: true,
      children: [empty(), ...gantt.months.map((month) => cell([new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run(month.label, { size: 11, color: MUTED })],
      })], { width: monthWidth, color: PAPER, margins: 0 }))],
    }),
  ];
}

/** Annexe A : Gantt en tableau, libellés avec le responsable de chaque chantier. */
function ganttBlocks(gantt: ExportGantt): (Paragraph | Table)[] {
  if (gantt.rows.length === 0) return [heading(e.ganttTitle), note(e.ganttEmpty)];
  const count = gantt.months.length;
  const monthWidth = Math.floor((WIDTH_LANDSCAPE - GANTT_LABEL_WIDTH) / count);
  const rows = gantt.rows.flatMap((row) => [
    ganttRow(row, count, row.owner, false),
    ...row.phases.map((phase) => ganttRow(phase, count, "", true)),
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
      rows: [...ganttHeader(gantt, monthWidth), ...rows],
    }),
    ...truncated,
  ];
}

/** Case de la vue d'ensemble : indicateurs nommés et leur cible. */
function overviewCell(perspective: ExportPerspective, width: number): TableCell {
  const body = perspective.indicators.length === 0
    ? [note(e.scorecardEmpty)]
    : perspective.indicators.map((item) => new Paragraph({
      spacing: { after: 100, line: 250 },
      children: [
        run(item.name, { bold: true, size: 19 }),
        new TextRun({ text: `${a.target}  `, bold: true, color: INK, size: 16, break: 1 }),
        run(item.target || e.none, { color: MUTED, size: 17 }),
      ],
    }));
  return cell(body, {
    width,
    color: PAPER,
    borders: { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 24, color: WHITE } },
    margins: 160,
  });
}

/** Vue d'ensemble 2 × 2 du tableau de bord : une perspective par case. */
function scorecardOverview(scorecard: ExportPerspective[]): Table {
  const half = WIDTH / 2;
  const rows: TableRow[] = [];
  for (let index = 0; index < scorecard.length; index += 2) {
    const pair = scorecard.slice(index, index + 2);
    rows.push(new TableRow({
      cantSplit: true,
      children: pair.map((perspective) => cell([new Paragraph({
        children: [run(perspective.title.toUpperCase(), { bold: true, color: WHITE, size: 17 })],
      })], { width: half, color: INK, borders: NO_BORDERS, margins: 140 })),
    }));
    rows.push(new TableRow({
      cantSplit: true,
      children: pair.map((perspective) => overviewCell(perspective, half)),
    }));
  }
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: WIDTH, type: WidthType.DXA },
    columnWidths: [half, half],
    rows,
  });
}

/** Tableau détaillé d'une perspective : en-tête coloré, lignes alternées. */
function scorecardTable(perspective: ExportPerspective): Table {
  const widths = [1900, 2500, 1750, 1100, 1500, 888];
  const columns = [a.indicatorName, a.definition, a.target, a.frequency, a.owner, a.kind];
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: columns.map((label, index) => cell([new Paragraph({
          children: [run(label, { bold: true, color: WHITE, size: 16 })],
        })], { width: widths[index], color: INK, borders: NO_BORDERS })),
      }),
      ...perspective.indicators.map((item, row) => new TableRow({
        cantSplit: true,
        children: [item.name, item.definition, item.target, item.frequency, item.owner,
          item.kind].map((value, index) => cell([new Paragraph({
          spacing: { line: 240 },
          children: [run(value || e.none, { size: 17, bold: index === 0, color: TEXT })],
        })], {
          width: widths[index],
          color: row % 2 === 1 ? PAPER : undefined,
          borders: { ...NO_BORDERS, bottom: THIN },
        })),
      })),
    ],
  });
}

/** Annexe B : vue d'ensemble, puis un tableau détaillé par perspective. */
function scorecardBlocks(scorecard: ExportPerspective[]): (Paragraph | Table)[] {
  return [
    heading(e.scorecardTitle, true),
    subheading(e.overview),
    scorecardOverview(scorecard),
    subheading(e.details),
    ...scorecard.flatMap((perspective) => [
      new Paragraph({
        keepNext: true,
        spacing: { before: 240, after: 100 },
        children: [run(perspective.title, { font: HEAD_FONT, bold: true, color: INK, size: 22 })],
      }),
      ...(perspective.indicators.length === 0
        ? [note(e.scorecardEmpty)]
        : [scorecardTable(perspective)]),
    ]),
  ];
}

/** Annexe C : traçabilité, paragraphe par paragraphe. */
function annexBlocks(annex: ExportTrace[]): Paragraph[] {
  const body = annex.length === 0
    ? [note(s.plan.annexEmpty)]
    : annex.flatMap((row) => [
      new Paragraph({
        keepNext: true,
        spacing: { before: 160, after: 40 },
        children: [run(row.heading, { bold: true, color: INK, size: 18 })],
      }),
      ...row.sources.map((source) => new Paragraph({
        numbering: { reference: BULLETS, level: 0 },
        spacing: { after: 20, line: 240 },
        children: [run(source.label, { size: 16, color: source.found ? MUTED : WARNING })],
      })),
    ]);
  return [heading(e.annexTitle, true), note(s.plan.annexIntro), ...body];
}

// ==================== DOCUMENT ====================

/** En-tête des pages intérieures : titre du document et organisation, filet en dessous. */
function header(doc: PlanExport): Header {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
      children: [run(`${doc.title}  ·  ${capitalize(doc.organisation)}`, { size: 15,
        color: MUTED })],
    })],
  });
}

/**
 * Pied de page : marque à gauche, « Page X sur Y » à droite.
 * @param width - Largeur utile de la page (position du taquet de droite)
 */
function footer(width: number): Footer {
  return new Footer({
    children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: width }],
      children: [
        run(e.brand, { size: 15, color: INK_SOFT, bold: true }),
        new TextRun({
          size: 15,
          color: MUTED,
          children: [`\t${e.page} `, PageNumber.CURRENT, ` ${e.pageOf} `,
            PageNumber.TOTAL_PAGES],
        }),
      ],
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
  const headers = { default: header(doc) };
  const portrait = (children: ISectionOptions["children"]): ISectionOptions => ({
    properties: { page: { size: A4, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN,
      right: MARGIN, header: 567, footer: 567 } } },
    headers,
    footers: { default: footer(WIDTH) },
    children,
  });

  const file = new Document({
    creator: e.brand,
    title: `${doc.title} — ${doc.organisation}`,
    description: doc.question,
    numbering: {
      config: [{
        reference: BULLETS,
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 360, hanging: 240 } },
            run: { color: OCRE, bold: true },
          },
        }],
      }],
    },
    styles: {
      default: {
        document: {
          run: { font: BODY_FONT, size: 21, color: TEXT },
          paragraph: { spacing: { line: 276 } },
        },
        heading1: {
          run: { font: HEAD_FONT, size: 34, bold: true },
          paragraph: {
            spacing: { before: 480, after: 240 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 6 } },
          },
        },
        heading2: {
          run: { font: HEAD_FONT, size: 25, bold: true },
          paragraph: { spacing: { before: 280, after: 140 } },
        },
      },
      paragraphStyles: [{
        id: "TOC1",
        name: "toc 1",
        basedOn: "Normal",
        next: "Normal",
        run: { font: HEAD_FONT, size: 23, color: INK },
        paragraph: { spacing: { before: 60, after: 140 } },
      }],
    },
    sections: [
      {
        // Couverture : bandeau collé aux bords, sans en-tête ni pied de page
        properties: { page: { size: A4, margin: { top: 0, bottom: MARGIN, left: 0, right: 0 } } },
        children: coverPage(doc),
      },
      portrait([
        ...contents(doc),
        ...doc.sections.flatMap((section, index) => sectionBlocks(section, index === 0)),
      ]),
      {
        properties: {
          page: {
            size: { ...A4, orientation: PageOrientation.LANDSCAPE },
            margin: { top: MARGIN_LANDSCAPE, bottom: MARGIN_LANDSCAPE,
              left: MARGIN_LANDSCAPE, right: MARGIN_LANDSCAPE, header: 454, footer: 454 },
          },
        },
        headers,
        footers: { default: footer(WIDTH_LANDSCAPE) },
        children: ganttBlocks(doc.gantt),
      },
      portrait([...scorecardBlocks(doc.scorecard), ...annexBlocks(doc.annex)]),
    ],
  });
  return new Uint8Array(await Packer.toBuffer(file));
}
