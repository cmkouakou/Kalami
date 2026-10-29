/**
 * =============================================================
 *  Fichier    : class-link.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Lien de classe (S10a, enseignant) : créer, régénérer (confirmé par un second
 *               clic) ou désactiver. Le nouveau lien n'est montré qu'une fois, juste après sa
 *               création : la base n'en garde que l'empreinte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, components/strategy/team/invite-link.tsx
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { InviteLink } from "@/components/strategy/team/invite-link";
import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { type ClassLinkState, setClassLink } from "@/lib/strategy/class-actions";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const cl = s.classes;

type ClassLinkProps = {
  classId: string;
  /** Vrai si un lien est actif (son adresse n'est plus connue). */
  active: boolean;
  /** Classe archivée : inscriptions fermées. */
  archived: boolean;
};

/** Gestion du lien de classe. */
export function ClassLink({ classId, active, archived }: ClassLinkProps) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<ClassLinkState>(undefined);

  /**
   * Crée un nouveau lien ou désactive le lien actuel.
   * @param enabled - Vrai pour un nouveau lien
   */
  function act(enabled: boolean) {
    setConfirming(false);
    startTransition(async () => {
      setState(await setClassLink(classId, enabled));
    });
  }

  const status = state?.link ? null : active ? cl.link.hidden : cl.link.none;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-ink-muted">{cl.link.intro}</p>
      {status && <p className="text-small">{status}</p>}
      {state?.link && (
        <div className="flex flex-col gap-2">
          <p className="text-small font-medium">{cl.link.fresh}</p>
          <InviteLink link={state.link} />
        </div>
      )}
      <FormMessage error={state?.error} message={state?.message} />

      {archived ? (
        <p className="text-small text-ink-muted">{cl.join.archived}</p>
      ) : confirming ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-small">{cl.link.regenerateConfirm}</span>
          <button
            type="button"
            disabled={pending}
            className={BUTTON_PRIMARY}
            onClick={() => act(true)}
          >
            {cl.link.regenerate}
          </button>
          <button type="button" className={BUTTON_TERTIARY} onClick={() => setConfirming(false)}>
            {s.team.cancel}
          </button>
        </span>
      ) : (
        <span className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className={active ? BUTTON_SECONDARY : BUTTON_PRIMARY}
            onClick={() => (active ? setConfirming(true) : act(true))}
          >
            {active ? cl.link.regenerate : cl.link.create}
          </button>
          {active && (
            <button
              type="button"
              disabled={pending}
              className={BUTTON_TERTIARY}
              onClick={() => act(false)}
            >
              {cl.link.disable}
            </button>
          )}
        </span>
      )}
    </div>
  );
}
