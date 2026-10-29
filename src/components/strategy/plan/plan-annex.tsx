/**
 * =============================================================
 *  Fichier    : plan-annex.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Annexe de traçabilité du plan stratégique (S8a) : pour chaque paragraphe qui
 *               cite des sources, l'étape et l'élément d'origine ; un élément supprimé depuis
 *               est signalé pour que l'équipe relise le paragraphe.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/plan-trace.ts
 * =============================================================
 */

"use client";

import { useMemo } from "react";

import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { traceRows, type CatalogEntry } from "@/lib/strategy/plan-trace";
import { sourceKey, type PlanPayload } from "@/lib/strategy/templates/plan";
import { getStrategyDictionary } from "@/i18n/strategy";

const p = getStrategyDictionary().plan;

type PlanAnnexProps = {
  plan: PlanPayload;
  catalog: CatalogEntry[];
};

/** Annexe de traçabilité, recalculée à chaque modification du plan. */
export function PlanAnnex({ plan, catalog }: PlanAnnexProps) {
  const rows = useMemo(() => traceRows(plan, catalog), [plan, catalog]);

  return (
    <section aria-labelledby="plan-annexe" className={`${CARD} flex flex-col gap-3 p-4 sm:p-6`}>
      <h2 id="plan-annexe" className="font-serif text-h2 font-semibold">{p.annexTitle}</h2>
      <p className="text-small text-ink-muted">{p.annexIntro}</p>
      {rows.length === 0 ? (
        <p className="text-small text-ink-muted">{p.annexEmpty}</p>
      ) : (
        <dl className="flex flex-col gap-3 text-small">
          {rows.map((row) => (
            <div key={`${row.section}-${row.paragraph}`} className="flex flex-col gap-1">
              <dt className="font-semibold">
                {p.sections[row.section]} · {interpolate(p.annexParagraph, {
                  no: String(row.paragraph),
                })}
              </dt>
              <dd>
                <ul className="flex flex-col gap-0.5 pl-4">
                  {row.sources.map((source) => (
                    <li
                      key={sourceKey(source)}
                      className={source.found ? "text-ink-muted" : "text-warning"}
                    >
                      {source.label}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
