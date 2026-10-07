/**
 * =============================================================
 *  Fichier    : form.tsx
 *  Projet     : Kalami
 *  Description: Briques de formulaire réutilisables : champ avec libellé, bouton d'envoi
 *               (état « en cours »), message d'erreur ou de succès accessible.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-06
 * =============================================================
 */

"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
};

const CONTROL_CLASS =
  "min-h-11 rounded-md border border-bordure bg-surface px-3 text-base " +
  "focus:outline-2 focus:outline-principale";

/** Libellé, contrôle et aide éventuelle (reliée par aria-describedby). */
function FieldShell({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-aide`} className="text-xs text-texte-doux">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Champ de saisie avec libellé associé. */
export function Field({ label, name, id, hint, ...props }: FieldProps) {
  const inputId = id ?? `champ-${name}`;
  return (
    <FieldShell id={inputId} label={label} hint={hint}>
      <input
        id={inputId}
        name={name}
        aria-describedby={hint ? `${inputId}-aide` : undefined}
        className={CONTROL_CLASS}
        {...props}
      />
    </FieldShell>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  hint?: string;
};

/** Zone de texte multiligne avec libellé associé. */
export function TextArea({ label, name, id, hint, rows = 5, ...props }: TextAreaProps) {
  const inputId = id ?? `champ-${name}`;
  return (
    <FieldShell id={inputId} label={label} hint={hint}>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        aria-describedby={hint ? `${inputId}-aide` : undefined}
        className={`${CONTROL_CLASS} py-2`}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  hint?: string;
  options: { value: string; label: string }[];
};

/** Liste déroulante avec libellé associé. */
export function SelectField({ label, name, id, hint, options, ...props }: SelectFieldProps) {
  const inputId = id ?? `champ-${name}`;
  return (
    <FieldShell id={inputId} label={label} hint={hint}>
      <select
        id={inputId}
        name={name}
        aria-describedby={hint ? `${inputId}-aide` : undefined}
        className={CONTROL_CLASS}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Bouton d'envoi désactivé pendant le traitement de l'action. */
export function SubmitButton({
  children,
  variant = "primary",
  pending: pendingOverride,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  /** État « en cours » fourni par l'appelant (envoi via onSubmit plutôt que via action). */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
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
