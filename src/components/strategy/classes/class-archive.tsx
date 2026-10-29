/**
 * =============================================================
 *  Fichier    : class-archive.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Archivage d'une classe (S10a, enseignant) : « Archiver » (confirmé par un
 *               second clic) ferme les inscriptions et la distribution sans supprimer
 *               d'étude ; « Réactiver » les rouvre.
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
import type { FormState } from "@/lib/auth/actions";
import { setClassArchived } from "@/lib/strategy/class-actions";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const st = s.classes.settings;

/** Bouton d'archivage ou de réactivation. */
export function ClassArchive({ classId, archived }: { classId: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<FormState>(undefined);

  /**
   * Archive ou réactive la classe.
   * @param next - Vrai pour archiver
   */
  function act(next: boolean) {
    setConfirming(false);
    startTransition(async () => {
      setState(await setClassArchived(classId, next));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-ink-muted">{st.archiveHelp}</p>
      {archived ? (
        <button
          type="button"
          disabled={pending}
          className={`${BUTTON_SECONDARY} w-fit`}
          onClick={() => act(false)}
        >
          {st.unarchive}
        </button>
      ) : confirming ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-small">{st.archiveConfirm}</span>
          <button
            type="button"
            disabled={pending}
            className={`${BUTTON_SECONDARY} border-danger text-danger`}
            onClick={() => act(true)}
          >
            {st.archive}
          </button>
          <button type="button" className={BUTTON_TERTIARY} onClick={() => setConfirming(false)}>
            {s.team.cancel}
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          className={`${BUTTON_SECONDARY} w-fit`}
          onClick={() => setConfirming(true)}
        >
          {st.archive}
        </button>
      )}
      <FormMessage {...state} />
    </div>
  );
}
