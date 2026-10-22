/**
 * =============================================================
 *  Fichier    : use-book-pages.ts (reader)
 *  Projet     : Kalami
 *  Description: Nombre de pages de chaque partie lisible du livre, pour numéroter les pages
 *               du début à la fin comme un livre imprimé. Les parties sont chargées une à
 *               une en arrière-plan (requêtes espacées : la limite est de 30 par minute),
 *               puis découpées aux dimensions et réglages de la vue affichée. Tout changement
 *               de taille ou de réglage relance le compte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: layout.ts, use-chapter.ts
 * =============================================================
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { layoutChapter, layoutFor } from "./layout";
import type { ChapterStore } from "./use-chapter";

/** Attente avant chaque partie pas encore chargée (ms) : moins de 30 requêtes par minute. */
const FETCH_GAP = 2100;

/** Zone de mesure signalée par la vue « pages à tourner ». */
export type MeasureTarget = {
  host: HTMLElement;
  width: number;
  height: number;
};

/** Pages par partie (numéro de chapitre → nombre de pages) pour une mise en pages donnée. */
type Counts = { signature: string; pages: Map<number, number> };

/** Numérotation d'une page dans le livre. */
export type BookPage = { number: number; total: number | null };

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Compte les pages des parties lisibles, dans l'ordre du livre.
 * @param store     - Cache des chapitres
 * @param chapters  - Numéros des parties lisibles, dans l'ordre
 * @param target    - Zone de mesure de la vue, ou null (défilement : rien à compter)
 * @param signature - Réglages qui changent la mise en pages (police, taille, interligne)
 * @returns Fonction qui donne le numéro d'une page dans le livre, ou null tant que les
 *          parties précédentes ne sont pas comptées
 */
export function useBookPages(
  store: ChapterStore,
  chapters: number[],
  target: MeasureTarget | null,
  signature: string,
) {
  const [counts, setCounts] = useState<Counts | null>(null);
  // Dernier compte, repris quand la vue change de chapitre (nouvel hôte, mêmes dimensions)
  const countsRef = useRef(counts);
  const key = target ? `${target.width}x${target.height}|${signature}` : "";
  const list = chapters.join(",");

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    const isCancelled = () => cancelled || !target.host.isConnected;
    const layout = layoutFor(target.width, target.height);

    const run = async () => {
      const previous = countsRef.current;
      const pages = new Map(previous?.signature === key ? previous.pages : []);
      for (const position of list.split(",").map(Number)) {
        if (pages.has(position)) continue;
        if (!store.has(position)) await pause(FETCH_GAP);
        if (isCancelled()) return;
        const result = await store.get(position);
        // Partie illisible (erreur, limite atteinte) : la numérotation s'arrête là
        if (result.status !== "ready" || isCancelled()) return;
        const laid = await layoutChapter(
          target.host,
          result.chapter,
          layout,
          isCancelled,
        );
        if (!laid) return;
        pages.set(position, laid.pages.length);
        countsRef.current = { signature: key, pages: new Map(pages) };
        setCounts(countsRef.current);
        // Laisser respirer l'affichage entre deux parties
        await pause(0);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [store, list, target, key]);

  const current = counts?.signature === key ? counts.pages : null;

  /**
   * Numéro dans le livre d'une page d'une partie.
   * @param chapter - Numéro de la partie
   * @param index   - Indice de la page dans la partie (0 = première)
   */
  return useCallback(
    (chapter: number, index: number): BookPage | null => {
      if (!current) return null;
      let before = 0;
      for (const position of chapters) {
        if (position === chapter) break;
        const count = current.get(position);
        if (count === undefined) return null;
        before += count;
      }
      const complete = chapters.every((position) => current.has(position));
      const total = complete
        ? chapters.reduce((sum, p) => sum + (current.get(p) ?? 0), 0)
        : null;
      return { number: before + index + 1, total };
    },
    [current, chapters],
  );
}
