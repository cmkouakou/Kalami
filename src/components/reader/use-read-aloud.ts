/**
 * =============================================================
 *  Fichier    : use-read-aloud.ts (reader)
 *  Projet     : Kalami
 *  Description: Lecture à voix haute par la synthèse vocale du navigateur (Web Speech).
 *               Un énoncé par bloc : la liseuse suit la lecture (page ou défilement) et
 *               les navigateurs ne coupent pas les textes longs.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: react, API Web Speech (speechSynthesis)
 * =============================================================
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ReadAloudStatus = "idle" | "speaking" | "paused";

/** Langue de la synthèse selon la langue du livre. */
const VOICE_LANGUAGES: Record<string, string> = { fr: "fr-FR", en: "en-US" };

/**
 * Commandes de lecture à voix haute.
 * @param language - Langue du livre (« fr », « en »)
 * @param onBlock  - Appelée au début de chaque bloc lu (indice du bloc)
 * @param onFinish - Appelée à la fin du dernier bloc (passage au chapitre suivant)
 */
export function useReadAloud(
  language: string,
  onBlock: (index: number) => void,
  onFinish: () => void,
) {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  // Numéro de session : un énoncé d'une lecture arrêtée ne relance rien
  const session = useRef(0);
  const callbacks = useRef({ onBlock, onFinish });

  useEffect(() => {
    callbacks.current = { onBlock, onFinish };
  }, [onBlock, onFinish]);

  const stop = useCallback(() => {
    session.current += 1;
    if (supported) window.speechSynthesis.cancel();
    setStatus("idle");
  }, [supported]);

  /**
   * Lit les blocs à partir d'un indice, l'un après l'autre.
   * @param texts - Texte brut de chaque bloc du chapitre
   * @param first - Premier bloc à lire
   */
  const start = useCallback(
    (texts: string[], first: number) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const current = ++session.current;

      const speak = (index: number) => {
        if (session.current !== current) return;
        if (index >= texts.length) {
          setStatus("idle");
          callbacks.current.onFinish();
          return;
        }
        if (!texts[index].trim()) {
          speak(index + 1);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(texts[index]);
        utterance.lang = VOICE_LANGUAGES[language] ?? language;
        utterance.onstart = () => callbacks.current.onBlock(index);
        utterance.onend = () => speak(index + 1);
        utterance.onerror = (event) => {
          // « interrupted » / « canceled » : arrêt volontaire, rien à signaler
          if (event.error !== "interrupted" && event.error !== "canceled") stop();
        };
        window.speechSynthesis.speak(utterance);
      };

      setStatus("speaking");
      speak(Math.max(0, first));
    },
    [supported, language, stop],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("speaking");
  }, [supported]);

  // Fermeture de la liseuse : la voix s'arrête
  useEffect(
    () => () => {
      session.current += 1;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  return { supported, status, start, pause, resume, stop };
}
