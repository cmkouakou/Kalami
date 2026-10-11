/**
 * =============================================================
 *  Fichier    : use-autosave.ts
 *  Projet     : Kalami Stratégie
 *  Description: Sauvegarde automatique d'un gabarit : enregistre 1,5 s après la dernière
 *               modification, un seul envoi à la fois (les modifications faites pendant
 *               l'envoi repartent ensuite), arrêt sur conflit de révision, envoi immédiat
 *               quand l'onglet passe en arrière-plan et alerte avant de quitter la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/actions.ts (saveStepPayload)
 * =============================================================
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveStepPayload } from "@/lib/strategy/actions";

// ==================== TYPES ====================

export type AutosaveStatus =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string; conflict: boolean };

type AutosaveOptions = {
  studyId: string;
  stepNo: number;
  /** Révision du contenu reçu du serveur. */
  revision: number;
  /** Faux en lecture seule : aucune modification ni aucun envoi. */
  enabled: boolean;
};

export type Autosave<T> = {
  value: T;
  /** Applique une modification au contenu et programme l'enregistrement. */
  update: (change: (previous: T) => T) => void;
  status: AutosaveStatus;
  /** Révision connue du serveur (après le dernier enregistrement réussi). */
  revision: number;
  /** Vrai tant qu'une modification n'est pas enregistrée. */
  pending: boolean;
  /** Relance l'enregistrement après une erreur (hors conflit). */
  retry: () => void;
};

// ==================== CONSTANTES ====================

const DELAY_MS = 1500;

// ==================== HOOK ====================

/**
 * Contenu d'un gabarit enregistré automatiquement.
 * @param initial - Contenu reçu du serveur
 * @param options - Étude, étape, révision et activation
 */
export function useAutosave<T>(initial: T, options: AutosaveOptions): Autosave<T> {
  const { studyId, stepNo, enabled } = options;
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>({ kind: "idle" });
  const [revision, setRevision] = useState(options.revision);

  const latest = useRef(initial);
  const revisionRef = useRef(options.revision);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const blocked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Envoie le contenu courant ; repart si des modifications sont arrivées entre-temps. */
  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current || blocked.current || !dirty.current) return;

    inFlight.current = true;
    setStatus({ kind: "saving" });
    // Un tour par envoi : les modifications arrivées pendant l'envoi repartent aussitôt
    while (dirty.current) {
      dirty.current = false;
      let result: Awaited<ReturnType<typeof saveStepPayload>>;
      try {
        result = await saveStepPayload(studyId, stepNo, latest.current, revisionRef.current);
      } catch {
        result = { ok: false, error: "", conflict: false };
      }

      if (!result.ok) {
        inFlight.current = false;
        dirty.current = true;
        blocked.current = true;
        setStatus({ kind: "error", message: result.error, conflict: result.conflict });
        return;
      }
      revisionRef.current = result.revision;
      setRevision(result.revision);
      if (!dirty.current) setStatus({ kind: "saved", at: result.savedAt });
    }
    inFlight.current = false;
  }, [studyId, stepNo]);

  const update = useCallback(
    (change: (previous: T) => T) => {
      if (!enabled) return;
      latest.current = change(latest.current);
      setValue(latest.current);
      dirty.current = true;
      if (blocked.current) return;
      setStatus((previous) => (previous.kind === "saving" ? previous : { kind: "dirty" }));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), DELAY_MS);
    },
    [enabled, save],
  );

  const retry = useCallback(() => {
    blocked.current = false;
    void save();
  }, [save]);

  // Envoi immédiat en arrière-plan ou en quittant la page, alerte avant de fermer l'onglet
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") void save();
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty.current || inFlight.current) event.preventDefault();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Navigation interne avant la fin du délai : on envoie quand même
      void save();
    };
  }, [save]);

  const pending = status.kind === "dirty" || status.kind === "saving" || status.kind === "error";
  return { value, update, status, revision, pending, retry };
}
