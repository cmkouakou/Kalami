/**
 * =============================================================
 *  Fichier    : generic-grid.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Stratégies génériques de Porter (étape 7) : grille 2 × 2 avantage (coûts ou
 *               valeur unique) × cible (large ou étroite), choix d'une position par boutons
 *               radio, et justification.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/choice.ts
 * =============================================================
 */

"use client";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { CONTROL } from "@/components/ui/styles";
import {
  JUSTIFICATION_MAX,
  type GenericChoice,
  type GenericPosition,
} from "@/lib/strategy/templates/choice";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.choice;

/** Disposition de la grille : une ligne par cible, une colonne par avantage. */
const GRID: { target: "broad" | "narrow"; cells: GenericPosition[] }[] = [
  { target: "broad", cells: ["cost", "differentiation"] },
  { target: "narrow", cells: ["focusCost", "focusDifferentiation"] },
];

type GenericGridProps = {
  generic: GenericChoice;
  readOnly: boolean;
  onChange: (patch: Partial<Omit<GenericChoice, "id">>) => void;
};

/** Grille de Porter et justification de la position. */
export function GenericGrid({ generic, readOnly, onChange }: GenericGridProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-h2 font-semibold">{s.genericTitle}</h2>
          <CommentBadge targetId="generic" label={s.genericTitle} />
        </div>
        <p className="text-small text-ink-muted">{s.genericIntro}</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-small font-semibold">{s.genericLegend}</legend>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-small">
          <span className="text-caption uppercase text-ink-muted">
            {s.axisTarget} / {s.axisAdvantage}
          </span>
          <span className="text-center font-semibold">{s.advantages.cost}</span>
          <span className="text-center font-semibold">{s.advantages.differentiation}</span>
          {GRID.map((row) => (
            <div key={row.target} className="contents">
              <span className="self-center font-semibold">{s.targets[row.target]}</span>
              {row.cells.map((position) => {
                const checked = generic.position === position;
                return (
                  <label
                    key={position}
                    className={
                      "flex min-h-20 cursor-pointer items-center gap-2 rounded-md border p-3 " +
                      (checked ? "border-encre bg-encre-soft text-encre" : "border-line")
                    }
                  >
                    <input
                      type="radio"
                      name="porter-position"
                      className="size-4"
                      value={position}
                      checked={checked}
                      disabled={readOnly}
                      onChange={() => onChange({ position })}
                    />
                    <span className="font-semibold">{s.positions[position]}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-small font-semibold">
        {s.justification}
        <textarea
          className={`${CONTROL} py-2`}
          rows={3}
          value={generic.justification}
          maxLength={JUSTIFICATION_MAX}
          readOnly={readOnly}
          onChange={(event) => onChange({ justification: event.target.value })}
        />
      </label>
    </section>
  );
}
