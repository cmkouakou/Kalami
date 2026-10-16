/**
 * =============================================================
 *  Fichier    : invite-students-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Invitation d'étudiants par courriel (S10a, enseignant) : jusqu'à 30
 *               adresses par envoi. Affiche les adresses refusées et, si un courriel n'est
 *               pas parti, le lien de chaque invitation à transmettre à la main.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, components/strategy/classes/manual-links.tsx
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { ManualLinks } from "@/components/strategy/classes/manual-links";
import { FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { inviteStudents } from "@/lib/strategy/class-actions";

const cl = getDictionary().strategy.classes;

/** Formulaire d'invitation des étudiants. */
export function InviteStudentsForm({ classId }: { classId: string }) {
  const [state, action] = useActionState(inviteStudents.bind(null, classId), undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <TextArea
        label={cl.invite.emails}
        name="emails"
        rows={4}
        required
        hint={cl.invite.help}
        autoComplete="off"
      />
      <FormMessage error={state?.error} message={state?.message} />
      {state?.failed && (
        <p role="alert" className="text-small text-danger">{state.failed}</p>
      )}
      {state?.links && <ManualLinks links={state.links} />}
      <div className="sm:w-64">
        <SubmitButton>{cl.invite.submit}</SubmitButton>
      </div>
    </form>
  );
}
