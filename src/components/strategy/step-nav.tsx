/**
 * =============================================================
 *  Fichier    : step-nav.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Navigation en bas d'une étape : étape précédente, retour à la carte et
 *               étape suivante, pour enchaîner sans remonter en haut de la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/steps.ts, i18n
 * =============================================================
 */

import Link from "next/link";

import { getDictionary, interpolate } from "@/i18n";
import { isStepNo, type StepNo } from "@/lib/strategy/steps";

const s = getDictionary().strategy;

/** Classe commune des liens de navigation (cible tactile d'au moins 44 px). */
const NAV_LINK = "flex min-h-11 flex-col justify-center rounded-lg border border-line px-4 py-2 " +
  "hover:border-encre hover:bg-encre/5";

/**
 * Liens vers l'étape précédente et l'étape suivante d'une étude.
 * @param studyId - Identifiant de l'étude
 * @param no      - Numéro de l'étape affichée
 */
export function StepNav({ studyId, no }: { studyId: string; no: StepNo }) {
  const base = `/strategie/etudes/${studyId}`;
  const previous = no - 1;
  const next = no + 1;

  return (
    <nav aria-label={s.step.navLabel} className="mt-4 grid gap-3 border-t border-line pt-6
      sm:grid-cols-3"
    >
      {isStepNo(previous) ? (
        <Link href={`${base}/etapes/${previous}`} className={NAV_LINK}>
          <span className="text-caption text-ink-muted">← {s.step.previous}</span>
          <span className="font-semibold">
            {interpolate(s.step.stepLabel, {
              no: String(previous),
              title: s.steps[previous].title,
            })}
          </span>
        </Link>
      ) : (
        <Link href={`${base}/profil`} className={NAV_LINK}>
          <span className="text-caption text-ink-muted">← {s.step.previous}</span>
          <span className="font-semibold">{s.step.profile}</span>
        </Link>
      )}

      <Link href={base} className={`${NAV_LINK} items-center text-center`}>
        <span className="font-semibold">{s.step.back}</span>
      </Link>

      {isStepNo(next) && (
        <Link href={`${base}/etapes/${next}`} className={`${NAV_LINK} items-end text-right`}>
          <span className="text-caption text-ink-muted">{s.step.next} →</span>
          <span className="font-semibold">
            {interpolate(s.step.stepLabel, { no: String(next), title: s.steps[next].title })}
          </span>
        </Link>
      )}
    </nav>
  );
}
