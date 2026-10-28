/**
 * =============================================================
 *  Fichier    : share-book-button.tsx
 *  Projet     : Kalami
 *  Description: Bouton « Partager ce livre » de la page du livre (composant client, v0.15.8) :
 *               menu de partage du téléphone, sinon lien copié avec un message de
 *               confirmation. Accessible sans compte.
 *               v1.1 : couverture jointe au partage (préchargée, téléphone seulement).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-28
 *  Dépendances: lib/catalog/share.ts, ui/icons.tsx, ui/styles.ts
 * =============================================================
 */

"use client";

import { useEffect, useState } from "react";

import { IconShare } from "@/components/ui/icons";
import { BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { loadCoverFile, shareBookLink } from "@/lib/catalog/share";

const t = getDictionary();

type ShareBookButtonProps = {
  slug: string;
  title: string;
  authorName: string;
  /** Adresse publique de la couverture (null : partage du lien seul) */
  coverUrl: string | null;
};

/**
 * Couverture préchargée en fichier, seulement si l'appareil sait partager des fichiers
 * (téléphone) : le menu de partage s'ouvre ensuite sans attendre le téléchargement.
 * @param coverUrl - Adresse publique de la couverture
 * @param slug - Slug du livre
 */
export function useCoverFile(coverUrl: string | null, slug: string): File | null {
  const [cover, setCover] = useState<File | null>(null);
  useEffect(() => {
    if (!coverUrl || typeof navigator.canShare !== "function") return;
    let active = true;
    loadCoverFile(coverUrl, slug).then((file) => {
      if (active && file && navigator.canShare({ files: [file] })) setCover(file);
    });
    return () => {
      active = false;
    };
  }, [coverUrl, slug]);
  return cover;
}

/** Bouton de partage du lien public du livre. */
export function ShareBookButton({ slug, title, authorName, coverUrl }: ShareBookButtonProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const cover = useCoverFile(coverUrl, slug);

  /** Ouvre le partage et affiche le résultat (lien copié ou échec). */
  async function share() {
    setNotice(null);
    const outcome = await shareBookLink({ slug, title, authorName, cover });
    if (outcome === "copied") setNotice(t.reader.share.bookCopied);
    if (outcome === "error") setNotice(t.reader.share.error);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={share} className={BUTTON_TERTIARY}>
        <IconShare size={20} />
        {t.reader.share.book}
      </button>
      <p role="status" className="text-small text-ink-muted">
        {notice}
      </p>
    </div>
  );
}
