/**
 * =============================================================
 *  Fichier    : power-interest-grid.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Matrice pouvoir-intérêt : chaque partie prenante nommée apparaît dans la
 *               case calculée (pouvoir et intérêt forts à partir de 3) ou dans celle choisie
 *               à la main, en la glissant (souris) ou avec sa liste (clavier, écran tactile).
 *               Un bouton ramène au placement automatique. Pouvoir en lignes (fort en haut),
 *               intérêt en colonnes (fort à droite).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/templates/stakeholders.ts
 * =============================================================
 */

"use client";

import { useState, type DragEvent } from "react";

import { BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  autoQuadrant,
  quadrantOf,
  STAKE_QUADRANTS,
  type StakeQuadrant,
  type Stakeholder,
} from "@/lib/strategy/templates/stakeholders";

const t = getDictionary();
const s = t.strategy.stakeholders;

/** Ordre d'affichage : pouvoir fort en haut, intérêt fort à droite. */
const LAYOUT: readonly StakeQuadrant[] = ["satisfy", "manage", "monitor", "inform"];

/** Zone de dépôt : une case de la matrice ou la réserve « à placer ». */
type Zone = StakeQuadrant | "unplaced";

const DRAG_TYPE = "text/plain";

type PowerInterestGridProps = {
  stakeholders: Stakeholder[];
  readOnly: boolean;
  /** Place à la main (case) ou revient au placement automatique (null). */
  onPlace: (id: string, quadrant: StakeQuadrant | null) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Étiquette d'une partie prenante : glissable, avec sa liste de placement. */
function StakeholderChip({
  stakeholder,
  readOnly,
  onPlace,
}: {
  stakeholder: Stakeholder;
  readOnly: boolean;
  onPlace: PowerInterestGridProps["onPlace"];
}) {
  const auto = autoQuadrant(stakeholder);
  const manual = stakeholder.quadrantOverride !== null;
  return (
    <li
      draggable={!readOnly}
      onDragStart={(event) => event.dataTransfer.setData(DRAG_TYPE, stakeholder.id)}
      className={`flex flex-col gap-1 rounded-md border border-line bg-surface p-2 text-small ${
        readOnly ? "" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <span className="font-semibold">
        {stakeholder.name}
        {stakeholder.power !== null && stakeholder.interest !== null && (
          <span className="text-ink-muted">
            {" "}
            · {s.fields.power} {stakeholder.power}, {s.fields.interest} {stakeholder.interest}
          </span>
        )}
      </span>
      {manual && <span className="text-caption text-ink-muted">{s.manual}</span>}
      {!readOnly && (
        <>
          <select
            className={`${CONTROL} text-small`}
            aria-label={interpolate(s.placeIn, { name: stakeholder.name })}
            value={stakeholder.quadrantOverride ?? ""}
            onChange={(event) =>
              onPlace(stakeholder.id, (event.target.value || null) as StakeQuadrant | null)
            }
          >
            <option value="">
              {auto ? interpolate(s.placeAuto, { quadrant: s.quadrants[auto] }) : s.placeAutoNone}
            </option>
            {STAKE_QUADRANTS.map((quadrant) => (
              <option key={quadrant} value={quadrant}>
                {s.quadrants[quadrant]}
              </option>
            ))}
          </select>
          {manual && (
            <button
              type="button"
              className={`${BUTTON_TERTIARY} w-fit text-small`}
              onClick={() => onPlace(stakeholder.id, null)}
            >
              {s.resetAuto}
            </button>
          )}
        </>
      )}
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Matrice 2 × 2 et réserve des parties prenantes à placer. */
export function PowerInterestGrid({ stakeholders, readOnly, onPlace }: PowerInterestGridProps) {
  const [over, setOver] = useState<Zone | null>(null);
  const named = stakeholders.filter((stakeholder) => stakeholder.name.trim().length > 0);

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

  /** Classes d'une zone, surlignée quand une partie prenante la survole. */
  function zoneClass(zone: Zone): string {
    return `flex min-h-32 flex-col gap-2 rounded-md p-3 transition-colors ${
      over === zone ? "bg-encre-soft" : zone === "manage" ? "bg-ocre/15" : "bg-sand"
    }`;
  }

  const unplaced = named.filter((stakeholder) => quadrantOf(stakeholder) === null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.gridTitle}</h2>
        <p className="text-small text-ink-muted">{s.gridIntro}</p>
      </div>

      <div className={`${CARD} flex flex-col gap-2 p-3`} {...dropProps("unplaced")}>
        <h3 className="font-semibold">{s.unplaced}</h3>
        {unplaced.length === 0 ? (
          <p className="text-small text-ink-muted">{s.unplacedEmpty}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((stakeholder) => (
              <StakeholderChip
                key={stakeholder.id}
                stakeholder={stakeholder}
                readOnly={readOnly}
                onPlace={onPlace}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-caption uppercase text-ink-muted">
          ↑ {s.powerAxis} · {s.interestAxis} →
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LAYOUT.map((quadrant) => {
            const inside = named.filter((stakeholder) => quadrantOf(stakeholder) === quadrant);
            return (
              <div key={quadrant} className={zoneClass(quadrant)} {...dropProps(quadrant)}>
                <h3 className="font-semibold">{s.quadrants[quadrant]}</h3>
                <p className="text-caption text-ink-muted">{s.quadrantHints[quadrant]}</p>
                <ul className="flex flex-col gap-2">
                  {inside.map((stakeholder) => (
                    <StakeholderChip
                      key={stakeholder.id}
                      stakeholder={stakeholder}
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
