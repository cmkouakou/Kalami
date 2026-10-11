/**
 * =============================================================
 *  Fichier    : step-card.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Carte d'une étape sur la carte de l'étude (maquette 06) : lien vers l'étape
 *               si elle est ouverte, carte en pointillés avec le cadenas et ce qui manque
 *               pour l'ouvrir si elle est verrouillée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/strategy/step-status.tsx, lib/strategy/steps.ts
 * =============================================================
 */

import Link from "next/link";

import { StepStatusBadge } from "@/components/strategy/step-status";
import { getDictionary, interpolate } from "@/i18n";
import {
  PROFILE_PREREQUISITE,
  type StepDefinition,
  type StepNo,
  type StepStatus,
} from "@/lib/strategy/steps";

const t = getDictionary();
const s = t.strategy;

type StepCardProps = {
  studyId: string;
  step: StepDefinition;
  status: StepStatus;
  /** Prérequis manquants (0 = profil incomplet) ; vide si l'étape est ouverte. */
  missing: number[];
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Phrase « S'ouvre quand… » à partir des prérequis manquants.
 * @param missing - Prérequis manquants (0 = profil)
 */
export function opensWhen(missing: number[]): string {
  if (missing.includes(PROFILE_PREREQUISITE)) return s.map.profileFirst;
  const titles = missing.map((no) => s.steps[no as StepNo].title);
  const list = titles.join(", ");
  return interpolate(titles.length > 1 ? s.map.opensWhenMany : s.map.opensWhen, { steps: list });
}

/** Classes de la carte selon son état (validée, en cours, à revoir, à faire). */
function cardLook(status: StepStatus): string {
  if (status === "in_progress" || status === "submitted") {
    return "border-2 border-encre bg-encre-soft";
  }
  if (status === "needs_review") return "border-2 border-warning bg-surface";
  return "border border-line bg-surface";
}

// ==================== COMPOSANT ====================

/** Carte d'une étape : ouverte (lien) ou verrouillée (pointillés). */
export function StepCard({ studyId, step, status, missing }: StepCardProps) {
  const text = s.steps[step.no];
  const locked = missing.length > 0;

  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="text-caption uppercase text-ink-muted">
          {interpolate(s.step.module, { module: String(step.module) })}
        </span>
        <StepStatusBadge status={status} locked={locked} />
      </span>
      <span className="font-serif text-h3 font-semibold">{text.title}</span>
      <span className="text-small text-ink-muted">{text.tools}</span>
      {locked && <span className="text-small text-ink-muted">{opensWhen(missing)}</span>}
    </>
  );

  if (locked) {
    return (
      <div className="flex h-full flex-col gap-2 rounded-lg border border-dashed border-line
        bg-sand p-4"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/strategie/etudes/${studyId}/etapes/${step.no}`}
      className={`flex h-full flex-col gap-2 rounded-lg p-4 transition-colors duration-150
        ease-kalami hover:border-encre ${cardLook(status)}`}
    >
      {body}
    </Link>
  );
}
