/**
 * =============================================================
 *  Fichier    : layout.ts (reader)
 *  Projet     : Kalami
 *  Description: Mise en pages d'un chapitre pour le mode « pages à tourner » : dimensions
 *               des pages selon la zone disponible, puis découpe mesurée dans une page
 *               cachée (polices et images chargées). Partagée par la vue et par le compteur
 *               des pages du livre, qui doivent obtenir exactement les mêmes pages.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: dom.ts, lib/reader/paginate.ts, lib/reader/opening.ts
 * =============================================================
 */

import type { ChapterPayload } from "@/lib/content/types";
import { paginate } from "@/lib/reader/paginate";
import { chapterKicker } from "@/lib/reader/opening";
import type { Page } from "@/lib/reader/types";

import {
  blockInfo,
  createMeasurer,
  openerEnd,
  parseBlock,
  preloadImages,
  titleElement,
} from "./dom";

/** Largeur minimale de la zone pour afficher deux pages côte à côte. */
const TWO_PAGES_MIN_WIDTH = 960;
/** Largeur maximale d'une page (confort de lecture : ~65 caractères par ligne). */
const MAX_PAGE_WIDTH = 640;
/** Marges intérieures d'une page (px) ; la marge basse laisse la place au numéro. */
export const PADDING = { x: 40, xSmall: 20, top: 36, bottom: 48 };

export type PageLayout = ReturnType<typeof layoutFor>;

/** Dimensions des pages selon la zone disponible. */
export function layoutFor(width: number, height: number) {
  const twoPages = width >= TWO_PAGES_MIN_WIDTH && width > height;
  const pageWidth = Math.floor(
    Math.min(twoPages ? width / 2 : width, MAX_PAGE_WIDTH),
  );
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

/** Chapitre découpé : éléments (titre compris), pages et présence d'une page d'ouverture. */
export type ChapterLayout = {
  elements: HTMLElement[];
  pages: Page[];
  opener: boolean;
};

/**
 * Découpe un chapitre en pages aux dimensions données.
 * @param host    - Élément qui porte les réglages de lecture (police, taille, interligne)
 * @param chapter - Chapitre chargé
 * @param layout  - Dimensions des pages
 * @returns Éléments et pages, ou null si l'appelant a annulé pendant le chargement
 */
export async function layoutChapter(
  host: HTMLElement,
  chapter: ChapterPayload,
  layout: PageLayout,
  cancelled: () => boolean = () => false,
): Promise<ChapterLayout | null> {
  // Mesurer avec les vraies polices, une fois chargées
  await document.fonts.ready;
  const kicker = chapterKicker(chapter.blocks);
  const elements = [
    titleElement(chapter.title, kicker),
    ...chapter.blocks.map(parseBlock),
  ];
  // Les schémas doivent avoir leur vraie hauteur au moment de la mesure
  const images = await preloadImages(elements);
  if (cancelled()) return null;

  const infos = elements.map(blockInfo);
  // Page d'ouverture d'un module : surtitre, titre et chapeau seuls sur leur page
  const end = openerEnd(elements, kicker);
  if (end !== null) infos[end] = { ...infos[end], breakAfter: true };

  const measurer = createMeasurer(
    host,
    elements,
    layout.contentWidth,
    layout.contentHeight,
  );
  const pages = paginate(infos, measurer.fits);
  measurer.dispose();
  images.length = 0;
  return { elements, pages, opener: end !== null };
}
