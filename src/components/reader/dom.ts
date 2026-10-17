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
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-17
 *  Dépendances: lib/reader/paginate.ts, lib/reader/types.ts
 * =============================================================
 */

import { type FitsFn, wordBreaks } from "@/lib/reader/paginate";
import type { BlockInfo, Page } from "@/lib/reader/types";

/** Blocs jamais coupés entre deux pages (une coupure les rendrait illisibles). */
const UNSPLITTABLE = new Set(["TABLE", "PRE", "FIGURE", "HR"]);

/** Éléments supprimés s'ils deviennent vides après une découpe (puce ou ligne orpheline). */
const PRUNABLE = "li, tr, dt, dd";

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
  const only = content.firstElementChild;
  if (content.childNodes.length === 1 && only instanceof HTMLElement) return only;
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
export async function preloadImages(elements: HTMLElement[]): Promise<HTMLImageElement[]> {
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
  await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  return images;
}

/**
 * Élément de titre du chapitre, placé avant le premier bloc.
 * @param title  - Titre du chapitre
 * @param kicker - Surtitre affiché au-dessus (« MODULE 3 »), ou null
 */
export function titleElement(title: string, kicker: string | null = null): HTMLElement {
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
    breaks: heading || UNSPLITTABLE.has(element.tagName) ? [] : wordBreaks(text),
    heading,
  };
}

// ==================== DÉCOUPE ====================

/**
 * Point du DOM correspondant à un décalage dans le texte d'un élément.
 * @returns Nœud texte et décalage, ou null si l'élément n'a aucun texte
 */
function locate(root: Node, offset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let last: Text | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (offset <= seen + text.length) return { node: text, offset: offset - seen };
    seen += text.length;
    last = text;
  }
  return last ? { node: last, offset: last.length } : null;
}

/** Supprime le contenu entre le début (ou un point) et la fin (ou un point) de l'élément. */
function deleteText(root: HTMLElement, from: number | null, to: number | null): void {
  const range = document.createRange();
  range.selectNodeContents(root);
  const start = from === null ? null : locate(root, from);
  const end = to === null ? null : locate(root, to);
  if (start) range.setStart(start.node, start.offset);
  if (end) range.setEnd(end.node, end.offset);
  range.deleteContents();
}

/**
 * Copie d'un bloc limitée au texte entre deux décalages, mise en forme conservée.
 * @param element - Bloc d'origine (non modifié)
 * @param start   - Premier caractère gardé
 * @param end     - Caractère de fin (exclu)
 * @returns Copie découpée ; classes « suite » (début coupé) et « coupe » (fin coupée)
 */
export function sliceBlock(element: HTMLElement, start: number, end: number): HTMLElement {
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
  return clone;
}

/**
 * Éléments d'une page, prêts à être insérés.
 * @param elements - Éléments du chapitre (titre compris)
 * @param page     - Fragments de la page
 */
export function renderPage(elements: HTMLElement[], page: Page): HTMLElement[] {
  return page.map(({ block, start, end }) => sliceBlock(elements[block], start, end));
}

// ==================== MESURE ====================

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
