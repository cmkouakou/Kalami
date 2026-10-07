/**
 * =============================================================
 *  Fichier    : reader.tsx (reader)
 *  Projet     : Kalami
 *  Description: Liseuse plein écran. Assemble la vue (pages à tourner ou défilement), la
 *               barre d'outils, les panneaux, la barre d'avancement, la navigation au
 *               clavier, la lecture à voix haute et l'enregistrement de la position
 *               (appareil pour tous, serveur pour un lecteur connecté).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: flip-view, scroll-view, panels, lock-screen, use-*, storage, lib/reader
 * =============================================================
 */

"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getDictionary, interpolate } from "@/i18n";
import { addBookmark, deleteBookmark } from "@/lib/reader/actions";
import {
  bookProgress,
  isChapterReadable,
  nextChapter,
  previousChapter,
  resolveStartPosition,
} from "@/lib/reader/position";
import {
  type Bookmark,
  FONT_SIZES,
  LINE_HEIGHTS,
  type ReaderBootstrap,
  type ReaderPosition,
  type ReaderSettings,
  type SavedPosition,
} from "@/lib/reader/types";

import { blockTexts, parseBlock } from "./dom";
import { FlipView, type ViewControls, type ViewPosition } from "./flip-view";
import { EndScreen, LockScreen } from "./lock-screen";
import {
  BookmarksPanel,
  Panel,
  type PanelName,
  SearchPanel,
  SettingsPanel,
  TocPanel,
} from "./panels";
import { ScrollView } from "./scroll-view";
import {
  loadLocalPosition,
  loadSettings,
  saveLocalPosition,
  saveSettings,
} from "./storage";
import { ChapterStore, useChapter } from "./use-chapter";
import { useProtection } from "./use-protection";
import { useReadAloud } from "./use-read-aloud";

const t = getDictionary();

/** Délai avant d'enregistrer la position après le dernier changement de page (ms). */
const SAVE_DELAY = 1500;
/** Bloc « au-delà de la fin » : ouvre un chapitre sur sa dernière page (retour arrière). */
const END_BLOCK = 100000;

const TOOL_BUTTON =
  "flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-lg " +
  "hover:bg-[var(--liseuse-survol)] aria-pressed:bg-[var(--liseuse-survol)]";
const NAV_BUTTON =
  "min-h-11 rounded-md border border-[var(--liseuse-bordure)] px-3 text-sm font-medium " +
  "disabled:opacity-40";

/** Chapitre affiché et position d'ouverture de sa vue ; « serial » force un nouveau montage. */
type Opening = ReaderPosition & { serial: number };

/** Avancement affiché dans la barre du bas. */
type Display = { fraction: number; page?: { current: number; total: number } };

type ReaderProps = {
  data: ReaderBootstrap;
  /** Prix du livre (composant serveur), affiché à la fin de l'extrait */
  price: ReactNode;
};

/** Vrai si la touche vient d'un champ de saisie (les flèches y gardent leur rôle). */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

// ==================== ENREGISTREMENT DE LA POSITION ====================

/**
 * Enregistre la position avec un délai : appareil pour tous, serveur pour un lecteur connecté.
 * La position en attente est envoyée à la fermeture de l'onglet (keepalive).
 * @returns Fonction qui planifie l'enregistrement d'une position
 */
function usePositionSaver(bookId: string, signedIn: boolean) {
  const pending = useRef<SavedPosition | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const saved = pending.current;
    if (!saved) return;
    pending.current = null;
    saveLocalPosition(bookId, saved);
    if (!signedIn) return;
    const { chapter, block, offset, progress } = saved;
    void fetch(`/api/livres/${bookId}/position`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter, block, offset, progress }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  }, [bookId, signedIn]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [flush]);

  return useCallback(
    (saved: SavedPosition) => {
      pending.current = saved;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY);
    },
    [flush],
  );
}

// ==================== COMPOSANT ====================

/** Liseuse plein écran d'un livre. */
export function Reader({ data, price }: ReaderProps) {
  const { book, toc, access, reader, watermark } = data;
  const signedIn = reader !== null;

  const rootRef = useRef<HTMLDivElement>(null);
  const controls = useRef<ViewControls | null>(null);
  const [store] = useState(() => new ChapterStore(book.id));
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [opening, setOpening] = useState<Opening>(() => ({
    ...resolveStartPosition(
      toc,
      data.requestedChapter,
      data.position,
      loadLocalPosition(book.id),
    ),
    serial: 0,
  }));
  // Position réelle, mise à jour à chaque page (lue dans les gestionnaires d'événements)
  const live = useRef<ReaderPosition>(opening);
  const [display, setDisplay] = useState<Display>({ fraction: 0 });
  const [ended, setEnded] = useState(false);
  const [panel, setPanel] = useState<PanelName | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(data.bookmarks);

  const chapter = opening.chapter;
  const readable = isChapterReadable(toc, chapter, access);
  const { state, retry } = useChapter(store, chapter, readable);
  const next = nextChapter(toc, chapter);
  const previous = previousChapter(toc, chapter);
  const chapterTitle =
    toc.find((entry) => entry.chapter_position === chapter)?.title ?? String(chapter);
  const scheduleSave = usePositionSaver(book.id, signedIn);

  useProtection(rootRef);

  // ==================== NAVIGATION ====================

  /** Ouvre un chapitre (nouvelle vue) à la position donnée. */
  const openAt = useCallback((position: ReaderPosition) => {
    setEnded(false);
    setDisplay({ fraction: 0 });
    setOpening((current) => ({ ...position, serial: current.serial + 1 }));
  }, []);

  /** Va à une position : dans le chapitre affiché sans le recharger, sinon l'ouvre. */
  const jumpTo = useCallback(
    (position: ReaderPosition) => {
      if (position.chapter === chapter && !ended && controls.current) {
        controls.current.goTo(position.block, position.offset);
      } else {
        openAt(position);
      }
    },
    [chapter, ended, openAt],
  );

  const goNextChapter = useCallback(() => {
    if (next === null) setEnded(true);
    else openAt({ chapter: next, block: 0, offset: 0 });
  }, [next, openAt]);

  const goPreviousChapter = useCallback(() => {
    if (ended) openAt({ chapter, block: END_BLOCK, offset: 0 });
    else if (previous !== null) openAt({ chapter: previous, block: END_BLOCK, offset: 0 });
  }, [chapter, ended, previous, openAt]);

  /** Page suivante (pages à tourner) ou défilement d'un écran. */
  const pageNext = useCallback(() => {
    if (controls.current) controls.current.next();
    else if (state.status !== "locked" && !ended) goNextChapter();
  }, [state.status, ended, goNextChapter]);

  const pagePrevious = useCallback(() => {
    if (controls.current) controls.current.previous();
    else goPreviousChapter();
  }, [goPreviousChapter]);

  /** Position signalée par la vue : affichage et enregistrement différé. */
  const onPosition = useCallback(
    (position: ViewPosition) => {
      live.current = { chapter, block: position.block, offset: position.offset };
      setDisplay({ fraction: position.fraction, page: position.page });
      scheduleSave({
        ...live.current,
        progress: bookProgress(toc, chapter, position.fraction),
        updatedAt: new Date().toISOString(),
      });
    },
    [chapter, toc, scheduleSave],
  );

  // ==================== LECTURE À VOIX HAUTE ====================

  const chapterPayload = state.status === "ready" ? state.chapter : null;
  const texts = useMemo(
    () => (chapterPayload ? blockTexts(chapterPayload.blocks.map(parseBlock)) : []),
    [chapterPayload],
  );
  const followBlock = useCallback((index: number) => controls.current?.goTo(index, 0), []);
  const speech = useReadAloud(book.language, followBlock, goNextChapter);

  /** Bouton principal : démarrer, mettre en pause ou reprendre. */
  const toggleSpeech = () => {
    if (speech.status === "speaking") speech.pause();
    else if (speech.status === "paused") speech.resume();
    else speech.start(texts, live.current.block);
  };

  // ==================== RÉGLAGES ET SIGNETS ====================

  const changeSettings = (value: ReaderSettings) => {
    setSettings(value);
    saveSettings(value);
    // Changement de mode : nouvelle vue, rouverte à la position courante
    if (value.mode !== settings.mode) {
      setOpening((current) => ({ ...live.current, serial: current.serial + 1 }));
    }
  };

  const onAddBookmark = async (label: string): Promise<string | null> => {
    const result = await addBookmark(book.id, live.current, label);
    if (!result.ok) return result.error;
    setBookmarks((list) => [...list, result.bookmark]);
    return null;
  };

  const onDeleteBookmark = async (id: string) => {
    if (await deleteBookmark(id)) setBookmarks((list) => list.filter((item) => item.id !== id));
  };

  /** Sélection dans un panneau : on va à la position et on referme le panneau. */
  const select = (position: ReaderPosition) => {
    if (speech.status !== "idle") speech.stop();
    setPanel(null);
    jumpTo(position);
  };

  // ==================== EFFETS ====================

  // La page derrière la liseuse ne défile pas
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Préchargement du chapitre suivant pendant la lecture
  useEffect(() => {
    if (state.status === "ready" && next !== null && isChapterReadable(toc, next, access)) {
      store.prefetch(next);
    }
  }, [state.status, next, toc, access, store]);

  // Clavier : flèches et Page préc./suiv. (pages à tourner), Échap (panneau)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panel) {
        setPanel(null);
        return;
      }
      if (panel || isTyping(event.target) || settings.mode !== "flip") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        pageNext();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        pagePrevious();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panel, settings.mode, pageNext, pagePrevious]);

  // ==================== RENDU ====================

  const percent = ended ? 100 : Math.round(bookProgress(toc, chapter, display.fraction) * 100);
  const lock = (
    <LockScreen title={book.title} slug={book.slug} price={price} signedIn={signedIn} />
  );
  const end = <EndScreen title={book.title} slug={book.slug} />;

  /** Bas d'un chapitre en défilement : chapitre suivant, fin de l'extrait ou fin du livre. */
  const scrollFooter =
    next === null ? (
      end
    ) : isChapterReadable(toc, next, access) ? (
      <div className="flex justify-center">
        <button type="button" onClick={goNextChapter} className={NAV_BUTTON}>
          {t.reader.nextChapter} →
        </button>
      </div>
    ) : (
      lock
    );

  let main: ReactNode;
  if (ended) main = end;
  else if (state.status === "locked") main = lock;
  else if (state.status === "loading") {
    main = <p className="m-auto opacity-80">{t.reader.loading}</p>;
  } else if (state.status === "error") {
    main = (
      <div role="alert" className="m-auto flex flex-col items-center gap-3 px-6 text-center">
        <p>{state.rateLimited ? t.content.api.tooManyRequests : t.reader.loadError}</p>
        <button type="button" onClick={retry} className={NAV_BUTTON}>
          {t.reader.retry}
        </button>
      </div>
    );
  } else {
    const viewKey = `${chapter}:${settings.mode}:${opening.serial}`;
    const initial = { block: opening.block, offset: opening.offset };
    main =
      settings.mode === "flip" ? (
        <FlipView
          key={viewKey}
          chapter={state.chapter}
          settings={settings}
          initial={initial}
          watermark={watermark}
          controlsRef={controls}
          onPosition={onPosition}
          onNextChapter={goNextChapter}
          onPreviousChapter={goPreviousChapter}
        />
      ) : (
        <ScrollView
          key={viewKey}
          chapter={state.chapter}
          initial={initial}
          watermark={watermark}
          controlsRef={controls}
          onPosition={onPosition}
          footer={scrollFooter}
        />
      );
  }

  const style = {
    "--liseuse-taille": `${FONT_SIZES[settings.fontSize]}px`,
    "--liseuse-interligne": String(LINE_HEIGHTS[settings.lineHeight]),
    "--liseuse-police":
      settings.font === "serif" ? "var(--police-lecture)" : "var(--police-interface)",
  } as CSSProperties;

  const togglePanel = (name: PanelName) => setPanel((value) => (value === name ? null : name));
  const panelButton = (name: PanelName, icon: string) => (
    <button
      type="button"
      onClick={() => togglePanel(name)}
      aria-pressed={panel === name}
      aria-label={t.reader.panels[name]}
      title={t.reader.panels[name]}
      className={TOOL_BUTTON}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );

  return (
    <div
      ref={rootRef}
      data-theme={settings.theme}
      style={style}
      className="liseuse fixed inset-0 z-50 flex flex-col"
    >
      <p className="liseuse-impression">{t.reader.printBlocked}</p>

      {/* ==================== BARRE D'OUTILS ==================== */}
      <header
        role="toolbar"
        aria-label={t.reader.toolbar}
        className="liseuse-barre flex items-center gap-1 border-b border-[var(--liseuse-bordure)]
          px-2 py-1"
      >
        <Link
          href={`/livres/${book.slug}`}
          aria-label={t.reader.close}
          title={t.reader.close}
          className={TOOL_BUTTON}
        >
          <span aria-hidden="true">←</span>
        </Link>
        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-sm font-semibold">{book.title}</h1>
          <p className="truncate text-xs opacity-75">{chapterTitle}</p>
        </div>
        {panelButton("toc", "☰")}
        {panelButton("bookmarks", "🔖")}
        {panelButton("search", "🔍")}
        {speech.supported && (
          <>
            <button
              type="button"
              onClick={toggleSpeech}
              disabled={!chapterPayload || ended}
              aria-label={
                speech.status === "speaking"
                  ? t.reader.readAloud.pause
                  : speech.status === "paused"
                    ? t.reader.readAloud.resume
                    : t.reader.readAloud.start
              }
              className={`${TOOL_BUTTON} disabled:opacity-40`}
            >
              <span aria-hidden="true">{speech.status === "speaking" ? "⏸" : "🔊"}</span>
            </button>
            {speech.status !== "idle" && (
              <button
                type="button"
                onClick={speech.stop}
                aria-label={t.reader.readAloud.stop}
                className={TOOL_BUTTON}
              >
                <span aria-hidden="true">⏹</span>
              </button>
            )}
          </>
        )}
        {panelButton("settings", "Aa")}
      </header>

      {/* ==================== TEXTE ==================== */}
      <main className="liseuse-zone relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {main}
        {panel && (
          <Panel name={panel} onClose={() => setPanel(null)}>
            {panel === "toc" && (
              <TocPanel
                toc={toc}
                access={access}
                current={chapter}
                onSelect={(n) => select({ chapter: n, block: 0, offset: 0 })}
              />
            )}
            {panel === "bookmarks" && (
              <BookmarksPanel
                signedIn={signedIn}
                slug={book.slug}
                bookmarks={bookmarks}
                toc={toc}
                defaultLabel={`${chapterTitle} (${percent} %)`}
                onAdd={onAddBookmark}
                onDelete={onDeleteBookmark}
                onSelect={select}
              />
            )}
            {panel === "search" && (
              <SearchPanel bookId={book.id} access={access} onSelect={select} />
            )}
            {panel === "settings" && (
              <SettingsPanel settings={settings} onChange={changeSettings} />
            )}
          </Panel>
        )}
      </main>

      {/* ==================== AVANCEMENT ==================== */}
      <footer className="liseuse-barre flex items-center gap-3 border-t
        border-[var(--liseuse-bordure)] px-3 py-2">
        <button
          type="button"
          onClick={settings.mode === "flip" ? pagePrevious : goPreviousChapter}
          disabled={previous === null && !ended && settings.mode === "scroll"}
          aria-label={settings.mode === "flip" ? t.reader.previousPage : t.reader.previousChapter}
          className={NAV_BUTTON}
        >
          ←
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            role="progressbar"
            aria-label={t.reader.progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-1.5 overflow-hidden rounded-full bg-[var(--liseuse-bordure)]"
          >
            <div className="liseuse-avancement h-full" style={{ width: `${percent}%` }} />
          </div>
          <p className="flex justify-between gap-2 text-xs opacity-75">
            <span>{interpolate(t.reader.progress, { percent: String(percent) })}</span>
            {settings.mode === "flip" && display.page && !ended && (
              <span>{`${display.page.current} / ${display.page.total}`}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={settings.mode === "flip" ? pageNext : goNextChapter}
          disabled={ended || state.status === "locked"}
          aria-label={settings.mode === "flip" ? t.reader.nextPage : t.reader.nextChapter}
          className={NAV_BUTTON}
        >
          →
        </button>
      </footer>
    </div>
  );
}
