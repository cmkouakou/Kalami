/**
 * =============================================================
 *  Fichier    : use-read-aloud.ts (reader)
 *  Projet     : Kalami
 *  Description: Lecture à voix haute par la synthèse vocale du navigateur (Web Speech).
 *               La liseuse suit la lecture bloc par bloc (page ou défilement) ; chaque
 *               bloc est lu phrase par phrase, car les navigateurs coupent les énoncés
 *               longs.
 *               v1.1 : la voix la plus naturelle de la langue est choisie d'office ;
 *               choix de la voix et de la vitesse (mémorisés sur l'appareil), extrait
 *               d'essai ; un changement en cours de lecture reprend au bloc courant.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-29
 *  Dépendances: react, API Web Speech (speechSynthesis), lib/reader/voices.ts, storage.ts
 * =============================================================
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { rankVoices, SPEECH_RATES, splitForSpeech } from "@/lib/reader/voices";

import { loadVoicePrefs, saveVoicePrefs, type VoicePrefs } from "./storage";

export type ReadAloudStatus = "idle" | "speaking" | "paused";

/** Langue de la synthèse selon la langue du livre. */
const VOICE_LANGUAGES: Record<string, string> = { fr: "fr-FR", en: "en-US" };

/** Phrase lue pour essayer une voix. */
const SAMPLE_TEXTS: Record<string, string> = {
  fr: "Bonjour, je serai votre voix de lecture pour ce livre.",
  en: "Hello, I will be your reading voice for this book.",
};

/** Énoncé à lire : un morceau d'un bloc. */
type Chunk = { block: number; text: string; first: boolean };

/**
 * Énoncés d'un chapitre à partir d'un bloc.
 * @param texts - Texte brut de chaque bloc du chapitre
 * @param first - Premier bloc à lire
 * @returns Morceaux dans l'ordre de lecture (les blocs vides sont sautés)
 */
function chunksFrom(texts: string[], first: number): Chunk[] {
  return texts.slice(first).flatMap((text, offset) =>
    splitForSpeech(text).map((piece, index) => ({
      block: first + offset,
      text: piece,
      first: index === 0,
    })),
  );
}

/**
 * Voix disponibles dans le navigateur. La liste arrive souvent après le chargement
 * (Chrome, Edge) : elle est relue à chaque événement « voiceschanged ».
 */
function useBrowserVoices(supported: boolean): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const read = () => setVoices(synth.getVoices());
    read();
    synth.addEventListener("voiceschanged", read);
    return () => synth.removeEventListener("voiceschanged", read);
  }, [supported]);
  return voices;
}

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
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [prefs, setPrefs] = useState<VoicePrefs>(() =>
    supported ? loadVoicePrefs() : { voices: {}, rate: 1 },
  );
  const browserVoices = useBrowserVoices(supported);
  const voices = useMemo(
    () => rankVoices(browserVoices, language),
    [browserVoices, language],
  );
  // Voix choisie si elle existe encore sur l'appareil, sinon la plus naturelle
  const voice =
    voices.find((item) => item.voiceURI === prefs.voices[language]) ??
    voices[0] ??
    null;
  const rate = SPEECH_RATES[prefs.rate] ?? 1;

  // Numéro de session : un énoncé d'une lecture arrêtée ne relance rien
  const session = useRef(0);
  const callbacks = useRef({ onBlock, onFinish });
  const settings = useRef<{ voice: SpeechSynthesisVoice | null; rate: number }>({
    voice,
    rate,
  });
  // Lecture en cours : textes du chapitre et bloc lu, pour reprendre après un réglage
  const reading = useRef<{ texts: string[]; block: number } | null>(null);

  useEffect(() => {
    callbacks.current = { onBlock, onFinish };
  }, [onBlock, onFinish]);

  useEffect(() => {
    settings.current = { voice, rate };
  }, [voice, rate]);

  /**
   * Prépare un énoncé avec la voix et la vitesse choisies.
   * @param text - Texte à dire
   */
  const utter = useCallback(
    (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const { voice: current, rate: speed } = settings.current;
      if (current) utterance.voice = current;
      utterance.lang = current?.lang ?? VOICE_LANGUAGES[language] ?? language;
      utterance.rate = speed;
      return utterance;
    },
    [language],
  );

  const stop = useCallback(() => {
    session.current += 1;
    reading.current = null;
    if (supported) window.speechSynthesis.cancel();
    setStatus("idle");
  }, [supported]);

  /**
   * Lit les blocs à partir d'un indice, phrase après phrase.
   * @param texts - Texte brut de chaque bloc du chapitre
   * @param first - Premier bloc à lire
   */
  const start = useCallback(
    (texts: string[], first: number) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const current = ++session.current;
      const chunks = chunksFrom(texts, Math.max(0, first));
      reading.current = { texts, block: Math.max(0, first) };

      const speak = (index: number) => {
        if (session.current !== current) return;
        if (index >= chunks.length) {
          reading.current = null;
          setStatus("idle");
          callbacks.current.onFinish();
          return;
        }
        const chunk = chunks[index];
        const utterance = utter(chunk.text);
        utterance.onstart = () => {
          if (reading.current) reading.current.block = chunk.block;
          if (chunk.first) callbacks.current.onBlock(chunk.block);
        };
        utterance.onend = () => speak(index + 1);
        utterance.onerror = (event) => {
          // « interrupted » / « canceled » : arrêt volontaire, rien à signaler
          if (event.error !== "interrupted" && event.error !== "canceled")
            stop();
        };
        window.speechSynthesis.speak(utterance);
      };

      setStatus("speaking");
      speak(0);
    },
    [supported, utter, stop],
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

  /**
   * Enregistre un réglage ; en cours de lecture, reprend au bloc courant pour l'entendre.
   * @param patch - Voix ou vitesse modifiée
   */
  const updatePrefs = useCallback(
    (patch: (prefs: VoicePrefs) => VoicePrefs) => {
      setPrefs((previous) => {
        const next = patch(previous);
        saveVoicePrefs(next);
        return next;
      });
    },
    [],
  );

  /** Réglage changé pendant la lecture : le bloc courant est relu avec la nouvelle voix. */
  const restart = useCallback(() => {
    if (reading.current) start(reading.current.texts, reading.current.block);
  }, [start]);

  const chooseVoice = useCallback(
    (voiceURI: string) => {
      updatePrefs((previous) => ({
        ...previous,
        voices: { ...previous.voices, [language]: voiceURI },
      }));
      const chosen = voices.find((item) => item.voiceURI === voiceURI);
      settings.current = { ...settings.current, voice: chosen ?? null };
      restart();
    },
    [language, voices, updatePrefs, restart],
  );

  const chooseRate = useCallback(
    (index: number) => {
      updatePrefs((previous) => ({ ...previous, rate: index }));
      settings.current = { ...settings.current, rate: SPEECH_RATES[index] ?? 1 };
      restart();
    },
    [updatePrefs, restart],
  );

  /** Fait entendre la voix choisie sur une phrase d'essai (hors lecture). */
  const preview = useCallback(() => {
    if (!supported || status !== "idle") return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(
      utter(SAMPLE_TEXTS[language] ?? SAMPLE_TEXTS.fr),
    );
  }, [supported, status, language, utter]);

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

  return {
    supported,
    status,
    start,
    pause,
    resume,
    stop,
    voices,
    voice,
    rate: prefs.rate,
    chooseVoice,
    chooseRate,
    preview,
  };
}

export type ReadAloud = ReturnType<typeof useReadAloud>;
