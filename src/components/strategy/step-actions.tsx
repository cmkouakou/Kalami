/**
 * =============================================================
 *  Fichier    : step-actions.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Boutons d'une étape ouverte : commencer, valider (propriétaire) et modifier
 *               une étape validée, avec l'avertissement sur les étapes en aval. Les droits
 *               sont revérifiés par les fonctions SQL ; ici on n'affiche que l'utile.
 *               Sur une étape à gabarit, la saisie démarre l'étape et la validation attend
 *               la fin de l'enregistrement.
 *               Le plan (étape 9) a son propre éditeur et ne passe pas par ici.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/actions.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { reopenStep, startStep, validateStep } from "@/lib/strategy/actions";
import type { StepNo, StepStatus, StudyRole } from "@/lib/strategy/steps";

const t = getDictionary();
const s = t.strategy;

type StepActionsProps = {
  studyId: string;
  stepNo: StepNo;
  status: StepStatus;
  role: StudyRole;
  /** Titres des étapes en aval déjà commencées (passeront « à revoir »). */
  affectedTitles: string[];
  /** Étape à gabarit : la première saisie la démarre (pas de bouton « Commencer »). */
  startByEditing?: boolean;
  /** Raison qui empêche de valider pour l'instant (enregistrement en cours…). */
  validateBlocked?: string;
};

/** Actions disponibles sur une étape ouverte, selon son statut et le rôle. */
export function StepActions({
  studyId,
  stepNo,
  status,
  role,
  affectedTitles,
  startByEditing = false,
  validateBlocked,
}: StepActionsProps) {
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const editor = role === "owner" || role === "contributor";

  /** Lance une action serveur et affiche son retour. */
  function run(action: (id: string, no: number) => Promise<FormState>) {
    startTransition(async () => {
      setState(await action(studyId, stepNo));
    });
  }

  if (!editor) return <p className="text-small text-ink-muted">{s.step.readOnly}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {status === "todo" && !startByEditing && (
          <button
            type="button"
            className={BUTTON_PRIMARY}
            disabled={pending}
            onClick={() => run(startStep)}
          >
            {s.step.start}
          </button>
        )}
        {status !== "todo" && status !== "validated" && role === "owner" && (
          <button
            type="button"
            className={BUTTON_PRIMARY}
            disabled={pending || Boolean(validateBlocked)}
            onClick={() => run(validateStep)}
          >
            {s.step.validate}
          </button>
        )}
        {status === "validated" && (
          <button
            type="button"
            className={BUTTON_SECONDARY}
            disabled={pending}
            onClick={() => run(reopenStep)}
          >
            {s.step.reopen}
          </button>
        )}
      </div>

      {status === "validated" && affectedTitles.length > 0 && (
        <p className="text-small text-ink-muted">
          {interpolate(s.step.reopenWarning, { steps: affectedTitles.join(", ") })}
        </p>
      )}
      {validateBlocked && role === "owner" && status !== "validated" && (
        <p className="text-small text-ink-muted">{validateBlocked}</p>
      )}
      {status !== "validated" && role !== "owner" && (
        <p className="text-small text-ink-muted">{s.step.validateOwnerOnly}</p>
      )}
      <FormMessage {...state} />
    </div>
  );
}
