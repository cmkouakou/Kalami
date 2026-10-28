/**
 * =============================================================
 *  Fichier    : share-book-button.tsx
 *  Projet     : Kalami
 *  Description: Bouton « Partager ce livre » de la page du livre (composant client, v0.15.8) :
 *               menu de partage du téléphone, sinon lien copié avec un message de
 *               confirmation. Accessible sans compte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/catalog/share.ts, ui/icons.tsx, ui/styles.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { IconShare } from "@/components/ui/icons";
import { BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { shareBookLink } from "@/lib/catalog/share";

const t = getDictionary();

type ShareBookButtonProps = {
  slug: string;
  title: string;
  authorName: string;
};

/** Bouton de partage du lien public du livre. */
export function ShareBookButton({ slug, title, authorName }: ShareBookButtonProps) {
  const [notice, setNotice] = useState<string | null>(null);

  /** Ouvre le partage et affiche le résultat (lien copié ou échec). */
  async function share() {
    setNotice(null);
    const outcome = await shareBookLink({ slug, title, authorName });
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
