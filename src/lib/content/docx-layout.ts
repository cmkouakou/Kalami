/**
 * =============================================================
 *  Fichier    : docx-layout.ts
 *  Projet     : Kalami
 *  Description: Mise en page d'un manuscrit Word que mammoth ne garde pas :
 *               - encadrés : paragraphes ombrés (« Sur le terrain ») ou seulement bordés
 *                 (énoncés), repérés dans le XML puis regroupés (début, fin, titre, étiquette) ;
 *               - illustrations : image seule sur sa ligne → figure, avec sa légende
 *                 (« Figure 2.1 – … ») qui sert aussi de texte de remplacement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: domhandler, domutils
 * =============================================================
 */

import "server-only";

import { type ChildNode, Element, isTag, isText, Text } from "domhandler";
import { findOne, textContent } from "domutils";

// ==================== CONSTANTES ====================

/** Styles fictifs posés dans le XML, reconnus par la table de styles de mammoth. */
const FILLED_STYLE = "KalamiEncadreFond";
const BORDERED_STYLE = "KalamiEncadreTrait";

/** Table de styles mammoth : chaque paragraphe d'encadré garde sa classe. */
export const BOX_STYLE_MAP = [
  `p.${FILLED_STYLE} => p.encadre-fond:fresh`,
  `p.${BORDERED_STYLE} => p.encadre-trait:fresh`,
];

/** Classes produites par mammoth pour les deux sortes d'encadrés. */
const BOX_KINDS = ["encadre-fond", "encadre-trait"] as const;

/** Paragraphe Word et ses propriétés (les propriétés viennent toujours en premier). */
const PARAGRAPH_PROPERTIES = /(<w:p(?:\s[^>]*)?>)(\s*)<w:pPr>([\s\S]*?)<\/w:pPr>/g;

/** Fond de paragraphe coloré (blanc et automatique exclus). */
const FILL = /<w:shd\b[^>]*\bw:fill="(?!auto|FFFFFF|ffffff)[0-9A-Fa-f]{6}"/;

/** Bordure de paragraphe visible. */
const BORDER = /<w:pBdr>[\s\S]*?w:val="(?!nil|none)[a-zA-Z]+"[\s\S]*?<\/w:pBdr>/;

/** Titre d'encadré au plus de cette longueur (au-delà : c'est déjà le texte). */
const MAX_BOX_TITLE = 160;

/** Étiquette en capitales suivie d'au moins deux espaces (« SUR LE TERRAIN  Titre »). */
const BOX_LABEL = /^(\p{Lu}[\p{Lu}'’ .-]{2,40}?)[\s ]{2,}(\S[\s\S]*)$/u;

/** Légende d'une illustration (« Figure 2.1 – … », « Schéma 3 : … »). */
const CAPTION =
  /^(?:figure|fig\.|schéma|schema|illustration|graphique|image|carte|photo|diagram|chart)\s*\d/iu;

// ==================== XML ====================

/**
 * Marque les paragraphes d'encadré du document Word par un style fictif, pour que mammoth
 * leur donne une classe. Les paragraphes déjà stylés ou numérotés (listes) sont laissés.
 * @param xml - Contenu de word/document.xml
 * @returns XML modifié
 *
 * Exemple : markBoxes(xml) — un paragraphe ombré reçoit <w:pStyle w:val="KalamiEncadreFond"/>
 */
export function markBoxes(xml: string): string {
  return xml.replace(PARAGRAPH_PROPERTIES, (whole, open: string, space: string, props: string) => {
    if (props.includes("<w:pStyle") || props.includes("<w:numPr")) return whole;
    const style = FILL.test(props) ? FILLED_STYLE : BORDER.test(props) ? BORDERED_STYLE : null;
    if (!style) return whole;
    return `${open}${space}<w:pPr><w:pStyle w:val="${style}"/>${props}</w:pPr>`;
  });
}

// ==================== OUTILS ====================

/** Sorte d'encadré d'un nœud, ou null. */
function boxKind(node: ChildNode): (typeof BOX_KINDS)[number] | null {
  if (!isTag(node) || node.name !== "p") return null;
  return BOX_KINDS.find((kind) => node.attribs.class === kind) ?? null;
}

/** Texte normalisé d'un nœud. */
function plain(node: ChildNode): string {
  return textContent(node).replace(/\s+/g, " ").trim();
}

/** Nœud vide (espaces entre deux balises). */
function isBlank(node: ChildNode): boolean {
  return isText(node) && !node.data.trim();
}

/** Indique si le paragraphe ne contient qu'une (ou des) image(s). */
function isImageOnly(node: ChildNode): node is Element {
  if (!isTag(node) || node.name !== "p" || plain(node)) return false;
  return !!findOne((child) => child.name === "img", node.children);
}

// ==================== ENCADRÉS ====================

/**
 * Sépare l'étiquette du titre d'un encadré (« SUR LE TERRAIN  Titre »).
 * @param element - Premier paragraphe de l'encadré
 */
function splitLabel(element: Element): void {
  const match = BOX_LABEL.exec(textContent(element).trim());
  if (!match) return;
  const label = new Element("span", { class: "encadre-label" }, [new Text(match[1].trim())]);
  element.children = [label, new Text(` ${match[2].trim()}`)];
  label.parent = element;
}

/**
 * Regroupe les paragraphes d'encadré consécutifs : classes communes, début et fin (la
 * liseuse dessine un seul cadre), titre et étiquette du premier paragraphe d'un encadré
 * ombré de plusieurs paragraphes.
 * @param nodes - Nœuds de premier niveau (modifiés sur place)
 */
function groupBoxes(nodes: ChildNode[]): void {
  const content = nodes.filter((node) => !isBlank(node));
  let index = 0;
  while (index < content.length) {
    const kind = boxKind(content[index]);
    if (!kind) {
      index++;
      continue;
    }
    const group: Element[] = [];
    while (index < content.length && boxKind(content[index]) === kind) {
      group.push(content[index] as Element);
      index++;
    }
    group.forEach((element, position) => {
      const classes = ["encadre", kind];
      if (position === 0) classes.push("encadre-debut");
      if (position === group.length - 1) classes.push("encadre-fin");
      element.attribs.class = classes.join(" ");
    });
    const [first] = group;
    if (kind === "encadre-fond" && group.length > 1 && plain(first).length <= MAX_BOX_TITLE) {
      first.attribs.class += " encadre-titre";
      splitLabel(first);
    }
  }
}

// ==================== ILLUSTRATIONS ====================

/**
 * Transforme chaque image seule sur sa ligne en figure, légende comprise si le paragraphe
 * suivant en est une. Sans texte de remplacement, l'image reçoit celui de la légende.
 * @param nodes - Nœuds de premier niveau
 * @returns Nouvelle liste de nœuds
 */
function buildFigures(nodes: ChildNode[]): ChildNode[] {
  const result: ChildNode[] = [];
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (!isImageOnly(node)) {
      result.push(node);
      continue;
    }
    let next = index + 1;
    while (next < nodes.length && isBlank(nodes[next])) next++;
    const candidate = nodes[next];
    const caption =
      candidate && isTag(candidate) && candidate.name === "p" && CAPTION.test(plain(candidate))
        ? candidate
        : null;

    const children: ChildNode[] = [...node.children];
    if (caption) {
      children.push(new Element("figcaption", {}, caption.children));
      const image = findOne((child) => child.name === "img", node.children);
      if (image && !image.attribs.alt) image.attribs.alt = plain(caption);
      index = next;
    }
    result.push(new Element("figure", { class: "illustration" }, children));
  }
  return result;
}

// ==================== POINT D'ENTRÉE ====================

/**
 * Applique la mise en page Word aux nœuds aplatis issus de mammoth.
 * @param nodes - Nœuds de premier niveau
 * @returns Nœuds avec encadrés regroupés et illustrations en figures
 */
export function arrangeLayout(nodes: ChildNode[]): ChildNode[] {
  groupBoxes(nodes);
  return buildFigures(nodes);
}
