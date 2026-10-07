/**
 * =============================================================
 *  Fichier    : image-upload.tsx
 *  Projet     : Kalami
 *  Description: Envoi d'une couverture de livre ou d'une photo d'auteur. Le fichier part
 *               directement du navigateur vers Supabase Storage (seau « covers », politique
 *               réservée à l'administrateur), sans transiter par le serveur Next.js ; l'action
 *               serveur vérifie ensuite le chemin et l'enregistre sur la fiche.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/supabase/client.ts, lib/admin/catalog-actions.ts
 * =============================================================
 */

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

import { FormMessage } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { setAuthorPhoto, setBookCover } from "@/lib/admin/catalog-actions";
import { COVERS_BUCKET, publicImageUrl } from "@/lib/catalog/images";
import { createClient } from "@/lib/supabase/client";

const t = getDictionary();

/** Limite identique à celle du seau (file_size_limit). */
const MAX_BYTES = 5 * 1024 * 1024;

/** Types acceptés par le seau et extension du fichier enregistré. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ImageUploadProps = {
  kind: "book" | "author";
  /** Identifiant du livre ou de l'auteur. */
  id: string;
  label: string;
  currentPath: string | null;
};

/** Sélecteur d'image avec aperçu et retour d'état. */
export function ImageUpload({ kind, id, label, currentPath }: ImageUploadProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const src = publicImageUrl(currentPath);
  const inputId = `image-${kind}-${id}`;

  /** Contrôle, envoie puis enregistre l'image choisie. */
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const extension = EXTENSIONS[file.type];
    if (!extension) return setFeedback({ error: t.admin.upload.invalidType });
    if (file.size > MAX_BYTES) return setFeedback({ error: t.admin.upload.tooLarge });

    setBusy(true);
    setFeedback({ message: t.admin.upload.uploading });
    try {
      const folder = kind === "book" ? "livres" : "auteurs";
      const path = `${folder}/${id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await createClient()
        .storage.from(COVERS_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) throw error;

      const save = kind === "book" ? setBookCover : setAuthorPhoto;
      const result = await save(id, path);
      setFeedback(result ?? {});
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
      <span className="text-sm font-medium">{label}</span>
      <div
        className="relative aspect-[2/3] w-32 overflow-hidden rounded-md border border-bordure
          bg-fond"
      >
        {src && <Image src={src} alt="" fill sizes="128px" className="object-cover" />}
      </div>
      <label
        htmlFor={inputId}
        className="flex min-h-11 w-fit cursor-pointer items-center rounded-md border
          border-bordure bg-surface px-4 text-sm font-medium hover:bg-fond"
      >
        {t.admin.upload.choose}
      </label>
      <input
        id={inputId}
        type="file"
        accept={Object.keys(EXTENSIONS).join(",")}
        onChange={handleChange}
        disabled={busy}
        className="sr-only"
      />
      <FormMessage {...feedback} />
    </div>
  );
}
