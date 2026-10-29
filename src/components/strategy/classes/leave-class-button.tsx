/**
 * =============================================================
 *  Fichier    : leave-class-button.tsx
 *  Projet     : Kalami Stratégie
 *  Description: « Quitter la classe » pour un étudiant (S10a), confirmé par un second clic.
 *               Les études déjà distribuées restent accessibles.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { leaveClass } from "@/lib/strategy/class-actions";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const st = s.classes.student;

/** Bouton de départ d'une classe. */
export function LeaveClassButton({ classId, name }: { classId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<FormState>(undefined);

  /** Quitte la classe et garde le résultat. */
  function leave() {
    setConfirming(false);
    startTransition(async () => {
      setState(await leaveClass(classId));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-small">{interpolate(st.leaveConfirm, { name })}</span>
          <button
            type="button"
            disabled={pending}
            className={`${BUTTON_SECONDARY} border-danger text-danger`}
            onClick={leave}
          >
            {st.leave}
          </button>
          <button type="button" className={BUTTON_TERTIARY} onClick={() => setConfirming(false)}>
            {s.team.cancel}
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          className={`${BUTTON_TERTIARY} w-fit text-danger`}
          onClick={() => setConfirming(true)}
        >
          {st.leave}
        </button>
      )}
      <FormMessage {...state} />
    </div>
  );
}
