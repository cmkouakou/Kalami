/**
 * =============================================================
 *  Fichier    : share-dialog.tsx (reader)
 *  Projet     : Kalami
 *  Description: Partage d'un extrait sous forme d'image : aperçu de la carte, puis partage
 *               natif (Web Share API avec fichier) ou, à défaut, téléchargement de l'image
 *               et copie du lien du livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: dialog.tsx, share-card.ts, i18n
 * =============================================================
 */

"use client";

import { useEffect, useState } from "react";

import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";

import { Dialog } from "./dialog";
import { drawShareCard, type ShareCardData } from "./share-card";

const t = getDictionary();

/** Nom du fichier image partagé. */
const FILE_NAME = "kalami-extrait.png";

type Card = { blob: Blob; url: string };

/** Fenêtre « Partager » : prépare l'image à l'ouverture, puis la partage. */
export function ShareDialog(props: { card: ShareCardData; onClose: () => void }) {
  const { onClose } = props;
  // Contenu figé à l'ouverture : l'image n'est dessinée qu'une fois
  const [card] = useState(props.card);
  const [image, setImage] = useState<Card | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Dessin de l'image à l'ouverture ; l'adresse temporaire est libérée à la fermeture
  useEffect(() => {
    let url: string | null = null;
    let active = true;
    drawShareCard(card)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => {
        if (active) setMessage(t.reader.share.error);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card]);

  const file = image ? new File([image.blob], FILE_NAME, { type: "image/png" }) : null;
  const native = Boolean(file && navigator.canShare?.({ files: [file] }));

  /** Partage natif de l'image avec le lien du livre. */
  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: card.title, url: card.link });
      onClose();
    } catch (error) {
      // Annulation par le lecteur : rien à signaler
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessage(t.reader.share.error);
      }
    }
  }

  /** Téléchargement de l'image et copie du lien (navigateurs sans partage de fichiers). */
  async function download() {
    if (!image) return;
    const anchor = document.createElement("a");
    anchor.href = image.url;
    anchor.download = FILE_NAME;
    anchor.click();
    try {
      await navigator.clipboard.writeText(card.link);
      setMessage(t.reader.share.linkCopied);
    } catch {
      setMessage(null);
    }
  }

  return (
    <Dialog id="dialogue-partage" title={t.reader.share.title} closeLabel={t.reader.share.close}
      onClose={onClose}>
      <p className="text-small text-ink-muted">{t.reader.share.intro}</p>
      <div className="aspect-square w-full overflow-hidden rounded-md border border-line bg-sand">
        {image && (
          // Image locale (blob:) : next/image n'apporte rien ici
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={t.reader.share.preview} className="size-full" />
        )}
      </div>
      <button
        type="button"
        onClick={native ? share : download}
        disabled={!image}
        className={BUTTON_PRIMARY}
      >
        {native ? t.reader.share.send : t.reader.share.download}
      </button>
      <p aria-live="polite" className="text-small">
        {message}
      </p>
    </Dialog>
  );
}
