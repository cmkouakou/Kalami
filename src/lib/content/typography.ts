/**
 * =============================================================
 *  Fichier    : typography.ts
 *  Projet     : Kalami
 *  Description: Finition des manuscrits convertis (DOCX, EPUB, PDF), quel que soit leur
 *               format : typographie française (espaces insécables, guillemets « », tiret
 *               de dialogue, points de suspension, apostrophe courbe), séparateurs de scène
 *               (« *** » → ornement), poèmes (vers conservés ligne à ligne), espaces et
 *               retraits saisis au clavier retirés, titre répété en tête de chapitre retiré.
 *               S'applique aux blocs déjà nettoyés (liste blanche de sanitize.ts).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: htmlparser2, domhandler, dom-serializer, lib/content/sanitize.ts
 * =============================================================
 */

import "server-only";

import render from "dom-serializer";
import { type ChildNode, type Element, isTag, isText, type Text } from "domhandler";
import { textContent } from "domutils";
import { parseDocument } from "htmlparser2";

import { assertLimits, countWords } from "./sanitize";
import type { ConvertedChapter } from "./types";

// ==================== CONSTANTES ====================

/** Langues des livres (colonne books.language). */
export type BookLanguage = "fr" | "en";

/** Espace insécable (avant « : » et à l'intérieur des guillemets). */
const NBSP = "\u00a0";
/** Espace fine insécable (avant « ; », « ! » et « ? »). */
const NNBSP = "\u202f";

/** Classe d'un paragraphe de vers (lignes courtes séparées par des retours à la ligne). */
export const VERSE_CLASS = "vers";
/** Longueur moyenne maximale d'une ligne de vers. */
const VERSE_MAX_LINE = 60;

/** Balises dont le texte n'est jamais retouché. */
const RAW_TAGS = new Set(["pre", "code"]);

/** Paragraphe réduit à des signes de séparation (« *** », « # », « ~ ~ ~ »…). */
const SCENE_BREAK = /^[*#~§•⁂✻◆·\-–—_]+$/;
const SCENE_SIGN = /[*#~§•⁂✻◆]/;

/** Tiret (ou double tiret) qui ouvre une réplique de dialogue. */
const DIALOGUE_START = /^(?:--?|–|—)[ \u00a0\u202f]*(?=[\p{L}«"“])/u;

// ==================== TEXTE ====================

/**
 * Corrige la typographie d'un morceau de texte.
 * @param text     - Texte d'un nœud
 * @param language - Langue du livre
 * @param quote    - État des guillemets droits du bloc (ouvert ou fermé), partagé entre nœuds
 * @returns Texte corrigé
 */
function fixText(text: string, language: BookLanguage, quote: { open: boolean }): string {
  let result = text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\.{3}/g, "…")
    // Pas d'espace avant le point ni la virgule (« mot . » → « mot. »)
    .replace(/(\S)[  ]+([.,])(?=\s|$)/g, "$1$2")
    .replace(/(\p{L})'(?=\p{L})/gu, "$1’");

  if (language === "en") {
    return result.replace(/"/g, () => ((quote.open = !quote.open) ? "“" : "”"));
  }

  result = result
    .replace(/"/g, () => ((quote.open = !quote.open) ? "«" : "»"))
    .replace(/“/g, "«")
    .replace(/”/g, "»")
    // Espaces des guillemets : toujours insécables
    .replace(/«[ \u00a0\u202f]*/g, `«${NBSP}`)
    .replace(/[ \u00a0\u202f]*»/g, `${NBSP}»`)
    // Ponctuation double : espace fine insécable (sauf adresses web et heures)
    .replace(/([^\s;!?\u00a0\u202f/=&])[ \u00a0\u202f]*([;!?]+)/g, `$1${NNBSP}$2`)
    .replace(/([^\s:\u00a0\u202f\d/])[ \u00a0\u202f]*:(?=\s|$)/g, `$1${NBSP}:`)
    // Ponctuation en tête de nœud (après du gras, par exemple) : espace rendue insécable
    .replace(/^ +([;!?])/, `${NNBSP}$1`)
    .replace(/^ +:(?=\s|$)/, `${NBSP}:`);
  return result;
}

/**
 * Parcourt les nœuds texte d'un bloc dans l'ordre du document (hors pre et code).
 * @param nodes - Nœuds à parcourir
 * @param visit - Fonction appelée sur chaque nœud texte
 */
function walkText(nodes: ChildNode[], visit: (node: Text) => void): void {
  for (const node of nodes) {
    if (isText(node)) visit(node);
    else if (isTag(node) && !RAW_TAGS.has(node.name)) walkText(node.children, visit);
  }
}

/** Premier et dernier nœuds texte non vides d'un bloc. */
function edgeTexts(element: Element): { first?: Text; last?: Text } {
  const texts: Text[] = [];
  walkText(element.children, (node) => {
    if (node.data.trim()) texts.push(node);
  });
  return { first: texts[0], last: texts[texts.length - 1] };
}

// ==================== BLOCS ====================

/** Retire les retours à la ligne en tête et en fin de paragraphe. */
function trimBreaks(element: Element): void {
  const isEdge = (node: ChildNode | undefined) =>
    !!node && ((isTag(node) && node.name === "br") || (isText(node) && !node.data.trim()));
  while (isEdge(element.children[0])) element.children.shift();
  while (isEdge(element.children[element.children.length - 1])) element.children.pop();
}

/** Indique si un paragraphe est un poème : plusieurs lignes courtes. */
function isVerse(element: Element): boolean {
  const breaks = element.children.filter((node) => isTag(node) && node.name === "br").length;
  if (breaks < 2) return false;
  const length = textContent(element).replace(/\s+/g, " ").trim().length;
  return length / (breaks + 1) <= VERSE_MAX_LINE;
}

/**
 * Applique la finition à un bloc HTML nettoyé.
 * @param html     - Bloc issu de la conversion
 * @param language - Langue du livre
 * @returns Bloc fini, ou chaîne vide s'il ne contient plus rien
 */
export function polishBlock(html: string, language: BookLanguage): string {
  const document = parseDocument(html);
  const element = document.children.find(isTag);
  if (!element || RAW_TAGS.has(element.name)) return html.trim();
  if (element.name === "hr") return "<hr />";

  const plain = textContent(element).replace(/\s+/g, "");
  if (element.name === "p" && SCENE_BREAK.test(plain)) {
    return SCENE_SIGN.test(plain) || plain.length >= 3 ? "<hr />" : "";
  }

  if (element.name === "p") {
    trimBreaks(element);
    if (isVerse(element)) element.attribs.class = VERSE_CLASS;
  }

  const quote = { open: false };
  walkText(element.children, (node) => {
    node.data = fixText(node.data, language, quote);
  });

  // Retraits et espaces saisis au clavier en début et en fin de bloc
  const { first, last } = edgeTexts(element);
  if (first) {
    first.data = first.data.replace(/^[\s\u00a0\u202f]+/, "");
    if (language === "fr" && element.name === "p") {
      first.data = first.data.replace(DIALOGUE_START, `—${NBSP}`);
    }
  }
  if (last) last.data = last.data.replace(/[\s\u00a0\u202f]+$/, "");

  if (!textContent(element).trim() && element.name !== "hr") return "";
  return render(document, { encodeEntities: "utf8" }).trim();
}

// ==================== CHAPITRES ====================

/** Forme comparable d'un titre : sans accents, casse ni ponctuation. */
function comparable(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Indique si un bloc est un séparateur de scène. */
function isBreak(block: string | undefined): boolean {
  return !!block?.startsWith("<hr");
}

/** Indique si un bloc ne fait que répéter le titre du chapitre. */
function repeatsTitle(block: string, title: string): boolean {
  const text = textContent(parseDocument(block));
  return text.length <= 300 && !!comparable(title) && comparable(text) === comparable(title);
}

/**
 * Applique la finition à tous les chapitres d'un livre converti.
 * @param chapters - Chapitres convertis et nettoyés
 * @param language - Langue du livre
 * @returns Chapitres finis (blocs vides retirés, nombre de mots recalculé)
 * @throws ConversionError « empty » si plus aucun texte ne subsiste
 */
export function polishChapters(
  chapters: ConvertedChapter[],
  language: BookLanguage,
): ConvertedChapter[] {
  const polished = chapters
    .map((chapter) => {
      const blocks = chapter.blocks
        .map((block) => polishBlock(block, language))
        .filter(Boolean)
        // Pas deux séparateurs de suite, ni de séparateur en tête ou en fin de chapitre
        .filter((block, index, all) => !(isBreak(block) && isBreak(all[index - 1])));
      if (blocks[0] && repeatsTitle(blocks[0], chapter.title)) blocks.shift();
      while (isBreak(blocks[0])) blocks.shift();
      while (isBreak(blocks[blocks.length - 1])) blocks.pop();
      return { ...chapter, blocks, word_count: countWords(blocks) };
    })
    .filter((chapter) => chapter.blocks.length > 0);

  assertLimits(polished);
  return polished;
}
