/**
 * =============================================================
 *  Fichier    : notify-email-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Préférence « recevoir un courriel quand un membre me mentionne » (S9b).
 *               Les autres notifications restent dans la cloche et sur la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/comments-actions.ts
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { FormMessage, SubmitButton } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { saveNotifyEmail } from "@/lib/strategy/comments-actions";

const pref = getDictionary().strategy.notifications.preference;

/** Case à cocher de la préférence de courriel, enregistrée par une action serveur. */
export function NotifyEmailForm({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(saveNotifyEmail, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex min-h-11 items-center gap-3 text-small">
        <input
          type="checkbox"
          name="notify_email"
          defaultChecked={enabled}
          aria-describedby="notify-email-aide"
          className="size-5"
        />
        {pref.label}
      </label>
      <p id="notify-email-aide" className="text-small text-ink-muted">{pref.help}</p>
      <FormMessage {...state} />
      <div>
        <SubmitButton variant="secondary">{pref.save}</SubmitButton>
      </div>
    </form>
  );
}
