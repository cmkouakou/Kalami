/**
 * =============================================================
 *  Fichier    : class-pending.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Invitations en attente d'une classe (S10a, enseignant) : courriel et
 *               échéance ; « Renvoyer » crée un nouveau lien, « Annuler » (confirmé par un
 *               second clic) le rend inutilisable.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, components/strategy/classes/manual-links.tsx
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { ManualLinks } from "@/components/strategy/classes/manual-links";
import { FormMessage } from "@/components/ui/form";
import { BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  type ClassInviteState,
  renewClassInvitation,
  revokeClassInvitation,
} from "@/lib/strategy/class-actions";
import type { PendingClassInvitation } from "@/lib/strategy/class-queries";
import { DATE_FORMAT } from "@/lib/format/date";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const cl = s.classes;

type ClassPendingProps = {
  classId: string;
  invitations: PendingClassInvitation[];
};

/** Liste des invitations en attente. */
export function ClassPending({ classId, invitations }: ClassPendingProps) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [state, setState] = useState<ClassInviteState>(undefined);

  /**
   * Lance une action sur une invitation et garde son résultat.
   * @param run - Action serveur à exécuter
   */
  function act(run: () => Promise<ClassInviteState>) {
    setConfirming(null);
    startTransition(async () => {
      setState(await run());
    });
  }

  if (invitations.length === 0 && !state) {
    return <p className="text-small text-ink-muted">{cl.pending.none}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="break-all font-medium">{invitation.email}</span>
              <span className="text-small text-ink-muted">
                {invitation.expired
                  ? cl.pending.expired
                  : interpolate(cl.pending.expires, {
                    date: DATE_FORMAT.format(new Date(invitation.expires_at)),
                  })}
              </span>
            </span>
            {confirming === invitation.id ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-small">
                  {interpolate(cl.pending.revokeConfirm, { email: invitation.email })}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  className={`${BUTTON_SECONDARY} border-danger text-danger`}
                  onClick={() => act(() => revokeClassInvitation(classId, invitation.id))}
                >
                  {cl.pending.revoke}
                </button>
                <button
                  type="button"
                  className={BUTTON_TERTIARY}
                  onClick={() => setConfirming(null)}
                >
                  {s.team.cancel}
                </button>
              </span>
            ) : (
              <span className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className={BUTTON_SECONDARY}
                  onClick={() => act(() => renewClassInvitation(classId, invitation.id))}
                >
                  {cl.pending.renew}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={BUTTON_TERTIARY}
                  onClick={() => setConfirming(invitation.id)}
                >
                  {cl.pending.revoke}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <FormMessage error={state?.error} message={state?.message} />
      {state?.links && <ManualLinks links={state.links} />}
    </div>
  );
}
