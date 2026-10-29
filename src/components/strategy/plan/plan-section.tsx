/**
 * =============================================================
 *  Fichier    : plan-section.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Une section du plan stratégique (S8a) : titre, origine (assemblée, rédigée
 *               avec le coach, modifiée), paragraphes éditables avec leur nombre de sources,
 *               ajout et retrait de paragraphes, régénération depuis les étapes et rédaction
 *               par le coach (chacune après confirmation). La proposition du coach s'affiche
 *               à part : « Remplacer la section » ou « Ignorer », décision notée au suivi.
 *               Forfait du coach absent ou épuisé : renvoi vers la page du coach (v0.11.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/plan-actions.ts, lib/strategy/coach/actions.ts,
 *               lib/strategy/templates/plan.ts
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { coachPageHref } from "@/components/strategy/coach-panel";
import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import {
  BADGE,
  BUTTON_ICON,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  CONTROL,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { decideSuggestion, requestPlanSection } from "@/lib/strategy/coach/actions";
import type { PlanProposal } from "@/lib/strategy/coach/plan-output";
import type { CoachUsage } from "@/lib/strategy/coach/queries";
import { assemblePlanSection } from "@/lib/strategy/plan-actions";
import {
  BLOCK_TEXT_MAX,
  BLOCKS_MAX,
  newBlock,
  type PlanBlock,
  type PlanSection as Section,
} from "@/lib/strategy/templates/plan";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const p = tStrategy.plan;

// ==================== TYPES ====================

/** Action en attente de confirmation. */
type Pending = "regenerate" | "coach" | null;

type PlanSectionProps = {
  studyId: string;
  section: Section;
  readOnly: boolean;
  /** Raison pour laquelle le coach est indisponible (vide : disponible). */
  coachBlocked: string;
  /** Remplace la section entière (régénération, proposition acceptée). */
  onReplace: (section: Section) => void;
  /** Modifie les paragraphes (la section passe « modifiée »). */
  onEdit: (blocks: PlanBlock[]) => void;
  /** Consommation du coach à jour après une demande. */
  onUsage: (usage: CoachUsage) => void;
};

// ==================== SOUS-COMPOSANTS ====================

/**
 * Proposition du coach : résumé, paragraphes et sources, puis choix de l'équipe.
 * @param proposal  - Proposition nettoyée
 * @param onReplace - Remplace la section par la proposition
 * @param onIgnore  - Écarte la proposition
 */
function Proposal({
  proposal,
  busy,
  onReplace,
  onIgnore,
}: {
  proposal: PlanProposal;
  busy: boolean;
  onReplace: () => void;
  onIgnore: () => void;
}) {
  const { blocks } = proposal.section;
  return (
    <section className={`${PANEL_SAND} flex flex-col gap-3 p-4`} aria-live="polite">
      <h4 className="font-semibold">{p.proposalTitle}</h4>
      {proposal.summary && <p className="text-small text-ink-muted">{proposal.summary}</p>}
      {blocks.length === 0 ? (
        <p className="text-small">{p.proposalEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {blocks.map((block) => (
            <li key={block.id} className="flex flex-col gap-1">
              <p className="whitespace-pre-line">{block.text}</p>
              <span className="text-caption text-ink-muted">
                {interpolate(p.sourcesCount, { count: String(block.sources.length) })}
              </span>
            </li>
          ))}
        </ol>
      )}
      {proposal.dropped > 0 && (
        <p className="text-small text-warning">
          {interpolate(p.proposalDropped, { count: String(proposal.dropped) })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {blocks.length > 0 && (
          <button type="button" className={BUTTON_PRIMARY} disabled={busy} onClick={onReplace}>
            {p.proposalReplace}
          </button>
        )}
        <button type="button" className={BUTTON_SECONDARY} disabled={busy} onClick={onIgnore}>
          {p.proposalIgnore}
        </button>
      </div>
    </section>
  );
}

/**
 * Paragraphes éditables de la section.
 * @param blocks   - Paragraphes actuels
 * @param readOnly - Lecture seule
 * @param onEdit   - Nouveaux paragraphes
 */
function Paragraphs({
  sectionKey,
  blocks,
  readOnly,
  onEdit,
}: {
  sectionKey: string;
  blocks: PlanBlock[];
  readOnly: boolean;
  onEdit: (blocks: PlanBlock[]) => void;
}) {
  const full = blocks.length >= BLOCKS_MAX;

  /** Change le texte d'un paragraphe (ses sources sont gardées). */
  const change = (id: string, text: string) =>
    onEdit(blocks.map((block) => (block.id === id ? { ...block, text } : block)));

  return (
    <>
      {blocks.length === 0 ? (
        <p className="text-small text-ink-muted">{p.emptySection}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {blocks.map((block, index) => {
            const id = `plan-${sectionKey}-${block.id}`;
            const no = String(index + 1);
            return (
              <li key={block.id} className="flex items-start gap-2">
                <label className="flex flex-1 flex-col gap-1 text-small font-semibold" htmlFor={id}>
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    {interpolate(p.paragraph, { no })}
                    <span className="text-caption font-normal text-ink-muted">
                      {block.sources.length > 0
                        ? interpolate(p.sourcesCount, { count: String(block.sources.length) })
                        : p.noSource}
                    </span>
                  </span>
                  <textarea
                    id={id}
                    className={`${CONTROL} py-2 font-normal`}
                    rows={Math.min(8, Math.max(2, Math.ceil(block.text.length / 90)))}
                    value={block.text}
                    maxLength={BLOCK_TEXT_MAX}
                    readOnly={readOnly}
                    onChange={(event) => change(block.id, event.target.value)}
                  />
                </label>
                {!readOnly && (
                  <button
                    type="button"
                    className={`${BUTTON_ICON} mt-6`}
                    aria-label={interpolate(p.removeParagraph, { no })}
                    onClick={() => onEdit(blocks.filter((item) => item.id !== block.id))}
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`${BUTTON_TERTIARY} w-fit`}
            disabled={full}
            onClick={() => onEdit([...blocks, newBlock(crypto.randomUUID())])}
          >
            <IconPlus size={16} />
            {p.addParagraph}
          </button>
          {full && (
            <span className="text-small text-ink-muted">
              {interpolate(p.maxParagraphs, { max: String(BLOCKS_MAX) })}
            </span>
          )}
        </div>
      )}
    </>
  );
}

// ==================== COMPOSANT ====================

/** Section du plan avec ses actions. */
export function PlanSection({
  studyId,
  section,
  readOnly,
  coachBlocked,
  onReplace,
  onEdit,
  onUsage,
}: PlanSectionProps) {
  const [pending, setPending] = useState<Pending>(null);
  const [proposal, setProposal] = useState<{ requestId: string; output: PlanProposal } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const router = useRouter();
  const headingId = `plan-section-${section.key}`;

  /** Réassemble la section depuis les étapes. */
  function regenerate() {
    startTransition(async () => {
      setError("");
      const assembled = await assemblePlanSection(studyId, section.key).catch(() => null);
      setPending(null);
      if (assembled) onReplace(assembled);
      else setError(tStrategy.errors.generic);
    });
  }

  /** Demande une proposition au coach. */
  function askCoach() {
    startTransition(async () => {
      setError("");
      setProposal(null);
      const result = await requestPlanSection(studyId, section.key).catch(() => null);
      setPending(null);
      if (!result) {
        setError(tStrategy.coach.errors.failed);
        return;
      }
      if (result.usage) onUsage(result.usage);
      if (!result.ok) {
        setError(result.error);
        if (result.pay) router.push(coachPageHref(studyId));
        return;
      }
      setProposal({ requestId: result.requestId, output: result.output });
    });
  }

  /** Applique la décision sur la proposition, puis la referme. */
  function decide(accepted: boolean) {
    if (!proposal) return;
    const { requestId, output } = proposal;
    if (accepted) onReplace(output.section);
    setProposal(null);
    // La décision ne sert qu'au suivi du coach : un échec n'empêche rien
    startTransition(async () => {
      await decideSuggestion(requestId, 0, accepted ? "accepted" : "rejected").catch(() => null);
    });
  }

  return (
    <section aria-labelledby={headingId} className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="font-serif text-h2 font-semibold">
          {p.sections[section.key]}
        </h3>
        <div className="flex items-center gap-2">
          <span className={BADGE}>{p.origins[section.origin]}</span>
          <CommentBadge targetId={section.key} label={p.sections[section.key]} />
        </div>
      </div>

      <Paragraphs
        sectionKey={section.key}
        blocks={section.blocks}
        readOnly={readOnly}
        onEdit={onEdit}
      />

      {!readOnly && pending === null && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <button
            type="button"
            className={BUTTON_SECONDARY}
            disabled={busy}
            onClick={() => setPending("regenerate")}
          >
            {p.regenerateSection}
          </button>
          <button
            type="button"
            className={BUTTON_SECONDARY}
            disabled={busy || coachBlocked !== ""}
            title={coachBlocked || undefined}
            onClick={() => setPending("coach")}
          >
            {p.coachWrite}
          </button>
          {coachBlocked && <span className="text-small text-ink-muted">{coachBlocked}</span>}
        </div>
      )}

      {!readOnly && pending !== null && (
        <div role="alertdialog" className={`${PANEL_SAND} flex flex-col gap-3 p-4`}>
          <p className="text-small">
            {pending === "regenerate" ? p.regenerateConfirm : p.coachConfirm}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON_PRIMARY}
              disabled={busy}
              onClick={pending === "regenerate" ? regenerate : askCoach}
            >
              {busy && pending === "coach" ? p.coachWriting : p.confirm}
            </button>
            <button
              type="button"
              className={BUTTON_TERTIARY}
              disabled={busy}
              onClick={() => setPending(null)}
            >
              {p.cancel}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      {proposal && !readOnly && (
        <Proposal
          proposal={proposal.output}
          busy={busy}
          onReplace={() => decide(true)}
          onIgnore={() => decide(false)}
        />
      )}
    </section>
  );
}
