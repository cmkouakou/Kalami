/**
 * =============================================================
 *  Fichier    : annotation-layer.tsx (reader)
 *  Projet     : Kalami
 *  Description: Couche d'annotation de la liseuse : suit la sélection du lecteur et les
 *               clics sur les surlignages, affiche le menu d'actions (couleurs, note,
 *               citer, partager, retirer) et ouvre les fenêtres de note, de citation et
 *               de partage. Les surlignages sont enregistrés par les actions serveur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: highlight-dom.ts, selection-menu.tsx, note/cite/share-dialog.tsx,
 *               lib/reader/actions.ts, lib/config.ts
 * =============================================================
 */

"use client";

import { type RefObject, useEffect, useState } from "react";

import { getDictionary } from "@/i18n";
import { APP_NAME, APP_URL } from "@/lib/config";
import { addHighlight, deleteHighlight, updateHighlight } from "@/lib/reader/actions";
import type { CitationSource } from "@/lib/reader/citation";
import type { Highlight, HighlightColor, ReaderBootstrap } from "@/lib/reader/types";

import { CiteDialog } from "./cite-dialog";
import { highlightAt, readSelection, type SelectionInfo } from "./highlight-dom";
import { NoteDialog } from "./note-dialog";
import { SelectionMenu } from "./selection-menu";
import type { ShareCardData } from "./share-card";
import { ShareDialog } from "./share-dialog";

const t = getDictionary();

/** Délai de stabilisation de la sélection avant d'afficher le menu (ms). */
const SELECTION_DELAY = 250;
/** Couleur par défaut d'un passage annoté sans couleur choisie. */
const DEFAULT_COLOR: HighlightColor = "jaune";

/** Passage visé : nouvelle sélection ou surlignage existant. */
type Target =
  | ({ kind: "new" } & SelectionInfo)
  | { kind: "existing"; highlight: Highlight; rect: DOMRect };

type DialogName = "note" | "cite" | "share";

type AnnotationLayerProps = {
  /** Zone du texte (sélections et clics suivis à l'intérieur) */
  zoneRef: RefObject<HTMLElement | null>;
  book: ReaderBootstrap["book"];
  chapter: number;
  chapterTitle: string;
  signedIn: boolean;
  /** Surlignages du chapitre affiché */
  highlights: Highlight[];
  /** Menu désactivé (panneau ouvert) */
  disabled: boolean;
  onChange: (update: (list: Highlight[]) => Highlight[]) => void;
  onNotice: (message: string) => void;
};

/** Efface la sélection du document (le surlignage la remplace). */
function clearSelection(): void {
  window.getSelection()?.removeAllRanges();
}

/** Remplace un surlignage modifié dans la liste. */
function replaceIn(list: Highlight[], updated: Highlight): Highlight[] {
  return list.map((item) => (item.id === updated.id ? updated : item));
}

/** Menu et fenêtres d'annotation d'un chapitre (recréé à chaque chapitre). */
export function AnnotationLayer({
  zoneRef,
  book,
  chapter,
  chapterTitle,
  signedIn,
  highlights,
  disabled,
  onChange,
  onNotice,
}: AnnotationLayerProps) {
  const [target, setTarget] = useState<Target | null>(null);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [busy, setBusy] = useState(false);

  // ==================== SUIVI DE LA SÉLECTION ====================

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || dialog) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onSelectionChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const info = readSelection(zone);
        if (info) setTarget({ kind: "new", ...info });
        else setTarget((current) => (current?.kind === "new" ? null : current));
      }, SELECTION_DELAY);
    };
    // Clic sur un surlignage : menu de ce surlignage ; ailleurs : fermeture du menu
    const onClick = (event: MouseEvent) => {
      if (!window.getSelection()?.isCollapsed) return;
      if (event.target instanceof Element && event.target.closest(".liseuse-menu")) return;
      const id = highlightAt(event.target);
      const highlight = id ? highlights.find((item) => item.id === id) : undefined;
      if (highlight && event.target instanceof Element) {
        const mark = event.target.closest("mark") ?? event.target;
        setTarget({ kind: "existing", highlight, rect: mark.getBoundingClientRect() });
      } else {
        setTarget((current) => (current?.kind === "existing" ? null : current));
      }
    };
    // Le menu suit mal un texte qui bouge : il se ferme au défilement
    const onScroll = () => setTarget(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTarget(null);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    zone.addEventListener("click", onClick);
    zone.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", onSelectionChange);
      zone.removeEventListener("click", onClick);
      zone.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [zoneRef, dialog, highlights]);

  // ==================== ACTIONS ====================

  /** Crée un surlignage à partir de la sélection courante. */
  async function create(selection: SelectionInfo, color: HighlightColor, note: string | null) {
    const anchor = { chapter, start: selection.start, end: selection.end };
    const result = await addHighlight(book.id, anchor, color, selection.text, note);
    if (!result.ok) {
      onNotice(result.error);
      return false;
    }
    onChange((list) => [...list, result.highlight]);
    clearSelection();
    return true;
  }

  /** Modifie la couleur ou la note d'un surlignage existant. */
  async function update(highlight: Highlight, changes: { color?: HighlightColor; note?: string }) {
    const result = await updateHighlight(highlight.id, changes);
    if (!result.ok) {
      onNotice(result.error);
      return false;
    }
    onChange((list) => replaceIn(list, result.highlight));
    return true;
  }

  /** Choix d'une couleur dans le menu. */
  async function onColor(color: HighlightColor) {
    if (!target) return;
    setBusy(true);
    const done =
      target.kind === "new"
        ? await create(target, color, null)
        : await update(target.highlight, { color });
    setBusy(false);
    if (done) setTarget(null);
  }

  /** Enregistrement de la note (nouveau passage : surligné en jaune). */
  async function onSaveNote(note: string) {
    if (!target) return;
    const done =
      target.kind === "new"
        ? await create(target, DEFAULT_COLOR, note)
        : await update(target.highlight, { note });
    if (done) closeDialog();
  }

  /** Retrait du surlignage visé. */
  async function onRemove() {
    if (target?.kind !== "existing") return;
    setBusy(true);
    const done = await deleteHighlight(target.highlight.id);
    setBusy(false);
    if (!done) {
      onNotice(t.reader.annotations.error);
      return;
    }
    const id = target.highlight.id;
    onChange((list) => list.filter((item) => item.id !== id));
    setTarget(null);
  }

  /** Ferme la fenêtre ouverte et le menu. */
  function closeDialog() {
    setDialog(null);
    setTarget(null);
  }

  // ==================== RENDU ====================

  if (!target || disabled) return null;
  const quote = target.kind === "new" ? target.text : target.highlight.quote;
  const existing = target.kind === "existing" ? target.highlight : null;

  if (dialog === "note") {
    return (
      <NoteDialog
        quote={quote}
        initialNote={existing?.note ?? null}
        onSave={onSaveNote}
        onClose={closeDialog}
      />
    );
  }
  if (dialog === "cite") {
    const source: CitationSource = {
      author: book.authorName,
      title: book.title,
      chapterTitle,
      edition: book.edition,
      year: book.publicationYear,
      platform: APP_NAME,
      url: `${APP_URL}/livres/${book.slug}/lire?chapitre=${chapter}`,
    };
    return <CiteDialog source={source} onClose={closeDialog} />;
  }
  if (dialog === "share") {
    const zone = zoneRef.current;
    const font = zone ? getComputedStyle(zone).getPropertyValue("--liseuse-police").trim() : "";
    const card: ShareCardData = {
      quote,
      title: book.title,
      author: book.authorName,
      coverUrl: book.coverUrl,
      link: `${APP_URL}/livres/${book.slug}`,
      fontFamily: font || "Georgia",
    };
    return <ShareDialog card={card} onClose={closeDialog} />;
  }

  const signInHref = signedIn
    ? null
    : `/connexion?suivant=${encodeURIComponent(`/livres/${book.slug}/lire`)}`;
  return (
    <SelectionMenu
      rect={target.rect}
      color={existing?.color ?? null}
      hasNote={Boolean(existing?.note)}
      signInHref={signInHref}
      busy={busy}
      onColor={onColor}
      onNote={() => setDialog("note")}
      onCite={() => setDialog("cite")}
      onShare={() => setDialog("share")}
      onRemove={existing ? onRemove : null}
    />
  );
}
