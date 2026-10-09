/**
 * =============================================================
 *  Fichier    : render.ts
 *  Projet     : Kalami
 *  Description: Gabarit HTML du PDF filigrané (fonctions pures, testables) : page de titre
 *               « Exemplaire de … », table des matières, chapitres. Chaque page porte le
 *               nom, le courriel et la référence de l'acheteur en pied de page (marges
 *               @page) et en filigrane diagonal léger. Toutes les valeurs saisies sont
 *               échappées ; le texte des chapitres est renettoyé par la liste blanche.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/content/sanitize.ts
 * =============================================================
 */

import { sanitizeBlock } from "@/lib/content/sanitize";

// ==================== TYPES ====================

/** Identité imprimée sur chaque page. */
export type PdfStamp = {
  name: string;
  email: string;
  reference: string;
};

export type PdfChapter = {
  position: number;
  title: string;
  blocks: string[];
};

export type PdfBook = {
  title: string;
  subtitle: string | null;
  author: string;
  language: string;
  chapters: PdfChapter[];
};

/** Polices intégrées (base64), absentes en test. */
export type PdfFonts = { normal: string; italic: string } | null;

// ==================== ÉCHAPPEMENT ====================

/** Échappe une valeur à placer dans du texte ou un attribut HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Échappe une valeur à placer dans une chaîne CSS (« content: "…" ») : tout caractère hors
 * lettres, chiffres, espace et ponctuation sûre devient une séquence hexadécimale.
 */
export function escapeCssString(value: string): string {
  return value.replace(/[^\p{L}\p{N} .,@_+-]/gu, (char) => {
    const code = char.codePointAt(0) ?? 0x3f;
    return `\\${code.toString(16)} `;
  });
}

/** Texte du pied de page et du filigrane : « Exemplaire de Nom · courriel · KAL-… ». */
export function stampText(stamp: PdfStamp, prefix: string): string {
  return `${prefix} ${stamp.name} · ${stamp.email} · ${stamp.reference}`;
}

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
 * Feuille de style du document : format A5, pied de page sur chaque page (marges @page,
 * numéro de page compris) et filigrane fixe, répété par Chromium sur chaque page.
 */
function styles(footer: string, fonts: PdfFonts): string {
  return `${fontFaces(fonts)}
@page {
  size: A5;
  margin: 18mm 16mm 20mm;
  @bottom-center {
    content: "${escapeCssString(footer)}  —  " counter(page) " / " counter(pages);
    font-family: "Literata", serif;
    font-size: 6.5pt;
    color: #6b6257;
  }
}
html { font-family: "Literata", serif; font-size: 10.5pt; line-height: 1.55; color: #1f1a14; }
body { margin: 0; }
.filigrane {
  position: fixed;
  top: 45%;
  left: -15%;
  width: 130%;
  text-align: center;
  transform: rotate(-35deg);
  font-size: 13pt;
  color: #1f1a14;
  opacity: 0.07;
  pointer-events: none;
  z-index: 10;
}
.titre { break-after: page; text-align: center; padding-top: 30%; }
.titre h1 { font-size: 22pt; line-height: 1.2; margin: 0 0 8pt; }
.titre .sous-titre { font-size: 12pt; font-style: italic; margin: 0 0 24pt; }
.titre .auteur { font-size: 12pt; margin: 0 0 48pt; }
.titre .exemplaire { font-size: 8.5pt; color: #6b6257; }
.sommaire { break-after: page; }
.sommaire h2 { font-size: 14pt; }
.sommaire ol { padding-left: 0; list-style: none; }
.sommaire li { margin: 0 0 5pt; }
.sommaire a { color: inherit; text-decoration: none; }
.chapitre { break-before: page; }
.chapitre > h1 { font-size: 16pt; line-height: 1.25; margin: 0 0 18pt; }
.chapitre p { margin: 0 0 7pt; text-align: justify; hyphens: auto; orphans: 2; widows: 2; }
.chapitre h2, .chapitre h3, .chapitre h4 { break-after: avoid; line-height: 1.3; }
.chapitre blockquote { margin: 8pt 14pt; font-style: italic; }
.chapitre table { border-collapse: collapse; width: 100%; font-size: 9pt; }
.chapitre td, .chapitre th { border: 0.5pt solid #b9ae9f; padding: 3pt; }
.chapitre pre { white-space: pre-wrap; font-size: 8.5pt; }`;
}

// ==================== GABARIT ====================

/** Libellés imprimés, fournis par le dictionnaire. */
export type PdfLabels = {
  copyOf: string;
  contents: string;
  by: string;
};

/**
 * Construit le document HTML complet à imprimer.
 * @param book   - Livre et chapitres de la version courante
 * @param stamp  - Identité de l'acheteur (nom, courriel, référence)
 * @param labels - Libellés (« Exemplaire de », « Sommaire », « par »)
 * @param fonts  - Polices base64, ou null (tests)
 * @returns HTML autonome, sans script ni ressource externe
 */
export function buildPdfHtml(
  book: PdfBook,
  stamp: PdfStamp,
  labels: PdfLabels,
  fonts: PdfFonts,
): string {
  const footer = stampText(stamp, labels.copyOf);
  const toc = book.chapters
    .map(
      (ch) =>
        `<li><a href="#chapitre-${ch.position}">${escapeHtml(ch.title)}</a></li>`,
    )
    .join("\n");
  const chapters = book.chapters
    .map(
      (ch) =>
        `<section class="chapitre" id="chapitre-${ch.position}">\n` +
        `<h1>${escapeHtml(ch.title)}</h1>\n` +
        ch.blocks.map(sanitizeBlock).join("\n") +
        "\n</section>",
    )
    .join("\n");
  const subtitle = book.subtitle
    ? `<p class="sous-titre">${escapeHtml(book.subtitle)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(book.language)}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(book.title)}</title>
<style>${styles(footer, fonts)}</style>
</head>
<body>
<div class="filigrane" aria-hidden="true">${escapeHtml(footer)}</div>
<section class="titre">
<h1>${escapeHtml(book.title)}</h1>
${subtitle}
<p class="auteur">${escapeHtml(labels.by)} ${escapeHtml(book.author)}</p>
<p class="exemplaire">${escapeHtml(footer)}</p>
</section>
<nav class="sommaire">
<h2>${escapeHtml(labels.contents)}</h2>
<ol>
${toc}
</ol>
</nav>
${chapters}
</body>
</html>`;
}
