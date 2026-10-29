/**
 * =============================================================
 *  Fichier    : docx-layout.ts
 *  Projet     : Kalami
 *  Description: Mise en page d'un manuscrit Word que mammoth ne garde pas :
 *               - encadrés : paragraphes ombrés (« Sur le terrain ») ou seulement bordés
 *                 (énoncés), repérés dans le XML puis regroupés (début, fin, titre, étiquette) ;
 *               - illustrations : image seule sur sa ligne → figure, avec sa légende
 *                 (« Figure 2.1 – … ») qui sert aussi de texte de remplacement ;
 *               - v1.1 : ouverture de chapitre (surtitre « MODULE 3 » rattaché au chapitre
 *                 qu'il annonce, chapeau en italique) et table des matières Word (numéros de
 *                 page retirés).
 *               - v1.2 : légende en italique sous une illustration, titre « CHAPITRE I »
 *                 suivi de son sous-titre (surtitre + titre), sommaire écrit à la main
 *                 (« SOMMAIRE » puis une ligne par chapitre) reconnu et cliquable.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-28
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

/**
 * Table de styles mammoth : chaque paragraphe d'encadré garde sa classe, comme chaque
 * entrée de la table des matières Word (styles « TM 1 » et « TM 2 »).
 */
export const BOX_STYLE_MAP = [
  `p.${FILLED_STYLE} => p.encadre-fond:fresh`,
  `p.${BORDERED_STYLE} => p.encadre-trait:fresh`,
  "p[style-name='toc 1'] => p.sommaire-1:fresh",
  "p[style-name='toc 2'] => p.sommaire-2:fresh",
];

/** Classes des entrées de table des matières (niveau 1 et 2). */
const CONTENTS_KINDS = ["sommaire-1", "sommaire-2"];

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

/** Surtitre d'un chapitre, seul sur sa ligne (« MODULE 3 », « Partie II », « Chapitre 4 »). */
const KICKER_WORDS = "module|partie|chapitre|livre|unité|leçon|séquence|part|chapter|unit";
const KICKER = new RegExp(`^(?:${KICKER_WORDS})\\s+[\\dIVXLC]{1,6}$`, "iu");

/** Section sans numéro qui peut aussi servir de surtitre (« ÉPILOGUE », puis son titre). */
const SECTION =
  /^(?:prologue|épilogue|epilogue|annexe|appendice|préface|postface|avant-propos|interlude|appendix|foreword|afterword)$/iu;

/** Sous-titre d'un chapitre au plus de cette longueur, sans ponctuation de fin de phrase. */
const MAX_SUBTITLE = 120;
const SENTENCE_END = /[.,;:!?…»"]$/u;

/** Légende en italique au plus de cette longueur (au-delà : c'est un paragraphe du texte). */
const MAX_ITALIC_CAPTION = 300;

/** Titre d'une table des matières écrite à la main. */
const CONTENTS_TITLE = /^(?:sommaire|table des matières|contents|table of contents)$/iu;

/** Entrée d'une table des matières écrite à la main : courte ligne. */
const MAX_CONTENTS_ENTRY = 150;

/** Chapeau au plus de cette longueur (au-delà : c'est un paragraphe ordinaire). */
const MAX_LEAD = 500;

/** Numéro de page d'une entrée de table des matières (après la tabulation de points). */
const CONTENTS_PAGE = /\t\s*[\dIVXLCivxlc]+\s*$/u;

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

/**
 * Indique si tout le texte du paragraphe est en italique (chapeau, légende).
 * @param node - Nœud à examiner
 * @param max  - Longueur maximale du texte
 */
function isItalicOnly(node: ChildNode, max: number): node is Element {
  if (!isTag(node) || node.name !== "p" || node.attribs.class) return false;
  const text = plain(node);
  if (!text || text.length > max) return false;
  return node.children.every((child) =>
    isText(child) ? !child.data.trim() : isTag(child) && /^(em|i)$/.test(child.name),
  );
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

/** Légende d'une illustration : « Figure 2.1 – … » ou paragraphe court tout en italique. */
function isCaption(node: ChildNode | undefined): node is Element {
  if (!node || !isTag(node) || node.name !== "p") return false;
  return CAPTION.test(plain(node)) || isItalicOnly(node, MAX_ITALIC_CAPTION);
}

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
    const caption = isCaption(candidate) ? candidate : null;

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

// ==================== OUVERTURES DE CHAPITRE ====================

/** Indique si le nœud est un titre de chapitre (h1). */
function isChapterTitle(node: ChildNode): boolean {
  return isTag(node) && node.name === "h1";
}

/** Paragraphe sans classe (ni encadré, ni sommaire). */
function isPlainParagraph(node: ChildNode): node is Element {
  return isTag(node) && node.name === "p" && !node.attribs.class;
}

/** Paragraphe dont tout le texte est en italique : le chapeau qui suit un titre. */
function isLead(node: ChildNode): node is Element {
  return isItalicOnly(node, MAX_LEAD);
}

/** Sous-titre d'un chapitre : ligne courte, sans ponctuation de fin de phrase. */
function isSubtitle(node: ChildNode | undefined): node is Element {
  if (!node || !isPlainParagraph(node) || isLead(node)) return false;
  const text = plain(node);
  return !!text && text.length <= MAX_SUBTITLE && !SENTENCE_END.test(text);
}

/**
 * Titre « CHAPITRE I » (ou « ÉPILOGUE ») suivi de son sous-titre : le sous-titre devient
 * le titre du chapitre et l'ancien titre son surtitre.
 * @param title - Titre de chapitre (h1, modifié sur place)
 * @param nodes - Nœuds de premier niveau
 * @param index - Indice du titre dans nodes
 * @returns Paragraphe de surtitre et indice du sous-titre absorbé, ou null
 */
function absorbSubtitle(
  title: Element,
  nodes: ChildNode[],
  index: number,
): { kicker: Element; last: number } | null {
  const text = plain(title);
  if (!KICKER.test(text) && !SECTION.test(text)) return null;
  let next = index + 1;
  while (next < nodes.length && isBlank(nodes[next])) next++;
  const subtitle = nodes[next];
  if (!isSubtitle(subtitle)) return null;
  title.children = [new Text(plain(subtitle))];
  const kicker = new Element("p", { class: "chapitre-surtitre" }, [new Text(text)]);
  return { kicker, last: next };
}

/**
 * Prépare l'ouverture des chapitres : le surtitre placé juste avant un titre (« MODULE 3 »)
 * passe juste après lui, pour ouvrir le chapitre au lieu de clore le précédent ; un titre
 * « CHAPITRE I » suivi de son sous-titre devient surtitre + titre ; le paragraphe en
 * italique qui suit le titre devient son chapeau.
 * @param nodes - Nœuds de premier niveau
 * @returns Nouvelle liste de nœuds
 */
function markOpenings(nodes: ChildNode[]): ChildNode[] {
  const result: ChildNode[] = [];
  let awaitingLead = false;
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (isChapterTitle(node)) {
      const absorbed = absorbSubtitle(node as Element, nodes, index);
      if (absorbed) {
        result.push(node, absorbed.kicker);
        index = absorbed.last;
        awaitingLead = true;
        continue;
      }
      let last = result.length - 1;
      while (last >= 0 && isBlank(result[last])) last--;
      const previous = result[last];
      const kicker =
        previous && isPlainParagraph(previous) && KICKER.test(plain(previous)) ? previous : null;
      if (kicker) result.splice(last, 1);
      result.push(node);
      if (kicker) {
        kicker.attribs.class = "chapitre-surtitre";
        kicker.children = [new Text(plain(kicker))];
        result.push(kicker);
      }
      awaitingLead = true;
      continue;
    }
    result.push(node);
    if (!awaitingLead || isBlank(node)) continue;
    if (isLead(node)) node.attribs.class = "chapitre-chapeau";
    awaitingLead = false;
  }
  return result;
}

// ==================== TABLE DES MATIÈRES ====================

/**
 * Reconnaît une table des matières écrite à la main (sans styles « TM » de Word) : un
 * paragraphe « SOMMAIRE » suivi de courtes lignes, une par chapitre. Le titre reçoit la
 * classe « sommaire-titre », chaque ligne « sommaire-1 » (rendue cliquable ensuite par
 * linkContents). Sans au moins deux lignes, rien n'est changé.
 * @param nodes - Nœuds de premier niveau (modifiés sur place)
 */
function markWrittenContents(nodes: ChildNode[]): void {
  const content = nodes.filter((node) => !isBlank(node));
  const hasWordContents = content.some(
    (node) => isTag(node) && CONTENTS_KINDS.includes(node.attribs.class ?? ""),
  );
  if (hasWordContents) return;
  const start = content.findIndex(
    (node) => isPlainParagraph(node) && CONTENTS_TITLE.test(plain(node)),
  );
  if (start < 0) return;

  const entries: Element[] = [];
  for (let index = start + 1; index < content.length; index++) {
    const node = content[index];
    const text = isPlainParagraph(node) ? plain(node) : "";
    if (!text || text.length > MAX_CONTENTS_ENTRY) break;
    entries.push(node as Element);
  }
  if (entries.length < 2) return;

  const title = content[start] as Element;
  title.attribs.class = "sommaire-titre";
  title.children = [new Text(plain(title))];
  for (const entry of entries) entry.attribs.class = "sommaire-1";
}

/**
 * Nettoie les entrées de la table des matières Word : texte seul (lien interne retiré),
 * sans le numéro de page, qui ne correspond pas aux pages de la liseuse. La liseuse rend
 * ensuite chaque entrée cliquable (voir linkContents).
 * @param nodes - Nœuds de premier niveau (modifiés sur place)
 */
function cleanContents(nodes: ChildNode[]): void {
  for (const node of nodes) {
    if (!isTag(node) || !CONTENTS_KINDS.includes(node.attribs.class ?? "")) continue;
    const text = textContent(node).replace(CONTENTS_PAGE, "").replace(/\s+/g, " ").trim();
    node.children = [new Text(text)];
  }
}

// ==================== POINT D'ENTRÉE ====================

/**
 * Applique la mise en page Word aux nœuds aplatis issus de mammoth.
 * @param nodes - Nœuds de premier niveau
 * @returns Nœuds avec encadrés regroupés, illustrations en figures, ouvertures de chapitre
 *          et table des matières nettoyée
 */
export function arrangeLayout(nodes: ChildNode[]): ChildNode[] {
  groupBoxes(nodes);
  markWrittenContents(nodes);
  cleanContents(nodes);
  return markOpenings(buildFigures(nodes));
}
