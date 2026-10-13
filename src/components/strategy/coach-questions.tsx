/**
 * =============================================================
 *  Fichier    : coach-questions.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Questions d'approfondissement du coach IA : introduction, puis chaque
 *               question avec la raison qui la motive. L'utilisateur la marque comme traitée
 *               ou l'écarte ; aucune question ne modifie le gabarit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: lib/strategy/coach (queries, schemas)
 * =============================================================
 */

"use client";

import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { CoachDecision, CoachDeepen } from "@/lib/strategy/coach/queries";

const c = getDictionary().strategy.coach;
const d = c.deepen;

type CoachQuestionsProps = {
  result: CoachDeepen;
  /** Date de la demande, déjà mise en forme. */
  date: string;
  outdated: boolean;
  canAct: boolean;
  onDecide: (index: number, decision: CoachDecision) => void;
};

// ==================== COMPOSANT ====================

/** Liste des questions d'approfondissement, avec leur décision. */
export function CoachQuestions({ result, date, outdated, canAct, onDecide }: CoachQuestionsProps) {
  const { intro, questions } = result.output;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-ink-muted">{interpolate(d.askedAt, { date })}</p>
      {outdated && <p className="text-small text-warning">{d.outdated}</p>}
      {intro && <p className="text-small">{intro}</p>}

      {questions.length === 0 ? (
        <p className="text-small text-ink-muted">{d.none}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {questions.map((item, index) => {
            const decision = result.decisions[index];
            return (
              <li key={`${result.requestId}-${index}`} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold">{item.question}</h4>
                  {decision && <span className={BADGE}>{d.decisions[decision]}</span>}
                </div>
                {item.why && (
                  <p className="text-small text-ink-muted">
                    {interpolate(d.why, { text: item.why })}
                  </p>
                )}
                {canAct && !decision && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={BUTTON_SECONDARY}
                      onClick={() => onDecide(index, "accepted")}
                    >
                      {d.treat}
                    </button>
                    <button
                      type="button"
                      className={BUTTON_TERTIARY}
                      onClick={() => onDecide(index, "rejected")}
                    >
                      {d.dismiss}
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
