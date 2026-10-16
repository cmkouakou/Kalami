/**
 * =============================================================
 *  Fichier    : objectives-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Objectifs SMART de l'étape 6 : énoncé, indicateur, cible, échéance au mois,
 *               cinq critères cochés un à un par l'équipe et liens vers les enjeux de
 *               l'étape 5.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/direction.ts
 * =============================================================
 */

"use client";

import { LinkPicker, type LinkOption } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconCheck, IconPlus, IconTrash } from "@/components/ui/icons";
import { BADGE, BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ISSUE_LINKS_MAX,
  isSmart,
  OBJECTIVE_FIELD_MAX,
  OBJECTIVE_TEXT_MAX,
  OBJECTIVES_MAX,
  SMART_KEYS,
  type Objective,
} from "@/lib/strategy/templates/direction";

const t = getDictionary();
const s = t.strategy.direction;

type ObjectivesListProps = {
  objectives: Objective[];
  /** Enjeux nommés à l'étape 5. */
  issues: LinkOption[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Omit<Objective, "id">>) => void;
  onRemove: (id: string) => void;
};

/** Liste des objectifs SMART. */
export function ObjectivesList({
  objectives,
  issues,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: ObjectivesListProps) {
  const full = objectives.length >= OBJECTIVES_MAX;
  const groups = [{ title: s.issuesGroup, options: issues }];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.objectivesTitle}</h2>
        <p className="text-small text-ink-muted">{s.objectivesIntro}</p>
      </div>
      {objectives.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyObjectives}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {objectives.map((objective, index) => {
            const id = `objectif-${objective.id}`;
            const label = interpolate(s.objectiveLabel, { no: String(index + 1) });
            const count = SMART_KEYS.filter((key) => objective.smart[key]).length;
            return (
              <li key={objective.id} className={`${CARD} flex flex-col gap-3 p-4`}>
                <div className="flex items-end gap-2">
                  <label
                    className="flex flex-1 flex-col gap-1 text-small font-semibold"
                    htmlFor={id}
                  >
                    {label}
                    <textarea
                      id={id}
                      className={`${CONTROL} py-2`}
                      rows={2}
                      value={objective.text}
                      maxLength={OBJECTIVE_TEXT_MAX}
                      readOnly={readOnly}
                      onChange={(event) => onChange(objective.id, { text: event.target.value })}
                    />
                  </label>
                  <CommentBadge
                    targetId={objective.id}
                    label={objective.text.trim() || s.untitledObjective}
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      className={BUTTON_ICON}
                      aria-label={
                        `${t.strategy.template.remove} : ` +
                        `${objective.text.trim() || s.untitledObjective}`
                      }
                      onClick={() => onRemove(objective.id)}
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-small font-semibold">
                    {s.objectiveIndicator}
                    <input
                      className={CONTROL}
                      value={objective.indicator}
                      maxLength={OBJECTIVE_FIELD_MAX}
                      readOnly={readOnly}
                      onChange={(event) =>
                        onChange(objective.id, { indicator: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-small font-semibold">
                    {s.objectiveTarget}
                    <input
                      className={CONTROL}
                      value={objective.target}
                      maxLength={OBJECTIVE_FIELD_MAX}
                      readOnly={readOnly}
                      onChange={(event) => onChange(objective.id, { target: event.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-small font-semibold">
                    {s.objectiveDeadline}
                    <input
                      type="month"
                      className={CONTROL}
                      value={objective.deadline}
                      readOnly={readOnly}
                      onChange={(event) =>
                        onChange(objective.id, { deadline: event.target.value })
                      }
                    />
                  </label>
                </div>

                {/* ==================== CRITÈRES SMART ==================== */}
                <fieldset className="flex flex-col gap-1">
                  <legend className="mb-1 flex flex-wrap items-center gap-2 text-small">
                    <span className="font-semibold">{s.smartLegend}</span>
                    {isSmart(objective) ? (
                      <span className={`${BADGE} gap-1 text-success`}>
                        <IconCheck size={14} />
                        {s.smartOk}
                      </span>
                    ) : (
                      <span className="text-ink-muted">
                        {interpolate(s.smartCount, { count: String(count) })}
                      </span>
                    )}
                  </legend>
                  {SMART_KEYS.map((key) => (
                    <label
                      key={key}
                      htmlFor={`${id}-${key}`}
                      className="flex min-h-11 items-start gap-2 py-1 text-small"
                    >
                      <input
                        id={`${id}-${key}`}
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={objective.smart[key]}
                        disabled={readOnly}
                        onChange={(event) =>
                          onChange(objective.id, {
                            smart: { ...objective.smart, [key]: event.target.checked },
                          })
                        }
                      />
                      <span>
                        <span className="font-semibold">{s.smart[key]}</span>
                        <span className="text-ink-muted"> — {s.smartHints[key]}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <LinkPicker
                  name={id}
                  title={s.issueLinks}
                  groups={groups}
                  selected={objective.issueLinks}
                  readOnly={readOnly}
                  max={ISSUE_LINKS_MAX}
                  emptyText={s.noIssues}
                  onChange={(issueLinks) => onChange(objective.id, { issueLinks })}
                />
              </li>
            );
          })}
        </ol>
      )}
      {!readOnly && (
        <button
          type="button"
          className={`${BUTTON_TERTIARY} w-fit`}
          disabled={full}
          onClick={onAdd}
        >
          <IconPlus size={18} />
          {s.addObjective}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxObjectives, { max: String(OBJECTIVES_MAX) })}
        </p>
      )}
    </section>
  );
}
