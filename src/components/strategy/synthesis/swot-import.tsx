/**
 * =============================================================
 *  Fichier    : swot-import.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Reprise des étapes 1 à 4 vers la SWOT (étape 5), sans IA : le bouton ouvre
 *               la liste des éléments proposés, regroupés par case avec leur étiquette
 *               d'origine ; l'équipe coche ceux qu'elle garde. Les éléments déjà repris sont
 *               signalés et ne peuvent pas être ajoutés deux fois.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: lib/strategy/synthesis-sources.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BADGE, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { SwotCandidate } from "@/lib/strategy/synthesis-sources";
import { originLabel, SWOT_KEYS } from "@/lib/strategy/templates/synthesis";

const t = getDictionary();
const s = t.strategy.synthesis;

type SwotImportProps = {
  candidates: SwotCandidate[];
  readOnly: boolean;
  onImport: (chosen: SwotCandidate[]) => void;
};

/** Clé unique d'un candidat (une même origine peut viser deux cases). */
function candidateKey(candidate: SwotCandidate): string {
  return `${candidate.key}-${candidate.origin.step}-${candidate.origin.ref}`;
}

/** Bouton de reprise et liste des éléments à cocher. */
export function SwotImport({ candidates, readOnly, onImport }: SwotImportProps) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);

  if (readOnly) return null;

  /** Ferme la liste et oublie les cases cochées. */
  const close = () => {
    setOpen(false);
    setChecked([]);
  };

  /** Ajoute les éléments cochés à la SWOT. */
  const confirm = () => {
    onImport(candidates.filter((candidate) => checked.includes(candidateKey(candidate))));
    close();
  };

  if (!open) {
    return (
      <button type="button" className={`${BUTTON_SECONDARY} w-fit`} onClick={() => setOpen(true)}>
        {s.importOpen}
      </button>
    );
  }

  return (
    <section aria-labelledby="swot-import" className={`${CARD} flex flex-col gap-4 p-4`}>
      <div className="flex flex-col gap-1">
        <h3 id="swot-import" className="font-semibold">{s.importTitle}</h3>
        <p className="text-small text-ink-muted">{s.importIntro}</p>
      </div>
      {candidates.length === 0 ? (
        <p className="text-small">{s.importNone}</p>
      ) : (
        SWOT_KEYS.map((key) => {
          const group = candidates.filter((candidate) => candidate.key === key);
          if (group.length === 0) return null;
          return (
            <fieldset key={key} className="flex flex-col gap-1">
              <legend className="font-semibold">{s.keys[key]}</legend>
              {group.map((candidate) => {
                const id = candidateKey(candidate);
                return (
                  <label
                    key={id}
                    htmlFor={`reprise-${id}`}
                    className="flex min-h-11 items-start gap-2 py-1 text-small"
                  >
                    <input
                      id={`reprise-${id}`}
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={candidate.present || checked.includes(id)}
                      disabled={candidate.present}
                      onChange={(event) =>
                        setChecked((prev) =>
                          event.target.checked ? [...prev, id] : prev.filter((x) => x !== id),
                        )
                      }
                    />
                    <span className={`${BADGE} shrink-0`}>{originLabel(candidate.origin)}</span>
                    <span>
                      {candidate.text}
                      {candidate.present && (
                        <span className="text-ink-muted"> · {s.importPresent}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          );
        })
      )}
      <div className="flex flex-wrap gap-3">
        {candidates.length > 0 && (
          <button
            type="button"
            className={BUTTON_PRIMARY}
            disabled={checked.length === 0}
            onClick={confirm}
          >
            {interpolate(s.importConfirm, { count: String(checked.length) })}
          </button>
        )}
        <button type="button" className={BUTTON_SECONDARY} onClick={close}>
          {s.importCancel}
        </button>
      </div>
    </section>
  );
}
