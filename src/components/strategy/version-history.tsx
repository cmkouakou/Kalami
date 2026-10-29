/**
 * =============================================================
 *  Fichier    : version-history.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Historique des versions d'un gabarit (date, motif, révision) et
 *               restauration après confirmation dans la page (pas de fenêtre du
 *               navigateur). La fonction SQL garde une copie de l'état remplacé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/actions.ts (restoreStepVersion)
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_SECONDARY, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { restoreStepVersion } from "@/lib/strategy/actions";
import type { StepVersion } from "@/lib/strategy/queries";
import { DATE_TIME_FORMAT } from "@/lib/format/date";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const v = tStrategy.template.versions;

type VersionHistoryProps = {
  studyId: string;
  stepNo: number;
  versions: StepVersion[];
  /** Révision courante du gabarit (envoyée avec la restauration). */
  revision: number;
  /** Restauration permise (éditeur, étape non validée). */
  canRestore: boolean;
  /** Une modification attend encore d'être enregistrée. */
  pending: boolean;
};

/** Liste repliable des versions, avec restauration. */
export function VersionHistory({
  studyId,
  stepNo,
  versions,
  revision,
  canRestore,
  pending,
}: VersionHistoryProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ error?: string; message?: string }>({});
  const [busy, startTransition] = useTransition();

  /** Restaure la version choisie puis laisse la page se rafraîchir. */
  function restore(versionId: string) {
    startTransition(async () => {
      const result = await restoreStepVersion(studyId, stepNo, versionId, revision);
      setConfirming(null);
      setMessage(result.ok ? { message: v.restored } : { error: result.error });
    });
  }

  return (
    <details className={`${CARD} p-4`}>
      <summary className="cursor-pointer font-semibold">
        {interpolate(v.title, { count: String(versions.length) })}
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-small text-ink-muted">{versions.length === 0 ? v.none : v.intro}</p>
        {canRestore && pending && versions.length > 0 && (
          <p className="text-small text-ink-muted">{v.dirtyFirst}</p>
        )}
        <ul className="flex flex-col divide-y divide-line">
          {versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
              <span className="text-small">
                {DATE_TIME_FORMAT.format(new Date(version.created_at))} · {v.reasons[version.reason]}
                <span className="text-ink-muted">
                  {" "}· {interpolate(v.revision, { revision: String(version.revision) })}
                </span>
              </span>
              {canRestore && confirming !== version.id && (
                <button
                  type="button"
                  className={BUTTON_TERTIARY}
                  disabled={busy || pending}
                  onClick={() => setConfirming(version.id)}
                >
                  {v.restore}
                </button>
              )}
              {confirming === version.id && (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-small">{v.confirm}</span>
                  <button
                    type="button"
                    className={BUTTON_SECONDARY}
                    disabled={busy || pending}
                    onClick={() => restore(version.id)}
                  >
                    {v.confirmYes}
                  </button>
                  <button
                    type="button"
                    className={BUTTON_TERTIARY}
                    onClick={() => setConfirming(null)}
                  >
                    {v.confirmNo}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <FormMessage {...message} />
      </div>
    </details>
  );
}
