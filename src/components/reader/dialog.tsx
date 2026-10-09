/**
 * =============================================================
 *  Fichier    : dialog.tsx (reader)
 *  Projet     : Kalami
 *  Description: Fenêtre modale de la liseuse (élément <dialog> natif : focus piégé, Échap
 *               pour fermer, fond assombri). Utilisée par la note, la citation et le
 *               partage d'un extrait.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: components/ui
 * =============================================================
 */

"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { IconX } from "@/components/ui/icons";
import { BUTTON_ICON } from "@/components/ui/styles";

type DialogProps = {
  /** Identifiant du titre (aria-labelledby) */
  id: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

/** Fenêtre modale ouverte dès son montage, refermée par Échap, le bouton ou le fond. */
export function Dialog({ id, title, closeLabel, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clic sur le fond (hors du contenu) : fermeture
        if (event.target === event.currentTarget) onClose();
      }}
      className="liseuse-dialogue m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border
        border-line p-0 shadow-pop"
    >
      <div className="flex flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-2">
          <h2 id={id} className="font-serif text-h3">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className={BUTTON_ICON}>
            <IconX />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
