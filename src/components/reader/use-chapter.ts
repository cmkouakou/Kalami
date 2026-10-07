/**
 * =============================================================
 *  Fichier    : use-chapter.ts (reader)
 *  Projet     : Kalami
 *  Description: Chargement des chapitres par l'API protégée, avec un cache en mémoire
 *               (jamais sur disque : le contenu n'est conservé que le temps de la lecture).
 *               403 → écran de fin d'extrait ; 429 → message d'attente ; autre → réessai.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/content/types.ts, API /api/livres/{id}/chapitres/{n}
 * =============================================================
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChapterPayload } from "@/lib/content/types";

export type ChapterState =
  | { status: "loading" }
  | { status: "ready"; chapter: ChapterPayload }
  | { status: "locked" }
  | { status: "error"; rateLimited: boolean };

type FetchResult = Exclude<ChapterState, { status: "loading" }>;

// ==================== CACHE ====================

/** Cache des chapitres d'un livre pour la session de lecture. */
export class ChapterStore {
  private readonly results = new Map<number, Promise<FetchResult>>();

  constructor(private readonly bookId: string) {}

  /**
   * Chapitre demandé (requête unique, même en cas d'appels simultanés).
   * Les erreurs ne sont pas gardées en cache : un nouvel essai refait la requête.
   */
  get(position: number): Promise<FetchResult> {
    const cached = this.results.get(position);
    if (cached) return cached;
    const request = this.fetchChapter(position);
    this.results.set(position, request);
    request.then((result) => {
      if (result.status === "error") this.results.delete(position);
    });
    return request;
  }

  /** Précharge un chapitre sans attendre la réponse. */
  prefetch(position: number): void {
    void this.get(position);
  }

  private async fetchChapter(position: number): Promise<FetchResult> {
    try {
      const response = await fetch(`/api/livres/${this.bookId}/chapitres/${position}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (response.status === 403) return { status: "locked" };
      if (!response.ok) return { status: "error", rateLimited: response.status === 429 };
      return { status: "ready", chapter: (await response.json()) as ChapterPayload };
    } catch {
      return { status: "error", rateLimited: false };
    }
  }
}

// ==================== HOOK ====================

/**
 * État du chapitre courant.
 * @param store    - Cache des chapitres du livre
 * @param position - Chapitre à afficher
 * @param readable - Faux pour un chapitre réservé : aucune requête, écran de fin d'extrait
 * @returns État et fonction de nouvel essai
 */
export function useChapter(store: ChapterStore, position: number, readable: boolean) {
  const [state, setState] = useState<{ key: string; value: ChapterState }>({
    key: "",
    value: { status: "loading" },
  });
  const [attempt, setAttempt] = useState(0);
  const key = `${position}:${attempt}`;

  useEffect(() => {
    if (!readable) return;
    let active = true;
    store.get(position).then((value) => {
      if (active) setState({ key, value });
    });
    return () => {
      active = false;
    };
  }, [store, position, readable, key]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const current: ChapterState = !readable
    ? { status: "locked" }
    : state.key === key
      ? state.value
      : { status: "loading" };
  return { state: current, retry };
}
