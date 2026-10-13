/**
 * =============================================================
 *  Fichier    : coach-score.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Évaluation du coach IA : note indicative sur 100 (elle ne bloque jamais la
 *               validation), appréciation, note et commentaire de chaque critère, points
 *               forts et points à améliorer, avec l'erreur classique citée et, si elle
 *               existe, son explication selon le livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: lib/strategy/coach (queries, schemas)
 * =============================================================
 */

"use client";

import { getDictionary, interpolate } from "@/i18n";
import type { CoachRuleTitle, CoachScore as CoachScoreResult } from "@/lib/strategy/coach/queries";
import { SCORE_CRITERIA } from "@/lib/strategy/coach/schemas";

const c = getDictionary().strategy.coach;
const sc = c.score;

type CoachScoreProps = {
  result: CoachScoreResult;
  /** Date de la demande, déjà mise en forme. */
  date: string;
  outdated: boolean;
  /** Erreurs classiques actives, par code. */
  rules: ReadonlyMap<string, CoachRuleTitle>;
};

// ==================== SOUS-COMPOSANTS ====================

/** Jauge d'une note sur 100, avec son libellé. */
function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <label className="flex flex-col gap-1 text-small">
      <span className="flex justify-between gap-2">
        <span>{label}</span>
        <span className="font-semibold">{interpolate(sc.total, { score: String(score) })}</span>
      </span>
      <progress className="h-2 w-full" value={score} max={100} />
    </label>
  );
}

// ==================== COMPOSANT ====================

/** Évaluation indicative d'un gabarit. */
export function CoachScore({ result, date, outdated, rules }: CoachScoreProps) {
  const { summary, score, criteria, strengths, improvements } = result.output;
  // Critères dans l'ordre de référence, quel que soit l'ordre renvoyé
  const ordered = SCORE_CRITERIA.flatMap((key) => criteria.filter((item) => item.key === key));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-ink-muted">{interpolate(sc.scoredAt, { date })}</p>
      {outdated && <p className="text-small text-warning">{sc.outdated}</p>}

      <ScoreBar label={sc.totalLabel} score={score} />
      {summary && <p className="text-small">{summary}</p>}

      {ordered.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">{sc.criteriaTitle}</h3>
          <ul className="flex flex-col gap-3">
            {ordered.map((item) => (
              <li key={item.key} className="flex flex-col gap-1">
                <ScoreBar label={sc.criteria[item.key]} score={item.score} />
                {item.comment && <p className="text-small text-ink-muted">{item.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{sc.strengths}</h3>
          <ul className="list-disc pl-5 text-small">
            {strengths.map((text, index) => <li key={index}>{text}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{sc.improvements}</h3>
        {improvements.length === 0 ? (
          <p className="text-small text-ink-muted">{sc.noImprovements}</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {improvements.map((item, index) => {
              const rule = item.ruleCode ? rules.get(item.ruleCode) : undefined;
              return (
                <li key={index} className="flex flex-col gap-1 py-2">
                  <h4 className="font-semibold">{item.title}</h4>
                  {rule && (
                    <p className="text-small text-ink-muted">
                      {interpolate(c.rule, { title: rule.title })}
                    </p>
                  )}
                  <p className="text-small">{item.explanation}</p>
                  {rule?.bookExplanation && (
                    <p className="text-small text-ink-muted">
                      {interpolate(c.book, { text: rule.bookExplanation })}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
