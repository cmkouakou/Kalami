/**
 * =============================================================
 *  Fichier    : headings.ts
 *  Projet     : Kalami
 *  Description: Repérage des titres d'un manuscrit qui n'utilise pas les styles « Titre » :
 *               lignes « Chapitre 3 », « Prologue », « IV »… (ouvrent un chapitre) et lignes
 *               courtes entièrement en gras ou en capitales (titres de section). Utilisé par
 *               la conversion DOCX ; le marqueur de chapitre sert aussi au PDF.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: domhandler, domutils, lib/content/sanitize.ts
 * =============================================================
 */

import "server-only";

import { type ChildNode, type Element, isTag } from "domhandler";
import { textContent } from "domutils";

import { headingText } from "./sanitize";

/** Longueur maximale d'une ligne reconnue comme titre. */
const MAX_HEADING_LENGTH = 80;

/** Numéro écrit en lettres (« Chapitre premier », « Part One »). */
const NUMBER_WORDS =
  "premi[eè]re?|\\p{L}+i[eè]me|second|seconde|un|une|deux|trois|quatre|cinq|six|sept|huit|" +
  "neuf|dix|one|two|three|four|five|seven|eight|nine|ten|first|third|\\p{L}+th";

/** Mot-clé suivi d'un numéro, puis éventuellement d'un titre (« Chapitre 2 : Le retour »). */
const NUMBERED_MARKER = new RegExp(
  "^(?:chapitre|chapter|partie|part|livre|book)\\s+(\\d{1,3}|[ivxlc]{1,7}|" + NUMBER_WORDS +
    ")(?=$|[\\s:.—–-])(?:[\\s:.—–-].{0,70})?$",
  "iu",
);

/** Section nommée, seule ou suivie d'un titre après un séparateur (« Prologue : … »). */
const NAMED_MARKER = new RegExp(
  "^(?:prologue|épilogue|epilogue|introduction|conclusion|avant-propos|préface|preface|" +
    "postface)(?:\\s*[:.—–-].{0,70})?$",
  "iu",
);

/** Numéro seul : chiffres romains en capitales (« IV ») ou arabes (« 12. »). */
const ROMAN_ALONE = /^[IVXLC]{1,7}\.?$/u;
const DIGITS_ALONE = /^\d{1,3}\.?$/u;

/**
 * Indique si une ligne ouvre un chapitre : « Chapitre 2 », « Partie III : … », « Prologue »,
 * « IV ». Les chiffres romains doivent être en capitales (« ci », « civil » sont des mots).
 * @param text   - Ligne à examiner (espaces de bord retirées)
 * @param digits - Accepter un nombre seul (« 12 ») ; non pour un PDF, où il vient souvent
 *                 d'un tableau ou d'une figure
 */
export function isChapterMarker(text: string, digits = true): boolean {
  const numbered = NUMBERED_MARKER.exec(text);
  if (numbered) {
    const number = numbered[1];
    return !/^[ivxlc]+$/iu.test(number) || number === number.toUpperCase();
  }
  return NAMED_MARKER.test(text) || ROMAN_ALONE.test(text) || (digits && DIGITS_ALONE.test(text));
}

/** Part maximale de paragraphes en relief pour qu'ils soient pris pour des titres. */
const MAX_EMPHASIZED_SHARE = 0.25;

/** Fin de phrase : une ligne qui se termine ainsi n'est pas un titre. */
const SENTENCE_END = /[.,;…]$/;

// ==================== OUTILS ====================

/** Texte en gras d'un nœud (b et strong, imbriqués compris). */
function boldText(nodes: ChildNode[]): string {
  return nodes
    .map((node) => {
      if (!isTag(node)) return "";
      if (node.name === "strong" || node.name === "b") return textContent(node);
      return boldText(node.children);
    })
    .join("");
}

/** Indique si la ligne est entièrement en gras ou en capitales (au moins 4 lettres). */
function isEmphasized(element: Element, text: string): boolean {
  const compact = (value: string) => value.replace(/\s+/g, "");
  if (compact(boldText(element.children)) === compact(text)) return true;
  const letters = text.replace(/[^\p{L}]/gu, "");
  return letters.length >= 4 && letters === letters.toLocaleUpperCase("fr");
}

// ==================== REPÉRAGE ====================

/**
 * Transforme en titres les paragraphes qui en ont l'allure. Les marqueurs de chapitre
 * deviennent des h1 s'il y en a au moins deux ; les autres lignes en relief, des h2.
 * @param nodes - Nœuds de premier niveau d'un document sans h1 ni h2
 * @returns Les mêmes nœuds, titres renommés sur place
 */
export function promoteHeadings(nodes: ChildNode[]): ChildNode[] {
  const candidates: { element: Element; marker: boolean }[] = [];
  let paragraphs = 0;
  for (const node of nodes) {
    // Les paragraphes d'encadré (classe posée par la conversion) ne sont pas des titres
    if (!isTag(node) || node.name !== "p" || node.attribs.class) continue;
    const text = headingText(node);
    if (text) paragraphs++;
    if (!text || text.length > MAX_HEADING_LENGTH || SENTENCE_END.test(text)) continue;
    const marker = isChapterMarker(text);
    if (marker || isEmphasized(node, text)) candidates.push({ element: node, marker });
  }

  const markers = candidates.filter((candidate) => candidate.marker).length;
  // Trop de lignes en relief (poème tout en capitales…) : c'est un style, pas des titres
  const emphasisIsStyle = candidates.length - markers > paragraphs * MAX_EMPHASIZED_SHARE;
  for (const { element, marker } of candidates) {
    if (marker) element.name = markers >= 2 ? "h1" : "h2";
    else if (!emphasisIsStyle) element.name = "h2";
  }
  return nodes;
}
