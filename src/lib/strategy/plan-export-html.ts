/**
 * =============================================================
 *  Fichier    : plan-export-html.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit HTML du plan stratégique à imprimer en PDF par Chromium (S8b) :
 *               A4 portrait, page de titre, sommaire, huit sections (rang du paragraphe en
 *               marge, cité par l'annexe), feuille de route en Gantt sur une page paysage,
 *               tableau de bord équilibré et annexe de traçabilité. Toutes les valeurs
 *               saisies sont échappées ; le document n'a ni script ni ressource externe.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/pdf/render.ts (échappement, PdfFonts), plan-export.ts, i18n
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import { escapeCssString, escapeHtml, type PdfFonts } from "@/lib/pdf/render";
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

/** Couleurs de la charte (globals.css) ; l'encre douce est foncée pour rester visible. */
const INK = "#1e4d4a";
const INK_SOFT = "#8fb3ae";
const TEXT = "#2a2520";
const MUTED = "#6b6156";
const LINE = "#e2d8c6";

// ==================== STYLES ====================

/** Déclarations @font-face (police Literata intégrée), vides sans polices. */
function fontFaces(fonts: PdfFonts): string {
  if (!fonts) return "";
  const face = (style: string, data: string) =>
    `@font-face { font-family: "Literata"; font-style: ${style}; font-weight: 200 900;` +
    ` src: url(data:font/woff2;base64,${data}) format("woff2"); }`;
  return face("normal", fonts.normal) + "\n" + face("italic", fonts.italic);
}

/**
 * Feuille de style : A4 portrait, pied de page numéroté, page nommée « paysage » pour le
 * Gantt (Chromium applique les pages nommées).
 * @param footer - Texte du pied de page
 * @param fonts  - Polices base64, ou null (tests)
 */
function styles(footer: string, fonts: PdfFonts): string {
  const bottom = `@bottom-center {
    content: "${escapeCssString(footer)}  —  " counter(page) " / " counter(pages);
    font-family: "Literata", serif;
    font-size: 7.5pt;
    color: ${MUTED};
  }`;
  return `${fontFaces(fonts)}
@page { size: A4; margin: 20mm 20mm 22mm 26mm; ${bottom} }
@page paysage { size: A4 landscape; margin: 16mm 14mm 18mm; ${bottom} }
html { font-family: "Literata", serif; font-size: 10.5pt; line-height: 1.5; color: ${TEXT}; }
body { margin: 0; }
h1, h2, h3 { color: ${INK}; line-height: 1.25; break-after: avoid; }
.titre { break-after: page; padding-top: 32%; }
.titre .kicker { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.08em;
  color: ${MUTED}; margin: 0 0 10pt; }
.titre h1 { font-size: 26pt; margin: 0 0 18pt; }
.titre .question-label { font-size: 9pt; color: ${MUTED}; margin: 24pt 0 2pt; }
.titre .question { font-size: 12pt; font-style: italic; margin: 0; }
.titre .meta { font-size: 9pt; color: ${MUTED}; margin: 48pt 0 0; }
.sommaire { break-after: page; }
.sommaire h2 { font-size: 15pt; }
.sommaire ol { list-style: none; padding: 0; }
.sommaire li { margin: 0 0 6pt; }
.sommaire a { color: inherit; text-decoration: none; }
.section { break-before: page; }
.section + .section { break-before: auto; margin-top: 18pt; }
.section h2 { font-size: 15pt; margin: 0 0 10pt; }
.para { position: relative; margin: 0 0 8pt; white-space: pre-line; text-align: justify;
  hyphens: auto; orphans: 2; widows: 2; }
.para .no { position: absolute; left: -15mm; width: 12mm; text-align: right;
  font-size: 7.5pt; color: ${MUTED}; }
.vide { font-style: italic; color: ${MUTED}; }
.annexe { break-before: page; }
.annexe h2 { font-size: 15pt; margin: 0 0 10pt; }
.annexe h3 { font-size: 11pt; margin: 14pt 0 4pt; }
.gantt { page: paysage; }
table { border-collapse: collapse; width: 100%; }
.gantt table { table-layout: fixed; font-size: 7pt; }
.gantt th, .gantt td { border-left: 0.4pt solid ${LINE}; padding: 1.5pt 0; height: 11pt; }
.gantt th.mois { font-weight: normal; color: ${MUTED}; text-align: center; vertical-align: bottom; }
.gantt th.mois b { display: block; color: ${TEXT}; }
.gantt td.nom { border-left: none; padding-right: 4pt; overflow: hidden; white-space: nowrap;
  text-overflow: ellipsis; font-weight: bold; }
.gantt td.nom.phase { font-weight: normal; padding-left: 8pt; color: ${MUTED}; }
.gantt .barre { display: block; height: 8pt; border-radius: 1.5pt; background: ${INK};
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.gantt .barre.phase { height: 5pt; background: ${INK_SOFT}; }
.gantt tr { break-inside: avoid; }
.periodes { font-size: 8pt; color: ${MUTED}; columns: 2; margin-top: 10pt; padding-left: 12pt; }
.bsc table, .annexe dl { font-size: 8.5pt; }
.bsc th, .bsc td { border: 0.4pt solid ${LINE}; padding: 3pt 4pt; text-align: left;
  vertical-align: top; }
.bsc th { background: #faf6ef; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.bsc tr { break-inside: avoid; }
.trace dt { font-weight: bold; margin: 8pt 0 2pt; break-after: avoid; }
.trace dd { margin: 0 0 0 12pt; color: ${MUTED}; }
.trace .introuvable { color: #9a5b00; }
.note { font-size: 8.5pt; color: ${MUTED}; }`;
}

// ==================== PARTIES DU DOCUMENT ====================

/** Section du plan : titre puis paragraphes numérotés. */
function sectionHtml(section: ExportSection): string {
  const body = section.paragraphs.length === 0
    ? `<p class="vide">${escapeHtml(e.emptySection)}</p>`
    : section.paragraphs.map((paragraph) =>
      `<p class="para"><span class="no">§ ${paragraph.no}</span>${escapeHtml(paragraph.text)}</p>`)
      .join("\n");
  return `<section class="section" id="section-${section.key}">
<h2>${escapeHtml(section.title)}</h2>
${body}
</section>`;
}

/**
 * Ligne du Gantt : libellé, cellules vides, barre sur plusieurs colonnes, cellules vides.
 * @param bar   - Barre (colonne de départ et nombre de mois)
 * @param count - Nombre de mois affichés
 * @param phase - Vrai pour une phase (barre plus fine)
 */
function ganttRow(bar: ExportBar, count: number, phase: boolean): string {
  const kind = phase ? " phase" : "";
  const before = "<td></td>".repeat(bar.start);
  const after = "<td></td>".repeat(count - bar.start - bar.span);
  return `<tr><td class="nom${kind}">${escapeHtml(bar.name)}</td>${before}` +
    `<td colspan="${bar.span}"><span class="barre${kind}"></span></td>${after}</tr>`;
}

/** Annexe A : feuille de route en Gantt, avec les périodes en toutes lettres. */
function ganttHtml(gantt: ExportGantt): string {
  if (gantt.rows.length === 0) {
    return `<section class="annexe gantt" id="gantt">
<h2>${escapeHtml(e.ganttTitle)}</h2>
<p class="vide">${escapeHtml(e.ganttEmpty)}</p>
</section>`;
  }
  const count = gantt.months.length;
  const head = gantt.months.map((month) =>
    `<th class="mois">${month.year ? `<b>${month.year}</b>` : ""}${escapeHtml(month.label)}</th>`)
    .join("");
  const rows = gantt.rows.map((row) =>
    [ganttRow(row, count, false), ...row.phases.map((phase) => ganttRow(phase, count, true))]
      .join("\n"))
    .join("\n");
  const periods = gantt.rows.map((row) => {
    const owner = row.owner ? ` (${escapeHtml(row.owner)})` : "";
    return `<li>${escapeHtml(row.period)}${owner}</li>`;
  }).join("\n");
  const truncated = gantt.truncated
    ? `<p class="note">${escapeHtml(interpolate(a.ganttTruncated, { max: String(count) }))}</p>`
    : "";
  return `<section class="annexe gantt" id="gantt">
<h2>${escapeHtml(e.ganttTitle)}</h2>
<table>
<colgroup><col style="width: 22%">${"<col>".repeat(count)}</colgroup>
<thead><tr><th></th>${head}</tr></thead>
<tbody>
${rows}
</tbody>
</table>
${truncated}
<ul class="periodes">
${periods}
</ul>
</section>`;
}

/** Annexe B : tableau de bord équilibré, un tableau par perspective. */
function scorecardHtml(scorecard: ExportPerspective[]): string {
  const columns = [a.indicatorName, a.definition, a.target, a.frequency, a.owner, a.kind];
  const head = columns.map((label) => `<th>${escapeHtml(label)}</th>`).join("");
  const blocks = scorecard.map((perspective) => {
    const body = perspective.indicators.length === 0
      ? `<p class="vide">${escapeHtml(e.scorecardEmpty)}</p>`
      : `<table><thead><tr>${head}</tr></thead><tbody>
${perspective.indicators.map((item) => `<tr>${
        [item.name, item.definition, item.target, item.frequency, item.owner, item.kind]
          .map((value) => `<td>${escapeHtml(value || e.none)}</td>`).join("")
      }</tr>`).join("\n")}
</tbody></table>`;
    return `<h3>${escapeHtml(perspective.title)}</h3>\n${body}`;
  }).join("\n");
  return `<section class="annexe bsc" id="tableau-de-bord">
<h2>${escapeHtml(e.scorecardTitle)}</h2>
${blocks}
</section>`;
}

/** Annexe C : traçabilité, paragraphe par paragraphe. */
function annexHtml(annex: ExportTrace[]): string {
  const body = annex.length === 0
    ? `<p class="vide">${escapeHtml(s.plan.annexEmpty)}</p>`
    : `<dl class="trace">
${annex.map((row) => `<dt>${escapeHtml(row.heading)}</dt>\n${row.sources.map((source) =>
    `<dd${source.found ? "" : " class=\"introuvable\""}>${escapeHtml(source.label)}</dd>`)
    .join("\n")}`).join("\n")}
</dl>`;
  return `<section class="annexe" id="tracabilite">
<h2>${escapeHtml(e.annexTitle)}</h2>
<p class="note">${escapeHtml(s.plan.annexIntro)}</p>
${body}
</section>`;
}

// ==================== GABARIT ====================

/**
 * Construit le document HTML complet du plan à imprimer.
 * @param doc   - Document d'export (plan-export.ts)
 * @param fonts - Polices base64, ou null (tests)
 * @returns HTML autonome, sans script ni ressource externe
 */
export function buildPlanHtml(doc: PlanExport, fonts: PdfFonts): string {
  const question = doc.question
    ? `<p class="question-label">${escapeHtml(e.question)}</p>
<p class="question">${escapeHtml(doc.question)}</p>`
    : "";
  const toc = [
    ...doc.sections.map((section) => [`section-${section.key}`, section.title]),
    ["gantt", e.ganttTitle],
    ["tableau-de-bord", e.scorecardTitle],
    ["tracabilite", e.annexTitle],
  ].map(([id, title]) => `<li><a href="#${id}">${escapeHtml(title)}</a></li>`).join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(`${doc.title} — ${doc.organisation}`)}</title>
<style>${styles(doc.footer, fonts)}</style>
</head>
<body>
<section class="titre">
<p class="kicker">${escapeHtml(doc.title)}</p>
<h1>${escapeHtml(doc.organisation)}</h1>
${question}
<p class="meta">${escapeHtml(doc.exportedOn)}<br>${escapeHtml(e.preparedWith)}</p>
</section>
<nav class="sommaire">
<h2>${escapeHtml(e.contents)}</h2>
<ol>
${toc}
</ol>
</nav>
${doc.sections.map(sectionHtml).join("\n")}
${ganttHtml(doc.gantt)}
${scorecardHtml(doc.scorecard)}
${annexHtml(doc.annex)}
</body>
</html>`;
}
