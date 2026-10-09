/**
 * =============================================================
 *  Fichier    : scroll-view.tsx (reader)
 *  Projet     : Kalami
 *  Description: Mode défilement (par défaut sur téléphone) : un chapitre à la fois, texte
 *               continu, bouton « Chapitre suivant » en bas. La position suivie est le
 *               premier bloc visible ; le filigrane se déplace légèrement toutes les minutes.
 *               Les surlignages sont dessinés dans les blocs (texte inchangé).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-10
 *  Dépendances: flip-view.tsx (types communs), highlight-dom.ts
 * =============================================================
 */

"use client";

import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";

import type { ChapterPayload } from "@/lib/content/types";
import type { Highlight } from "@/lib/reader/types";

import type { ViewControls, ViewPosition } from "./flip-view";
import { paintHighlights } from "./highlight-dom";

/** Intervalle de déplacement du filigrane (ms). */
const WATERMARK_SHIFT_MS = 60_000;
/** Part de la hauteur visible parcourue par « page suivante ». */
const PAGE_SCROLL_RATIO = 0.9;

type ScrollViewProps = {
  chapter: ChapterPayload;
  initial: { block: number; offset: number };
  watermark: string | null;
  /** Surlignages du chapitre, du plus ancien au plus récent */
  highlights: Highlight[];
  controlsRef: RefObject<ViewControls | null>;
  onPosition: (position: ViewPosition) => void;
  /** Bas du chapitre : bouton du chapitre suivant ou écran de fin d'extrait */
  footer: ReactNode;
};

/** Texte défilant d'un chapitre. */
export function ScrollView({
  chapter,
  initial,
  watermark,
  highlights,
  controlsRef,
  onPosition,
  footer,
}: ScrollViewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const onPositionRef = useRef(onPosition);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

  // Commandes, ouverture à la position demandée et suivi du défilement
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const blockAt = (index: number) =>
      scroller.querySelector<HTMLElement>(`[data-bloc="${index}"]`);

    const report = () => {
      const top = scroller.getBoundingClientRect().top;
      const blocks = scroller.querySelectorAll<HTMLElement>("[data-bloc]");
      let block = 0;
      for (const element of blocks) {
        if (element.getBoundingClientRect().bottom > top + 1) {
          block = Number(element.dataset.bloc);
          break;
        }
      }
      const range = scroller.scrollHeight - scroller.clientHeight;
      const fraction = range > 0 ? Math.min(1, scroller.scrollTop / range) : 1;
      onPositionRef.current({ block, offset: 0, fraction });
    };

    const scrollScreen = (direction: 1 | -1) =>
      scroller.scrollBy({
        top: direction * scroller.clientHeight * PAGE_SCROLL_RATIO,
        behavior: "smooth",
      });
    controlsRef.current = {
      next: () => scrollScreen(1),
      previous: () => scrollScreen(-1),
      goTo: (block) => {
        blockAt(block)?.scrollIntoView({ block: "start" });
        report();
      },
    };

    // Bloc au-delà de la fin (retour au chapitre précédent) : ouverture en bas du texte
    const opening = initial.block > 0 ? blockAt(initial.block) : null;
    if (opening) opening.scrollIntoView({ block: "start" });
    else scroller.scrollTop = initial.block > 0 ? scroller.scrollHeight : 0;
    report();

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(report);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      controlsRef.current = null;
    };
    // La position d'ouverture n'est lue qu'au montage (vue recréée à chaque chapitre)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, controlsRef]);

  // Surlignages du chapitre (redessinés à chaque ajout, changement ou retrait)
  useEffect(() => {
    if (articleRef.current) paintHighlights(articleRef.current, highlights);
  }, [chapter, highlights]);

  // Déplacement régulier du filigrane (gêne le recadrage des captures d'écran)
  useEffect(() => {
    if (!watermark) return;
    const timer = setInterval(() => setShift((value) => (value + 1) % 4), WATERMARK_SHIFT_MS);
    return () => clearInterval(timer);
  }, [watermark]);

  return (
    <div className="relative h-full">
      <div ref={scrollerRef} className="liseuse-defilement h-full overflow-y-auto">
        <article
          ref={articleRef}
          className="liseuse-texte mx-auto max-w-[42rem] px-5 py-10 sm:px-8"
        >
          <h1 className="liseuse-titre-chapitre">{chapter.title}</h1>
          {chapter.blocks.map((html, index) => (
            <div
              key={index}
              data-bloc={index}
              // Blocs nettoyés par liste blanche côté serveur (lib/content/sanitize.ts)
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
          <div className="mt-10">{footer}</div>
        </article>
      </div>
      {watermark && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {[0, 1, 2].map((row) => (
            <span
              key={row}
              className="liseuse-filigrane"
              style={{
                top: `${15 + row * 30 + shift * 4}%`,
                left: `${8 + ((row + shift) % 3) * 12}%`,
              }}
            >
              {watermark}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
