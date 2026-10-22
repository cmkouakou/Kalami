/**
 * =============================================================
 *  Fichier    : dom.ts (reader)
 *  Projet     : Kalami
 *  Description: Outils DOM de la liseuse (navigateur uniquement) : transformation des blocs
 *               HTML en éléments, découpe d'un bloc entre deux décalages de texte (la mise
 *               en forme est conservée) et mesure d'une page pour la pagination.
 *               Les décalages portent sur textContent, comme la recherche côté serveur.
 *               v1.1 : préchargement des images avant la mesure.
 *               v1.2 : surtitre de chapitre (« MODULE 3 ») au-dessus du titre.
 *               v1.3 : page d'ouverture d'un module ; images non déplaçables (glissement).
 *               v1.4 : liste coupée entre deux pages (numérotation reprise, élément
 *               commencé sans numéro) ; illustration réduite pour tenir sur sa page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.4
 *  Date       : 2026-10-22
 *  Dépendances: lib/reader/paginate.ts, lib/reader/types.ts
 * =============================================================
 */

import { type FitsFn, wordBreaks } from "@/lib/reader/paginate";
import type { BlockInfo, Page } from "@/lib/reader/types";

/** Blocs jamais coupés entre deux pages (une coupure les rendrait illisibles). */
const UNSPLITTABLE = new Set(["TABLE", "PRE", "FIGURE", "HR"]);

/** Éléments supprimés s'ils deviennent vides après une découpe (puce ou ligne orpheline). */
const PRUNABLE = "li, tr, dt, dd";

/** Listes dont la numérotation continue d'une page à l'autre. */
const LISTS = new Set(["OL", "UL"]);

// ==================== BLOCS ====================

/**
 * Transforme un bloc HTML (déjà nettoyé par le serveur) en élément.
 * @param html - Bloc HTML (ex. « <p>…</p> »)
 * @returns Élément racine du bloc (enveloppé dans un div s'il y en a plusieurs)
 */
export function parseBlock(html: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = html;
  const content = template.content;
  // Une image déplaçable capte le glissement : la page ne tournerait pas
  content
    .querySelectorAll("img")
    .forEach((image) => image.setAttribute("draggable", "false"));
  const only = content.firstElementChild;
  if (content.childNodes.length === 1 && only instanceof HTMLElement)
    return only;
  const wrapper = document.createElement("div");
  wrapper.append(content);
  return wrapper;
}

/**
 * Charge et décode les images des blocs avant la pagination : un bloc analysé dans un
 * template ne charge pas ses images, et une image non décodée mesure 0 px de haut (le
 * schéma « tiendrait » toujours et déborderait de la page). Une image déjà décodée a sa
 * taille dès son insertion dans la page de mesure.
 * @param elements - Éléments du chapitre
 * @returns Images préchargées, à garder en vie pendant la pagination
 */
export async function preloadImages(
  elements: HTMLElement[],
): Promise<HTMLImageElement[]> {
  const sources = new Set<string>();
  for (const element of elements) {
    element.querySelectorAll("img").forEach((image) => {
      const source = image.getAttribute("src");
      if (source) sources.add(source);
    });
  }
  const images = [...sources].map((source) => {
    const image = new Image();
    image.src = source;
    return image;
  });
  // Image illisible : mesurée sans elle plutôt que de bloquer le chapitre
  await Promise.all(
    images.map((image) => image.decode().catch(() => undefined)),
  );
  return images;
}

/**
 * Élément de titre du chapitre, placé avant le premier bloc.
 * @param title  - Titre du chapitre
 * @param kicker - Surtitre affiché au-dessus (« MODULE 3 »), ou null
 */
export function titleElement(
  title: string,
  kicker: string | null = null,
): HTMLElement {
  const heading = document.createElement("h1");
  heading.className = "liseuse-titre-chapitre";
  if (kicker) {
    const label = document.createElement("span");
    label.className = "liseuse-surtitre";
    label.textContent = kicker;
    heading.append(label);
  }
  heading.append(title);
  return heading;
}

/** Description d'un élément pour la pagination. */
export function blockInfo(element: HTMLElement): BlockInfo {
  const text = element.textContent ?? "";
  const heading = /^H[1-6]$/.test(element.tagName);
  return {
    length: text.length,
    breaks:
      heading || UNSPLITTABLE.has(element.tagName) ? [] : wordBreaks(text),
    heading,
    shrinkable:
      element.tagName === "FIGURE" && element.querySelector("img") !== null,
  };
}

/**
 * Dernier élément de la page d'ouverture d'un module : titre (surtitre compris), bloc du
 * surtitre (masqué) et chapeau s'il suit.
 * @param elements - Éléments du chapitre (titre compris, puis un élément par bloc)
 * @param kicker   - Surtitre du chapitre, ou null (pas de page d'ouverture)
 * @returns Indice du dernier élément de la page d'ouverture, ou null
 */
export function openerEnd(
  elements: HTMLElement[],
  kicker: string | null,
): number | null {
  if (!kicker || elements.length < 3) return null;
  return elements[2].classList.contains("chapitre-chapeau") ? 2 : 1;
}

// ==================== DÉCOUPE ====================

/**
 * Point du DOM correspondant à un décalage dans le texte d'un élément.
 * @returns Nœud texte et décalage, ou null si l'élément n'a aucun texte
 */
function locate(
  root: Node,
  offset: number,
): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let last: Text | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (offset <= seen + text.length)
      return { node: text, offset: offset - seen };
    seen += text.length;
    last = text;
  }
  return last ? { node: last, offset: last.length } : null;
}

/** Supprime le contenu entre le début (ou un point) et la fin (ou un point) de l'élément. */
function deleteText(
  root: HTMLElement,
  from: number | null,
  to: number | null,
): void {
  const range = document.createRange();
  range.selectNodeContents(root);
  const start = from === null ? null : locate(root, from);
  const end = to === null ? null : locate(root, to);
  if (start) range.setStart(start.node, start.offset);
  if (end) range.setEnd(end.node, end.offset);
  range.deleteContents();
}

/**
 * Liste reprise en haut de page : la numérotation continue au premier élément gardé, et
 * un élément commencé sur la page précédente est affiché sans puce ni numéro (sinon
 * « 1. » devant la fin d'une phrase). Les sous-listes coupées sont traitées de même.
 * @param original - Liste d'origine (décalages comptés dans son texte)
 * @param clone    - Copie déjà découpée
 * @param start    - Premier caractère gardé, dans le texte de la liste d'origine
 */
function continueList(
  original: Element,
  clone: Element,
  start: number,
): void {
  let seen = 0;
  let index = 0;
  for (const node of original.childNodes) {
    const length = node.textContent?.length ?? 0;
    if (!(node instanceof HTMLLIElement)) {
      seen += length;
      continue;
    }
    if (start >= seen + length) {
      seen += length;
      index++;
      continue;
    }
    if (clone instanceof HTMLOListElement && original instanceof HTMLOListElement)
      clone.start = original.start + index;
    const item = clone.querySelector(":scope > li");
    const cut = node.textContent?.slice(0, start - seen).trim() !== "";
    if (item && cut) {
      item.classList.add("suite");
      continueNestedList(node, item, start - seen);
    }
    return;
  }
}

/**
 * Sous-liste coupée dans un élément de liste (voir continueList).
 * @param original - Élément de liste d'origine
 * @param clone    - Élément correspondant dans la copie découpée
 * @param start    - Premier caractère gardé, dans le texte de l'élément d'origine
 */
function continueNestedList(original: Element, clone: Element, start: number) {
  let seen = 0;
  for (const node of original.childNodes) {
    const length = node.textContent?.length ?? 0;
    const list = node instanceof HTMLOListElement || node instanceof HTMLUListElement;
    if (list && start > seen && start < seen + length) {
      const nested = clone.querySelector(":scope > ol, :scope > ul");
      if (nested) continueList(node, nested, start - seen);
      return;
    }
    seen += length;
  }
}

/**
 * Copie d'un bloc limitée au texte entre deux décalages, mise en forme conservée.
 * @param element - Bloc d'origine (non modifié)
 * @param start   - Premier caractère gardé
 * @param end     - Caractère de fin (exclu)
 * @returns Copie découpée ; classes « suite » (début coupé) et « coupe » (fin coupée)
 */
export function sliceBlock(
  element: HTMLElement,
  start: number,
  end: number,
): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const length = clone.textContent?.length ?? 0;
  if (start <= 0 && end >= length) return clone;

  // La fin d'abord : les décalages du début restent alors valables
  if (end < length) {
    deleteText(clone, end, null);
    clone.classList.add("coupe");
  }
  if (start > 0) {
    deleteText(clone, null, start);
    clone.classList.add("suite");
  }
  clone.querySelectorAll(PRUNABLE).forEach((item) => {
    if (!item.textContent?.trim()) item.remove();
  });
  if (start > 0 && LISTS.has(clone.tagName))
    continueList(element, clone, start);
  return clone;
}

/**
 * Réduit les images d'une illustration à une part de leur hauteur affichée, mesurée
 * avant la pagination (data-hauteur, voir createMeasurer). Les proportions sont gardées.
 * @param element - Copie de l'illustration
 * @param scale   - Part de la hauteur (< 1)
 */
function shrinkImages(element: HTMLElement, scale: number): void {
  element
    .querySelectorAll<HTMLImageElement>("img[data-hauteur]")
    .forEach((image) => {
      const height = Number(image.dataset.hauteur) * scale;
      image.style.maxHeight = `${Math.floor(height)}px`;
    });
}

/**
 * Éléments d'une page, prêts à être insérés.
 * @param elements - Éléments du chapitre (titre compris)
 * @param page     - Fragments de la page
 */
export function renderPage(elements: HTMLElement[], page: Page): HTMLElement[] {
  return page.map(({ block, start, end, scale }) => {
    const element = sliceBlock(elements[block], start, end);
    if (scale) shrinkImages(element, scale);
    return element;
  });
}

// ==================== MESURE ====================

/**
 * Note sur chaque image d'illustration sa hauteur affichée dans la page (data-hauteur),
 * base de sa réduction quand elle ne tient pas entière (shrinkImages).
 * @param box      - Zone de mesure, aux dimensions du contenu d'une page
 * @param elements - Éléments du chapitre ; leurs images reçoivent data-hauteur
 */
function measureImages(box: HTMLElement, elements: HTMLElement[]): void {
  for (const element of elements) {
    if (element.tagName !== "FIGURE") continue;
    const images = element.querySelectorAll("img");
    if (images.length === 0) continue;
    const copy = element.cloneNode(true) as HTMLElement;
    box.replaceChildren(copy);
    copy.querySelectorAll("img").forEach((image, index) => {
      const height = image.getBoundingClientRect().height;
      // Image illisible (hauteur nulle) : jamais réduite
      if (height > 0) images[index].dataset.hauteur = String(height);
    });
  }
  box.replaceChildren();
}

/**
 * Zone de mesure invisible aux dimensions du contenu d'une page.
 * @param host     - Élément qui porte les réglages de lecture (police, taille, interligne)
 * @param elements - Éléments du chapitre (titre compris)
 * @param width    - Largeur du contenu (px)
 * @param height   - Hauteur du contenu (px)
 * @returns Fonction de mesure pour paginate() et fonction de nettoyage
 */
export function createMeasurer(
  host: HTMLElement,
  elements: HTMLElement[],
  width: number,
  height: number,
): { fits: FitsFn; dispose: () => void } {
  const box = document.createElement("div");
  box.className = "liseuse-texte liseuse-mesure";
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
  box.setAttribute("aria-hidden", "true");
  host.append(box);
  measureImages(box, elements);

  const fits: FitsFn = (page) => {
    box.replaceChildren(...renderPage(elements, page));
    const last = box.lastElementChild;
    if (!last) return true;
    const limit = box.getBoundingClientRect().bottom;
    const bottom = last.getBoundingClientRect().bottom;
    // Marge basse du dernier bloc ignorée : elle peut déborder sans gêner la lecture
    return bottom <= limit + 0.5;
  };
  return { fits, dispose: () => box.remove() };
}

// ==================== TEXTE ====================

/** Texte brut de chaque bloc, pour la lecture à voix haute et l'avancement. */
export function blockTexts(elements: HTMLElement[]): string[] {
  return elements.map((element) => element.textContent ?? "");
}
