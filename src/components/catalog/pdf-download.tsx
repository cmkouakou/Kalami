/**
 * =============================================================
 *  Fichier    : pdf-download.tsx
 *  Projet     : Kalami
 *  Description: Bloc « Version PDF » de la fiche d'un livre (lecteur ayant l'option PDF) :
 *               préparation du fichier filigrané à son nom, puis téléchargement par un lien
 *               signé de courte durée. Affiche les téléchargements restants (3 par option).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: api/livres/[id]/pdf, api/pdf/[id], i18n
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";

const p = getDictionary().pdf;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

type ErrorCode = keyof typeof p.errors;

type PdfDownloadProps = {
  bookId: string;
  reference: string;
  remaining: number;
  /** Fichier encore valable, s'il y en a un */
  initialExport: { id: string; expires_at: string } | null;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Envoie une requête POST à une route PDF et lit la réponse JSON.
 * @returns Données si succès, sinon code d'erreur connu (ou « generic »)
 */
async function postJson<T>(url: string): Promise<{ data: T } | { error: ErrorCode }> {
  try {
    const response = await fetch(url, { method: "POST" });
    const body = (await response.json()) as T & { error?: string };
    if (response.ok) return { data: body };
    const code = body.error && body.error in p.errors ? (body.error as ErrorCode) : "generic";
    return { error: code };
  } catch {
    return { error: "generic" };
  }
}

// ==================== COMPOSANT ====================

/** Bloc PDF : « Préparer mon PDF », puis « Télécharger le PDF » tant qu'il reste des essais. */
export function PdfDownload({ bookId, reference, remaining, initialExport }: PdfDownloadProps) {
  const [left, setLeft] = useState(remaining);
  const [file, setFile] = useState(initialExport);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  /** Génère (ou retrouve) le fichier filigrané. */
  async function prepare() {
    setPending(true);
    setError(null);
    const result = await postJson<{ id: string; expiresAt: string; remaining: number }>(
      `/api/livres/${bookId}/pdf`,
    );
    setPending(false);
    if ("error" in result) return setError(result.error);
    setFile({ id: result.data.id, expires_at: result.data.expiresAt });
    setLeft(result.data.remaining);
  }

  /** Consomme un téléchargement et ouvre le lien signé. */
  async function download() {
    if (!file) return;
    setPending(true);
    setError(null);
    const result = await postJson<{ url: string }>(`/api/pdf/${file.id}`);
    setPending(false);
    if ("error" in result) {
      if (result.error === "expired") setFile(null);
      return setError(result.error);
    }
    setLeft((count) => Math.max(0, count - 1));
    window.location.assign(result.data.url);
  }

  return (
    <section className="flex flex-col gap-2 border-t border-line pt-4">
      <h2 className="text-sm font-semibold">{p.title}</h2>
      <p className="text-small text-ink-muted">{interpolate(p.help, { ref: reference })}</p>
      <p className="text-small">{interpolate(p.remaining, { count: String(left) })}</p>
      {left > 0 && (
        <button
          type="button"
          onClick={file ? download : prepare}
          disabled={pending}
          aria-busy={pending}
          className={`${BUTTON_SECONDARY} w-full`}
        >
          {file ? p.download : pending ? p.preparing : p.prepare}
        </button>
      )}
      {file && (
        <p className="text-small text-ink-muted" suppressHydrationWarning>
          {interpolate(p.expiresAt, { date: DATE_FORMAT.format(new Date(file.expires_at)) })}
        </p>
      )}
      {error && (
        <p role="alert" className="text-small text-danger">
          {p.errors[error]}
        </p>
      )}
    </section>
  );
}
