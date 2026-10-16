/**
 * =============================================================
 *  Fichier    : tows-board.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Matrice TOWS de l'étape 5 : quatre quadrants (SO, ST, WO, WT) ; chaque piste
 *               d'action est liée aux éléments des deux cases de la SWOT qu'elle croise.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/synthesis.ts
 * =============================================================
 */

"use client";

import { LinkPicker } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ITEM_TEXT_MAX,
  TOWS_CROSS,
  TOWS_MAX,
  TOWS_QUADRANTS,
  type SynthesisPayload,
  type TowsItem,
  type TowsQuadrant,
} from "@/lib/strategy/templates/synthesis";

const t = getDictionary();
const s = t.strategy.synthesis;

type TowsBoardProps = {
  swot: SynthesisPayload["swot"];
  tows: TowsItem[];
  readOnly: boolean;
  onAdd: (quadrant: TowsQuadrant) => void;
  onChange: (id: string, patch: Partial<Pick<TowsItem, "text" | "links">>) => void;
  onRemove: (id: string) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Piste d'action : texte, éléments liés, suppression. */
function TowsRow({
  item,
  swot,
  readOnly,
  onChange,
  onRemove,
}: {
  item: TowsItem;
  swot: SynthesisPayload["swot"];
  readOnly: boolean;
  onChange: TowsBoardProps["onChange"];
  onRemove: TowsBoardProps["onRemove"];
}) {
  const groups = TOWS_CROSS[item.quadrant].map((key) => ({
    title: s.keys[key],
    options: swot[key],
  }));

  return (
    <li className="flex flex-col gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-2">
        <textarea
          className={`${CONTROL} flex-1 py-2`}
          rows={2}
          value={item.text}
          maxLength={ITEM_TEXT_MAX}
          readOnly={readOnly}
          aria-label={interpolate(s.towsLabel, { quadrant: s.quadrants[item.quadrant] })}
          onChange={(event) => onChange(item.id, { text: event.target.value })}
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
      </div>
      <LinkPicker
        name={`tows-${item.id}`}
        title={s.links}
        groups={groups}
        selected={item.links}
        readOnly={readOnly}
        onChange={(links) => onChange(item.id, { links })}
      />
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Matrice TOWS en grille 2 × 2 (une colonne sur mobile). */
export function TowsBoard({ swot, tows, readOnly, onAdd, onChange, onRemove }: TowsBoardProps) {
  const full = tows.length >= TOWS_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.towsTitle}</h2>
        <p className="text-small text-ink-muted">{s.towsIntro}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {TOWS_QUADRANTS.map((quadrant) => {
          const items = tows.filter((item) => item.quadrant === quadrant);
          const headingId = `tows-${quadrant}`;
          return (
            <section
              key={quadrant}
              aria-labelledby={headingId}
              className={`${CARD} flex flex-col gap-3 p-4`}
            >
              <div className="flex flex-col">
                <h3 id={headingId} className="font-semibold">
                  {s.quadrants[quadrant]} ({items.length})
                </h3>
                <p className="text-small text-ink-muted">{s.quadrantHints[quadrant]}</p>
              </div>
              {items.length === 0 ? (
                <p className="text-small text-ink-muted">{s.emptyTows}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <TowsRow
                      key={item.id}
                      item={item}
                      swot={swot}
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
                  onClick={() => onAdd(quadrant)}
                >
                  <IconPlus size={18} />
                  {s.addTows}
                </button>
              )}
            </section>
          );
        })}
      </div>
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxTows, { max: String(TOWS_MAX) })}
        </p>
      )}
    </section>
  );
}
