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
 *  Auteur     : Claude Marcel
 *  Version    : 1.4
 *  Date       : 2026-10-17
 *  Dépendances: page-flip, dom.ts, highlight-dom.ts, lib/reader/paginate.ts,
 *               lib/reader/position.ts
 * =============================================================
 */

"use client";

import type { PageFlip as PageFlipInstance } from "page-flip/dist/js/page-flip.module.js";
import { type RefObject, useEffect, useRef, useState } from "react";

import { getDictionary, interpolate } from "@/i18n";
import type { ChapterPayload } from "@/lib/content/types";
import { pageIndexOf, pageStart, paginate } from "@/lib/reader/paginate";
import { chapterKicker } from "@/lib/reader/opening";
import { chapterFraction, positionAtFraction } from "@/lib/reader/position";
import type { Highlight, Page, ReaderSettings } from "@/lib/reader/types";

import {
  blockInfo,
  createMeasurer,
  parseBlock,
  preloadImages,
  renderPage,
  titleElement,
} from "./dom";
import { paintHighlights } from "./highlight-dom";

const t = getDictionary();

/** Largeur minimale de la zone pour afficher deux pages côte à côte. */
const TWO_PAGES_MIN_WIDTH = 960;
/** Largeur maximale d'une page (confort de lecture : ~65 caractères par ligne). */
const MAX_PAGE_WIDTH = 640;
/** Marges intérieures d'une page (px) ; la marge basse laisse la place au numéro. */
const PADDING = { x: 40, xSmall: 20, top: 36, bottom: 48 };
/** Délai avant de repaginer après un redimensionnement (ms). */
const RESIZE_DELAY = 250;
/** Distance horizontale minimale d'un glissement qui tourne la page (px). */
const SWIPE_MIN = 50;
/** Déplacement maximal d'un simple clic (px). */
const TAP_MAX = 6;
/** Éléments dont le clic ne tourne jamais la page. */
const NO_TURN = ".liseuse-page-texte, a, button, input, textarea";

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
};

// ==================== OUTILS ====================

/** Dimensions des pages selon la zone disponible. */
function layoutFor(width: number, height: number) {
  const twoPages = width >= TWO_PAGES_MIN_WIDTH && width > height;
  const pageWidth = Math.floor(Math.min(twoPages ? width / 2 : width, MAX_PAGE_WIDTH));
  const padX = pageWidth < 480 ? PADDING.xSmall : PADDING.x;
  return {
    twoPages,
    pageWidth,
    pageHeight: Math.floor(height),
    padX,
    contentWidth: pageWidth - 2 * padX,
    contentHeight: Math.floor(height) - PADDING.top - PADDING.bottom,
  };
}

/** Décalage du filigrane, légèrement différent d'une page à l'autre. */
function watermarkOffset(chapter: number, page: number): { top: number; left: number } {
  const seed = (chapter * 37 + page * 53) % 97;
  return { top: 18 + (seed % 55), left: 6 + ((seed * 7) % 30) };
}

/**
 * Crée l'élément d'une page (texte, filigrane, numéro).
 * @param content   - Éléments du texte de la page
 * @param index     - Indice de la page
 * @param total     - Nombre de pages du chapitre
 * @param chapter   - Numéro du chapitre (variation du filigrane)
 * @param watermark - Texte du filigrane, ou null
 * @param padX      - Marge latérale (px)
 */
function buildPage(
  content: HTMLElement[],
  index: number,
  total: number,
  chapter: number,
  watermark: string | null,
  padX: number,
): HTMLElement {
  const page = document.createElement("div");
  page.className = "liseuse-page";

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

  if (index < total) {
    const number = document.createElement("span");
    number.className = "liseuse-numero";
    number.textContent = `${index + 1} / ${total}`;
    number.setAttribute(
      "aria-label",
      interpolate(t.reader.pageOf, { current: String(index + 1), total: String(total) }),
    );
    page.append(number);
  }
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

type GestureOptions = {
  isFirst: (index: number) => boolean;
  isLast: (index: number) => boolean;
  controls: ViewControls;
  callbacks: RefObject<{ onNextChapter: () => void; onPreviousChapter: () => void }>;
};

/**
 * Complète les gestes de page-flip :
 * - aux limites du chapitre, page-flip ne tourne rien : glisser vers la gauche sur la
 *   dernière double page ouvre le chapitre suivant, vers la droite sur la première, le
 *   précédent (un glissement qui sélectionne du texte est ignoré) ;
 * - un clic dans une marge (hors du texte) tourne la page, selon le côté du livre.
 * @param container - Élément du livre
 * @param flip      - Instance page-flip
 * @param options   - Limites du chapitre, commandes et rappels de changement de chapitre
 * @returns Fonction qui retire les écouteurs
 */
function watchGestures(
  container: HTMLElement,
  flip: PageFlipInstance,
  { isFirst, isLast, controls, callbacks }: GestureOptions,
): () => void {
  let gesture: { x: number; y: number; index: number; flipped: boolean } | null = null;

  // Une page tournée par page-flip pendant le geste : rien à ajouter
  flip.on("changeState", (event) => {
    if (gesture && event.data === "flipping") gesture.flipped = true;
  });

  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const index = flip.getCurrentPageIndex();
    gesture = { x: event.clientX, y: event.clientY, index, flipped: false };
  };

  const onUp = (event: PointerEvent) => {
    const start = gesture;
    gesture = null;
    if (!start || start.flipped) return;
    if (!(window.getSelection()?.isCollapsed ?? true)) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      if (flip.getCurrentPageIndex() !== start.index) return;
      if (dx < 0 && isLast(start.index)) callbacks.current?.onNextChapter();
      else if (dx > 0 && isFirst(start.index)) callbacks.current?.onPreviousChapter();
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    if (Math.abs(dx) > TAP_MAX || Math.abs(dy) > TAP_MAX || target?.closest(NO_TURN)) return;
    const rect = container.getBoundingClientRect();
    if (event.clientX >= rect.left + rect.width / 2) controls.next();
    else controls.previous();
  };

  // Phase de capture : le texte arrête la propagation (sélection) avant page-flip
  container.addEventListener("pointerdown", onDown, true);
  container.addEventListener("pointerup", onUp, true);
  return () => {
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
}: FlipViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Livre affiché et surlignages courants (redessinés sans repaginer)
  const bookRef = useRef<HTMLElement | null>(null);
  const highlightsRef = useRef(highlights);
  // Position courante (élément de pagination : 0 = titre, n = bloc n-1), mise à jour à
  // chaque page ; sert à rester au même endroit après une repagination
  const positionRef = useRef({ element: initial.block + 1, offset: initial.offset });
  // Ouverture à une part du chapitre (accès rapide) : convertie une fois les blocs mesurés
  const fractionRef = useRef(initial.fraction);
  const callbacks = useRef({ onPosition, onNextChapter, onPreviousChapter });
  const [layoutKey, setLayoutKey] = useState(0);

  useEffect(() => {
    callbacks.current = { onPosition, onNextChapter, onPreviousChapter };
  }, [onPosition, onNextChapter, onPreviousChapter]);

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
      // Mesurer avec les vraies polices, une fois chargées
      await document.fonts.ready;
      const { PageFlip } = await import("page-flip/dist/js/page-flip.module.js");
      if (cancelled) return;

      const elements = [
        titleElement(chapter.title, chapterKicker(chapter.blocks)),
        ...chapter.blocks.map(parseBlock),
      ];
      // Les schémas doivent avoir leur vraie hauteur au moment de la mesure
      const images = await preloadImages(elements);
      if (cancelled) return;

      const layout = layoutFor(host.clientWidth, host.clientHeight);
      const measurer = createMeasurer(host, elements, layout.contentWidth, layout.contentHeight);
      const pages: Page[] = paginate(elements.map(blockInfo), measurer.fits);
      measurer.dispose();
      images.length = 0;

      const lengths = elements.slice(1).map((element) => element.textContent?.length ?? 0);
      if (fractionRef.current !== undefined) {
        const target = positionAtFraction(lengths, fractionRef.current);
        positionRef.current = { element: target.block + 1, offset: target.offset };
        fractionRef.current = undefined;
      }
      const items = pages.map((page, index) =>
        buildPage(
          anchoredPage(elements, page),
          index,
          pages.length,
          chapter.position,
          watermark,
          layout.padX,
        ),
      );
      // Nombre pair en double page : une dernière page seule serait rigide
      if (layout.twoPages && items.length % 2 === 1) {
        items.push(buildPage([], items.length, pages.length, chapter.position, null, layout.padX));
      }

      const container = document.createElement("div");
      container.className = "liseuse-livre";
      container.style.width = `${layout.twoPages ? 2 * layout.pageWidth : layout.pageWidth}px`;
      container.style.height = `${layout.pageHeight}px`;
      host.append(container);

      const { element, offset } = positionRef.current;
      const startPage = pageIndexOf(pages, element, offset);
      const flip = new PageFlip(container, {
        width: layout.pageWidth,
        height: layout.pageHeight,
        size: "fixed",
        usePortrait: true,
        showCover: false,
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

      const spread = layout.twoPages ? 2 : 1;
      const isLastSpread = (index: number) => index + spread >= pages.length;

      /** Signale la position du début de la page affichée. */
      const report = (index: number) => {
        const start = pageStart(pages, Math.min(index, pages.length - 1));
        positionRef.current = { element: start.block, offset: start.offset };
        const block = Math.max(0, start.block - 1);
        const offset = start.block === 0 ? 0 : start.offset;
        const fraction = isLastSpread(index) ? 1 : chapterFraction(lengths, block, offset);
        callbacks.current.onPosition({
          block,
          offset,
          fraction,
          page: { current: Math.min(index + 1, pages.length), total: pages.length },
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
          if (flip.getCurrentPageIndex() === 0) callbacks.current.onPreviousChapter();
          else flip.flipPrev();
        },
        goTo: (block, offset) => {
          const index = pageIndexOf(pages, block + 1, offset);
          if (index !== flip.getCurrentPageIndex()) flip.turnToPage(index);
          report(index);
        },
        goToFraction: (fraction) => {
          const target = positionAtFraction(lengths, fraction);
          controls.goTo(target.block, target.offset);
        },
      };
      controlsRef.current = controls;
      const removeGestures = watchGestures(container, flip, {
        isFirst: (index) => index === 0,
        isLast: isLastSpread,
        controls,
        callbacks,
      });

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
  }, [chapter, font, fontSize, lineHeight, watermark, layoutKey, controlsRef]);

  return <div ref={hostRef} className="liseuse-flip" />;
}
