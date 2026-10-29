/**
 * =============================================================
 *  Fichier    : coach-research.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Recherche Web sourcée du coach IA (étapes 1 et 2) : synthèse, puis chaque
 *               fait avec sa destination (dimension PESTEL ou force) et ses sources
 *               cliquables (titre, site, date). Un fait sans source est présenté comme une
 *               hypothèse à vérifier. L'utilisateur l'ajoute au gabarit ou l'écarte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: lib/strategy/coach (queries, schemas)
 * =============================================================
 */

"use client";

import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import type { CoachDecision, CoachResearch } from "@/lib/strategy/coach/queries";
import type { ResearchFact } from "@/lib/strategy/coach/schemas";
import { getStrategyDictionary } from "@/i18n/strategy";

const strategy = getStrategyDictionary();
const r = strategy.coach.research;

/** Libellés des destinations possibles d'un fait : dimensions PESTEL et cinq forces. */
const TARGET_LABELS: Record<string, string> = {
  ...strategy.pestel.dimensions,
  ...strategy.forces.names,
};

type CoachResearchProps = {
  result: CoachResearch;
  /** Date de la demande, déjà mise en forme. */
  date: string;
  canAct: boolean;
  onDecide: (index: number, decision: CoachDecision) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Sources d'un fait (liens externes), ou mention d'hypothèse s'il n'en a aucune. */
function FactSources({ fact }: { fact: ResearchFact }) {
  if (fact.sources.length === 0) {
    return <p className="text-small text-warning">{r.hypothesis}</p>;
  }
  return (
    <div className="flex flex-col gap-1 text-small">
      <span className="text-ink-muted">{r.sources}</span>
      <ul className="flex flex-col gap-1">
        {fact.sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {source.title || source.site}
            </a>
            <span className="text-ink-muted">
              {" — "}
              {source.site}
              {source.pageAge && `, ${interpolate(r.pageAge, { date: source.pageAge })}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==================== COMPOSANT ====================

/** Faits trouvés par la recherche Web, avec leurs sources et leur décision. */
export function CoachResearchList({ result, date, canAct, onDecide }: CoachResearchProps) {
  const { summary, facts } = result.output;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-ink-muted">{interpolate(r.searchedAt, { date })}</p>
      {summary && <p className="text-small">{summary}</p>}

      {facts.length === 0 ? (
        <p className="text-small text-ink-muted">{r.none}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {facts.map((fact, index) => {
            const decision = result.decisions[index];
            return (
              <li key={`${result.requestId}-${index}`} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={BADGE}>
                    {interpolate(r.target, { target: TARGET_LABELS[fact.target] ?? fact.target })}
                  </span>
                  {fact.nature && (
                    <span className={BADGE}>{strategy.pestel.natures[fact.nature]}</span>
                  )}
                  {decision && <span className={BADGE}>{r.decisions[decision]}</span>}
                </div>
                <p className="text-small">{fact.text}</p>
                <FactSources fact={fact} />
                {canAct && !decision && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={BUTTON_SECONDARY}
                      onClick={() => onDecide(index, "accepted")}
                    >
                      {r.add}
                    </button>
                    <button
                      type="button"
                      className={BUTTON_TERTIARY}
                      onClick={() => onDecide(index, "rejected")}
                    >
                      {r.dismiss}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
