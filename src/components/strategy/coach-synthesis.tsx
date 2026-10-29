/**
 * =============================================================
 *  Fichier    : coach-synthesis.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Propositions du coach pour la synthèse de l'étape 5 (S6b) : résumé, puis
 *               éléments de SWOT (par case), pistes TOWS et enjeux, chacun avec une case à
 *               cocher. Un élément repris d'une étape porte son étiquette (« É1 » à « É4 ») ;
 *               un élément tiré du profil seul est marqué « à vérifier ». Les doublons sont
 *               signalés et décochés par défaut. « Appliquer la sélection » complète la
 *               synthèse sans rien remplacer ; les propositions non cochées sont écartées.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: lib/strategy/coach (queries, schemas), lib/strategy/synthesis-proposals.ts,
 *               lib/strategy/templates/synthesis.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BADGE, BUTTON_PRIMARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import type { CoachDecision, CoachSynthesize } from "@/lib/strategy/coach/queries";
import {
  defaultSelection,
  duplicateIndexes,
  indexProposals,
  type IndexedProposal,
} from "@/lib/strategy/synthesis-proposals";
import {
  originLabel,
  SWOT_KEYS,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";
import { getStrategyDictionary } from "@/i18n/strategy";

const strategy = getStrategyDictionary();
const y = strategy.coach.synthesize;
const s = strategy.synthesis;

type CoachSynthesisProps = {
  result: CoachSynthesize;
  /** Date de la demande, déjà mise en forme. */
  date: string;
  outdated: boolean;
  /** Synthèse actuelle (doublons et textes des éléments liés). */
  payload: SynthesisPayload;
  canAct: boolean;
  /** Applique les propositions cochées (ensemble vide : tout écarter). */
  onApply: (selected: ReadonlySet<number>) => void;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Texte court d'un élément lié : proposition (par sa ref) ou élément existant (par son id).
 * @param link      - Ref ou identifiant
 * @param proposals - Propositions numérotées
 * @param payload   - Synthèse actuelle
 */
function linkText(link: string, proposals: IndexedProposal[], payload: SynthesisPayload) {
  for (const entry of proposals) {
    if (entry.kind !== "issue" && entry.item.ref === link) return entry.item.text;
  }
  for (const key of SWOT_KEYS) {
    const item = payload.swot[key].find((candidate) => candidate.id === link);
    if (item) return item.text;
  }
  return payload.tows.find((item) => item.id === link)?.text ?? null;
}

// ==================== SOUS-COMPOSANTS ====================

type ProposalRowProps = {
  entry: IndexedProposal;
  inputId: string;
  open: boolean;
  checked: boolean;
  duplicate: boolean;
  decision: CoachDecision | undefined;
  links: string[];
  onToggle: () => void;
};

/** Une proposition : case à cocher, texte, étiquettes et éléments liés. */
function ProposalRow(props: ProposalRowProps) {
  const { entry, inputId, open, checked, duplicate, decision, links, onToggle } = props;
  let origin: string | null = null;
  let badges: string[] = [];
  let text: string;
  let detail: string | null = null;
  if (entry.kind === "swot") {
    origin = originLabel(entry.item.origin);
    if (!origin) badges = [y.toVerifyBadge];
    text = entry.item.text;
  } else if (entry.kind === "tows") {
    badges = [s.quadrants[entry.item.quadrant]];
    text = entry.item.text;
  } else {
    text = entry.item.title;
    detail = entry.item.explanation;
  }

  return (
    <li className="flex items-start gap-2 py-2 text-small">
      {open && (
        <input
          id={inputId}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0"
          checked={checked}
          onChange={onToggle}
        />
      )}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {origin && entry.kind === "swot" && entry.item.origin && (
            <span
              className={BADGE}
              title={interpolate(s.origin, { step: String(entry.item.origin.step) })}
            >
              {origin}
            </span>
          )}
          {badges.map((badge) => <span key={badge} className={BADGE}>{badge}</span>)}
          {duplicate && !decision && <span className={BADGE}>{y.duplicate}</span>}
          {decision && <span className={BADGE}>{y.decisions[decision]}</span>}
        </div>
        <label htmlFor={open ? inputId : undefined} className="font-medium">{text}</label>
        {detail && <p>{detail}</p>}
        {links.length > 0 && (
          <p className="text-ink-muted">{interpolate(y.links, { items: links.join(" ; ") })}</p>
        )}
      </div>
    </li>
  );
}

// ==================== COMPOSANT ====================

/** Propositions de synthèse, à cocher puis appliquer. */
export function CoachSynthesis(props: CoachSynthesisProps) {
  const { result, date, outdated, payload, canAct, onApply } = props;
  const output = result.output;
  const entries = indexProposals(output);
  const duplicates = duplicateIndexes(output, payload);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => defaultSelection(output, payload),
  );
  const decided = entries.every((entry) => result.decisions[entry.index] !== undefined);
  // Sans proposition, decided est vrai : rien à appliquer
  const open = canAct && !decided;
  const count = entries.filter((entry) => selected.has(entry.index)).length;

  /** Coche ou décoche une proposition. */
  function toggle(index: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  /** Liste d'un groupe de propositions. */
  const list = (group: IndexedProposal[]) => (
    <ul className="flex flex-col divide-y divide-line">
      {group.map((entry) => {
        const links = entry.kind === "swot" ? [] : entry.item.links
          .map((link) => linkText(link, entries, payload))
          .filter((text): text is string => text !== null);
        return (
          <ProposalRow
            key={`${result.requestId}-${entry.index}`}
            entry={entry}
            inputId={`synthese-${result.requestId}-${entry.index}`}
            open={open}
            checked={selected.has(entry.index)}
            duplicate={duplicates.has(entry.index)}
            decision={result.decisions[entry.index]}
            links={links}
            onToggle={() => toggle(entry.index)}
          />
        );
      })}
    </ul>
  );

  const tows = entries.filter((entry) => entry.kind === "tows");
  const issues = entries.filter((entry) => entry.kind === "issue");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-ink-muted">{interpolate(y.proposedAt, { date })}</p>
      {outdated && <p className="text-small text-warning">{y.outdated}</p>}
      {output.summary && <p className="whitespace-pre-line text-small">{output.summary}</p>}

      {entries.length === 0 && <p className="text-small text-ink-muted">{y.none}</p>}

      {output.swot.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">{y.swotTitle}</h3>
          {SWOT_KEYS.map((key) => {
            const group = entries.filter((entry) => entry.kind === "swot"
              && entry.item.key === key);
            if (group.length === 0) return null;
            return (
              <div key={key} className="flex flex-col gap-1">
                <h4 className="text-label">{s.keys[key]}</h4>
                {list(group)}
              </div>
            );
          })}
        </section>
      )}

      {tows.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">{y.towsTitle}</h3>
          {list(tows)}
        </section>
      )}

      {issues.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">{y.issuesTitle}</h3>
          {list(issues)}
        </section>
      )}

      {open && (
        <div className="flex flex-col gap-3">
          <p className="text-small text-ink-muted">{y.applyHint}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON_PRIMARY}
              disabled={count === 0}
              onClick={() => onApply(selected)}
            >
              {interpolate(y.apply, { count: String(count) })}
            </button>
            <button type="button" className={BUTTON_TERTIARY} onClick={() => onApply(new Set())}>
              {y.dismissAll}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
