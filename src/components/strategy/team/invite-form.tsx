/**
 * =============================================================
 *  Fichier    : invite-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Formulaire « Inviter une personne » de la page Équipe (S9a, propriétaire) :
 *               courriel et rôle. Si le courriel d'invitation ne part pas, le lien est
 *               affiché pour être transmis à la main.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-actions.ts, components/strategy/team/invite-link.tsx
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { InviteLink } from "@/components/strategy/team/invite-link";
import { Field, FormMessage, SelectField, SubmitButton } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { EMAIL_MAX, INVITE_ROLES } from "@/lib/strategy/team";
import { inviteMember } from "@/lib/strategy/team-actions";

const s = getDictionary().strategy;
const tm = s.team;

/** Formulaire d'invitation d'un membre. */
export function InviteForm({ studyId }: { studyId: string }) {
  const [state, action] = useActionState(inviteMember.bind(null, studyId), undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field
          label={tm.invite.email}
          name="email"
          type="email"
          required
          maxLength={EMAIL_MAX}
          autoComplete="off"
        />
        <SelectField
          label={tm.invite.role}
          name="role"
          defaultValue="contributor"
          options={INVITE_ROLES.map((role) => ({ value: role, label: s.studies.roles[role] }))}
        />
      </div>
      <FormMessage error={state?.error} message={state?.message} />
      {state?.link && <InviteLink link={state.link} />}
      <div>
        <SubmitButton>{tm.invite.submit}</SubmitButton>
      </div>
    </form>
  );
}
