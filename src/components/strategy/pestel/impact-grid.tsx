/**
 * =============================================================
 *  Fichier    : impact-grid.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Grille impact-incertitude : les facteurs nommés se glissent d'une case à
 *               l'autre (souris) ou se placent avec la liste de chaque facteur (clavier,
 *               écran tactile). Impact en lignes (fort en haut), incertitude en colonnes
 *               (forte à droite).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/templates/pestel.ts
 * =============================================================
 */

"use client";

import { useState, type DragEvent } from "react";

import { CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { QUADRANTS, type PestelFactor, type Quadrant } from "@/lib/strategy/templates/pestel";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const p = tStrategy.pestel;

/** Ordre d'affichage : impact fort en haut, incertitude forte à droite. */
const LAYOUT: readonly Quadrant[] = ["trend", "pivot", "minor", "watch"];

/** Zone de dépôt : une case de la grille ou la réserve « à placer ». */
type Zone = Quadrant | "unplaced";

const DRAG_TYPE = "text/plain";

type ImpactGridProps = {
  factors: PestelFactor[];
  readOnly: boolean;
  onPlace: (id: string, quadrant: Quadrant | null) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Étiquette d'un facteur : glissable, avec sa liste de placement. */
function FactorChip({
  factor,
  readOnly,
  onPlace,
}: {
  factor: PestelFactor;
  readOnly: boolean;
  onPlace: ImpactGridProps["onPlace"];
}) {
  return (
    <li
      draggable={!readOnly}
      onDragStart={(event) => event.dataTransfer.setData(DRAG_TYPE, factor.id)}
      className={`flex flex-col gap-1 rounded-md border border-line bg-surface p-2 text-small ${
        readOnly ? "" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <span className="font-semibold">
        <span className="text-ink-muted">{p.dimensions[factor.dimension]} · </span>
        {factor.factor}
      </span>
      {!readOnly && (
        <select
          className={`${CONTROL} text-small`}
          aria-label={interpolate(p.placeIn, { factor: factor.factor })}
          value={factor.quadrant ?? ""}
          onChange={(event) => onPlace(factor.id, (event.target.value || null) as Quadrant | null)}
        >
          <option value="">{p.placeNone}</option>
          {QUADRANTS.map((quadrant) => (
            <option key={quadrant} value={quadrant}>
              {p.quadrants[quadrant]}
            </option>
          ))}
        </select>
      )}
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Grille 2 × 2 et réserve des facteurs à placer. */
export function ImpactGrid({ factors, readOnly, onPlace }: ImpactGridProps) {
  const [over, setOver] = useState<Zone | null>(null);
  const named = factors.filter((factor) => factor.factor.trim().length > 0);

  /** Propriétés de dépôt d'une zone (aucune en lecture seule). */
  function dropProps(zone: Zone) {
    if (readOnly) return {};
    return {
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        setOver(zone);
      },
      onDragLeave: () => setOver((current) => (current === zone ? null : current)),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setOver(null);
        const id = event.dataTransfer.getData(DRAG_TYPE);
        if (id) onPlace(id, zone === "unplaced" ? null : zone);
      },
    };
  }

  /** Classes d'une zone, surlignée quand un facteur la survole. */
  function zoneClass(zone: Zone): string {
    return `flex min-h-32 flex-col gap-2 rounded-md p-3 transition-colors ${
      over === zone ? "bg-encre-soft" : zone === "pivot" ? "bg-ocre/15" : "bg-sand"
    }`;
  }

  const unplaced = named.filter((factor) => factor.quadrant === null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{p.gridTitle}</h2>
        <p className="text-small text-ink-muted">{p.gridIntro}</p>
      </div>

      <div className={`${CARD} flex flex-col gap-2 p-3`} {...dropProps("unplaced")}>
        <h3 className="font-semibold">{p.unplaced}</h3>
        {unplaced.length === 0 ? (
          <p className="text-small text-ink-muted">{p.unplacedEmpty}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((factor) => (
              <FactorChip key={factor.id} factor={factor} readOnly={readOnly} onPlace={onPlace} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-caption uppercase text-ink-muted">
          ↑ {p.impactAxis} · {p.uncertaintyAxis} →
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LAYOUT.map((quadrant) => {
            const inside = named.filter((factor) => factor.quadrant === quadrant);
            return (
              <div key={quadrant} className={zoneClass(quadrant)} {...dropProps(quadrant)}>
                <h3 className="font-semibold">{p.quadrants[quadrant]}</h3>
                <p className="text-caption text-ink-muted">{p.quadrantHints[quadrant]}</p>
                <ul className="flex flex-col gap-2">
                  {inside.map((factor) => (
                    <FactorChip
                      key={factor.id}
                      factor={factor}
                      readOnly={readOnly}
                      onPlace={onPlace}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
