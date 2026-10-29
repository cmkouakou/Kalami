/**
 * =============================================================
 *  Fichier    : issues-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Enjeux stratégiques de l'étape 5 (deux ou trois) : titre, explication et
 *               éléments de la SWOT ou pistes TOWS sur lesquels chaque enjeu s'appuie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/synthesis.ts
 * =============================================================
 */

"use client";

import { LinkPicker, type LinkGroup } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  ISSUE_EXPLANATION_MAX,
  ISSUE_TITLE_MAX,
  ISSUES_MAX,
  SWOT_KEYS,
  TOWS_QUADRANTS,
  type Issue,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.synthesis;

type IssuesListProps = {
  payload: SynthesisPayload;
  readOnly: boolean;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Omit<Issue, "id">>) => void;
  onRemove: (id: string) => void;
};

/** Éléments pouvant appuyer un enjeu : cases de la SWOT puis quadrants TOWS. */
function linkGroups(payload: SynthesisPayload): LinkGroup[] {
  return [
    ...SWOT_KEYS.map((key) => ({ title: s.keys[key], options: payload.swot[key] })),
    ...TOWS_QUADRANTS.map((quadrant) => ({
      title: `TOWS · ${s.quadrants[quadrant]}`,
      options: payload.tows.filter((item) => item.quadrant === quadrant),
    })),
  ];
}

/** Liste des enjeux stratégiques. */
export function IssuesList({ payload, readOnly, onAdd, onChange, onRemove }: IssuesListProps) {
  const full = payload.issues.length >= ISSUES_MAX;
  const groups = linkGroups(payload);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-h2 font-semibold">{s.issuesTitle}</h2>
        <p className="text-small text-ink-muted">{s.issuesIntro}</p>
      </div>
      {payload.issues.length === 0 ? (
        <p className="text-small text-ink-muted">{s.emptyIssues}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {payload.issues.map((issue, index) => {
            const id = `enjeu-${issue.id}`;
            return (
              <li key={issue.id} className={`${CARD} flex flex-col gap-3 p-4`}>
                <div className="flex items-end gap-2">
                  <label
                    className="flex flex-1 flex-col gap-1 text-small font-semibold"
                    htmlFor={id}
                  >
                    {s.issueTitle} {index + 1}
                    <input
                      id={id}
                      className={CONTROL}
                      value={issue.title}
                      maxLength={ISSUE_TITLE_MAX}
                      readOnly={readOnly}
                      onChange={(event) => onChange(issue.id, { title: event.target.value })}
                    />
                  </label>
                  <CommentBadge targetId={issue.id} label={issue.title.trim() || s.untitledIssue} />
                  {!readOnly && (
                    <button
                      type="button"
                      className={BUTTON_ICON}
                      aria-label={
                        `${tStrategy.template.remove} : ${issue.title.trim() || s.untitledIssue}`
                      }
                      onClick={() => onRemove(issue.id)}
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>
                <label className="flex flex-col gap-1 text-small font-semibold">
                  {s.issueExplanation}
                  <textarea
                    className={`${CONTROL} py-2`}
                    rows={3}
                    value={issue.explanation}
                    maxLength={ISSUE_EXPLANATION_MAX}
                    readOnly={readOnly}
                    onChange={(event) =>
                      onChange(issue.id, { explanation: event.target.value })
                    }
                  />
                </label>
                <LinkPicker
                  name={id}
                  title={s.issueLinks}
                  groups={groups}
                  selected={issue.links}
                  readOnly={readOnly}
                  onChange={(links) => onChange(issue.id, { links })}
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
          {s.addIssue}
        </button>
      )}
      {full && !readOnly && (
        <p className="text-small text-ink-muted">
          {interpolate(s.maxIssues, { max: String(ISSUES_MAX) })}
        </p>
      )}
    </section>
  );
}
