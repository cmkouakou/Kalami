/**
 * =============================================================
 *  Fichier    : form.tsx
 *  Projet     : Kalami
 *  Description: Briques de formulaire réutilisables : champ avec libellé, bouton d'envoi
 *               (état « en cours »), message d'erreur ou de succès accessible.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 * =============================================================
 */

"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

/** Champ de saisie avec libellé associé. */
export function Field({ label, name, id, ...props }: FieldProps) {
  const inputId = id ?? `champ-${name}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className="min-h-11 rounded-md border border-bordure bg-surface px-3 text-base
          focus:outline-2 focus:outline-principale"
        {...props}
      />
    </div>
  );
}

/** Bouton d'envoi désactivé pendant le traitement de l'action. */
export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-principale text-principale-texte hover:opacity-90"
      : "border border-bordure bg-surface hover:bg-fond";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`min-h-11 w-full rounded-md px-4 font-medium transition disabled:opacity-60
        ${styles}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

/** Message de retour (erreur ou succès), annoncé aux lecteurs d'écran. */
export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
        {message}
      </p>
    );
  }
  return null;
}
