/**
 * =============================================================
 *  Fichier    : gantt-chart.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Vue Gantt au mois de la feuille de route (étape 8), en grille CSS : une ligne
 *               par chantier daté, une ligne par phase datée. Défilement horizontal sur
 *               petit écran ; les périodes sont aussi données en texte aux lecteurs d'écran.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/action.ts
 * =============================================================
 */

"use client";

import { Fragment } from "react";

import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  GANTT_MONTHS_MAX,
  ganttLayout,
  monthFromIndex,
  monthIndex,
  type GanttBar,
  type Workstream,
} from "@/lib/strategy/templates/action";
import { MONTH_FORMAT, MONTH_YEAR_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const s = t.strategy.action;

/** Date UTC du premier jour d'un mois AAAA-MM. */
function monthDate(month: string): Date {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value - 1, 1));
}

/** Libellé d'un mois dans un texte (« janvier 2027 »). */
function periodLabel(month: string): string {
  return MONTH_YEAR_FORMAT.format(monthDate(month));
}

/** Colonnes de grille d'une barre (la colonne 1 porte les libellés). */
function barColumns(bar: GanttBar): { gridColumn: string } {
  return { gridColumn: `${bar.start + 2} / span ${bar.span}` };
}

/**
 * Mois de début et de fin affichés d'une barre, pour le texte des lecteurs d'écran.
 * @param bar    - Barre calculée
 * @param origin - Premier mois affiché
 */
function barPeriod(bar: GanttBar, origin: string): { start: string; end: string } {
  const first = (monthIndex(origin) as number) + bar.start;
  return {
    start: periodLabel(monthFromIndex(first)),
    end: periodLabel(monthFromIndex(first + bar.span - 1)),
  };
}

/** Vue Gantt des chantiers datés. */
export function GanttChart({ workstreams }: { workstreams: Workstream[] }) {
  const layout = ganttLayout(workstreams);
  const origin = layout.months[0];

  return (
    <section className="flex flex-col gap-3" aria-labelledby="gantt-titre">
      <div className="flex flex-col gap-1">
        <h3 id="gantt-titre" className="font-serif text-h3 font-semibold">
          {s.ganttTitle}
        </h3>
        <p className="text-small text-ink-muted">{s.ganttIntro}</p>
      </div>
      {layout.rows.length === 0 ? (
        <p className="text-small text-ink-muted">{s.ganttEmpty}</p>
      ) : (
        <>
          {/* ==================== GRILLE (VISUELLE) ==================== */}
          <div className={`${CARD} overflow-x-auto p-3`} aria-hidden="true">
            <div
              className="grid items-center gap-y-1 text-caption"
              style={{
                gridTemplateColumns:
                  `minmax(7rem, 12rem) repeat(${layout.months.length}, minmax(2.25rem, 1fr))`,
              }}
            >
              <span />
              {layout.months.map((month, index) => (
                <span
                  key={month}
                  className="border-l border-line px-1 text-center text-ink-muted"
                >
                  {MONTH_FORMAT.format(monthDate(month))}
                  {(index === 0 || month.endsWith("-01")) && (
                    <span className="block font-semibold">{month.slice(0, 4)}</span>
                  )}
                </span>
              ))}

              {layout.rows.map((row) => (
                <Fragment key={row.id}>
                  <span className="truncate pr-2 font-semibold">
                    {row.name.trim() || s.untitledWorkstream}
                  </span>
                  <span
                    className="h-5 rounded-sm bg-encre"
                    style={barColumns(row.bar)}
                    title={row.owner}
                  />
                  {row.phases.map((phase) => (
                    <Fragment key={phase.id}>
                      <span className="col-start-1 truncate pl-3 pr-2 text-ink-muted">
                        {phase.name.trim() || s.untitledPhase}
                      </span>
                      <span
                        className="h-3 rounded-sm bg-encre-soft"
                        style={barColumns(phase)}
                      />
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>

          {/* ==================== TEXTE (LECTEURS D'ÉCRAN) ==================== */}
          <ul className="sr-only">
            {layout.rows.map((row) => (
              <li key={row.id}>
                {interpolate(s.ganttPeriod, {
                  name: row.name.trim() || s.untitledWorkstream,
                  ...barPeriod(row.bar, origin),
                })}
                {row.phases.length > 0 && (
                  <ul>
                    {row.phases.map((phase) => (
                      <li key={phase.id}>
                        {interpolate(s.ganttPeriod, {
                          name: phase.name.trim() || s.untitledPhase,
                          ...barPeriod(phase, origin),
                        })}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {layout.truncated && (
            <p className="text-small text-ink-muted">
              {interpolate(s.ganttTruncated, { max: String(GANTT_MONTHS_MAX) })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
