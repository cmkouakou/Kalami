/**
 * =============================================================
 *  Fichier    : sanitize.ts
 *  Projet     : Kalami
 *  Description: Nettoyage et découpage du HTML issu des manuscrits (DOCX ou EPUB) :
 *               liste blanche de balises, aplatissement des conteneurs, découpage en blocs
 *               de premier niveau et en chapitres, comptage des mots, limites de taille.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: sanitize-html, htmlparser2, domhandler, domutils, dom-serializer
 * =============================================================
 */

import "server-only";

import render from "dom-serializer";
import { type ChildNode, type Element, isTag, isText } from "domhandler";
import { textContent } from "domutils";
import sanitizeHtml from "sanitize-html";

import { ConversionError, type ConvertedChapter } from "./types";

// ==================== CONSTANTES ====================

/** Limites d'un livre converti (protection contre les fichiers piégés ou démesurés). */
export const MAX_CHAPTERS = 500;
export const MAX_BLOCKS_PER_CHAPTER = 20000;
export const MAX_TOTAL_CHARACTERS = 5_000_000;

/** Longueur maximale d'un titre de chapitre (contrainte de la table chapters). */
const MAX_TITLE_LENGTH = 300;

/** Balises qui forment un bloc de premier niveau. */
const BLOCK_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "dl", "blockquote", "table",
  "pre", "hr", "figure",
]);

/** Conteneurs sans valeur propre : leur contenu est remonté au premier niveau. */
const CONTAINER_TAGS = new Set([
  "html", "body", "div", "section", "article", "main", "header", "footer", "aside",
]);

/** Balises jamais conservées, contenu compris. */
const DROPPED_TAGS = new Set(["head", "script", "style", "nav", "template", "noscript", "svg"]);

/** Liste blanche appliquée à chaque bloc. Liens et images ne sont pas conservés en v1. */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i", "u", "s", "sub", "sup",
    "small", "br", "ul", "ol", "li", "dl", "dt", "dd", "blockquote", "table", "caption",
    "thead", "tbody", "tfoot", "tr", "th", "td", "pre", "code", "hr", "figure", "figcaption",
  ],
  allowedAttributes: {
    ol: ["start"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
  },
  // Le titre du chapitre est rendu à part : un h1 restant dans le texte devient h2
  transformTags: { h1: "h2" },
  disallowedTagsMode: "discard",
};

// ==================== NETTOYAGE ====================

/**
 * Nettoie un fragment HTML selon la liste blanche.
 * @param html - Fragment issu de la conversion
 * @returns Fragment sûr à injecter dans la liseuse
 */
export function sanitizeBlock(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

/** Texte brut d'un fragment déjà nettoyé (balises retirées, espaces normalisés). */
function plainText(sanitized: string): string {
  return sanitized
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compte les mots d'une liste de blocs nettoyés.
 * @param blocks - Blocs HTML
 * @returns Nombre de mots (suites de caractères séparées par des espaces)
 */
export function countWords(blocks: string[]): number {
  return blocks.reduce((total, block) => {
    const text = plainText(block);
    return total + (text ? text.split(" ").length : 0);
  }, 0);
}

// ==================== DÉCOUPAGE EN BLOCS ====================

/**
 * Aplatit une liste de nœuds : les conteneurs (div, section…) sont remplacés par leur
 * contenu, les balises interdites et les commentaires sont retirés.
 * @param nodes - Nœuds d'un document analysé par htmlparser2
 * @returns Nœuds de premier niveau (blocs et éléments en ligne)
 */
export function flattenNodes(nodes: ChildNode[]): ChildNode[] {
  const result: ChildNode[] = [];
  for (const node of nodes) {
    if (isText(node)) {
      result.push(node);
    } else if (isTag(node)) {
      const name = node.name.toLowerCase();
      if (DROPPED_TAGS.has(name)) continue;
      if (CONTAINER_TAGS.has(name)) result.push(...flattenNodes(node.children));
      else result.push(node);
    }
  }
  return result;
}

/** Indique si le nœud est un titre du niveau demandé (ex. 1 pour h1). */
export function isHeading(node: ChildNode, level: number): node is Element {
  return isTag(node) && node.name.toLowerCase() === `h${level}`;
}

/**
 * Transforme des nœuds aplatis en blocs HTML nettoyés. Les nœuds en ligne consécutifs
 * (texte, gras…) sont regroupés dans un paragraphe ; les blocs vides sont écartés.
 * @param nodes - Nœuds de premier niveau
 * @returns Blocs HTML nettoyés
 */
export function nodesToBlocks(nodes: ChildNode[]): string[] {
  const blocks: string[] = [];
  let inline: ChildNode[] = [];

  const push = (html: string) => {
    const clean = sanitizeBlock(html);
    if (clean && (plainText(clean) || clean.startsWith("<hr"))) blocks.push(clean);
  };
  const flushInline = () => {
    if (inline.length && textContent(inline).trim()) push(`<p>${render(inline)}</p>`);
    inline = [];
  };

  for (const node of nodes) {
    if (isTag(node) && BLOCK_TAGS.has(node.name.toLowerCase())) {
      flushInline();
      push(render(node));
    } else {
      inline.push(node);
    }
  }
  flushInline();
  return blocks;
}

// ==================== CHAPITRES ====================

/**
 * Titre lisible d'un nœud (espaces normalisés, longueur bornée).
 * @param node - Nœud de titre
 * @returns Texte du titre, éventuellement vide
 */
export function headingText(node: ChildNode | ChildNode[]): string {
  return textContent(node).replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH);
}

/**
 * Construit un chapitre à partir de son titre et de ses nœuds.
 * @param title - Titre (non vide)
 * @param nodes - Nœuds de premier niveau du chapitre
 */
export function buildChapter(title: string, nodes: ChildNode[]): ConvertedChapter {
  const blocks = nodesToBlocks(nodes);
  return { title: title.slice(0, MAX_TITLE_LENGTH), blocks, word_count: countWords(blocks) };
}

/**
 * Découpe une suite de nœuds en chapitres à chaque titre du niveau donné.
 * Le texte placé avant le premier titre forme un chapitre « début » s'il n'est pas vide.
 * @param nodes        - Nœuds aplatis du document
 * @param level        - Niveau de titre qui ouvre un chapitre (1 = h1)
 * @param openingTitle - Titre du chapitre placé avant le premier titre
 * @returns Chapitres non vides, dans l'ordre du document
 */
export function splitByHeading(
  nodes: ChildNode[],
  level: number,
  openingTitle: string,
): ConvertedChapter[] {
  const chapters: ConvertedChapter[] = [];
  let title = openingTitle;
  let current: ChildNode[] = [];

  const close = () => {
    const chapter = buildChapter(title, current);
    // Un titre sans texte (page de garde, image seule) ne forme pas un chapitre
    if (chapter.blocks.length) chapters.push(chapter);
  };

  for (const node of nodes) {
    if (isHeading(node, level)) {
      close();
      title = headingText(node) || openingTitle;
      current = [];
    } else {
      current.push(node);
    }
  }
  close();
  return chapters;
}

// ==================== LIMITES ====================

/**
 * Vérifie qu'un livre converti respecte les limites de taille.
 * @param chapters - Chapitres convertis
 * @throws ConversionError « empty », « too_many_chapters » ou « too_large »
 */
export function assertLimits(chapters: ConvertedChapter[]): void {
  if (!chapters.length) throw new ConversionError("empty");
  if (chapters.length > MAX_CHAPTERS) throw new ConversionError("too_many_chapters");

  let characters = 0;
  for (const chapter of chapters) {
    if (chapter.blocks.length > MAX_BLOCKS_PER_CHAPTER) throw new ConversionError("too_large");
    for (const block of chapter.blocks) characters += block.length;
  }
  if (characters > MAX_TOTAL_CHARACTERS) throw new ConversionError("too_large");
}
