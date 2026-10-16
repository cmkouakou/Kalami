/**
 * =============================================================
 *  Fichier    : invitation-response.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Boutons « Accepter l'invitation » et « Refuser » (S9a), sur la page du lien
 *               d'invitation et dans « Invitations reçues ». Accepter ouvre l'étude.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { respondInvitation } from "@/lib/strategy/team-actions";

const tm = getDictionary().strategy.team;

/** Accepter ou refuser une invitation. */
export function InvitationResponse({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(undefined);

  /**
   * Transmet la réponse ; accepter redirige vers l'étude.
   * @param accept - Vrai pour accepter
   */
  function respond(accept: boolean) {
    startTransition(async () => {
      setState(await respondInvitation(invitationId, accept));
    });
  }

  if (state?.message) return <FormMessage message={state.message} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={BUTTON_PRIMARY}
          disabled={pending}
          onClick={() => respond(true)}
        >
          {tm.invitation.accept}
        </button>
        <button
          type="button"
          className={BUTTON_SECONDARY}
          disabled={pending}
          onClick={() => respond(false)}
        >
          {tm.invitation.decline}
        </button>
      </div>
      <FormMessage error={state?.error} />
    </div>
  );
}
