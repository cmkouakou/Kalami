/**
 * =============================================================
 *  Fichier    : flip-view.tsx (reader)
 *  Projet     : Kalami
 *  Description: Mode « pages à tourner » : le chapitre est paginé selon la taille de l'écran
 *               et les réglages (mesure réelle dans une page cachée), puis affiché avec
 *               page-flip (deux pages sur grand écran, une sur tablette en portrait).
 *               La position (bloc + décalage) survit aux changements de taille et de police.
 *               Les pages sont créées hors de React : page-flip déplace leurs nœuds.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: page-flip, dom.ts, lib/reader/paginate.ts, lib/reader/position.ts
 * =============================================================
 */

"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { getDictionary, interpolate } from "@/i18n";
import type { ChapterPayload } from "@/lib/content/types";
import { pageIndexOf, pageStart, paginate } from "@/lib/reader/paginate";
import { chapterFraction } from "@/lib/reader/position";
import type { Page, ReaderSettings } from "@/lib/reader/types";

import { blockInfo, createMeasurer, parseBlock, renderPage, titleElement } from "./dom";

const t = getDictionary();

/** Largeur minimale de la zone pour afficher deux pages côte à côte. */
const TWO_PAGES_MIN_WIDTH = 960;
/** Largeur maximale d'une page (confort de lecture : ~65 caractères par ligne). */
const MAX_PAGE_WIDTH = 640;
/** Marges intérieures d'une page (px) ; la marge basse laisse la place au numéro. */
const PADDING = { x: 40, xSmall: 20, top: 36, bottom: 48 };
/** Délai avant de repaginer après un redimensionnement (ms). */
const RESIZE_DELAY = 250;

/** Commandes appelées par la barre d'outils, le clavier et la lecture à voix haute. */
export type ViewControls = {
  next: () => void;
  previous: () => void;
  goTo: (block: number, offset: number) => void;
};

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
  initial: { block: number; offset: number };
  watermark: string | null;
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
  page.style.padding = `${PADDING.top}px ${padX}px ${PADDING.bottom}px`;

  const text = document.createElement("div");
  text.className = "liseuse-texte";
  text.append(...content);
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

// ==================== COMPOSANT ====================

/** Livre à pages tournantes pour un chapitre. */
export function FlipView({
  chapter,
  settings,
  initial,
  watermark,
  controlsRef,
  onPosition,
  onNextChapter,
  onPreviousChapter,
}: FlipViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Position courante (élément de pagination : 0 = titre, n = bloc n-1), mise à jour à
  // chaque page ; sert à rester au même endroit après une repagination
  const positionRef = useRef({ element: initial.block + 1, offset: initial.offset });
  const callbacks = useRef({ onPosition, onNextChapter, onPreviousChapter });
  const [layoutKey, setLayoutKey] = useState(0);

  useEffect(() => {
    callbacks.current = { onPosition, onNextChapter, onPreviousChapter };
  }, [onPosition, onNextChapter, onPreviousChapter]);

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

      const layout = layoutFor(host.clientWidth, host.clientHeight);
      const elements = [titleElement(chapter.title), ...chapter.blocks.map(parseBlock)];
      const measurer = createMeasurer(host, elements, layout.contentWidth, layout.contentHeight);
      const pages: Page[] = paginate(elements.map(blockInfo), measurer.fits);
      measurer.dispose();

      const lengths = elements.slice(1).map((element) => element.textContent?.length ?? 0);
      const items = pages.map((page, index) =>
        buildPage(
          renderPage(elements, page),
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
        disableFlipByClick: false,
      });
      flip.loadFromHTML(items);

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

      controlsRef.current = {
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
      };

      dispose = () => {
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
