/**
 * =============================================================
 *  Fichier    : student-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Étudiants inscrits à une classe (S10a, enseignant) : nom, courriel, date
 *               d'inscription et nombre d'études ; « Retirer » est confirmé par un second
 *               clic et ne touche pas aux études.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, lib/strategy/team.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { removeStudent } from "@/lib/strategy/class-actions";
import type { ClassStudent } from "@/lib/strategy/classes";
import { memberLabel } from "@/lib/strategy/team";
import { DATE_FORMAT } from "@/lib/format/date";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const cl = s.classes;

/** Liste des étudiants avec retrait confirmé. */
export function StudentList({ classId, students }: { classId: string; students: ClassStudent[] }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [state, setState] = useState<FormState>(undefined);

  /**
   * Retire un étudiant et garde le résultat.
   * @param userId - Étudiant retiré
   */
  function remove(userId: string) {
    setConfirming(null);
    startTransition(async () => {
      setState(await removeStudent(classId, userId));
    });
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-small text-ink-muted">{cl.students.none}</p>
        <FormMessage {...state} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line">
        {students.map((student) => {
          const name = memberLabel(student);
          return (
            <li key={student.user_id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">
                    {student.display_name ?? s.team.members.noName}
                  </span>
                  <span className="break-all text-small text-ink-muted">{student.email}</span>
                  <span className="text-caption text-ink-muted">
                    {interpolate(cl.students.joined, {
                      date: DATE_FORMAT.format(new Date(student.joined_at)),
                    })}
                  </span>
                </span>
                <span className={`${BADGE} w-fit`}>
                  {interpolate(cl.students.studies, { count: String(student.studies) })}
                </span>
              </div>
              {confirming === student.user_id ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-small">
                    {interpolate(cl.students.removeConfirm, { name })}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    className={`${BUTTON_SECONDARY} border-danger text-danger`}
                    onClick={() => remove(student.user_id)}
                  >
                    {cl.students.remove}
                  </button>
                  <button
                    type="button"
                    className={BUTTON_TERTIARY}
                    onClick={() => setConfirming(null)}
                  >
                    {s.team.cancel}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className={`${BUTTON_TERTIARY} w-fit text-danger`}
                  onClick={() => setConfirming(student.user_id)}
                >
                  {cl.students.remove}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <FormMessage {...state} />
    </div>
  );
}
