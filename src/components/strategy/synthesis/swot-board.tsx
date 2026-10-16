/**
 * =============================================================
 *  Fichier    : swot-board.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Matrice SWOT de l'étape 5 : quatre cases (forces, faiblesses, opportunités,
 *               menaces), chaque élément modifiable avec l'étiquette de son étape d'origine
 *               (« É1 » à « É4 ») quand il a été repris.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/synthesis.ts
 * =============================================================
 */

"use client";

import type { ReactNode } from "react";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BADGE, BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ITEM_TEXT_MAX,
  originLabel,
  SWOT_ITEMS_MAX,
  SWOT_KEYS,
  type SwotItem,
  type SwotKey,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

const t = getDictionary();
const s = t.strategy.synthesis;

type SwotBoardProps = {
  swot: SynthesisPayload["swot"];
  readOnly: boolean;
  /** Reprise des étapes 1 à 4 (bouton et liste), affichée sous l'introduction. */
  importer: ReactNode;
  onAdd: (key: SwotKey) => void;
  onChange: (key: SwotKey, id: string, text: string) => void;
  onRemove: (id: string) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Élément d'une case : texte, étiquette d'origine, suppression. */
function SwotRow({
  swotKey,
  item,
  readOnly,
  onChange,
  onRemove,
}: {
  swotKey: SwotKey;
  item: SwotItem;
  readOnly: boolean;
  onChange: SwotBoardProps["onChange"];
  onRemove: SwotBoardProps["onRemove"];
}) {
  const label = originLabel(item.origin);

  return (
    <li className="flex items-start gap-2">
      {label && item.origin && (
        <span
          className={`${BADGE} mt-2 shrink-0`}
          title={interpolate(s.origin, { step: String(item.origin.step) })}
        >
          {label}
        </span>
      )}
      <textarea
        className={`${CONTROL} flex-1 py-2`}
        rows={2}
        value={item.text}
        maxLength={ITEM_TEXT_MAX}
        readOnly={readOnly}
        aria-label={interpolate(s.itemLabel, { key: s.keys[swotKey] })}
        onChange={(event) => onChange(swotKey, item.id, event.target.value)}
      />
      <CommentBadge targetId={item.id} label={item.text.trim() || s.untitled} />
      {!readOnly && (
        <button
          type="button"
          className={BUTTON_ICON}
          aria-label={`${t.strategy.template.remove} : ${item.text.trim() || s.untitled}`}
          onClick={() => onRemove(item.id)}
        >
          <IconTrash size={18} />
        </button>
      )}
    </li>
  );
}

/** Une case de la SWOT. */
function SwotCell({
  swotKey,
  items,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: {
  swotKey: SwotKey;
  items: SwotItem[];
  readOnly: boolean;
} & Pick<SwotBoardProps, "onAdd" | "onChange" | "onRemove">) {
  const full = items.length >= SWOT_ITEMS_MAX;
  const headingId = `swot-${swotKey}`;

  return (
    <section aria-labelledby={headingId} className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex flex-col">
        <h3 id={headingId} className="font-semibold">
          {s.keys[swotKey]} ({items.length})
        </h3>
        <p className="text-caption uppercase text-ink-muted">{s.keyHints[swotKey]}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyKey}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <SwotRow
              key={item.id}
              swotKey={swotKey}
              item={item}
              readOnly={readOnly}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
      {!readOnly && (
        <button
          type="button"
          className={`${BUTTON_TERTIARY} w-fit`}
          disabled={full}
          onClick={() => onAdd(swotKey)}
        >
          <IconPlus size={18} />
          {s.addItem}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxItems, { max: String(SWOT_ITEMS_MAX) })}
        </p>
      )}
    </section>
  );
}

// ==================== COMPOSANT ====================

/** Matrice SWOT en grille 2 × 2 (une colonne sur mobile). */
export function SwotBoard({ swot, readOnly, importer, ...handlers }: SwotBoardProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.swotTitle}</h2>
        <p className="text-small text-ink-muted">{s.swotIntro}</p>
      </div>
      {importer}
      <div className="grid gap-4 md:grid-cols-2">
        {SWOT_KEYS.map((key) => (
          <SwotCell key={key} swotKey={key} items={swot[key]} readOnly={readOnly} {...handlers} />
        ))}
      </div>
    </section>
  );
}
