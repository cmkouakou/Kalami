/**
 * =============================================================
 *  Fichier    : plan-export-html.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit HTML du plan stratégique à imprimer en PDF par Chromium, aligné sur
 *               l'export Word : couverture à bandeau, sommaire, titres numérotés, listes à
 *               puces et précisions, encadrés (vision, mission, énoncé, renoncements),
 *               grille SWOT, feuille de route en Gantt (page paysage), tableau de bord
 *               (vue d'ensemble 2 × 2 et détail) et annexe de traçabilité. En-tête et pied
 *               « Page X sur Y ». Toutes les valeurs saisies sont échappées ; le document
 *               n'a ni script ni ressource externe.
 *  Auteur     : Claude Marcel
 *  Version    : 2.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/pdf/render.ts (échappement, PdfFonts), plan-export.ts, i18n
 * =============================================================
 */

import { interpolate } from "@/i18n";
import { escapeCssString, escapeHtml, type PdfFonts } from "@/lib/pdf/render";
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

/** Couleurs de la charte (globals.css), identiques à l'export Word. */
const INK = "#1e4d4a";
const INK_SOFT = "#8fb3ae";
const INK_PALE = "#dce9e6";
const OCRE = "#b8622f";
const OCRE_PALE = "#f6e9df";
const TEXT = "#2a2520";
const MUTED = "#6b6156";
const LINE = "#e2d8c6";
const PAPER = "#faf6ef";
const WARNING = "#8a5a00";

/** Couleur d'en-tête de chaque case de la grille SWOT (forces, faiblesses, etc.). */
const SWOT_COLORS = ["#2e6b47", OCRE, INK, "#a1291f"];

/** Raccourci d'échappement. */
const h = escapeHtml;

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
 * Feuille de style : couverture sans marge, A4 portrait avec en-tête et pied « Page X sur Y »,
 * page nommée « paysage » pour le Gantt (Chromium applique les pages nommées).
 * @param doc   - Document d'export (titre, organisation)
 * @param fonts - Polices base64, ou null (tests)
 */
function styles(doc: PlanExport, fonts: PdfFonts): string {
  const running = `${doc.title}  ·  ${capitalize(doc.organisation)}`;
  const margins = `
  @top-right { content: "${escapeCssString(running)}"; font-size: 7.5pt; color: ${MUTED};
    vertical-align: bottom; padding-bottom: 3mm; border-bottom: 0.5pt solid ${LINE}; }
  @bottom-left { content: "${escapeCssString(e.brand)}"; font-size: 7.5pt; font-weight: bold;
    color: ${INK_SOFT}; }
  @bottom-right { content: "${escapeCssString(e.page)} " counter(page)
    " ${escapeCssString(e.pageOf)} " counter(pages); font-size: 7.5pt; color: ${MUTED}; }`;
  return `${fontFaces(fonts)}
@page { size: A4; margin: 22mm 20mm 20mm; ${margins} }
@page couverture { size: A4; margin: 0; }
@page paysage { size: A4 landscape; margin: 18mm 16mm 16mm; ${margins} }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
html { font-family: "Literata", Georgia, serif; font-size: 10pt; line-height: 1.5;
  color: ${TEXT}; }
body { margin: 0; }
h1, h2, h3, h4 { color: ${INK}; line-height: 1.25; break-after: avoid; }
p { margin: 0; }

/* ==================== COUVERTURE ==================== */
.couverture { page: couverture; break-after: page; height: 297mm; }
.bandeau { background: ${INK}; height: 135mm; padding: 0 30mm 16mm; display: flex;
  flex-direction: column; justify-content: flex-end; }
.bandeau .kicker { font-size: 10pt; font-weight: bold; letter-spacing: 0.3em;
  text-transform: uppercase; color: ${INK_SOFT}; margin-bottom: 8pt; }
.bandeau h1 { font-size: 28pt; color: #fff; margin: 0 0 16pt; }
.bandeau .marque { border-top: 1.5pt solid ${OCRE}; padding-top: 6pt; width: 45mm;
  font-size: 9pt; color: ${INK_PALE}; }
.couverture .question { margin: 50pt 30mm 0; }
.couverture .question-label { font-size: 8.5pt; font-weight: bold; letter-spacing: 0.2em;
  text-transform: uppercase; color: ${OCRE}; margin-bottom: 6pt; }
.couverture blockquote { margin: 0; border-left: 3pt solid ${OCRE}; padding-left: 10pt;
  font-size: 13.5pt; font-style: italic; line-height: 1.45; }
.couverture .meta { margin: 70pt 30mm 0; font-size: 9pt; color: ${MUTED}; }

/* ==================== SOMMAIRE ==================== */
.sommaire { break-after: page; }
.sommaire h2 { font-size: 20pt; margin: 0 0 18pt; }
.sommaire ol { list-style: none; padding: 0; margin: 0; }
.sommaire li { font-size: 11.5pt; color: ${INK}; margin: 0 0 9pt; padding-bottom: 6pt;
  border-bottom: 0.5pt dotted ${LINE}; }
.sommaire a { color: inherit; text-decoration: none; }

/* ==================== TITRES ==================== */
h2.titre { font-size: 17pt; margin: 26pt 0 12pt; padding-bottom: 4pt;
  border-bottom: 0.75pt solid ${LINE}; }
h2.titre .prefixe { color: ${OCRE}; }
h2.titre.saut { break-before: page; margin-top: 0; }
h3 { font-size: 12.5pt; margin: 16pt 0 8pt; }

/* ==================== PARAGRAPHES ==================== */
.para { margin: 0 0 10pt; }
.no { font-size: 7.5pt; font-weight: bold; color: ${INK_SOFT}; margin-right: 6pt; }
.titre-liste { font-size: 11.5pt; font-weight: bold; color: ${INK}; margin: 12pt 0 4pt;
  break-after: avoid; }
.libelle { font-weight: bold; color: ${INK}; margin: 6pt 0 2pt; break-after: avoid; }
.texte { text-align: justify; hyphens: auto; orphans: 2; widows: 2; }
.details { margin: 2pt 0 6pt; font-size: 9pt; line-height: 1.4; }
.details div { break-inside: avoid; }
.details b { color: ${INK}; margin-right: 5pt; }
.details span { color: ${MUTED}; }
ul.puces { margin: 4pt 0 0; padding-left: 16pt; }
ul.puces li { margin: 0 0 5pt; break-inside: avoid; }
ul.puces li::marker { color: ${OCRE}; font-weight: bold; }
.vide { font-style: italic; color: ${MUTED}; font-size: 9pt; }

/* ==================== ENCADRÉS ==================== */
.encadre { background: ${INK_PALE}; border-left: 3pt solid ${INK}; padding: 12pt 14pt;
  margin: 6pt 0 12pt; break-inside: avoid; }
.encadre > :first-child { margin-top: 0; }
.encadre .libelle { font-size: 8pt; letter-spacing: 0.15em; text-transform: uppercase;
  margin-top: 0; }
.encadre .texte { font-style: italic; font-size: 11pt; text-align: left; }
.encadre.reserve { background: ${OCRE_PALE}; border-left-color: ${OCRE};
  break-inside: auto; }
.encadre.reserve .texte { font-style: normal; font-size: 10pt; }

/* ==================== GRILLE SWOT ==================== */
.swot { display: grid; grid-template-columns: 1fr 1fr; gap: 4pt; margin: 6pt 0 14pt; }
.swot .case { background: ${PAPER}; break-inside: avoid; }
.swot .entete { color: #fff; font-weight: bold; font-size: 9pt; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 5pt 9pt; }
.swot .entete .no { color: #fff; }
.swot ul.puces { font-size: 8.5pt; padding: 0 9pt 6pt 24pt; }

/* ==================== GANTT ==================== */
.gantt { page: paysage; break-before: page; }
.gantt h2.titre { margin-top: 0; }
.gantt table { border-collapse: collapse; width: 100%; table-layout: fixed; }
.gantt td, .gantt th { padding: 0; }
.gantt th.annee { background: ${INK}; color: #fff; font-size: 7.5pt; padding: 2pt 0;
  border-left: 1pt solid #fff; }
.gantt th.mois { background: ${PAPER}; color: ${MUTED}; font-size: 5.5pt; font-weight: normal;
  padding: 2pt 0; border: 0.4pt solid ${LINE}; }
.gantt td.mois { border-left: 0.4pt solid ${LINE}; border-right: 0.4pt solid ${LINE};
  height: 15pt; padding: 2pt 0; }
.gantt td.mois.plein { background-clip: content-box; background-color: ${INK}; }
.gantt td.mois.plein.phase { background-color: ${INK_SOFT}; }
.gantt td.nom { font-size: 7.5pt; line-height: 1.25; padding: 2pt 6pt 2pt 0;
  border-right: 0.4pt solid ${LINE}; vertical-align: middle; }
.gantt tr.chantier td.nom { border-top: 0.4pt solid ${LINE}; font-weight: bold;
  color: ${INK}; }
.gantt tr.chantier td.nom small { display: block; font-weight: normal; color: ${MUTED};
  font-size: 6.5pt; }
.gantt tr.phase td.nom { color: ${MUTED}; padding-left: 10pt; font-size: 7pt; }
.gantt tr { break-inside: avoid; }
.note { font-size: 8.5pt; color: ${MUTED}; font-style: italic; }

/* ==================== TABLEAU DE BORD ==================== */
.bsc { break-before: page; }
.bsc h2.titre { margin-top: 0; }
.apercu { display: grid; grid-template-columns: 1fr 1fr; gap: 4pt; }
.apercu .case { background: ${PAPER}; break-inside: avoid; }
.apercu .entete { background: ${INK}; color: #fff; font-weight: bold; font-size: 8.5pt;
  letter-spacing: 0.05em; text-transform: uppercase; padding: 5pt 9pt; }
.apercu .indicateur { padding: 6pt 9pt 2pt; font-size: 9pt; line-height: 1.35; }
.apercu .indicateur b { display: block; }
.apercu .indicateur span { color: ${MUTED}; font-size: 8.5pt; }
.apercu .indicateur span b { display: inline; color: ${INK}; margin-right: 4pt; }
h4 { font-size: 11pt; margin: 14pt 0 6pt; }
table.detail { border-collapse: collapse; width: 100%; font-size: 8.5pt; line-height: 1.35; }
table.detail th { background: ${INK}; color: #fff; text-align: left; padding: 4pt 5pt; }
table.detail td { padding: 4pt 5pt; vertical-align: top; border-bottom: 0.5pt solid ${LINE}; }
table.detail td:first-child { font-weight: bold; }
table.detail tr:nth-child(even) td { background: ${PAPER}; }
table.detail tr { break-inside: avoid; }

/* ==================== TRAÇABILITÉ ==================== */
.trace { break-before: page; }
.trace h2.titre { margin-top: 0; }
.trace .intro { font-size: 9pt; font-style: italic; color: ${MUTED}; margin-bottom: 8pt; }
.trace h5 { font-size: 9pt; color: ${INK}; margin: 10pt 0 2pt; break-after: avoid; }
.trace ul.puces { font-size: 8pt; color: ${MUTED}; margin-top: 0; }
.trace ul.puces li { margin-bottom: 2pt; }
.trace .introuvable { color: ${WARNING}; }`;
}

// ==================== FONCTIONS UTILITAIRES ====================

/** Première lettre en majuscule (libellés de précisions : « cible » → « Cible »). */
function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);
}

/** Repère « § n » cité par l'annexe de traçabilité. */
function marker(no: number): string {
  return `<span class="no">§ ${no}</span>`;
}

/**
 * Titre de niveau 2 : le préfixe (« 3. », « Annexe B ») en ocre, le reste à l'encre.
 * @param text - Titre complet
 * @param id   - Ancre du sommaire
 * @param page - Vrai pour commencer une nouvelle page
 */
function heading(text: string, id: string, page = false): string {
  const match = /^(\d+\.|Annexe \p{Lu})(.*)$/u.exec(text);
  const body = match
    ? `<span class="prefixe">${h(match[1])}</span>${h(match[2])}`
    : h(text);
  return `<h2 class="titre${page ? " saut" : ""}" id="${id}">${body}</h2>`;
}

// ==================== PARAGRAPHES DU PLAN ====================

/** Précisions d'une ligne (« Cible  80 % »), une par ligne. */
function detailsHtml(line: ExportLine): string {
  if (line.details.length === 0) return "";
  const rows = line.details.map((detail) =>
    `<div><b>${h(capitalize(detail.label))}</b><span>${h(detail.value)}</span></div>`);
  return `<div class="details">${rows.join("")}</div>`;
}

/** Liste à puces, chaque puce suivie de ses précisions. */
function bulletsHtml(items: ExportLine[]): string {
  if (items.length === 0) return "";
  const rows = items.map((item) => `<li>${h(item.text)}${detailsHtml(item)}</li>`);
  return `<ul class="puces">${rows.join("")}</ul>`;
}

/**
 * Contenu d'un paragraphe : titre de liste, lignes (libellé, texte, précisions) et puces.
 * Le repère « § n » est placé une seule fois, devant le premier élément.
 * @param paragraph - Paragraphe numéroté de l'export
 */
function paragraphContent(paragraph: ExportParagraph): string {
  const { title, lines, items } = paragraph.layout;
  let numbered = false;
  const lead = () => {
    if (numbered) return "";
    numbered = true;
    return marker(paragraph.no);
  };
  const parts: string[] = [];
  if (title) parts.push(`<p class="titre-liste">${lead()}${h(title)}</p>`);
  for (const line of lines) {
    if (line.label) parts.push(`<p class="libelle">${lead()}${h(line.label)}</p>`);
    parts.push(`<p class="texte">${lead()}${h(line.text)}</p>${detailsHtml(line)}`);
  }
  if (items.length > 0) parts.push(`${numbered ? "" : `<p>${lead()}</p>`}${bulletsHtml(items)}`);
  return parts.join("\n");
}

/** Paragraphe simple, ou encadré pour la vision, la mission, l'énoncé et les renoncements. */
function paragraphHtml(paragraph: ExportParagraph): string {
  if (paragraph.tone === "plain") return `<div class="para">${paragraphContent(paragraph)}</div>`;
  const kind = paragraph.tone === "caution" ? " reserve" : "";
  return `<div class="encadre${kind}">${paragraphContent(paragraph)}</div>`;
}

/**
 * Grille SWOT 2 × 2 : chaque case reprend un paragraphe (son « § n » reste cité).
 * @param paragraphs - Paragraphes Forces, Faiblesses, Opportunités et Menaces
 * @param labels     - Libellés SWOT, dans l'ordre des couleurs
 */
function swotHtml(paragraphs: ExportParagraph[], labels: string[]): string {
  const cases = paragraphs.map((p) => {
    const color = SWOT_COLORS[labels.indexOf(p.layout.title)] ?? INK;
    return `<div class="case"><div class="entete" style="background: ${color}">` +
      `${marker(p.no)}${h(p.layout.title)}</div>${bulletsHtml(p.layout.items)}</div>`;
  });
  return `<div class="swot">${cases.join("\n")}</div>`;
}

/** Section du plan : titre, grille SWOT éventuelle, puis paragraphes et encadrés. */
function sectionHtml(section: ExportSection, first: boolean): string {
  const title = heading(section.title, `section-${section.key}`, first);
  if (section.paragraphs.length === 0) {
    return `${title}\n<p class="vide">${h(e.emptySection)}</p>`;
  }
  const labels = Object.values(s.synthesis.keys) as string[];
  const isSwot = (p: ExportParagraph) => section.key === "situation"
    && labels.includes(p.layout.title) && p.layout.items.length > 0 && p.layout.lines.length === 0;
  const swot = section.paragraphs.filter(isSwot);
  const parts = [title];
  let swotDone = false;
  for (const paragraph of section.paragraphs) {
    if (swot.length >= 2 && isSwot(paragraph)) {
      if (!swotDone) parts.push(swotHtml(swot, labels));
      swotDone = true;
    } else {
      parts.push(paragraphHtml(paragraph));
    }
  }
  return `<section>\n${parts.join("\n")}\n</section>`;
}

// ==================== ANNEXES ====================

/**
 * Ligne du Gantt : libellé, puis une cellule par mois, colorée sur la durée de la barre.
 * @param bar   - Barre (colonne de départ et nombre de mois)
 * @param count - Nombre de mois affichés
 * @param owner - Responsable du chantier (vide pour une phase)
 * @param phase - Vrai pour une phase (couleur plus claire, libellé en retrait)
 */
function ganttRow(bar: ExportBar, count: number, owner: string, phase: boolean): string {
  const kind = phase ? "phase" : "chantier";
  const label = phase
    ? h(bar.name)
    : `${h(bar.name)}${owner ? `<small>${h(owner)}</small>` : ""}`;
  const cells = Array.from({ length: count }, (_, index) => {
    const inside = index >= bar.start && index < bar.start + bar.span;
    return `<td class="mois${inside ? ` plein ${kind}` : ""}"></td>`;
  });
  return `<tr class="${kind}"><td class="nom">${label}</td>${cells.join("")}</tr>`;
}

/** Annexe A : Gantt sur une page paysage, ligne des années puis ligne des mois. */
function ganttHtml(gantt: ExportGantt): string {
  const title = heading(e.ganttTitle, "gantt");
  if (gantt.rows.length === 0) {
    return `<section class="gantt">${title}<p class="vide">${h(e.ganttEmpty)}</p></section>`;
  }
  const count = gantt.months.length;
  const years: { year: string; span: number }[] = [];
  for (const month of gantt.months) {
    if (month.year || years.length === 0) years.push({ year: month.year, span: 0 });
    years[years.length - 1].span += 1;
  }
  const yearRow = years.map((group) =>
    `<th class="annee" colspan="${group.span}">${h(group.year)}</th>`).join("");
  const monthRow = gantt.months.map((month) => `<th class="mois">${h(month.label)}</th>`)
    .join("");
  const rows = gantt.rows.flatMap((row) => [
    ganttRow(row, count, row.owner, false),
    ...row.phases.map((phase) => ganttRow(phase, count, "", true)),
  ]).join("\n");
  const truncated = gantt.truncated
    ? `<p class="note">${h(interpolate(a.ganttTruncated, { max: String(count) }))}</p>`
    : "";
  return `<section class="gantt">
${title}
<table>
<colgroup><col style="width: 24%">${"<col>".repeat(count)}</colgroup>
<thead>
<tr><th></th>${yearRow}</tr>
<tr><th></th>${monthRow}</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
${truncated}
</section>`;
}

/** Case de la vue d'ensemble : indicateurs nommés et leur cible. */
function overviewCase(perspective: ExportPerspective): string {
  const body = perspective.indicators.length === 0
    ? `<p class="indicateur vide">${h(e.scorecardEmpty)}</p>`
    : perspective.indicators.map((item) => `<p class="indicateur"><b>${h(item.name)}</b>` +
      `<span><b>${h(a.target)}</b>${h(item.target || e.none)}</span></p>`).join("");
  return `<div class="case"><div class="entete">${h(perspective.title)}</div>${body}</div>`;
}

/** Tableau détaillé d'une perspective : en-tête coloré, lignes alternées. */
function detailTable(perspective: ExportPerspective): string {
  if (perspective.indicators.length === 0) {
    return `<p class="vide">${h(e.scorecardEmpty)}</p>`;
  }
  const widths = [18, 26, 18, 11, 16, 11];
  const columns = [a.indicatorName, a.definition, a.target, a.frequency, a.owner, a.kind];
  const head = columns.map((label, index) =>
    `<th style="width: ${widths[index]}%">${h(label)}</th>`).join("");
  const rows = perspective.indicators.map((item) => `<tr>${
    [item.name, item.definition, item.target, item.frequency, item.owner, item.kind]
      .map((value) => `<td>${h(value || e.none)}</td>`).join("")
  }</tr>`).join("\n");
  return `<table class="detail"><thead><tr>${head}</tr></thead><tbody>\n${rows}\n</tbody></table>`;
}

/** Annexe B : vue d'ensemble 2 × 2, puis un tableau détaillé par perspective. */
function scorecardHtml(scorecard: ExportPerspective[]): string {
  const details = scorecard.map((perspective) =>
    `<h4>${h(perspective.title)}</h4>\n${detailTable(perspective)}`).join("\n");
  return `<section class="bsc">
${heading(e.scorecardTitle, "tableau-de-bord")}
<h3>${h(e.overview)}</h3>
<div class="apercu">${scorecard.map(overviewCase).join("\n")}</div>
<h3>${h(e.details)}</h3>
${details}
</section>`;
}

/** Annexe C : traçabilité, paragraphe par paragraphe. */
function annexHtml(annex: ExportTrace[]): string {
  const body = annex.length === 0
    ? `<p class="vide">${h(s.plan.annexEmpty)}</p>`
    : annex.map((row) => `<h5>${h(row.heading)}</h5>\n<ul class="puces">${row.sources.map(
      (source) => `<li${source.found ? "" : " class=\"introuvable\""}>${h(source.label)}</li>`)
      .join("")}</ul>`).join("\n");
  return `<section class="trace">
${heading(e.annexTitle, "tracabilite")}
<p class="intro">${h(s.plan.annexIntro)}</p>
${body}
</section>`;
}

// ==================== GABARIT ====================

/** Couverture : bandeau pleine largeur, question stratégique, date. */
function coverHtml(doc: PlanExport): string {
  const question = doc.question
    ? `<div class="question"><p class="question-label">${h(e.question)}</p>
<blockquote>${h(doc.question)}</blockquote></div>`
    : "";
  return `<section class="couverture">
<div class="bandeau">
<p class="kicker">${h(doc.title)}</p>
<h1>${h(capitalize(doc.organisation))}</h1>
<p class="marque">${h(e.brand)}</p>
</div>
${question}
<p class="meta">${h(doc.exportedOn)}<br>${h(e.preparedWith)}</p>
</section>`;
}

/**
 * Construit le document HTML complet du plan à imprimer.
 * @param doc   - Document d'export (plan-export.ts)
 * @param fonts - Polices base64, ou null (tests)
 * @returns HTML autonome, sans script ni ressource externe
 */
export function buildPlanHtml(doc: PlanExport, fonts: PdfFonts): string {
  const toc = [
    ...doc.sections.map((section) => [`section-${section.key}`, section.title]),
    ["gantt", e.ganttTitle],
    ["tableau-de-bord", e.scorecardTitle],
    ["tracabilite", e.annexTitle],
  ].map(([id, title]) => `<li><a href="#${id}">${h(title)}</a></li>`).join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${h(`${doc.title} — ${doc.organisation}`)}</title>
<style>${styles(doc, fonts)}</style>
</head>
<body>
${coverHtml(doc)}
<nav class="sommaire">
<h2>${h(e.contents)}</h2>
<ol>
${toc}
</ol>
</nav>
${doc.sections.map((section, index) => sectionHtml(section, index === 0)).join("\n")}
${ganttHtml(doc.gantt)}
${scorecardHtml(doc.scorecard)}
${annexHtml(doc.annex)}
</body>
</html>`;
}
