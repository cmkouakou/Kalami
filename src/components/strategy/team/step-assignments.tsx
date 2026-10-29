/**
 * =============================================================
 *  Fichier    : step-assignments.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Responsables des étapes sur la page Équipe (S9a). Le propriétaire choisit,
 *               pour chacune des 9 étapes, un membre qui peut la remplir (propriétaire ou
 *               contributeur) ; les autres membres voient la répartition. Indicatif : aucun
 *               droit n'en dépend.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-actions.ts, lib/strategy/steps.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { STEPS, type StepNo } from "@/lib/strategy/steps";
import { canBeAssigned, memberLabel } from "@/lib/strategy/team";
import { assignStep } from "@/lib/strategy/team-actions";
import type { StudyMember } from "@/lib/strategy/team-queries";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const tm = s.team;

type StepAssignmentsProps = {
  studyId: string;
  members: StudyMember[];
  /** Responsable actuel de chaque étape (null = personne). */
  assignees: Record<StepNo, string | null>;
  editable: boolean;
};

/** Tableau des responsables d'étapes. */
export function StepAssignments({ studyId, members, assignees, editable }: StepAssignmentsProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(undefined);
  const assignable = members.filter((member) => canBeAssigned(member.role));
  const names = new Map(members.map((member) => [member.user_id, memberLabel(member)]));

  /**
   * Enregistre le responsable choisi pour une étape.
   * @param stepNo - Étape concernée
   * @param userId - Membre choisi, ou chaîne vide pour personne
   */
  function assign(stepNo: StepNo, userId: string) {
    startTransition(async () => {
      setState(await assignStep(studyId, stepNo, userId));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line">
        {STEPS.map((step) => {
          const current = assignees[step.no] ?? "";
          const label = interpolate(tm.assign.label, { no: String(step.no) });
          return (
            <li
              key={step.no}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium">
                {step.no}. {s.steps[step.no].title}
              </span>
              {editable ? (
                <select
                  aria-label={label}
                  value={current}
                  disabled={pending}
                  onChange={(event) => assign(step.no, event.target.value)}
                  className={`${CONTROL} sm:w-64`}
                >
                  <option value="">{tm.assign.none}</option>
                  {assignable.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {memberLabel(member)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-small text-ink-muted">
                  {(current && names.get(current)) || tm.assign.none}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <FormMessage {...state} />
    </div>
  );
}
