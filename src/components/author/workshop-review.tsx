/**
 * =============================================================
 *  Fichier    : workshop-review.tsx
 *  Projet     : Kalami
 *  Description: Suggestions du relecteur ou du conseiller de style pour un chapitre
 *               (v0.15.1) : passage d'origine, proposition, explication, boutons Accepter
 *               et Refuser (un par un ou tous ensemble). Les passages introuvables tels
 *               quels sont signalés « à corriger à la main ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { decideWorkshopSuggestions } from "@/lib/author/workshop/actions";
import type {
  ChapterReview,
  SuggestionDecision,
} from "@/lib/author/workshop/suggestions";
import { getWorkshopDictionary } from "@/i18n/workshop";

const w = getWorkshopDictionary().tools;

type WorkshopReviewProps = {
  requestId: string;
  review: ChapterReview;
  decisions: Record<string, SuggestionDecision>;
};

/** Liste des suggestions d'une analyse, avec les décisions de l'auteur. */
export function WorkshopReview({ requestId, review, decisions: initial }: WorkshopReviewProps) {
  const [decisions, setDecisions] = useState(initial);
  const [error, setError] = useState<string>();
  const [busy, startTransition] = useTransition();

  /** Enregistre des décisions ; l'affichage revient en arrière en cas d'échec. */
  const decide = (changes: Record<number, SuggestionDecision>) => {
    const previous = decisions;
    setDecisions({ ...decisions, ...changes });
    setError(undefined);
    startTransition(async () => {
      const result = await decideWorkshopSuggestions(requestId, changes);
      if (!result.ok) {
        setDecisions(previous);
        setError(result.error);
      }
    });
  };

  /** Même décision pour toutes les suggestions encore en attente. */
  const decideAll = (decision: SuggestionDecision) => {
    const changes: Record<number, SuggestionDecision> = {};
    review.suggestions.forEach((_, index) => {
      if (!decisions[String(index)]) changes[index] = decision;
    });
    if (Object.keys(changes).length > 0) decide(changes);
  };

  const values = Object.values(decisions);
  const accepted = values.filter((value) => value === "accepted").length;
  const rejected = values.filter((value) => value === "rejected").length;
  const waiting = review.suggestions.length - accepted - rejected;

  return (
    <div className="flex flex-col gap-4">
      {review.summary && (
        <p className="text-sm">
          <strong>{w.summary} : </strong>
          {review.summary}
        </p>
      )}
      {review.suggestions.length === 0 ? (
        <p className="text-sm text-ink-muted">{w.noSuggestion}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-small text-ink-muted">
            <span>
              {interpolate(w.counts, {
                total: String(review.suggestions.length),
                accepted: String(accepted),
                rejected: String(rejected),
              })}
            </span>
            {waiting > 0 && (
              <>
                <span>{interpolate(w.pending, { count: String(waiting) })}</span>
                <button
                  type="button"
                  className={BUTTON_TERTIARY}
                  disabled={busy}
                  onClick={() => decideAll("accepted")}
                >
                  {w.acceptAll}
                </button>
                <button
                  type="button"
                  className={BUTTON_TERTIARY}
                  disabled={busy}
                  onClick={() => decideAll("rejected")}
                >
                  {w.rejectAll}
                </button>
              </>
            )}
          </div>
          <FormMessage error={error} />
          <ol className="flex flex-col gap-3">
            {review.suggestions.map((suggestion, index) => {
              const decision = decisions[String(index)];
              return (
                <li
                  key={index}
                  className={`flex flex-col gap-2 rounded-md border border-line p-3 text-sm ${
                    decision === "rejected" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-small text-ink-muted">
                    <span className={BADGE}>{w.kinds[suggestion.kind]}</span>
                    <span>{interpolate(w.block, { n: String(suggestion.block) })}</span>
                  </div>
                  <p>
                    <del className="bg-danger/10">{suggestion.original}</del>
                    {" → "}
                    <ins className="bg-success/10 no-underline">{suggestion.replacement}</ins>
                  </p>
                  {suggestion.explanation && (
                    <p className="text-ink-muted">{suggestion.explanation}</p>
                  )}
                  {!suggestion.applicable && (
                    <p className="text-small text-warning">{w.manual}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {decision ? (
                      <>
                        <span className="text-small font-semibold">
                          {decision === "accepted" ? w.accepted : w.rejected}
                        </span>
                        <button
                          type="button"
                          className={BUTTON_TERTIARY}
                          disabled={busy}
                          onClick={() => decide({
                            [index]: decision === "accepted" ? "rejected" : "accepted",
                          })}
                        >
                          {decision === "accepted" ? w.reject : w.accept}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={BUTTON_SECONDARY}
                          disabled={busy}
                          onClick={() => decide({ [index]: "accepted" })}
                        >
                          {w.accept}
                        </button>
                        <button
                          type="button"
                          className={BUTTON_TERTIARY}
                          disabled={busy}
                          onClick={() => decide({ [index]: "rejected" })}
                        >
                          {w.reject}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
