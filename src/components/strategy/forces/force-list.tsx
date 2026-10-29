/**
 * =============================================================
 *  Fichier    : force-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Les cinq forces : pour chacune, intensité (faible, moyenne, forte) et
 *               justification, avec une question d'aide.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/forces.ts
 * =============================================================
 */

"use client";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { CARD, CONTROL, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import {
  FORCES,
  INTENSITIES,
  type Force,
  type ForceKey,
  type ForcesPayload,
} from "@/lib/strategy/templates/forces";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const f = tStrategy.forces;

type ForceListProps = {
  forces: ForcesPayload["forces"];
  readOnly: boolean;
  onChange: (key: ForceKey, patch: Partial<Force>) => void;
};

/** Cinq fiches : intensité en boutons radio, justification en zone de texte. */
export function ForceList({ forces, readOnly, onChange }: ForceListProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{f.forcesTitle}</h2>
        <p className="text-small text-ink-muted">{f.forcesIntro}</p>
      </div>
      {FORCES.map((key) => {
        const force = forces[key];
        return (
          <fieldset key={key} className={`${CARD} flex flex-col gap-3 p-4`}>
            <legend className="flex items-center gap-2 px-1 font-semibold">
              {f.names[key]}
              <CommentBadge targetId={key} label={f.names[key]} />
            </legend>
            <p className="text-small text-ink-muted">{f.hints[key]}</p>
            <div role="radiogroup" aria-label={`${f.intensity} : ${f.names[key]}`}
              className="flex flex-wrap gap-2"
            >
              {INTENSITIES.map((intensity) => (
                <label
                  key={intensity}
                  className={`${force.intensity === intensity ? PILL_ACTIVE : PILL} ${
                    readOnly ? "" : "cursor-pointer"
                  } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name={`intensite-${key}`}
                    value={intensity}
                    checked={force.intensity === intensity}
                    disabled={readOnly}
                    onChange={() => onChange(key, { intensity })}
                  />
                  {f.intensities[intensity]}
                </label>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-small font-semibold">
              {f.justification}
              <textarea
                className={`${CONTROL} py-2`}
                rows={3}
                value={force.justification}
                maxLength={2000}
                readOnly={readOnly}
                onChange={(event) => onChange(key, { justification: event.target.value })}
              />
            </label>
          </fieldset>
        );
      })}
    </section>
  );
}
