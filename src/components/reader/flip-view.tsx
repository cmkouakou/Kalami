/**
 * =============================================================
 *  Fichier    : flip-view.tsx (reader)
 *  Projet     : Kalami
 *  Description: Mode « pages à tourner » : le chapitre est paginé selon la taille de l'écran
 *               et les réglages (mesure réelle dans une page cachée), puis affiché avec
 *               page-flip (deux pages sur grand écran, une sur tablette en portrait).
 *               La position (bloc + décalage) survit aux changements de taille et de police.
 *               Les pages sont créées hors de React : page-flip déplace leurs nœuds.
 *               Les surlignages sont dessinés après la découpe : ils ne changent jamais
 *               la pagination. Les pages se tournent par les coins, le glissement, les
 *               flèches et le clavier (un clic sert à sélectionner du texte).
 *               v1.2 : marges portées par le bloc de texte (page-flip effaçait celles de la
 *               page), pli central entre les deux pages. v1.3 : images décodées avant la
 *               mesure (un schéma ne déborde plus de sa page).
 *               v1.4 : aux limites du chapitre, glisser ou tourner le coin ouvre le chapitre
 *               voisin ; un clic dans la marge tourne la page ; surtitre de module ;
 *               ouverture à une part du chapitre (accès rapide).
 *               v1.5 : couverture en première page du premier chapitre (le livre s'ouvre
 *               dessus) et quatrième de couverture en dernière page du dernier chapitre.
 *               v1.6 : page de l'encart Kalami Stratégie après le texte d'un module.
 *               v1.7 : numéros de page dans tout le livre ; page d'ouverture d'un module ;
 *               un glissement sur une page sans texte (schéma) tourne la page ; mise en
 *               pages déplacée dans layout.ts (partagée avec le compteur de pages).
 *               v1.8 : un glissement rapide sur le texte tourne la page (il sélectionnait
 *               le texte) ; une ancienne sélection ne bloque plus les glissements.
 *               v1.9 : pages légères (ouverture de module, encart) sans sélection,
 *               tournées par tout glissement et par un clic ; un pli refusé
 *               par page-flip (limite du chapitre) ouvre le chapitre voisin.
 *  Auteur     : Claude Marcel
 *  Version    : 1.9
 *  Date       : 2026-10-22
 *  Dépendances: page-flip, dom.ts, layout.ts, highlight-dom.ts, lib/reader/paginate.ts,
 *               lib/reader/position.ts, use-book-pages.ts
 * =============================================================
 */

"use client";

import type { PageFlip as PageFlipInstance } from "page-flip/dist/js/page-flip.module.js";
import { type RefObject, useEffect, useRef, useState } from "react";

import { getDictionary, interpolate } from "@/i18n";
import type { ChapterPayload } from "@/lib/content/types";
import { pageIndexOf, pageStart } from "@/lib/reader/paginate";
import { chapterFraction, positionAtFraction } from "@/lib/reader/position";
import type { Highlight, Page, ReaderSettings } from "@/lib/reader/types";

import { renderPage } from "./dom";
import { paintHighlights } from "./highlight-dom";
import { layoutChapter, layoutFor, PADDING } from "./layout";
import { buildPromoElement } from "./strategy-promo";
import type { BookPage, MeasureTarget } from "./use-book-pages";

const t = getDictionary();

/** Délai avant de repaginer après un redimensionnement (ms). */
const RESIZE_DELAY = 250;
/** Distance horizontale minimale d'un glissement qui tourne la page (px). */
const SWIPE_MIN = 50;
/** Un glissement qui tourne la page est au moins deux fois plus large que haut. */
const SWIPE_RATIO = 2;
/** Durée maximale d'un glissement rapide à la souris, qui tourne la page (ms). */
const FLICK_MAX = 400;
/** Déplacement maximal d'un simple clic (px). */
const TAP_MAX = 6;
/** Attente de la décision de page-flip après un glissement (ms). */
const SWIPE_SETTLE = 120;
/** Numérotation inconnue (compteur absent) : pages sans numéro. */
const NO_NUMBERING = () => null;
/** Éléments dont le clic ne tourne jamais la page. */
const NO_TURN = ".liseuse-page-texte, a, button, input, textarea";
/** Commandes d'une page légère : leur clic ne tourne pas la page. */
const COMMANDS = "a, button, input, textarea";
/**
 * Nombre de caractères sous lequel une page est « légère » (ouverture de module, encart,
 * fin de partie) : rien à y annoter, elle se tourne comme une marge.
 */
const LIGHT_PAGE_MAX = 300;

/** Commandes appelées par la barre d'outils, le clavier et la lecture à voix haute. */
export type ViewControls = {
  next: () => void;
  previous: () => void;
  goTo: (block: number, offset: number) => void;
  /** Va à une part du chapitre (0 = début, 1 = fin) */
  goToFraction: (fraction: number) => void;
};

/** Position d'ouverture d'une vue : bloc et décalage, ou part du chapitre. */
export type ViewOpening = { block: number; offset: number; fraction?: number };

/** Position signalée à la liseuse après chaque changement de page. */
export type ViewPosition = {
  block: number;
  offset: number;
  fraction: number;
  page?: { current: number; total: number };
};

type FlipViewProps = {
  chapter: ChapterPayload;
  settings: ReaderSettings;
  /** Position d'ouverture (lue une seule fois : la vue est recréée à chaque chapitre) */
  initial: ViewOpening;
  watermark: string | null;
  /** Surlignages du chapitre, du plus ancien au plus récent */
  highlights: Highlight[];
  controlsRef: RefObject<ViewControls | null>;
  onPosition: (position: ViewPosition) => void;
  onNextChapter: () => void;
  onPreviousChapter: () => void;
  /** Couverture en première page (premier chapitre seulement), ou null */
  cover?: { url: string; alt: string } | null;
  /** Quatrième de couverture en dernière page (dernier chapitre seulement), ou null */
  backCover?: { url: string; alt: string } | null;
  /** Page de l'encart Kalami Stratégie après la dernière page de texte */
  promo?: boolean;
  /** Numéro dans le livre d'une page du chapitre (indice), ou null s'il n'est pas connu */
  numbering?: (index: number) => BookPage | null;
  /** Zone de mesure, signalée après chaque mise en pages (compteur des pages du livre) */
  onLayout?: (target: MeasureTarget) => void;
};

// ==================== OUTILS ====================

/** Décalage du filigrane, légèrement différent d'une page à l'autre. */
function watermarkOffset(
  chapter: number,
  page: number,
): { top: number; left: number } {
  const seed = (chapter * 37 + page * 53) % 97;
  return { top: 18 + (seed % 55), left: 6 + ((seed * 7) % 30) };
}

/** Options d'une page : indice, filigrane, marge, numérotation et page d'ouverture. */
type PageOptions = {
  /** Indice de la page dans le chapitre (variation du filigrane, numéro) */
  index: number;
  /** Numéro du chapitre (variation du filigrane) */
  chapter: number;
  watermark: string | null;
  /** Marge latérale (px) */
  padX: number;
  /** Faux pour une page hors texte (encart, page blanche) : pas de numéro */
  numbered: boolean;
  /** Page d'ouverture d'un module : contenu centré */
  opener?: boolean;
};

/**
 * Écrit le numéro d'une page dans le livre (vide tant que le compte n'est pas arrivé
 * jusqu'à elle).
 * @param element - Élément .liseuse-numero
 * @param page    - Numéro dans le livre, ou null
 */
function writeNumber(element: HTMLElement, page: BookPage | null) {
  element.textContent = page ? String(page.number) : "";
  if (page?.total) {
    const label = { current: String(page.number), total: String(page.total) };
    element.setAttribute("aria-label", interpolate(t.reader.pageOf, label));
  } else element.removeAttribute("aria-label");
}

/**
 * Met à jour les numéros des pages affichées, sans repaginer.
 * @param book      - Élément du livre
 * @param numbering - Numéro dans le livre d'une page du chapitre
 */
function paintNumbers(
  book: HTMLElement,
  numbering: (index: number) => BookPage | null,
) {
  book
    .querySelectorAll<HTMLElement>(".liseuse-numero[data-page]")
    .forEach((element) => {
      writeNumber(element, numbering(Number(element.dataset.page)));
    });
}

/**
 * Crée l'élément d'une page (texte, filigrane, numéro).
 * @param content - Éléments du texte de la page
 * @param options - Indice, filigrane, marge, numérotation et page d'ouverture
 */
function buildPage(content: HTMLElement[], options: PageOptions): HTMLElement {
  const { index, chapter, watermark, padX, numbered, opener = false } = options;
  const page = document.createElement("div");
  page.className = opener
    ? "liseuse-page liseuse-page-ouverture"
    : "liseuse-page";

  // page-flip réécrit le style de la page (position, taille) : les marges sont portées
  // par le bloc de texte, placé exactement dans la zone mesurée pendant la pagination
  const text = document.createElement("div");
  text.className = "liseuse-texte liseuse-page-texte";
  text.style.top = `${PADDING.top}px`;
  text.style.right = `${padX}px`;
  text.style.bottom = `${PADDING.bottom}px`;
  text.style.left = `${padX}px`;
  text.append(...content);
  // page-flip annule le mousedown (début de glissement) : le texte reste sélectionnable
  text.addEventListener("mousedown", (event) => event.stopPropagation());
  // Page légère : rien à sélectionner, tout glissement ou clic la tourne (watchGestures)
  if (opener || (text.textContent ?? "").trim().length < LIGHT_PAGE_MAX)
    page.classList.add("liseuse-page-legere");
  page.append(text);

  if (watermark) {
    const mark = document.createElement("span");
    const { top, left } = watermarkOffset(chapter, index);
    mark.className = "liseuse-filigrane";
    mark.textContent = watermark;
    mark.style.top = `${top}%`;
    mark.style.left = `${left}%`;
    mark.setAttribute("aria-hidden", "true");
    page.append(mark);
  }

  if (numbered) {
    // Numéro écrit plus tard (paintNumbers) : il dépend du compte des parties précédentes
    const number = document.createElement("span");
    number.className = "liseuse-numero";
    number.dataset.page = String(index);
    page.append(number);
  }
  return page;
}

/**
 * Crée une page de couverture (rigide, image pleine page, sans texte ni numéro).
 * @param image - Adresse et texte de remplacement de l'image
 */
function buildCoverPage(image: { url: string; alt: string }): HTMLElement {
  const page = document.createElement("div");
  page.className = "liseuse-page liseuse-couverture";
  page.dataset.density = "hard";
  const img = document.createElement("img");
  img.src = image.url;
  img.alt = image.alt;
  img.draggable = false;
  page.append(img);
  return page;
}

/**
 * Éléments d'une page, chacun repéré pour les surlignages : data-bloc (indice du bloc,
 * sans le titre) et data-debut (premier caractère du morceau de bloc affiché).
 */
function anchoredPage(elements: HTMLElement[], page: Page): HTMLElement[] {
  const rendered = renderPage(elements, page);
  page.forEach((fragment, index) => {
    if (fragment.block === 0) return;
    rendered[index].dataset.bloc = String(fragment.block - 1);
    rendered[index].dataset.debut = String(fragment.start);
  });
  return rendered;
}

// ==================== GESTES ====================

/**
 * Complète les gestes de page-flip :
 * - un glissement que page-flip n'a pas tourné (commencé sur le texte ou sur un schéma,
 *   ou aux limites du chapitre) tourne la page, ou ouvre le chapitre voisin (les
 *   commandes s'en chargent) ; un glissement lent à la souris qui sélectionne du texte
 *   est laissé à la sélection, un glissement rapide ou au doigt tourne la page ;
 * - un clic dans une marge (hors du texte) tourne la page, selon le côté du livre.
 * @param container - Élément du livre
 * @param flip      - Instance page-flip
 * @param controls  - Commandes de la vue (page suivante ou précédente)
 * @returns Fonction qui retire les écouteurs
 */
function watchGestures(
  container: HTMLElement,
  flip: PageFlipInstance,
  controls: ViewControls,
): () => void {
  let gesture: {
    x: number;
    y: number;
    index: number;
    time: number;
    /** Texte déjà sélectionné au début du geste (une ancienne sélection ne bloque rien) */
    selected: string;
  } | null = null;
  // Pages pliées ou tournées par page-flip : un glissement tactile qu'il tourne après le
  // relâchement n'est pas refait
  let turns = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  flip.on("changeState", (event) => {
    if (event.data === "user_fold" || event.data === "flipping") turns += 1;
  });

  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const index = flip.getCurrentPageIndex();
    gesture = {
      x: event.clientX,
      y: event.clientY,
      index,
      time: event.timeStamp,
      selected: window.getSelection()?.toString() ?? "",
    };
  };

  const onUp = (event: PointerEvent) => {
    const start = gesture;
    gesture = null;
    if (!start) return;
    // Page pliée sous le pointeur : page-flip finit le geste (tourne ou rabat la page) ;
    // un pli refusé (limite du chapitre) n'a pas de calcul et reste aux commandes
    if (flip.getFlipController().getCalculation() !== null) return;
    const settled = turns;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const swipe =
      Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > SWIPE_RATIO * Math.abs(dy);
    // Glissement rapide (ou au doigt) : il tourne la page même commencé sur le texte ;
    // un glissement lent à la souris sélectionne du texte (surlignage, note)
    const flick =
      swipe &&
      (event.pointerType !== "mouse" ||
        event.timeStamp - start.time <= FLICK_MAX);
    const selection = window.getSelection();
    const selecting =
      selection !== null &&
      !selection.isCollapsed &&
      selection.toString() !== start.selected;
    if (selecting && !flick) return;
    // Sélection faite par le glissement lui-même : effacée (le menu se ferme)
    if (selecting) selection.removeAllRanges();

    if (swipe) {
      // page-flip traite le glissement tactile après pointerup : on attend sa décision
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (turns !== settled || flip.getCurrentPageIndex() !== start.index)
          return;
        if (dx < 0) controls.next();
        else controls.previous();
      }, SWIPE_SETTLE);
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    const light = target?.closest(".liseuse-page-legere") != null;
    if (
      Math.abs(dx) > TAP_MAX ||
      Math.abs(dy) > TAP_MAX ||
      target?.closest(light ? COMMANDS : NO_TURN)
    )
      return;
    const rect = container.getBoundingClientRect();
    if (event.clientX >= rect.left + rect.width / 2) controls.next();
    else controls.previous();
  };

  // Phase de capture : le texte arrête la propagation (sélection) avant page-flip
  container.addEventListener("pointerdown", onDown, true);
  container.addEventListener("pointerup", onUp, true);
  return () => {
    clearTimeout(timer);
    flip.off("changeState");
    container.removeEventListener("pointerdown", onDown, true);
    container.removeEventListener("pointerup", onUp, true);
  };
}

// ==================== COMPOSANT ====================

/** Livre à pages tournantes pour un chapitre. */
export function FlipView({
  chapter,
  settings,
  initial,
  watermark,
  highlights,
  controlsRef,
  onPosition,
  onNextChapter,
  onPreviousChapter,
  cover = null,
  backCover = null,
  promo = false,
  numbering = NO_NUMBERING,
  onLayout,
}: FlipViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Livre affiché et surlignages courants (redessinés sans repaginer)
  const bookRef = useRef<HTMLElement | null>(null);
  const highlightsRef = useRef(highlights);
  // Position courante (élément de pagination : 0 = titre, n = bloc n-1), mise à jour à
  // chaque page ; sert à rester au même endroit après une repagination. -1 = couverture,
  // où s'ouvre le premier chapitre lu depuis son début
  const onCover =
    Boolean(cover) &&
    initial.fraction === undefined &&
    initial.block === 0 &&
    initial.offset === 0;
  const positionRef = useRef({
    element: onCover ? -1 : initial.block + 1,
    offset: initial.offset,
  });
  // Ouverture à une part du chapitre (accès rapide) : convertie une fois les blocs mesurés
  const fractionRef = useRef(initial.fraction);
  const callbacks = useRef({
    onPosition,
    onNextChapter,
    onPreviousChapter,
    onLayout,
  });
  const numberingRef = useRef(numbering);
  const [layoutKey, setLayoutKey] = useState(0);

  useEffect(() => {
    callbacks.current = {
      onPosition,
      onNextChapter,
      onPreviousChapter,
      onLayout,
    };
  }, [onPosition, onNextChapter, onPreviousChapter, onLayout]);

  // Compte des pages du livre avancé : numéros réécrits sans repaginer
  useEffect(() => {
    numberingRef.current = numbering;
    if (bookRef.current) paintNumbers(bookRef.current, numbering);
  }, [numbering]);

  // Surlignage ajouté, recoloré ou retiré : redessin des pages existantes
  useEffect(() => {
    highlightsRef.current = highlights;
    if (bookRef.current) paintHighlights(bookRef.current, highlights);
  }, [highlights]);

  // Repagination après un redimensionnement (fenêtre, rotation de la tablette)
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = `${host.clientWidth}x${host.clientHeight}`;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const size = `${host.clientWidth}x${host.clientHeight}`;
        if (size !== last) {
          last = size;
          setLayoutKey((value) => value + 1);
        }
      }, RESIZE_DELAY);
    });
    observer.observe(host);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const { font, fontSize, lineHeight } = settings;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const build = async () => {
      const { PageFlip } =
        await import("page-flip/dist/js/page-flip.module.js");
      if (cancelled) return;

      const width = host.clientWidth;
      const height = host.clientHeight;
      const layout = layoutFor(width, height);
      const laid = await layoutChapter(host, chapter, layout, () => cancelled);
      if (!laid || cancelled) return;
      const { elements, pages, opener } = laid;
      // Même zone pour le compteur des pages du livre : mêmes pages, mêmes numéros
      callbacks.current.onLayout?.({ host, width, height });

      const lengths = elements
        .slice(1)
        .map((element) => element.textContent?.length ?? 0);
      if (fractionRef.current !== undefined) {
        const target = positionAtFraction(lengths, fractionRef.current);
        positionRef.current = {
          element: target.block + 1,
          offset: target.offset,
        };
        fractionRef.current = undefined;
      }
      const base = { chapter: chapter.position, padX: layout.padX };
      const textPages = pages.map((page, index) =>
        buildPage(anchoredPage(elements, page), {
          ...base,
          index,
          watermark,
          numbered: true,
          opener: opener && index === 0,
        }),
      );
      // Encart après le texte : sans numéro ni filigrane, hors des indices de pagination
      if (promo) {
        textPages.push(
          buildPage([buildPromoElement()], {
            ...base,
            index: pages.length,
            watermark: null,
            numbered: false,
          }),
        );
      }
      // Nombre pair en double page : une dernière page seule serait rigide
      if (layout.twoPages && textPages.length % 2 === 1) {
        textPages.push(
          buildPage([], {
            ...base,
            index: textPages.length,
            watermark: null,
            numbered: false,
          }),
        );
      }
      // Couvertures : seules sur leur double page (showCover pour la première, nombre
      // impair de pages pour la quatrième) ; « lead » décale les indices des pages de texte
      const lead = cover ? 1 : 0;
      const items = [
        ...(cover ? [buildCoverPage(cover)] : []),
        ...textPages,
        ...(backCover ? [buildCoverPage(backCover)] : []),
      ];
      const lastItem = items.length - 1;

      const container = document.createElement("div");
      container.className = "liseuse-livre";
      container.style.width = `${layout.twoPages ? 2 * layout.pageWidth : layout.pageWidth}px`;
      container.style.height = `${layout.pageHeight}px`;
      host.append(container);

      const { element, offset } = positionRef.current;
      const startPage =
        element < 0 ? 0 : pageIndexOf(pages, element, offset) + lead;
      const flip = new PageFlip(container, {
        width: layout.pageWidth,
        height: layout.pageHeight,
        size: "fixed",
        usePortrait: true,
        showCover: Boolean(cover),
        autoSize: false,
        startPage,
        flippingTime: 600,
        maxShadowOpacity: 0.3,
        mobileScrollSupport: false,
        showPageCorners: true,
        disableFlipByClick: true,
      });
      flip.loadFromHTML(items);
      bookRef.current = container;
      paintHighlights(container, highlightsRef.current);
      paintNumbers(container, numberingRef.current);

      // Dernière double page : elle contient la dernière page du livre affiché
      const spread = layout.twoPages ? 2 : 1;
      const isLastSpread = (index: number) => index + spread > lastItem;

      /** Signale la position du début de la page affichée (indice page-flip). */
      const report = (item: number) => {
        const index = Math.max(0, Math.min(item - lead, pages.length - 1));
        const start = pageStart(pages, index);
        positionRef.current =
          item < lead
            ? { element: -1, offset: 0 }
            : { element: start.block, offset: start.offset };
        const block = Math.max(0, start.block - 1);
        const offset = start.block === 0 ? 0 : start.offset;
        // Fin du chapitre dès que la double page montre la dernière page de texte
        const textEnd = index + spread >= pages.length;
        const fraction = textEnd ? 1 : chapterFraction(lengths, block, offset);
        callbacks.current.onPosition({
          block,
          offset,
          fraction,
          // Couverture affichée : pas de numéro de page
          page:
            item < lead
              ? undefined
              : {
                  current: Math.min(index + 1, pages.length),
                  total: pages.length,
                },
        });
      };
      flip.on("flip", (event) => report(event.data));
      report(startPage);

      const controls: ViewControls = {
        next: () => {
          const index = flip.getCurrentPageIndex();
          if (isLastSpread(index)) callbacks.current.onNextChapter();
          else flip.flipNext();
        },
        previous: () => {
          if (flip.getCurrentPageIndex() === 0)
            callbacks.current.onPreviousChapter();
          else flip.flipPrev();
        },
        goTo: (block, offset) => {
          const index = pageIndexOf(pages, block + 1, offset) + lead;
          if (index !== flip.getCurrentPageIndex()) flip.turnToPage(index);
          report(index);
        },
        goToFraction: (fraction) => {
          const target = positionAtFraction(lengths, fraction);
          controls.goTo(target.block, target.offset);
        },
      };
      controlsRef.current = controls;
      const removeGestures = watchGestures(container, flip, controls);

      dispose = () => {
        bookRef.current = null;
        removeGestures();
        flip.destroy();
        container.remove();
      };
    };

    void build();
    return () => {
      cancelled = true;
      controlsRef.current = null;
      dispose?.();
    };
  }, [
    chapter,
    font,
    fontSize,
    lineHeight,
    watermark,
    layoutKey,
    controlsRef,
    cover,
    backCover,
    promo,
  ]);

  return <div ref={hostRef} className="liseuse-flip" />;
}
