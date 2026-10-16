/**
 * =============================================================
 *  Fichier    : options-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Évaluation des options stratégiques (étape 7) : texte, case d'Ansoff,
 *               pertinence, acceptabilité et faisabilité (oui / partiel / non), commentaire,
 *               décision de l'équipe et enjeux liés. Une option retenue malgré un « non »
 *               ou sans enjeu lié est signalée, sans être bloquée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/choice.ts
 * =============================================================
 */

"use client";

import { LinkPicker, type LinkOption } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconAlert, IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  ANSOFF_CELLS,
  COMMENT_MAX,
  CRITERIA,
  DECISIONS,
  failedCriteria,
  ISSUE_LINKS_MAX,
  OPTION_TEXT_MAX,
  OPTIONS_MAX,
  optionWarnings,
  RATINGS,
  type StrategicOption,
} from "@/lib/strategy/templates/choice";

const t = getDictionary();
const s = t.strategy.choice;

type OptionsListProps = {
  options: StrategicOption[];
  /** Enjeux nommés à l'étape 5. */
  issues: LinkOption[];
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Omit<StrategicOption, "id">>) => void;
  onRemove: (id: string) => void;
};

/**
 * Convertit la valeur d'un menu en valeur enregistrée (vide → null).
 * @param value   - Valeur choisie dans le menu
 * @param allowed - Valeurs admises
 */
function pick<T extends string>(value: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Alertes d'une option retenue. */
function Warnings({ option }: { option: StrategicOption }) {
  const warnings = optionWarnings(option);
  if (warnings.length === 0) return null;
  const criteria = failedCriteria(option)
    .map((criterion) => s.criteria[criterion].toLowerCase())
    .join(", ");
  return (
    <ul className="flex flex-col gap-1">
      {warnings.map((warning) => (
        <li key={warning} className="flex items-start gap-2 text-small text-warning">
          <IconAlert size={16} className="mt-0.5 shrink-0" />
          {interpolate(s.warnings[warning], { criteria })}
        </li>
      ))}
    </ul>
  );
}

/** Liste des options et de leur évaluation. */
export function OptionsList({
  options,
  issues,
  readOnly,
  onAdd,
  onChange,
  onRemove,
}: OptionsListProps) {
  const full = options.length >= OPTIONS_MAX;
  const groups = [{ title: s.issuesGroup, options: issues }];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.optionsTitle}</h2>
        <p className="text-small text-ink-muted">{s.optionsIntro}</p>
      </div>
      {options.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyOptions}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {options.map((option, index) => {
            const id = `option-${option.id}`;
            return (
              <li key={option.id} className={`${CARD} flex flex-col gap-3 p-4`}>
                <div className="flex items-end gap-2">
                  <label
                    className="flex flex-1 flex-col gap-1 text-small font-semibold"
                    htmlFor={id}
                  >
                    {interpolate(s.optionLabel, { no: String(index + 1) })}
                    <textarea
                      id={id}
                      className={`${CONTROL} py-2`}
                      rows={2}
                      value={option.text}
                      maxLength={OPTION_TEXT_MAX}
                      readOnly={readOnly}
                      onChange={(event) => onChange(option.id, { text: event.target.value })}
                    />
                  </label>
                  <CommentBadge
                    targetId={option.id}
                    label={option.text.trim() || s.untitledOption}
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      className={BUTTON_ICON}
                      aria-label={
                        `${t.strategy.template.remove} : ${option.text.trim() || s.untitledOption}`
                      }
                      onClick={() => onRemove(option.id)}
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>

                {/* ==================== CASE ET CRITÈRES ==================== */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="flex flex-col gap-1 text-small font-semibold">
                    {s.ansoffLabel}
                    <select
                      className={CONTROL}
                      value={option.ansoff ?? ""}
                      disabled={readOnly}
                      onChange={(event) =>
                        onChange(option.id, { ansoff: pick(event.target.value, ANSOFF_CELLS) })
                      }
                    >
                      <option value="">{s.cellNone}</option>
                      {ANSOFF_CELLS.map((cell) => (
                        <option key={cell} value={cell}>
                          {s.cells[cell]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {CRITERIA.map((criterion) => (
                    <label key={criterion} className="flex flex-col gap-1 text-small font-semibold">
                      {s.criteria[criterion]}
                      <select
                        className={CONTROL}
                        value={option[criterion] ?? ""}
                        disabled={readOnly}
                        onChange={(event) =>
                          onChange(option.id, { [criterion]: pick(event.target.value, RATINGS) })
                        }
                      >
                        <option value="">{s.ratingNone}</option>
                        {RATINGS.map((rating) => (
                          <option key={rating} value={rating}>
                            {s.ratings[rating]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label className="flex flex-col gap-1 text-small font-semibold">
                    {s.decisionLabel}
                    <select
                      className={CONTROL}
                      value={option.decision ?? ""}
                      disabled={readOnly}
                      onChange={(event) =>
                        onChange(option.id, { decision: pick(event.target.value, DECISIONS) })
                      }
                    >
                      <option value="">{s.decisionNone}</option>
                      {DECISIONS.map((decision) => (
                        <option key={decision} value={decision}>
                          {s.decisions[decision]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <Warnings option={option} />

                <label className="flex flex-col gap-1 text-small font-semibold">
                  {s.comment}
                  <textarea
                    className={`${CONTROL} py-2`}
                    rows={2}
                    value={option.comment}
                    maxLength={COMMENT_MAX}
                    readOnly={readOnly}
                    onChange={(event) => onChange(option.id, { comment: event.target.value })}
                  />
                </label>
                <LinkPicker
                  name={id}
                  title={s.issueLinks}
                  groups={groups}
                  selected={option.issueLinks}
                  readOnly={readOnly}
                  max={ISSUE_LINKS_MAX}
                  emptyText={s.noIssues}
                  onChange={(issueLinks) => onChange(option.id, { issueLinks })}
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
          {s.addOption}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxOptions, { max: String(OPTIONS_MAX) })}
        </p>
      )}
    </section>
  );
}
