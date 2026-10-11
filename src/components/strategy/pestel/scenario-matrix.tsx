/**
 * =============================================================
 *  Fichier    : scenario-matrix.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Matrice des scénarios 2 × 2 : deux variables pivots (facteur, hypothèse
 *               basse, hypothèse haute) et, pour chaque combinaison, un nom et une
 *               description du scénario.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/templates/pestel.ts
 * =============================================================
 */

"use client";

import { CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  SCENARIO_CELLS,
  type PestelFactor,
  type PestelPayload,
  type Scenario,
  type ScenarioAxis,
  type ScenarioCell,
} from "@/lib/strategy/templates/pestel";

const t = getDictionary();
const p = t.strategy.pestel;

type Scenarios = PestelPayload["scenarios"];

type ScenarioMatrixProps = {
  scenarios: Scenarios;
  /** Facteurs proposés comme variables (pivots, ou tous les facteurs nommés). */
  candidates: PestelFactor[];
  readOnly: boolean;
  onAxis: (index: 0 | 1, patch: Partial<ScenarioAxis>) => void;
  onCell: (cell: ScenarioCell, patch: Partial<Scenario>) => void;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Titre d'une case : hypothèse retenue sur chaque axe (ex. « forte croissance × taux bas »).
 * @param cell - Case (pôle de l'axe 1 puis de l'axe 2)
 * @param axes - Les deux axes
 */
function cellTitle(cell: ScenarioCell, axes: Scenarios["axes"]): string {
  const pole = (axis: ScenarioAxis, side: string, no: number) => {
    const text = side === "h" ? axis.high : axis.low;
    const fallback = side === "h" ? p.axisHigh : p.axisLow;
    return text.trim() || `${fallback} (${interpolate(p.axis, { no: String(no) })})`;
  };
  return `${pole(axes[0], cell[0], 1)} × ${pole(axes[1], cell[1], 2)}`;
}

// ==================== COMPOSANT ====================

/** Deux axes puis les quatre scénarios. */
export function ScenarioMatrix({
  scenarios,
  candidates,
  readOnly,
  onAxis,
  onCell,
}: ScenarioMatrixProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{p.scenariosTitle}</h2>
        <p className="text-small text-ink-muted">{p.scenariosIntro}</p>
      </div>

      {candidates.length === 0 && <p className="text-small text-ink-muted">{p.noPivot}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((index) => {
          const axis = scenarios.axes[index];
          return (
            <fieldset key={index} className={`${CARD} flex flex-col gap-3 p-4`}>
              <legend className="px-1 font-semibold">
                {interpolate(p.axis, { no: String(index + 1) })}
              </legend>
              <label className="flex flex-col gap-1 text-small font-semibold">
                {p.axisFactor}
                <select
                  className={CONTROL}
                  value={axis.factorId ?? ""}
                  disabled={readOnly}
                  onChange={(event) => onAxis(index, { factorId: event.target.value || null })}
                >
                  <option value="">{p.axisNone}</option>
                  {candidates.map((factor) => (
                    <option key={factor.id} value={factor.id}>
                      {factor.factor}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-small font-semibold">
                {p.axisLow}
                <input
                  className={CONTROL}
                  value={axis.low}
                  maxLength={200}
                  readOnly={readOnly}
                  onChange={(event) => onAxis(index, { low: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-small font-semibold">
                {p.axisHigh}
                <input
                  className={CONTROL}
                  value={axis.high}
                  maxLength={200}
                  readOnly={readOnly}
                  onChange={(event) => onAxis(index, { high: event.target.value })}
                />
              </label>
            </fieldset>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SCENARIO_CELLS.map((cell) => {
          const scenario = scenarios.cells[cell];
          return (
            <fieldset key={cell} className="flex flex-col gap-3 rounded-lg bg-sand p-4">
              <legend className="sr-only">{cellTitle(cell, scenarios.axes)}</legend>
              <p aria-hidden="true" className="text-caption uppercase text-ink-muted">
                {cellTitle(cell, scenarios.axes)}
              </p>
              <label className="flex flex-col gap-1 text-small font-semibold">
                {p.scenarioName}
                <input
                  className={CONTROL}
                  value={scenario.name}
                  maxLength={120}
                  readOnly={readOnly}
                  onChange={(event) => onCell(cell, { name: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-small font-semibold">
                {p.scenarioDescription}
                <textarea
                  className={`${CONTROL} py-2`}
                  rows={3}
                  value={scenario.description}
                  maxLength={1500}
                  readOnly={readOnly}
                  onChange={(event) => onCell(cell, { description: event.target.value })}
                />
              </label>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
