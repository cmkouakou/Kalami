/**
 * =============================================================
 *  Fichier    : comparison-table.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Tableau de comparaison avec les concurrents : critères en lignes, acteurs
 *               en colonnes, note de 1 à 5 et commentaire facultatif par case, moyenne par
 *               acteur. Défilement horizontal limité au tableau sur petit écran.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/forces.ts
 * =============================================================
 */

"use client";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  ACTORS_MAX,
  actorAverage,
  CRITERIA_MAX,
  SCORE_MAX,
  SCORE_MIN,
  type ForcesPayload,
  type ScoreCell,
} from "@/lib/strategy/templates/forces";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const f = tStrategy.forces;
const remove = tStrategy.template.remove;

const SCORES = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => SCORE_MIN + i);
const AVERAGE_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

type ComparisonTableProps = {
  payload: ForcesPayload;
  readOnly: boolean;
  onAddActor: () => void;
  onRenameActor: (id: string, name: string) => void;
  onRemoveActor: (id: string) => void;
  onAddCriterion: () => void;
  onRenameCriterion: (id: string, name: string) => void;
  onRemoveCriterion: (id: string) => void;
  onScore: (criterionId: string, actorId: string, patch: Partial<ScoreCell>) => void;
};

/** Tableau critères × acteurs. */
export function ComparisonTable({
  payload,
  readOnly,
  onAddActor,
  onRenameActor,
  onRemoveActor,
  onAddCriterion,
  onRenameCriterion,
  onRemoveCriterion,
  onScore,
}: ComparisonTableProps) {
  const { actors, criteria } = payload.comparison;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{f.comparisonTitle}</h2>
        <p className="text-small text-ink-muted">{f.comparisonIntro}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-max border-collapse text-small">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="p-2 text-left align-bottom">{f.criterion}</th>
              {actors.map((actor) => (
                <th key={actor.id} scope="col" className="p-2 align-bottom">
                  <div className="flex items-center gap-1">
                    <input
                      className={`${CONTROL} w-36 font-semibold`}
                      aria-label={f.actorName}
                      value={actor.name}
                      maxLength={120}
                      readOnly={readOnly}
                      onChange={(event) => onRenameActor(actor.id, event.target.value)}
                    />
                    {!readOnly && (
                      <button
                        type="button"
                        className={BUTTON_ICON}
                        aria-label={`${remove} : ${actor.name}`}
                        onClick={() => onRemoveActor(actor.id)}
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion) => (
              <tr key={criterion.id} className="border-b border-line align-top">
                <th scope="row" className="p-2 text-left font-normal">
                  <div className="flex items-center gap-1">
                    <input
                      className={`${CONTROL} w-44`}
                      aria-label={f.criterionName}
                      value={criterion.name}
                      maxLength={120}
                      readOnly={readOnly}
                      onChange={(event) => onRenameCriterion(criterion.id, event.target.value)}
                    />
                    <CommentBadge targetId={criterion.id} label={criterion.name} />
                    {!readOnly && (
                      <button
                        type="button"
                        className={BUTTON_ICON}
                        aria-label={`${remove} : ${criterion.name}`}
                        onClick={() => onRemoveCriterion(criterion.id)}
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </th>
                {actors.map((actor) => {
                  const cell = criterion.scores[actor.id] ?? { score: null, note: "" };
                  const label = interpolate(f.score, {
                    actor: actor.name,
                    criterion: criterion.name,
                  });
                  return (
                    <td key={actor.id} className="p-2">
                      <div className="flex w-36 flex-col gap-1">
                        <select
                          className={CONTROL}
                          aria-label={label}
                          value={cell.score ?? ""}
                          disabled={readOnly}
                          onChange={(event) =>
                            onScore(criterion.id, actor.id, {
                              score: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        >
                          <option value="">{f.scoreNone}</option>
                          {SCORES.map((score) => (
                            <option key={score} value={score}>{score}</option>
                          ))}
                        </select>
                        <input
                          className={`${CONTROL} text-small`}
                          aria-label={`${f.note} — ${label}`}
                          placeholder={f.note}
                          value={cell.note}
                          maxLength={300}
                          readOnly={readOnly}
                          onChange={(event) =>
                            onScore(criterion.id, actor.id, { note: event.target.value })
                          }
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {criteria.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" className="p-2 text-left">{f.average}</th>
                {actors.map((actor) => {
                  const average = actorAverage(payload, actor.id);
                  return (
                    <td key={actor.id} className="p-2 font-semibold">
                      {average === null ? f.scoreNone : AVERAGE_FORMAT.format(average)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {criteria.length === 0 && <p className="text-small text-ink-muted">{f.noCriterion}</p>}

      {!readOnly && (
        <div className="flex flex-wrap gap-x-4">
          <button
            type="button"
            className={BUTTON_TERTIARY}
            disabled={criteria.length >= CRITERIA_MAX}
            onClick={onAddCriterion}
          >
            <IconPlus size={18} />
            {f.addCriterion}
          </button>
          <button
            type="button"
            className={BUTTON_TERTIARY}
            disabled={actors.length >= ACTORS_MAX}
            onClick={onAddActor}
          >
            <IconPlus size={18} />
            {f.addActor}
          </button>
        </div>
      )}
      {!readOnly && (criteria.length >= CRITERIA_MAX || actors.length >= ACTORS_MAX) && (
        <p className="text-small text-ink-muted">
          {criteria.length >= CRITERIA_MAX
            ? interpolate(f.maxCriteria, { max: String(CRITERIA_MAX) })
            : interpolate(f.maxActors, { max: String(ACTORS_MAX) })}
        </p>
      )}
    </section>
  );
}
