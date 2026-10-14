/**
 * =============================================================
 *  Fichier    : coach-panel.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Panneau du coach IA dans un gabarit, en quatre onglets : relecture
 *               (suggestions à accepter, modifier ou rejeter ; une suggestion acceptée passe
 *               par la sauvegarde automatique du gabarit), questions d'approfondissement
 *               (traitées ou écartées), évaluation indicative et recherche Web sourcée
 *               (étapes 1 et 2 seulement ; un fait ajouté passe par la sauvegarde
 *               automatique). Jauge commune du budget IA de l'étude (alerte à 80 %). Une
 *               fonction sans consigne publiée est signalée comme indisponible. La jauge est
 *               exportée pour le panneau des documents joints (S5b).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-14
 *  Dépendances: lib/strategy/coach (actions, patch, queries, schemas),
 *               coach-questions.tsx, coach-research.tsx, coach-score.tsx
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { CoachQuestions } from "@/components/strategy/coach-questions";
import { CoachResearchList } from "@/components/strategy/coach-research";
import { CoachScore } from "@/components/strategy/coach-score";
import { FormMessage } from "@/components/ui/form";
import {
  BADGE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  CONTROL,
  PILL,
  PILL_ACTIVE,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { decideSuggestion, requestCoach } from "@/lib/strategy/coach/actions";
import {
  COACH_FUNCTIONS,
  isFunctionAvailable,
  type CoachFunction,
} from "@/lib/strategy/coach/context";
import { applyFact, applySuggestion, findField } from "@/lib/strategy/coach/patch";
import type {
  CoachDecision,
  CoachDeepen,
  CoachResearch,
  CoachReview,
  CoachRuleTitle,
  CoachScore as CoachScoreResult,
  CoachState,
} from "@/lib/strategy/coach/queries";
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
export function UsageGauge({ spent, budget }: { spent: number; budget: number }) {
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
  rule: CoachRuleTitle | null;
  canAct: boolean;
  onDecide: (decision: CoachDecision, text?: string) => void;
};

/** Une suggestion du coach, avec ses trois décisions possibles. */
function SuggestionItem({
  suggestion,
  current,
  decision,
  rule,
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
      {rule && (
        <p className="text-small text-ink-muted">{interpolate(c.rule, { title: rule.title })}</p>
      )}
      <p className="text-small">{suggestion.explanation}</p>
      {rule?.bookExplanation && (
        <p className="text-small text-ink-muted">
          {interpolate(c.book, { text: rule.bookExplanation })}
        </p>
      )}
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

/** Dernier résultat de chaque fonction du coach. */
type Results = {
  review: CoachReview | null;
  deepen: CoachDeepen | null;
  score: CoachScoreResult | null;
  research: CoachResearch | null;
};

/** Textes du bouton de demande, par fonction. */
const REQUEST_TEXTS: Record<CoachFunction, { request: string; again: string; busy: string }> = {
  review: { request: c.request, again: c.again, busy: c.requesting },
  deepen: { request: c.deepen.request, again: c.deepen.again, busy: c.deepen.requesting },
  score: { request: c.score.request, again: c.score.again, busy: c.score.requesting },
  research: {
    request: c.research.request,
    again: c.research.again,
    busy: c.research.requesting,
  },
};

/** Introduction de chaque onglet (celle de la relecture est l'introduction générale). */
const TAB_INTROS: Record<CoachFunction, string | null> = {
  review: null,
  deepen: c.deepen.intro,
  score: c.score.intro,
  research: c.research.intro,
};

/** Panneau du coach : onglets, budget, demande et dernier résultat de chaque fonction. */
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
  const [tab, setTab] = useState<CoachFunction>("review");
  const [usage, setUsage] = useState(coach.usage);
  const [results, setResults] = useState<Results>({
    review: coach.latest,
    deepen: coach.deepen,
    score: coach.score,
    research: coach.research,
  });
  // Fonctions dont le résultat porte sur une version antérieure (constat au chargement)
  const [fresh, setFresh] = useState<Record<CoachFunction, boolean>>({
    review: false,
    deepen: false,
    score: false,
    research: false,
  });
  const [message, setMessage] = useState<{ error?: string; message?: string }>({});
  const [busy, startTransition] = useTransition();

  const available = coach.available[tab];
  const canAct = editor && !validated && usage.enabled;
  const rules = new Map(coach.rules.map((rule) => [rule.code, rule]));
  const tabs = COACH_FUNCTIONS.filter((fn) => isFunctionAvailable(fn, stepNo));
  const current = results[tab];
  const outdated = current !== null && !fresh[tab] && current.revision !== revision;
  const date = current ? DATE_FORMAT.format(new Date(current.createdAt)) : "";

  let blocked: string | null = null;
  if (!usage.enabled) blocked = c.disabled;
  else if (!available) blocked = c.notAvailable;
  else if (!editor) blocked = c.readOnly;
  else if (validated) blocked = c.validatedStep;
  else if (pending) blocked = c.waitSave;

  /** Change d'onglet et efface le message de l'onglet précédent. */
  function select(next: CoachFunction) {
    setTab(next);
    setMessage({});
  }

  /** Lance la fonction de l'onglet ouvert sur le contenu enregistré. */
  function ask() {
    const fn = tab;
    setMessage({});
    startTransition(async () => {
      const result = await requestCoach(fn, studyId, stepNo);
      if (result.usage) setUsage(result.usage);
      if (!result.ok) {
        setMessage({ error: result.error });
        return;
      }
      const next = {
        requestId: result.requestId,
        output: result.output,
        decisions: {},
        revision,
        createdAt: new Date().toISOString(),
      };
      setResults((previous) => ({ ...previous, [fn]: next }));
      setFresh((previous) => ({ ...previous, [fn]: true }));
    });
  }

  /**
   * Note la décision côté serveur, après l'avoir affichée.
   * @param fn        - Fonction dont le résultat est concerné
   * @param requestId - Demande concernée
   * @param index     - Indice de la suggestion ou de la question
   * @param decision  - Décision prise
   */
  function record(fn: CoachFunction, requestId: string, index: number, decision: CoachDecision) {
    setMessage({});
    setResults((previous) => {
      const result = previous[fn];
      if (!result) return previous;
      return {
        ...previous,
        [fn]: { ...result, decisions: { ...result.decisions, [index]: decision } },
      };
    });
    startTransition(async () => {
      const outcome = await decideSuggestion(requestId, index, decision);
      if (!outcome.ok) setMessage({ error: outcome.error });
    });
  }

  /**
   * Applique la décision prise sur une suggestion de relecture puis la note.
   * @param index    - Indice de la suggestion
   * @param decision - accepted, modified ou rejected
   * @param text     - Texte modifié par l'utilisateur (décision « modified »)
   */
  function decideReview(index: number, decision: CoachDecision, text?: string) {
    const latest = results.review;
    if (!latest) return;
    const suggestion = latest.output.suggestions[index];
    const replaces = decision !== "rejected" && suggestion.proposal !== null;
    const replacement = decision === "modified" ? text ?? null : suggestion.proposal;

    if (replaces) {
      if (!applySuggestion(stepNo, value, suggestion, replacement)) {
        setMessage({ error: c.notApplicable });
        return;
      }
      update((previous) => applySuggestion(stepNo, previous, suggestion, replacement) ?? previous);
    }
    record("review", latest.requestId, index, decision);
  }

  /**
   * Ajoute un fait de la recherche au gabarit (ou l'écarte) puis note la décision.
   * @param index    - Indice du fait
   * @param decision - accepted (ajouté) ou rejected (écarté)
   */
  function decideResearch(index: number, decision: CoachDecision) {
    const latest = results.research;
    if (!latest) return;
    const fact = latest.output.facts[index];

    if (decision === "accepted") {
      const id = crypto.randomUUID();
      if (!applyFact(stepNo, value, fact, id, c.research.hypothesis)) {
        setMessage({ error: c.research.notApplicable });
        return;
      }
      update((previous) => applyFact(stepNo, previous, fact, id, c.research.hypothesis)
        ?? previous);
    }
    record("research", latest.requestId, index, decision);
  }

  return (
    <section className={`${CARD} flex flex-col gap-4 p-4`} aria-busy={busy}>
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{c.title}</h2>
        <p className="text-small text-ink-muted">{c.intro}</p>
      </div>

      <UsageGauge spent={usage.spent} budget={usage.budget} />

      <div role="tablist" aria-label={c.title} className="flex flex-wrap gap-2">
        {tabs.map((fn) => (
          <button
            key={fn}
            type="button"
            role="tab"
            aria-selected={tab === fn}
            className={tab === fn ? PILL_ACTIVE : PILL}
            disabled={busy}
            onClick={() => select(fn)}
          >
            {c.tabs[fn]}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="flex flex-col gap-3">
        {TAB_INTROS[tab] && <p className="text-small text-ink-muted">{TAB_INTROS[tab]}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={BUTTON_PRIMARY}
            disabled={busy || blocked !== null}
            onClick={ask}
          >
            {current ? REQUEST_TEXTS[tab].again : REQUEST_TEXTS[tab].request}
          </button>
          {busy && (
            <span role="status" className="text-small text-ink-muted">
              {REQUEST_TEXTS[tab].busy}
            </span>
          )}
          {blocked && !busy && <span className="text-small text-ink-muted">{blocked}</span>}
        </div>

        <FormMessage {...message} />

        {tab === "review" && results.review && (
          <div className="flex flex-col gap-2">
            <p className="text-caption text-ink-muted">{interpolate(c.reviewedAt, { date })}</p>
            {outdated && <p className="text-small text-warning">{c.outdated}</p>}
            <h3 className="font-semibold">{c.summaryTitle}</h3>
            <p className="text-small">{results.review.output.summary}</p>
            {results.review.output.suggestions.length === 0 ? (
              <p className="text-small text-ink-muted">{c.noSuggestions}</p>
            ) : (
              <ol className="flex flex-col divide-y divide-line">
                {results.review.output.suggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={`${results.review?.requestId}-${index}`}
                    suggestion={suggestion}
                    current={suggestion.targetId && suggestion.field
                      ? findField(value, suggestion.targetId, suggestion.field)
                      : null}
                    decision={results.review?.decisions[index]}
                    rule={suggestion.ruleCode ? rules.get(suggestion.ruleCode) ?? null : null}
                    canAct={canAct && !busy}
                    onDecide={(decision, text) => decideReview(index, decision, text)}
                  />
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "deepen" && results.deepen && (
          <CoachQuestions
            result={results.deepen}
            date={date}
            outdated={outdated}
            canAct={canAct && !busy}
            onDecide={(index, decision) => {
              if (results.deepen) record("deepen", results.deepen.requestId, index, decision);
            }}
          />
        )}

        {tab === "score" && results.score && (
          <CoachScore result={results.score} date={date} outdated={outdated} rules={rules} />
        )}

        {tab === "research" && results.research && (
          <CoachResearchList
            result={results.research}
            date={date}
            canAct={canAct && !busy}
            onDecide={decideResearch}
          />
        )}
      </div>
    </section>
  );
}
