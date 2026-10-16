/**
 * =============================================================
 *  Fichier    : pending-invitations.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Invitations en attente de la page Équipe (S9a, propriétaire) : courriel,
 *               rôle, échéance ; « Renvoyer » crée un nouveau lien, « Annuler » (confirmé
 *               par un second clic) le rend inutilisable.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-actions.ts, components/strategy/team/invite-link.tsx
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { InviteLink } from "@/components/strategy/team/invite-link";
import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { type InviteState, renewInvitation, revokeInvitation } from "@/lib/strategy/team-actions";
import type { PendingInvitation } from "@/lib/strategy/team-queries";

const s = getDictionary().strategy;
const tm = s.team;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

type PendingInvitationsProps = {
  studyId: string;
  invitations: PendingInvitation[];
};

/** Liste des invitations en attente. */
export function PendingInvitations({ studyId, invitations }: PendingInvitationsProps) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [state, setState] = useState<InviteState>(undefined);

  /**
   * Lance une action sur une invitation et garde son résultat.
   * @param run - Action serveur à exécuter
   */
  function act(run: () => Promise<InviteState>) {
    setConfirming(null);
    startTransition(async () => {
      setState(await run());
    });
  }

  if (invitations.length === 0) {
    return <p className="text-small text-ink-muted">{tm.pending.none}</p>;
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
              <span className="flex flex-wrap items-center gap-2 text-small text-ink-muted">
                <span className={BADGE}>{s.studies.roles[invitation.role]}</span>
                {invitation.expired
                  ? tm.pending.expired
                  : interpolate(tm.pending.expires, {
                    date: DATE_FORMAT.format(new Date(invitation.expires_at)),
                  })}
              </span>
            </span>
            {confirming === invitation.id ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-small">
                  {interpolate(tm.pending.revokeConfirm, { email: invitation.email })}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  className={`${BUTTON_SECONDARY} border-danger text-danger`}
                  onClick={() => act(() => revokeInvitation(studyId, invitation.id))}
                >
                  {tm.pending.revoke}
                </button>
                <button
                  type="button"
                  className={BUTTON_TERTIARY}
                  onClick={() => setConfirming(null)}
                >
                  {tm.cancel}
                </button>
              </span>
            ) : (
              <span className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className={BUTTON_SECONDARY}
                  onClick={() => act(() => renewInvitation(studyId, invitation.id))}
                >
                  {tm.pending.renew}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={BUTTON_TERTIARY}
                  onClick={() => setConfirming(invitation.id)}
                >
                  {tm.pending.revoke}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <FormMessage error={state?.error} message={state?.message} />
      {state?.link && <InviteLink link={state.link} />}
    </div>
  );
}
