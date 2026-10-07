/**
 * =============================================================
 *  Fichier    : panels.tsx (reader)
 *  Projet     : Kalami
 *  Description: Panneaux latéraux de la liseuse : sommaire cliquable, signets nommés,
 *               recherche dans le texte (parties autorisées seulement) et réglages de
 *               lecture (mode, thème, police, taille, interligne).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: i18n, lib/reader/types.ts, API /api/livres/{id}/recherche
 * =============================================================
 */

"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";

import { getDictionary, interpolate } from "@/i18n";
import type { TocEntry } from "@/lib/catalog/types";
import { parseSearchQuery, SEARCH_MAX_HITS } from "@/lib/reader/search";
import {
  type Bookmark,
  FONT_SIZES,
  LINE_HEIGHTS,
  READER_FONTS,
  READER_MODES,
  READER_THEMES,
  type ReaderAccess,
  type ReaderPosition,
  type ReaderSettings,
  type SearchHit,
} from "@/lib/reader/types";

const t = getDictionary();

export type PanelName = "toc" | "bookmarks" | "search" | "settings";

const BUTTON =
  "min-h-11 rounded-md border border-[var(--liseuse-bordure)] px-3 text-sm font-medium " +
  "disabled:opacity-50";
const BUTTON_ACTIVE = "bg-[var(--liseuse-texte)] text-[var(--liseuse-fond)]";

// ==================== CADRE ====================

/** Panneau latéral avec titre et bouton de fermeture. */
export function Panel({
  name,
  onClose,
  children,
}: {
  name: PanelName;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <aside
      aria-labelledby={`panneau-${name}`}
      className="liseuse-panneau absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col
        border-l border-[var(--liseuse-bordure)] shadow-xl"
    >
      <header className="flex items-center justify-between gap-2 border-b
        border-[var(--liseuse-bordure)] px-4 py-2">
        <h2 id={`panneau-${name}`} className="font-semibold">
          {t.reader.panels[name]}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.reader.panels.close}
          className="min-h-11 min-w-11 rounded-md text-xl"
        >
          ×
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

// ==================== SOMMAIRE ====================

/** Sommaire : chapitres réservés signalés, chapitre en cours marqué. */
export function TocPanel({
  toc,
  access,
  current,
  onSelect,
}: {
  toc: TocEntry[];
  access: ReaderAccess;
  current: number;
  onSelect: (chapter: number) => void;
}) {
  return (
    <ol className="flex flex-col">
      {toc.map((entry) => {
        const locked = access !== "full" && !entry.is_preview;
        const isCurrent = entry.chapter_position === current;
        return (
          <li key={entry.chapter_position}>
            <button
              type="button"
              onClick={() => onSelect(entry.chapter_position)}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex min-h-11 w-full items-baseline gap-2 rounded-md px-2 py-2
                text-left ${isCurrent ? "font-semibold" : ""} ${locked ? "opacity-60" : ""}`}
            >
              <span className="opacity-70">{entry.chapter_position}.</span>
              <span className="flex-1">{entry.title}</span>
              {locked && (
                <span className="text-xs" title={t.reader.toc.locked}>
                  🔒<span className="sr-only">{t.reader.toc.locked}</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ==================== SIGNETS ====================

type BookmarksPanelProps = {
  signedIn: boolean;
  slug: string;
  bookmarks: Bookmark[];
  toc: TocEntry[];
  defaultLabel: string;
  onAdd: (label: string) => Promise<string | null>;
  onDelete: (id: string) => void;
  onSelect: (position: ReaderPosition) => void;
};

/** Signets nommés (lecteur connecté), triés dans l'ordre du livre. */
export function BookmarksPanel(props: BookmarksPanelProps) {
  const { signedIn, slug, bookmarks, toc, defaultLabel, onAdd, onDelete, onSelect } = props;
  const [label, setLabel] = useState(defaultLabel);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-3">
        <p>{t.reader.bookmarks.signInRequired}</p>
        <Link
          href={`/connexion?suivant=${encodeURIComponent(`/livres/${slug}/lire`)}`}
          className="underline"
        >
          {t.reader.bookmarks.signIn}
        </Link>
      </div>
    );
  }

  /** Enregistre un signet à la position courante. */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    const message = await onAdd(label);
    setPending(false);
    setError(message);
  };

  const sorted = [...bookmarks].sort(
    (a, b) => a.chapter - b.chapter || a.block - b.block || a.offset - b.offset,
  );
  const chapterTitle = (chapter: number) =>
    toc.find((entry) => entry.chapter_position === chapter)?.title ?? String(chapter);

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="nom-signet" className="text-sm font-medium">
          {t.reader.bookmarks.label}
        </label>
        <input
          id="nom-signet"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={120}
          required
          className="liseuse-champ min-h-11 rounded-md border px-3"
        />
        <button type="submit" disabled={pending} className={BUTTON}>
          {t.reader.bookmarks.add}
        </button>
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
      </form>

      {sorted.length === 0 ? (
        <p className="opacity-80">{t.reader.bookmarks.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--liseuse-bordure)]">
          {sorted.map((bookmark) => (
            <li key={bookmark.id} className="flex items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => onSelect(bookmark)}
                className="flex min-h-11 flex-1 flex-col items-start text-left"
              >
                <span className="font-medium">{bookmark.label}</span>
                <span className="text-xs opacity-70">{chapterTitle(bookmark.chapter)}</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(bookmark.id)}
                aria-label={interpolate(t.reader.bookmarks.remove, { label: bookmark.label })}
                className="min-h-11 min-w-11 rounded-md"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==================== RECHERCHE ====================

type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "done"; hits: SearchHit[]; limited: boolean }
  | { status: "error"; message: string };

/** Recherche dans le texte ; l'API ne renvoie que des passages autorisés. */
export function SearchPanel({
  bookId,
  access,
  onSelect,
}: {
  bookId: string;
  access: ReaderAccess;
  onSelect: (hit: SearchHit) => void;
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  /** Lance la recherche côté serveur. */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = parseSearchQuery(query);
    if (!clean) {
      setState({ status: "error", message: t.reader.search.tooShort });
      return;
    }
    setState({ status: "searching" });
    try {
      const response = await fetch(
        `/api/livres/${bookId}/recherche?q=${encodeURIComponent(clean)}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) {
        setState({ status: "error", message: body.message ?? t.reader.search.error });
        return;
      }
      setState({ status: "done", hits: body.hits, limited: body.limited });
    } catch {
      setState({ status: "error", message: t.reader.search.error });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} role="search" className="flex flex-col gap-2">
        <label htmlFor="recherche-texte" className="text-sm font-medium">
          {t.reader.search.field}
        </label>
        <div className="flex gap-2">
          <input
            id="recherche-texte"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            minLength={2}
            maxLength={100}
            required
            className="liseuse-champ min-h-11 flex-1 rounded-md border px-3"
          />
          <button type="submit" disabled={state.status === "searching"} className={BUTTON}>
            {t.reader.search.submit}
          </button>
        </div>
        {access !== "full" && <p className="text-xs opacity-80">{t.reader.search.previewOnly}</p>}
      </form>

      <div aria-live="polite">
        {state.status === "searching" && <p>{t.reader.search.searching}</p>}
        {state.status === "error" && <p role="alert">{state.message}</p>}
        {state.status === "done" && <SearchResults state={state} onSelect={onSelect} />}
      </div>
    </div>
  );
}

/** Liste des résultats, occurrence mise en évidence. */
function SearchResults({
  state,
  onSelect,
}: {
  state: Extract<SearchState, { status: "done" }>;
  onSelect: (hit: SearchHit) => void;
}) {
  if (state.hits.length === 0) return <p>{t.reader.search.noResults}</p>;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm opacity-80">
        {interpolate(t.reader.search.results, { count: String(state.hits.length) })}
      </p>
      <ul className="flex flex-col divide-y divide-[var(--liseuse-bordure)]">
        {state.hits.map((hit, index) => {
          const end = hit.matchStart + hit.matchLength;
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => onSelect(hit)}
                className="flex w-full flex-col gap-1 py-2 text-left"
              >
                <span className="text-xs font-medium opacity-70">{hit.title}</span>
                <span className="text-sm">
                  {hit.snippet.slice(0, hit.matchStart)}
                  <mark className="liseuse-surlignage">
                    {hit.snippet.slice(hit.matchStart, end)}
                  </mark>
                  {hit.snippet.slice(end)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {state.limited && (
        <p className="text-xs opacity-80">
          {interpolate(t.reader.search.limited, { count: String(SEARCH_MAX_HITS) })}
        </p>
      )}
    </div>
  );
}

// ==================== RÉGLAGES ====================

/** Groupe de boutons à choix unique. */
function Choice<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`${BUTTON} ${option.value === value ? BUTTON_ACTIVE : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Réglages de lecture, enregistrés sur l'appareil. */
export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: ReaderSettings;
  onChange: (settings: ReaderSettings) => void;
}) {
  const s = t.reader.settings;
  const update = (patch: Partial<ReaderSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="flex flex-col gap-6">
      <Choice
        legend={s.mode}
        options={READER_MODES.map((value) => ({ value, label: s[value] }))}
        value={settings.mode}
        onChange={(mode) => update({ mode })}
      />
      <Choice
        legend={s.theme}
        options={READER_THEMES.map((value) => ({ value, label: s[value] }))}
        value={settings.theme}
        onChange={(theme) => update({ theme })}
      />
      <Choice
        legend={s.font}
        options={READER_FONTS.map((value) => ({ value, label: s[value] }))}
        value={settings.font}
        onChange={(font) => update({ font })}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{s.fontSize}</legend>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={BUTTON}
            aria-label={s.smaller}
            disabled={settings.fontSize === 0}
            onClick={() => update({ fontSize: settings.fontSize - 1 })}
          >
            A−
          </button>
          <span className="min-w-12 text-center">{FONT_SIZES[settings.fontSize]} px</span>
          <button
            type="button"
            className={BUTTON}
            aria-label={s.larger}
            disabled={settings.fontSize === FONT_SIZES.length - 1}
            onClick={() => update({ fontSize: settings.fontSize + 1 })}
          >
            A+
          </button>
        </div>
      </fieldset>
      <Choice
        legend={s.lineHeight}
        options={LINE_HEIGHTS.map((_, index) => ({ value: index, label: s.lineHeights[index] }))}
        value={settings.lineHeight}
        onChange={(lineHeight) => update({ lineHeight })}
      />
      <p className="text-xs opacity-80">{t.reader.protection}</p>
      <p className="text-xs opacity-80">{t.reader.shortcuts}</p>
    </div>
  );
}
