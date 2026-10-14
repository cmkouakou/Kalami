/**
 * =============================================================
 *  Fichier    : prefill-review.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Résultat de l'analyse d'une pièce jointe (S5b) : résumé du document et
 *               propositions du coach pour le profil, à cocher. « Appliquer la sélection »
 *               enregistre tout de suite les propositions cochées dans le profil (les listes
 *               sont complétées sans doublon) ; « Tout écarter » les rejette. Une proposition
 *               déjà présente dans le profil est signalée et décochée par défaut.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: lib/strategy/attachment-actions.ts, lib/strategy/prefill.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_PRIMARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { applyProposals } from "@/lib/strategy/attachment-actions";
import type { AttachmentAnalysis } from "@/lib/strategy/attachment-queries";
import { isAlreadyInProfile, type Proposal } from "@/lib/strategy/prefill";
import type { ProfileData } from "@/lib/strategy/profile";

const s = getDictionary().strategy;
const a = s.attachments;
const fields = s.profile.fields as Record<string, string>;

type PrefillReviewProps = {
  studyId: string;
  analysis: AttachmentAnalysis;
  profile: ProfileData;
  /** Vrai pour le propriétaire et les contributeurs. */
  canAct: boolean;
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Texte d'une proposition (avec l'effectif d'une équipe s'il est connu). */
function proposalText(proposal: Proposal): string {
  return proposal.headcount === null
    ? proposal.value
    : `${proposal.value} (${proposal.headcount})`;
}

// ==================== COMPOSANT ====================

/** Résumé et propositions d'une analyse, avec application au profil. */
export function PrefillReview({ studyId, analysis, profile, canAct }: PrefillReviewProps) {
  const { summary, proposals } = analysis.output;
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set(
      proposals.flatMap((proposal, index) => isAlreadyInProfile(profile, proposal) ? [] : [index]),
    ),
  );
  const decided = proposals.every((_, index) => analysis.decisions[index] !== undefined);
  // Sans proposition, decided est vrai : rien à appliquer
  const open = canAct && !decided;

  /** Coche ou décoche une proposition. */
  function toggle(index: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  /**
   * Enregistre la décision : propositions cochées appliquées, les autres écartées.
   * @param indices - Propositions retenues (vide pour tout écarter)
   */
  function submit(indices: number[]) {
    setFeedback({});
    startTransition(async () => {
      const result = await applyProposals(studyId, analysis.requestId, indices);
      if (!result.ok) return setFeedback({ error: result.error });
      setFeedback({ message: indices.length > 0 ? a.applied : a.decided });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <h4 className="text-label">{a.summaryTitle}</h4>
        <p className="whitespace-pre-line text-small">{summary}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="text-label">{a.proposalsTitle}</h4>
        {proposals.length === 0 ? (
          <p className="text-small text-ink-muted">{a.noProposals}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proposals.map((proposal, index) => {
              const decision = analysis.decisions[index];
              const known = isAlreadyInProfile(profile, proposal);
              const inputId = `proposition-${analysis.requestId}-${index}`;
              return (
                <li key={inputId} className="flex flex-wrap items-center gap-2 text-small">
                  {open && (
                    <input
                      id={inputId}
                      type="checkbox"
                      className="size-5"
                      checked={selected.has(index)}
                      disabled={pending}
                      onChange={() => toggle(index)}
                    />
                  )}
                  <label htmlFor={open ? inputId : undefined} className="flex-1">
                    <span className="text-ink-muted">{fields[proposal.field]} : </span>
                    {proposalText(proposal)}
                  </label>
                  {known && <span className={BADGE}>{a.inProfile}</span>}
                  {decision && <span className={BADGE}>{a.decisions[decision]}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {open && (
        <div className="flex flex-col gap-3">
          <p className="text-small text-ink-muted">{a.applyHint}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON_PRIMARY}
              disabled={pending || selected.size === 0}
              onClick={() => submit([...selected])}
            >
              {a.apply}
            </button>
            <button
              type="button"
              className={BUTTON_TERTIARY}
              disabled={pending}
              onClick={() => submit([])}
            >
              {a.dismissAll}
            </button>
          </div>
        </div>
      )}
      <FormMessage {...feedback} />
    </div>
  );
}
