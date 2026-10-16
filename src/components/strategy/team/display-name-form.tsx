/**
 * =============================================================
 *  Fichier    : display-name-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: « Votre nom dans l'équipe » (S9a) : nom affiché aux autres membres, au
 *               journal et dans les invitations. Sans nom, le courriel est montré.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-actions.ts
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { DISPLAY_NAME_MAX } from "@/lib/strategy/team";
import { saveDisplayName } from "@/lib/strategy/team-actions";

const tm = getDictionary().strategy.team;

type DisplayNameFormProps = {
  studyId: string;
  displayName: string | null;
};

/** Formulaire du nom affiché. */
export function DisplayNameForm({ studyId, displayName }: DisplayNameFormProps) {
  const [state, action] = useActionState(saveDisplayName.bind(null, studyId), undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field
        label={tm.name.label}
        name="display_name"
        defaultValue={displayName ?? ""}
        maxLength={DISPLAY_NAME_MAX}
        autoComplete="name"
        hint={tm.name.help}
      />
      <FormMessage {...state} />
      <div>
        <SubmitButton variant="secondary">{tm.name.save}</SubmitButton>
      </div>
    </form>
  );
}
