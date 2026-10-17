/**
 * =============================================================
 *  Fichier    : seek-bar.tsx (reader)
 *  Projet     : Kalami
 *  Description: Accès rapide dans le livre : curseur d'avancement à glisser (le chapitre
 *               visé s'affiche pendant le geste, le saut a lieu au relâchement), boutons
 *               « Début du livre » et « Fin du livre ». Au clavier, chaque flèche saute
 *               directement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: lib/reader/position.ts, ui/icons.tsx
 * =============================================================
 */

"use client";

import { type ChangeEvent, useRef, useState } from "react";

import { IconToEnd, IconToStart } from "@/components/ui/icons";
import { getDictionary, interpolate } from "@/i18n";
import type { TocEntry } from "@/lib/catalog/types";
import { progressTarget } from "@/lib/reader/position";

const t = getDictionary();

/** Précision du curseur (pas de 0,1 % du livre). */
const STEPS = 1000;

type SeekBarProps = {
  toc: TocEntry[];
  /** Avancement affiché, de 0 à 1 */
  value: number;
  /** Page du chapitre (mode livre), ou null */
  page: { current: number; total: number } | null;
  disabled: boolean;
  /** Classe des boutons d'icône */
  buttonClass: string;
  iconSize: number;
  onSeek: (value: number) => void;
  onStart: () => void;
  onEnd: () => void;
};

/** Barre d'avancement interactive de la liseuse. */
export function SeekBar({
  toc,
  value,
  page,
  disabled,
  buttonClass,
  iconSize,
  onSeek,
  onStart,
  onEnd,
}: SeekBarProps) {
  // Valeur en cours de glissement (null : affichage de la position réelle)
  const [dragged, setDragged] = useState<number | null>(null);
  const pointer = useRef(false);

  const shown = dragged ?? value;
  const percent = Math.round(shown * 100);
  const target = dragged === null ? null : progressTarget(toc, dragged);
  const targetTitle = target
    ? toc.find((entry) => entry.chapter_position === target.chapter)?.title ?? ""
    : "";

  /** Saut à la valeur glissée, puis retour à l'affichage de la position réelle. */
  const commit = (next: number | null) => {
    setDragged(null);
    if (next !== null) onSeek(next);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value) / STEPS;
    // Clavier : saut immédiat ; souris ou doigt : au relâchement
    if (pointer.current) setDragged(next);
    else commit(next);
  };

  const release = () => {
    if (!pointer.current) return;
    pointer.current = false;
    commit(dragged);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        aria-label={t.reader.bookStart}
        title={t.reader.bookStart}
        className={buttonClass}
      >
        <IconToStart size={iconSize} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <input
          type="range"
          min={0}
          max={STEPS}
          step={1}
          value={Math.round(shown * STEPS)}
          disabled={disabled}
          aria-label={t.reader.seekLabel}
          aria-valuetext={interpolate(t.reader.progress, { percent: String(percent) })}
          onPointerDown={() => {
            pointer.current = true;
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onBlur={release}
          onChange={onChange}
          className="liseuse-curseur"
        />
        <p className="flex justify-between gap-2 text-caption text-ink-muted tabular-nums">
          <span className="truncate">
            {target
              ? interpolate(t.reader.seekTarget, { title: targetTitle, percent: String(percent) })
              : interpolate(t.reader.progress, { percent: String(percent) })}
          </span>
          {page && !target && <span>{`${page.current} / ${page.total}`}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={onEnd}
        disabled={disabled}
        aria-label={t.reader.bookEnd}
        title={t.reader.bookEnd}
        className={buttonClass}
      >
        <IconToEnd size={iconSize} />
      </button>
    </div>
  );
}
