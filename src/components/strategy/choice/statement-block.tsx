/**
 * =============================================================
 *  Fichier    : statement-block.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Fin de l'étape 7 : énoncé de la stratégie retenue (avec le rappel des options
 *               retenues) et liste des renoncements, « ce que nous ne ferons pas ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: synthesis/link-picker.tsx, lib/strategy/templates/choice.ts
 * =============================================================
 */

"use client";

import { shortLabel } from "@/components/strategy/synthesis/link-picker";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import {
  BUTTON_ICON,
  BUTTON_TERTIARY,
  CONTROL,
  PANEL_SAND,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  RENUNCIATION_MAX,
  RENUNCIATIONS_MAX,
  STATEMENT_MAX,
  type ChoicePayload,
  type Renunciation,
} from "@/lib/strategy/templates/choice";

const t = getDictionary();
const s = t.strategy.choice;

type StatementBlockProps = {
  payload: ChoicePayload;
  readOnly: boolean;
  onStatement: (text: string) => void;
  onAdd: () => void;
  onChange: (id: string, text: Renunciation["text"]) => void;
  onRemove: (id: string) => void;
};

/** Énoncé de la stratégie et renoncements. */
export function StatementBlock({
  payload,
  readOnly,
  onStatement,
  onAdd,
  onChange,
  onRemove,
}: StatementBlockProps) {
  const retained = payload.options.filter(
    (option) => option.decision === "retained" && option.text.trim(),
  );
  const full = payload.renunciations.length >= RENUNCIATIONS_MAX;

  return (
    <>
      {/* ==================== ÉNONCÉ ==================== */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-h2 font-semibold">{s.statementTitle}</h2>
            <CommentBadge targetId="statement" label={s.statementTitle} />
          </div>
          <p className="text-small text-ink-muted">{s.statementIntro}</p>
        </div>
        <div className={`${PANEL_SAND} flex flex-col gap-1 p-3 text-small`}>
          <span className="font-semibold">{s.retainedSummary}</span>
          {retained.length === 0 ? (
            <span className="text-ink-muted">{s.retainedNone}</span>
          ) : (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {retained.map((option) => (
                <li key={option.id}>{shortLabel(option.text)}</li>
              ))}
            </ul>
          )}
        </div>
        <label className="flex flex-col gap-1 text-small font-semibold">
          {s.statementLabel}
          <textarea
            className={`${CONTROL} py-2`}
            rows={5}
            value={payload.statement.text}
            maxLength={STATEMENT_MAX}
            readOnly={readOnly}
            onChange={(event) => onStatement(event.target.value)}
          />
        </label>
      </section>

      {/* ==================== RENONCEMENTS ==================== */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-h2 font-semibold">{s.renunciationsTitle}</h2>
          <p className="text-small text-ink-muted">{s.renunciationsIntro}</p>
        </div>
        {payload.renunciations.length === 0 ? (
          <p className="text-small text-ink-muted">{s.emptyRenunciations}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {payload.renunciations.map((item, index) => {
              const label = interpolate(s.renunciationLabel, { no: String(index + 1) });
              return (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    className={`${CONTROL} flex-1`}
                    value={item.text}
                    maxLength={RENUNCIATION_MAX}
                    readOnly={readOnly}
                    aria-label={label}
                    onChange={(event) => onChange(item.id, event.target.value)}
                  />
                  <CommentBadge targetId={item.id} label={label} />
                  {!readOnly && (
                    <button
                      type="button"
                      className={BUTTON_ICON}
                      aria-label={`${t.strategy.template.remove} : ${label}`}
                      onClick={() => onRemove(item.id)}
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
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
            {s.addRenunciation}
          </button>
        )}
        {full && !readOnly && (
          <p className="text-small text-ink-muted">
            {interpolate(s.maxRenunciations, { max: String(RENUNCIATIONS_MAX) })}
          </p>
        )}
      </section>
    </>
  );
}
