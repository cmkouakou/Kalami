/**
 * =============================================================
 *  Fichier    : coach-panel.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Panneau du coach IA dans un gabarit : demande de relecture du contenu
 *               enregistré, jauge du budget IA de l'étude (alerte à 80 %), appréciation
 *               d'ensemble et suggestions. Chaque suggestion s'accepte, se modifie ou se
 *               rejette ; une suggestion acceptée passe par la sauvegarde automatique du
 *               gabarit, jamais sans action de l'utilisateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: lib/strategy/coach (actions, patch, queries, schemas)
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import {
  BADGE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  CONTROL,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { decideSuggestion, requestReview } from "@/lib/strategy/coach/actions";
import { applySuggestion, findField } from "@/lib/strategy/coach/patch";
import type { CoachDecision, CoachReview, CoachState } from "@/lib/strategy/coach/queries";
import type { Suggestion } from "@/lib/strategy/coach/schemas";
import type { TemplateStep } from "@/lib/strategy/templates";

const c = getDictionary().strategy.coach;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const MONEY_FORMAT = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Part du budget à partir de laquelle l'alerte s'affiche. */
const NEAR_BUDGET = 0.8;

type CoachPanelProps<T> = {
  studyId: string;
  stepNo: TemplateStep;
  editor: boolean;
  validated: boolean;
  /** Modifications pas encore enregistrées (la relecture porte sur le contenu enregistré). */
  pending: boolean;
  revision: number;
  value: T;
  update: (change: (previous: T) => T) => void;
  coach: CoachState;
};

// ==================== SOUS-COMPOSANTS ====================

/** Jauge du budget IA de l'étude. */
function UsageGauge({ spent, budget }: { spent: number; budget: number }) {
  const near = budget > 0 && spent / budget >= NEAR_BUDGET;
  return (
    <div className="flex flex-col gap-1 text-small">
      <label className="flex flex-col gap-1">
        <span className="text-ink-muted">
          {interpolate(c.usage, {
            spent: MONEY_FORMAT.format(spent),
            budget: MONEY_FORMAT.format(budget),
          })}
        </span>
        <progress className="h-2 w-full" value={Math.min(spent, budget)} max={budget || 1} />
      </label>
      {near && <p className="text-warning">{c.usageNear}</p>}
    </div>
  );
}

type SuggestionProps = {
  suggestion: Suggestion;
  current: string | null;
  decision: CoachDecision | undefined;
  ruleTitle: string | null;
  canAct: boolean;
  onDecide: (decision: CoachDecision, text?: string) => void;
};

/** Une suggestion du coach, avec ses trois décisions possibles. */
function SuggestionItem({
  suggestion,
  current,
  decision,
  ruleTitle,
  canAct,
  onDecide,
}: SuggestionProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(suggestion.proposal ?? "");
  const precise = Boolean(suggestion.proposal && current !== null);

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-semibold">{suggestion.title}</h4>
        {decision && <span className={BADGE}>{c.decisions[decision]}</span>}
      </div>
      {ruleTitle && (
        <p className="text-small text-ink-muted">{interpolate(c.rule, { title: ruleTitle })}</p>
      )}
      <p className="text-small">{suggestion.explanation}</p>
      {precise && (
        <dl className="grid gap-1 text-small sm:grid-cols-[auto_1fr] sm:gap-x-3">
          <dt className="text-ink-muted">{c.current}</dt>
          <dd>{current}</dd>
          <dt className="text-ink-muted">{c.proposal}</dt>
          <dd className="font-medium">{suggestion.proposal}</dd>
        </dl>
      )}

      {canAct && !decision && !editing && (
        <div className="flex flex-wrap gap-2">
          {precise ? (
            <>
              <button
                type="button"
                className={BUTTON_SECONDARY}
                onClick={() => onDecide("accepted")}
              >
                {c.accept}
              </button>
              <button type="button" className={BUTTON_TERTIARY} onClick={() => setEditing(true)}>
                {c.modify}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={BUTTON_SECONDARY}
              onClick={() => onDecide("accepted")}
            >
              {c.noted}
            </button>
          )}
          <button type="button" className={BUTTON_TERTIARY} onClick={() => onDecide("rejected")}>
            {c.reject}
          </button>
        </div>
      )}

      {canAct && !decision && editing && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-small">
            <span>{c.editLabel}</span>
            <textarea
              className={CONTROL}
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON_SECONDARY}
              disabled={!text.trim()}
              onClick={() => onDecide("modified", text)}
            >
              {c.applyEdited}
            </button>
            <button type="button" className={BUTTON_TERTIARY} onClick={() => setEditing(false)}>
              {c.cancel}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Panneau du coach : relecture, budget et suggestions. */
export function CoachPanel<T>({
  studyId,
  stepNo,
  editor,
  validated,
  pending,
  revision,
  value,
  update,
  coach,
}: CoachPanelProps<T>) {
  const [usage, setUsage] = useState(coach.usage);
  const [latest, setLatest] = useState<CoachReview | null>(coach.latest);
  // Relecture faite sur une version antérieure du gabarit (constat au chargement)
  const [outdated, setOutdated] = useState(
    coach.latest !== null && coach.latest.revision !== revision,
  );
  const [message, setMessage] = useState<{ error?: string; message?: string }>({});
  const [busy, startTransition] = useTransition();

  const canAct = editor && !validated && usage.enabled;
  const ruleTitles = new Map(coach.rules.map((rule) => [rule.code, rule.title]));

  let blocked: string | null = null;
  if (!usage.enabled) blocked = c.disabled;
  else if (!editor) blocked = c.readOnly;
  else if (validated) blocked = c.validatedStep;
  else if (pending) blocked = c.waitSave;

  /** Lance une relecture du contenu enregistré. */
  function review() {
    setMessage({});
    startTransition(async () => {
      const result = await requestReview(studyId, stepNo);
      if (result.usage) setUsage(result.usage);
      if (!result.ok) {
        setMessage({ error: result.error });
        return;
      }
      setLatest({
        requestId: result.requestId,
        review: result.review,
        decisions: {},
        revision,
        createdAt: new Date().toISOString(),
      });
      setOutdated(false);
    });
  }

  /**
   * Applique la décision prise sur une suggestion puis la note côté serveur.
   * @param index    - Indice de la suggestion
   * @param decision - accepted, modified ou rejected
   * @param text     - Texte modifié par l'utilisateur (décision « modified »)
   */
  function decide(index: number, decision: CoachDecision, text?: string) {
    if (!latest) return;
    const suggestion = latest.review.suggestions[index];
    const replaces = decision !== "rejected" && suggestion.proposal !== null;
    const replacement = decision === "modified" ? text ?? null : suggestion.proposal;

    if (replaces) {
      if (!applySuggestion(stepNo, value, suggestion, replacement)) {
        setMessage({ error: c.notApplicable });
        return;
      }
      update((previous) => applySuggestion(stepNo, previous, suggestion, replacement) ?? previous);
    }

    setMessage({});
    setLatest({ ...latest, decisions: { ...latest.decisions, [index]: decision } });
    startTransition(async () => {
      const result = await decideSuggestion(latest.requestId, index, decision);
      if (!result.ok) setMessage({ error: result.error });
    });
  }

  return (
    <section className={`${CARD} flex flex-col gap-4 p-4`} aria-busy={busy}>
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{c.title}</h2>
        <p className="text-small text-ink-muted">{c.intro}</p>
      </div>

      <UsageGauge spent={usage.spent} budget={usage.budget} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={BUTTON_PRIMARY}
          disabled={busy || blocked !== null}
          onClick={review}
        >
          {latest ? c.again : c.request}
        </button>
        {busy && <span role="status" className="text-small text-ink-muted">{c.requesting}</span>}
        {blocked && !busy && <span className="text-small text-ink-muted">{blocked}</span>}
      </div>

      <FormMessage {...message} />

      {latest && (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-ink-muted">
            {interpolate(c.reviewedAt, { date: DATE_FORMAT.format(new Date(latest.createdAt)) })}
          </p>
          {outdated && <p className="text-small text-warning">{c.outdated}</p>}
          <h3 className="font-semibold">{c.summaryTitle}</h3>
          <p className="text-small">{latest.review.summary}</p>
          {latest.review.suggestions.length === 0 ? (
            <p className="text-small text-ink-muted">{c.noSuggestions}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {latest.review.suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={`${latest.requestId}-${index}`}
                  suggestion={suggestion}
                  current={suggestion.targetId && suggestion.field
                    ? findField(value, suggestion.targetId, suggestion.field)
                    : null}
                  decision={latest.decisions[index]}
                  ruleTitle={suggestion.ruleCode ? ruleTitles.get(suggestion.ruleCode) ?? null
                    : null}
                  canAct={canAct && !busy}
                  onDecide={(decision, text) => decide(index, decision, text)}
                />
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
