/**
 * =============================================================
 *  Fichier    : step-status.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Pastille du statut d'une étape (à faire, en cours, soumise, validée,
 *               à revoir), avec une icône pour ne pas reposer sur la couleur seule.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/ui/icons.tsx, i18n
 * =============================================================
 */

import { IconAlert, IconCheck, IconCircle, IconClock, IconLock } from "@/components/ui/icons";
import { getDictionary } from "@/i18n";
import type { StepStatus } from "@/lib/strategy/steps";

const t = getDictionary();

/** Couleurs et icône de chaque statut (jetons de la charte). */
const LOOK: Record<StepStatus, { className: string; Icon: typeof IconCheck }> = {
  todo: { className: "bg-sand text-ink-muted", Icon: IconCircle },
  in_progress: { className: "bg-encre-soft text-encre", Icon: IconClock },
  submitted: { className: "bg-encre-soft text-encre", Icon: IconClock },
  validated: { className: "bg-success/15 text-success", Icon: IconCheck },
  needs_review: { className: "bg-warning/15 text-ink", Icon: IconAlert },
};

const PILL = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold";

type StepStatusBadgeProps = { status: StepStatus; locked?: boolean };

/** Pastille de statut ; « locked » affiche le cadenas à la place du statut. */
export function StepStatusBadge({ status, locked = false }: StepStatusBadgeProps) {
  if (locked) {
    return (
      <span className={`${PILL} bg-sand text-ink-muted`}>
        <IconLock size={14} />
        {t.strategy.map.locked}
      </span>
    );
  }
  const { className, Icon } = LOOK[status];
  return (
    <span className={`${PILL} ${className}`}>
      <Icon size={14} />
      {t.strategy.status[status]}
    </span>
  );
}
