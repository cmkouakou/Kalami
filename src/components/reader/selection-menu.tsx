/**
 * =============================================================
 *  Fichier    : selection-menu.tsx (reader)
 *  Projet     : Kalami
 *  Description: Menu flottant affiché près d'un passage sélectionné ou d'un surlignage :
 *               5 couleurs, note, citer, partager, retirer. Un visiteur ne voit que
 *               « Citer », « Partager » et le lien de connexion.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: components/ui, lib/reader/types.ts, i18n
 * =============================================================
 */

"use client";

import Link from "next/link";

import { IconPencil, IconQuote, IconShare, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/reader/types";

const t = getDictionary();

/** Hauteur approximative du menu, pour le placer au-dessus du passage. */
const MENU_HEIGHT = 56;
const MENU_WIDTH = 340;
const GAP = 8;

type SelectionMenuProps = {
  rect: DOMRect;
  /** Couleur du surlignage existant, ou null pour une nouvelle sélection */
  color: HighlightColor | null;
  hasNote: boolean;
  /** Adresse de connexion, ou null si le lecteur est connecté */
  signInHref: string | null;
  busy: boolean;
  onColor: (color: HighlightColor) => void;
  onNote: () => void;
  onCite: () => void;
  onShare: () => void;
  onRemove: (() => void) | null;
};

/** Position du menu : au-dessus du passage, sinon en dessous, toujours dans l'écran. */
function placement(rect: DOMRect): { top: number; left: number } {
  const above = rect.top - MENU_HEIGHT - GAP;
  const top = above > GAP ? above : Math.min(rect.bottom + GAP, window.innerHeight - MENU_HEIGHT);
  const center = rect.left + rect.width / 2 - MENU_WIDTH / 2;
  const left = Math.max(GAP, Math.min(center, window.innerWidth - MENU_WIDTH - GAP));
  return { top, left };
}

/** Menu des actions sur un passage. */
export function SelectionMenu({
  rect,
  color,
  hasNote,
  signInHref,
  busy,
  onColor,
  onNote,
  onCite,
  onShare,
  onRemove,
}: SelectionMenuProps) {
  const { top, left } = placement(rect);
  return (
    <div
      role="toolbar"
      aria-label={t.reader.selection.menu}
      style={{ top, left, maxWidth: `calc(100vw - ${2 * GAP}px)` }}
      // Garde la sélection active pendant le clic sur un bouton
      onMouseDown={(event) => event.preventDefault()}
      className="liseuse-menu fixed z-30 flex flex-wrap items-center gap-1 rounded-lg border
        border-[var(--liseuse-bordure)] p-1 shadow-pop"
    >
      {signInHref ? (
        <Link href={signInHref} className="px-3 py-2 text-small underline underline-offset-4">
          {t.reader.selection.signIn}
        </Link>
      ) : (
        <>
          {HIGHLIGHT_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              onClick={() => onColor(value)}
              aria-pressed={color === value}
              aria-label={interpolate(t.reader.selection.highlight, {
                color: t.reader.colors[value].toLowerCase(),
              })}
              title={t.reader.colors[value]}
              className="inline-flex size-11 items-center justify-center rounded-md
                hover:bg-[var(--liseuse-survol)]"
            >
              <span
                data-couleur={value}
                className="liseuse-pastille size-6 rounded-full border border-line"
              />
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={onNote}
            aria-label={hasNote ? t.reader.selection.editNote : t.reader.selection.note}
            title={hasNote ? t.reader.selection.editNote : t.reader.selection.note}
            className={BUTTON_ICON}
          >
            <IconPencil />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onCite}
        aria-label={t.reader.selection.cite}
        title={t.reader.selection.cite}
        className={BUTTON_ICON}
      >
        <IconQuote />
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label={t.reader.selection.share}
        title={t.reader.selection.share}
        className={BUTTON_ICON}
      >
        <IconShare />
      </button>
      {onRemove && (
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          aria-label={t.reader.selection.remove}
          title={t.reader.selection.remove}
          className={BUTTON_ICON}
        >
          <IconTrash />
        </button>
      )}
    </div>
  );
}
