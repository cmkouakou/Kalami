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
  "min-h-11 rounded-md border border-line bg-surface px-3 text-base " +
  "focus:outline-2 focus:outline-encre";

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
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-aide`} className="text-small text-ink-muted">
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
      ? "bg-encre text-on-encre hover:bg-encre-strong"
      : "border border-encre text-encre hover:bg-encre-soft";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`min-h-11 w-full rounded-md px-4 text-label transition disabled:opacity-60
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
      <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-3 text-small text-ink">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-md border border-success/40 bg-success/10 p-3 text-small text-ink">
        {message}
      </p>
    );
  }
  return null;
}
