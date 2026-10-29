/**
 * =============================================================
 *  Fichier    : ansoff-matrix.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Matrice d'Ansoff (étape 7) : grille 2 × 2 produits (actuels ou nouveaux) ×
 *               marchés (actuels ou nouveaux) qui montre les options placées dans chaque case
 *               et permet d'en ajouter une directement dans une case. Les options sans case
 *               sont comptées sous la grille.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/choice.ts
 * =============================================================
 */

"use client";

import { shortLabel } from "@/components/strategy/synthesis/link-picker";
import { IconPlus } from "@/components/ui/icons";
import { BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  OPTIONS_MAX,
  type AnsoffCell,
  type StrategicOption,
} from "@/lib/strategy/templates/choice";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.choice;

/** Disposition : une ligne par marché, une colonne par produit (actuels puis nouveaux). */
const GRID: { market: "current" | "new"; cells: AnsoffCell[] }[] = [
  { market: "current", cells: ["penetration", "productDevelopment"] },
  { market: "new", cells: ["marketDevelopment", "diversification"] },
];

type AnsoffMatrixProps = {
  options: StrategicOption[];
  readOnly: boolean;
  onAdd: (cell: AnsoffCell) => void;
};

/** Matrice d'Ansoff des options. */
export function AnsoffMatrix({ options, readOnly, onAdd }: AnsoffMatrixProps) {
  const full = options.length >= OPTIONS_MAX;
  const unplaced = options.filter((option) => option.ansoff === null).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.ansoffTitle}</h2>
        <p className="text-small text-ink-muted">{s.ansoffIntro}</p>
      </div>
      <div className="grid gap-2 text-small md:grid-cols-[auto_1fr_1fr]">
        <span className="hidden text-caption uppercase text-ink-muted md:block">
          {s.axisMarkets} / {s.axisProducts}
        </span>
        <span className="hidden text-center font-semibold md:block">
          {s.axisProducts} {s.current.toLowerCase()}
        </span>
        <span className="hidden text-center font-semibold md:block">
          {s.axisProducts} {s.new.toLowerCase()}
        </span>
        {GRID.map((row) => (
          <div key={row.market} className="contents">
            <span className="hidden self-center font-semibold md:block">
              {s.axisMarkets} {s[row.market].toLowerCase()}
            </span>
            {row.cells.map((cell) => {
              const items = options.filter((option) => option.ansoff === cell);
              const headingId = `ansoff-${cell}`;
              return (
                <section
                  key={cell}
                  aria-labelledby={headingId}
                  className={`${CARD} flex flex-col gap-2 p-3`}
                >
                  <h3 id={headingId} className="font-semibold">
                    {s.cells[cell]} ({items.length})
                  </h3>
                  {items.length === 0 ? (
                    <p className="text-ink-muted">{s.cellEmpty}</p>
                  ) : (
                    <ul className="flex list-disc flex-col gap-1 pl-5">
                      {items.map((option) => (
                        <li key={option.id}>
                          {option.text.trim() ? shortLabel(option.text) : s.untitledOption}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      className={`${BUTTON_TERTIARY} w-fit`}
                      disabled={full}
                      onClick={() => onAdd(cell)}
                    >
                      <IconPlus size={18} />
                      {s.addOption}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        ))}
      </div>
      {unplaced > 0 && (
        <p className="text-small text-ink-muted">
          {interpolate(s.unplaced, { count: String(unplaced) })}
        </p>
      )}
    </section>
  );
}
