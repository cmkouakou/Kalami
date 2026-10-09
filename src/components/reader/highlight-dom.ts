/**
 * =============================================================
 *  Fichier    : highlight-dom.ts (reader)
 *  Projet     : Kalami
 *  Description: Surlignages dans le DOM de la liseuse (navigateur uniquement) : dessin des
 *               surlignages dans les blocs affichés et conversion de la sélection du
 *               lecteur en ancrage (bloc + décalage). Chaque bloc affiché porte data-bloc
 *               (indice du bloc) et, en mode pages, data-debut (premier caractère du
 *               morceau de bloc affiché sur la page).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: lib/reader/annotations.ts, lib/reader/types.ts
 * =============================================================
 */

import {
  blockSegments,
  comparePoints,
  fragmentSegments,
  type Segment,
} from "@/lib/reader/annotations";
import type { Highlight, TextPoint } from "@/lib/reader/types";

/** Classe des surlignages dessinés (distincte de la mise en évidence de la recherche). */
const MARK_CLASS = "liseuse-annotation";

/** Parents où un texte vide ne peut pas être enveloppé (structure de tableau ou de liste). */
const STRUCTURAL = new Set(["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "UL", "OL", "DL"]);

/** Sélection convertie en ancrage, avec le texte et la zone à l'écran. */
export type SelectionInfo = {
  start: TextPoint;
  end: TextPoint;
  text: string;
  rect: DOMRect;
};

// ==================== OUTILS ====================

/** Premier caractère du bloc affiché dans cet élément (0 hors mode pages). */
function fragmentStart(element: HTMLElement): number {
  return Number(element.dataset.debut ?? 0);
}

/** Retire les surlignages dessinés dans un élément (le texte reste identique). */
function unpaint(element: HTMLElement): void {
  const marks = element.querySelectorAll(`mark.${MARK_CLASS}`);
  if (marks.length === 0) return;
  marks.forEach((mark) => mark.replaceWith(...mark.childNodes));
  element.normalize();
}

/**
 * Enveloppe le texte entre deux décalages dans des <mark>, un par nœud texte traversé
 * (la mise en forme intérieure, italique ou lien, est conservée).
 */
function wrap(element: HTMLElement, segment: Segment): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const parts: { node: Text; from: number; to: number }[] = [];
  let seen = 0;
  for (let node = walker.nextNode(); node && seen < segment.end; node = walker.nextNode()) {
    const text = node as Text;
    const from = Math.max(segment.start - seen, 0);
    const to = Math.min(segment.end - seen, text.length);
    if (to > from) parts.push({ node: text, from, to });
    seen += text.length;
  }

  for (const { node, from, to } of parts) {
    const parent = node.parentElement;
    if (!parent || (STRUCTURAL.has(parent.tagName) && !/\S/.test(node.data))) continue;
    if (to < node.length) node.splitText(to);
    const target = from > 0 ? node.splitText(from) : node;
    const mark = document.createElement("mark");
    mark.className = MARK_CLASS;
    mark.dataset.hl = segment.id;
    mark.dataset.couleur = segment.color;
    if (segment.hasNote) mark.dataset.note = "";
    target.before(mark);
    mark.append(target);
  }
}

// ==================== DESSIN ====================

/**
 * Redessine les surlignages d'un chapitre dans tous les blocs affichés sous « root ».
 * Le texte des blocs n'est pas modifié : décalages et pagination restent valables.
 * @param root       - Zone de texte (page, livre ou article défilant)
 * @param highlights - Surlignages du chapitre, du plus ancien au plus récent
 */
export function paintHighlights(root: HTMLElement, highlights: Highlight[]): void {
  root.querySelectorAll<HTMLElement>("[data-bloc]").forEach((element) => {
    unpaint(element);
    if (highlights.length === 0) return;
    const block = Number(element.dataset.bloc);
    const start = fragmentStart(element);
    const end = start + (element.textContent?.length ?? 0);
    const segments = fragmentSegments(blockSegments(highlights, block, end), start, end);
    // De la fin vers le début : les nœuds déjà découpés ne décalent pas les suivants
    for (const segment of segments.reverse()) wrap(element, segment);
  });
}

/** Identifiant du surlignage sous un élément cliqué, ou null. */
export function highlightAt(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(`mark.${MARK_CLASS}`)?.dataset.hl ?? null;
}

// ==================== SÉLECTION ====================

/** Décalage, dans le texte du bloc, d'un point de la sélection situé dans l'élément. */
function offsetIn(element: HTMLElement, container: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.setEnd(container, offset);
  return fragmentStart(element) + range.toString().length;
}

/**
 * Convertit la sélection courante (si elle est dans « root ») en ancrage.
 * Seuls les blocs comptent : titre, numéro de page et filigrane sont ignorés.
 * @returns Début, fin, texte et zone de la sélection, ou null (vide, ailleurs, hors blocs)
 */
export function readSelection(root: HTMLElement): SelectionInfo | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const blocks = [...root.querySelectorAll<HTMLElement>("[data-bloc]")].filter((element) =>
    range.intersectsNode(element),
  );
  if (blocks.length === 0) return null;
  const first = blocks[0];
  const last = blocks[blocks.length - 1];

  const start: TextPoint = {
    block: Number(first.dataset.bloc),
    offset: first.contains(range.startContainer)
      ? offsetIn(first, range.startContainer, range.startOffset)
      : fragmentStart(first),
  };
  const end: TextPoint = {
    block: Number(last.dataset.bloc),
    offset: last.contains(range.endContainer)
      ? offsetIn(last, range.endContainer, range.endOffset)
      : fragmentStart(last) + (last.textContent?.length ?? 0),
  };

  // Texte des seuls blocs, un bloc par ligne
  const text = blocks
    .map((element) => {
      const part = document.createRange();
      part.selectNodeContents(element);
      if (element === first && first.contains(range.startContainer)) {
        part.setStart(range.startContainer, range.startOffset);
      }
      if (element === last && last.contains(range.endContainer)) {
        part.setEnd(range.endContainer, range.endOffset);
      }
      return part.toString();
    })
    .join("\n")
    .trim();

  if (!text || comparePoints(start, end) >= 0) return null;
  return { start, end, text, rect: range.getBoundingClientRect() };
}
