/**
 * =============================================================
 *  Fichier    : note-dialog.tsx (reader)
 *  Projet     : Kalami
 *  Description: Saisie ou modification de la note attachée à un passage surligné.
 *               Une note vide supprime la note (le surlignage reste).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: dialog.tsx, lib/reader/annotations.ts, i18n
 * =============================================================
 */

"use client";

import { type FormEvent, useState } from "react";

import { BUTTON_PRIMARY, BUTTON_TERTIARY, CONTROL } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { MAX_NOTE_LENGTH } from "@/lib/reader/annotations";

import { Dialog } from "./dialog";

const t = getDictionary();

type NoteDialogProps = {
  /** Passage annoté (rappelé au-dessus du champ) */
  quote: string;
  initialNote: string | null;
  onSave: (note: string) => Promise<void>;
  onClose: () => void;
};

/** Fenêtre de note : citation du passage, champ de texte, enregistrer ou annuler. */
export function NoteDialog({ quote, initialNote, onSave, onClose }: NoteDialogProps) {
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  /** Enregistre la note puis ferme la fenêtre (l'erreur est signalée par la liseuse). */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(note);
    } finally {
      setSaving(false);
    }
  }

  const title = initialNote ? t.reader.selection.editNote : t.reader.selection.note;
  return (
    <Dialog
      id="dialogue-note"
      title={title}
      closeLabel={t.reader.selection.cancel}
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <blockquote className="line-clamp-4 border-l-4 border-encre pl-3 font-serif italic
          text-ink-muted">
          {quote}
        </blockquote>
        <label htmlFor="champ-note" className="text-label">
          {t.reader.selection.noteLabel}
        </label>
        <textarea
          id="champ-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          rows={5}
          autoFocus
          placeholder={t.reader.selection.notePlaceholder}
          className={`${CONTROL} liseuse-champ py-2`}
        />
        <p className="text-right text-caption text-ink-muted" aria-live="polite">
          {note.length} / {MAX_NOTE_LENGTH}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BUTTON_TERTIARY}>
            {t.reader.selection.cancel}
          </button>
          <button type="submit" disabled={saving} className={BUTTON_PRIMARY}>
            {t.reader.selection.saveNote}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
