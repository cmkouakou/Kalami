/**
 * =============================================================
 *  Fichier    : eac-panel.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Panneau « Dossier transmis par Entrepreneur au Combat » de la carte de
 *               l'étude (v0.26.0) : besoin exprimé, compréhension validée par l'entrepreneur
 *               et notes de l'équipe sur les 4 étapes. Repliable (details). v0.26.1 : bouton
 *               d'envoi du plan au dossier (EacSend) pour le propriétaire et les contributeurs.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-18
 *  Dépendances: lib/strategy/eac.ts, components/ui/styles.ts, components/strategy/eac-send
 * =============================================================
 */

import { EacSend } from "@/components/strategy/eac-send";
import { BUTTON_TERTIARY, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getStrategyDictionary } from "@/i18n/strategy";
import { EAC_STAGES, isContextEmpty } from "@/lib/strategy/eac";
import type { EacLink } from "@/lib/strategy/eac-queries";

const s = getStrategyDictionary();

/**
 * Panneau du dossier EAC lié à l'étude.
 * @param link    - Dossier lu par getEacLink
 * @param studyId - Étude affichée
 * @param canSend - Vrai si le membre peut envoyer le plan (rôle, plan ouvert, liaison réglée)
 */
type EacPanelProps = { link: EacLink; studyId: string; canSend: boolean };

export function EacPanel({ link, studyId, canSend }: EacPanelProps) {
  const { context } = link;
  const sections = [
    { key: "besoin", title: s.eac.besoin, text: context.besoin },
    { key: "comprehension", title: s.eac.comprehension, text: context.comprehension },
    ...EAC_STAGES.map((stage) => ({
      key: stage,
      title: s.eac.stages[stage],
      text: context.etapes[stage],
    })),
  ].filter((section) => section.text !== "");

  return (
    <section className={`${PANEL_SAND} flex flex-col gap-2 p-4`} aria-labelledby="eac-title">
      <h2 id="eac-title" className="font-semibold">{s.eac.title}</h2>
      {link.reference && (
        <p className="text-small text-ink-muted">
          {interpolate(s.eac.reference, { ref: link.reference })}
        </p>
      )}
      <p className="text-small">{s.eac.intro}</p>
      {isContextEmpty(context) ? (
        <p className="text-small text-ink-muted">{s.eac.empty}</p>
      ) : (
        <details>
          <summary className={`${BUTTON_TERTIARY} cursor-pointer`}>{s.eac.show}</summary>
          <dl className="mt-3 flex flex-col gap-4">
            {sections.map((section) => (
              <div key={section.key} className="flex flex-col gap-1">
                <dt className="text-label">{section.title}</dt>
                <dd className="whitespace-pre-line text-small">{section.text}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {canSend && <EacSend studyId={studyId} sentAt={link.sentBackAt} />}
    </section>
  );
}
