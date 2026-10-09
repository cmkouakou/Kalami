/**
 * =============================================================
 *  Fichier    : manuscript-upload.tsx
 *  Projet     : Kalami
 *  Description: Dépôt d'un manuscrit (DOCX ou EPUB). Le fichier part directement du
 *               navigateur vers le seau privé « manuscripts » (politique administrateur),
 *               puis l'action serveur le convertit en chapitres et crée une nouvelle version.
 *               L'espace auteur fournit sa propre action et son texte d'aide.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/supabase/client.ts, lib/admin/content-actions.ts
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

import { FormMessage } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { convertManuscript } from "@/lib/admin/content-actions";
import type { FormState } from "@/lib/auth/actions";
import {
  MANUSCRIPT_FORMATS,
  MANUSCRIPT_MAX_BYTES,
  MANUSCRIPT_MIME_TYPES,
  MANUSCRIPTS_BUCKET,
  type ManuscriptFormat,
} from "@/lib/content/types";
import { createClient } from "@/lib/supabase/client";

const t = getDictionary();
const l = t.admin.content;

/**
 * Format déduit de l'extension : sous Windows, le navigateur fournit souvent un type MIME
 * vide pour un EPUB, on ne peut donc pas se fier à file.type.
 */
function formatOf(name: string): ManuscriptFormat | null {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return (MANUSCRIPT_FORMATS as readonly string[]).includes(extension)
    ? (extension as ManuscriptFormat)
    : null;
}

type ManuscriptUploadProps = {
  bookId: string;
  /** Action de conversion ; par défaut, celle de l'administration. */
  convert?: (bookId: string, path: string) => Promise<FormState>;
  /** Texte d'aide ; par défaut, celui de l'administration. */
  help?: string;
};

/** Sélecteur de manuscrit avec retour d'état (envoi, conversion, résultat). */
export function ManuscriptUpload({ bookId, convert, help }: ManuscriptUploadProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const inputId = `manuscrit-${bookId}`;

  /** Contrôle, envoie puis fait convertir le fichier choisi. */
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const format = formatOf(file.name);
    if (!format) return setFeedback({ error: l.invalidType });
    if (file.size > MANUSCRIPT_MAX_BYTES) return setFeedback({ error: l.tooLarge });

    setBusy(true);
    setFeedback({ message: l.uploading });
    try {
      const path = `livres/${bookId}/${crypto.randomUUID()}.${format}`;
      const { error } = await createClient()
        .storage.from(MANUSCRIPTS_BUCKET)
        .upload(path, file, { contentType: MANUSCRIPT_MIME_TYPES[format] });
      if (error) throw error;

      setFeedback({ message: l.converting });
      setFeedback((await (convert ?? convertManuscript)(bookId, path)) ?? {});
      router.refresh();
    } catch {
      setFeedback({ error: t.admin.upload.failed });
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">{l.manuscript}</span>
      <p className="text-sm text-ink-muted">{help ?? l.help}</p>
      <label
        htmlFor={inputId}
        aria-disabled={busy}
        className="flex min-h-11 w-fit cursor-pointer items-center rounded-md border
          border-line bg-surface px-4 text-sm font-medium hover:bg-paper
          aria-disabled:cursor-wait aria-disabled:opacity-60"
      >
        {l.choose}
      </label>
      <input
        id={inputId}
        type="file"
        accept={MANUSCRIPT_FORMATS.map((f) => `.${f},${MANUSCRIPT_MIME_TYPES[f]}`).join(",")}
        onChange={handleChange}
        disabled={busy}
        className="sr-only"
      />
      <FormMessage {...feedback} />
    </div>
  );
}
