/**
 * =============================================================
 *  Fichier    : value-chain.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Chaîne de valeur de l'étape 3 : activités principales et de soutien,
 *               chacune nommée, décrite, évaluée (point fort, à renforcer, point faible,
 *               marginal) et commentée. Les activités se renomment, s'ajoutent et se
 *               retirent.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/internal.ts
 * =============================================================
 */

"use client";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ACTIVITIES_MAX,
  ACTIVITY_KINDS,
  EVALUATIONS,
  type Activity,
  type ActivityKind,
  type Evaluation,
} from "@/lib/strategy/templates/internal";

const t = getDictionary();
const n = t.strategy.internal;

type ValueChainProps = {
  activities: Activity[];
  readOnly: boolean;
  onAdd: (kind: ActivityKind) => void;
  onChange: (id: string, patch: Partial<Activity>) => void;
  onRemove: (id: string) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/** Fiche d'une activité. */
function ActivityCard({
  activity,
  readOnly,
  onChange,
  onRemove,
}: {
  activity: Activity;
  readOnly: boolean;
  onChange: ValueChainProps["onChange"];
  onRemove: ValueChainProps["onRemove"];
}) {
  const id = `activite-${activity.id}`;
  return (
    <li className="flex flex-col gap-3 rounded-md border border-line p-3">
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
          {n.fields.name}
          <input
            id={id}
            className={CONTROL}
            value={activity.name}
            maxLength={200}
            readOnly={readOnly}
            onChange={(event) => onChange(activity.id, { name: event.target.value })}
          />
        </label>
        <CommentBadge targetId={activity.id} label={activity.name || n.untitled} />
        {!readOnly && (
          <button
            type="button"
            className={BUTTON_ICON}
            aria-label={`${t.strategy.template.remove} : ${activity.name || n.untitled}`}
            onClick={() => onRemove(activity.id)}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1 text-small font-semibold">
        {n.fields.description}
        <textarea
          className={`${CONTROL} py-2`}
          rows={2}
          value={activity.description}
          maxLength={1500}
          readOnly={readOnly}
          onChange={(event) => onChange(activity.id, { description: event.target.value })}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-small font-semibold">
          {n.fields.evaluation}
          <select
            className={CONTROL}
            value={activity.evaluation ?? ""}
            disabled={readOnly}
            onChange={(event) =>
              onChange(activity.id, {
                evaluation: (event.target.value || null) as Evaluation | null,
              })
            }
          >
            <option value="">{n.evaluationNone}</option>
            {EVALUATIONS.map((evaluation) => (
              <option key={evaluation} value={evaluation}>
                {n.evaluations[evaluation]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {n.fields.comment}
          <input
            className={CONTROL}
            value={activity.comment}
            maxLength={1000}
            readOnly={readOnly}
            onChange={(event) => onChange(activity.id, { comment: event.target.value })}
          />
        </label>
      </div>
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Activités regroupées en principales et de soutien. */
export function ValueChain({ activities, readOnly, onAdd, onChange, onRemove }: ValueChainProps) {
  const full = activities.length >= ACTIVITIES_MAX;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{n.chainTitle}</h2>
        <p className="text-small text-ink-muted">{n.chainIntro}</p>
      </div>
      {ACTIVITY_KINDS.map((kind) => {
        const inKind = activities.filter((activity) => activity.kind === kind);
        return (
          <fieldset key={kind} className={`${CARD} flex flex-col gap-3 p-4`}>
            <legend className="px-1 font-semibold">{n.kinds[kind]}</legend>
            {inKind.length === 0 ? (
              <p className="text-small text-ink-muted">{n.noActivity}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {inKind.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    readOnly={readOnly}
                    onChange={onChange}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            )}
            {!readOnly && (
              <button
                type="button"
                className={`${BUTTON_TERTIARY} w-fit`}
                disabled={full}
                onClick={() => onAdd(kind)}
              >
                <IconPlus size={18} />
                {n.addActivity}
              </button>
            )}
          </fieldset>
        );
      })}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(n.maxActivities, { max: String(ACTIVITIES_MAX) })}
        </p>
      )}
    </section>
  );
}
