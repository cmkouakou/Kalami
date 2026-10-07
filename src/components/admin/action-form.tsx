/**
 * =============================================================
 *  Fichier    : action-form.tsx
 *  Projet     : Kalami
 *  Description: Formulaire d'administration générique relié à une action serveur.
 *               L'envoi passe par onSubmit + startTransition : contrairement à <form action>,
 *               les champs ne sont pas réinitialisés, et la saisie est conservée si l'action
 *               renvoie une erreur. Sans JavaScript, l'attribut action prend le relais.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: components/ui/form.tsx
 * =============================================================
 */

"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";

import { FormMessage, SubmitButton } from "@/components/ui/form";
import type { FormState } from "@/lib/auth/actions";

type ActionFormProps = {
  /** Action serveur (éventuellement liée à un identifiant par .bind). */
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  /** Vide les champs après un succès (formulaire de création qui reste affiché). */
  resetOnSuccess?: boolean;
};

/** Formulaire qui affiche le retour de l'action (erreur ou succès) sous les champs. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className,
  resetOnSuccess = false,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Après un succès, repart d'un formulaire vierge si demandé
  useEffect(() => {
    if (resetOnSuccess && state?.message) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  /** Envoie le formulaire sans le réinitialiser. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className={className ?? "flex flex-col gap-4"}
    >
      {children}
      <FormMessage {...state} />
      <div className="sm:w-60">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
