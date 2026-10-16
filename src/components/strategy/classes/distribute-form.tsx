/**
 * =============================================================
 *  Fichier    : distribute-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Distribution d'une étude (S10a, enseignant) : entreprise ou cas étudié,
 *               question stratégique, puis répartition — une étude par étudiant coché, ou
 *               des équipes formées à la main (6 au plus, le premier de la liste
 *               propriétaire). Le résumé indique le nombre d'études et de crédits.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, lib/strategy/classes.ts
 * =============================================================
 */

"use client";

import { useActionState, useMemo, useState } from "react";

import { Field, FormMessage, TextArea } from "@/components/ui/form";
import {
  BUTTON_PRIMARY,
  BUTTON_TERTIARY,
  CONTROL,
  PILL,
  PILL_ACTIVE,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { distributeStudies } from "@/lib/strategy/class-actions";
import {
  type ClassStudent,
  COMPANY_MAX,
  GROUP_MAX,
  individualGroups,
  QUESTION_MAX,
  teamGroups,
} from "@/lib/strategy/classes";
import { memberLabel } from "@/lib/strategy/team";

const cl = getDictionary().strategy.classes;
const d = cl.distribute;

type Mode = "individual" | "teams";

type DistributeFormProps = {
  classId: string;
  students: ClassStudent[];
  credits: number;
};

/** Formulaire de distribution d'une étude. */
export function DistributeForm({ classId, students, credits }: DistributeFormProps) {
  const [state, action, isPending] = useActionState(
    distributeStudies.bind(null, classId),
    undefined,
  );
  const [mode, setMode] = useState<Mode>("individual");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [teams, setTeams] = useState<Record<string, number>>({});

  const ids = useMemo(() => students.map((student) => student.user_id), [students]);
  const names = useMemo(
    () => new Map(students.map((student) => [student.user_id, memberLabel(student)])),
    [students],
  );
  const groups = useMemo(
    () => (mode === "individual"
      ? individualGroups(ids.filter((id) => selected.has(id)))
      : teamGroups(ids, teams)),
    [mode, ids, selected, teams],
  );
  const tooLarge = groups.some((group) => group.length > GROUP_MAX);
  const blocked = groups.length === 0 || tooLarge || groups.length > credits;

  /**
   * Coche ou décoche un étudiant (une étude par étudiant).
   * @param id - Étudiant
   */
  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (students.length === 0) {
    return <p className="text-small text-ink-muted">{d.noStudents}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-small text-ink-muted">{d.intro}</p>
      <Field label={d.company} name="company_name" required maxLength={COMPANY_MAX} />
      <TextArea label={d.question} name="question" rows={3} maxLength={QUESTION_MAX} />

      {/* ==================== RÉPARTITION ==================== */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-label font-medium">{d.mode}</legend>
        <div className="flex flex-wrap gap-2">
          {(["individual", "teams"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              className={mode === value ? PILL_ACTIVE : PILL}
              onClick={() => setMode(value)}
            >
              {d[value]}
            </button>
          ))}
        </div>

        {mode === "individual" ? (
          <div className="flex flex-col gap-2">
            <span className="flex flex-wrap gap-2">
              <button
                type="button"
                className={BUTTON_TERTIARY}
                onClick={() => setSelected(new Set(ids))}
              >
                {d.selectAll}
              </button>
              <button
                type="button"
                className={BUTTON_TERTIARY}
                onClick={() => setSelected(new Set())}
              >
                {d.selectNone}
              </button>
            </span>
            <ul className="grid gap-2 sm:grid-cols-2">
              {students.map((student) => (
                <li key={student.user_id}>
                  <label className="flex min-h-11 items-center gap-3 text-small">
                    <input
                      type="checkbox"
                      className="size-5"
                      checked={selected.has(student.user_id)}
                      onChange={() => toggle(student.user_id)}
                    />
                    <span className="break-all">{names.get(student.user_id)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-small text-ink-muted">{d.teamsHelp}</p>
            <ul className="flex flex-col gap-2">
              {students.map((student) => (
                <li
                  key={student.user_id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="break-all text-small">{names.get(student.user_id)}</span>
                  <select
                    aria-label={names.get(student.user_id)}
                    value={teams[student.user_id] ?? 0}
                    onChange={(event) => setTeams((current) => ({
                      ...current,
                      [student.user_id]: Number(event.target.value),
                    }))}
                    className={`${CONTROL} sm:w-48`}
                  >
                    <option value={0}>{d.teamNone}</option>
                    {students.map((_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {interpolate(d.teamNumber, { no: String(index + 1) })}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            {groups.length > 0 && (
              <ul className="flex flex-col gap-1 text-small text-ink-muted">
                {groups.map((group) => (
                  <li key={group[0]}>
                    {interpolate(d.teamOf, { name: names.get(group[0]) ?? "" })}
                    {" : "}
                    {group.map((id) => names.get(id)).join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </fieldset>

      <input type="hidden" name="groups" value={JSON.stringify(groups)} />
      <p className="text-small">
        {interpolate(d.summary, { studies: String(groups.length), credits: String(credits) })}
      </p>
      {tooLarge && <p role="alert" className="text-small text-danger">{d.teamTooLarge}</p>}
      {groups.length > credits && (
        <p role="alert" className="text-small text-danger">{cl.errors.not_enough_credits}</p>
      )}
      <FormMessage error={state?.error} message={state?.message} />
      <div>
        <button
          type="submit"
          disabled={blocked || isPending}
          aria-busy={isPending}
          className={`${BUTTON_PRIMARY} disabled:opacity-60`}
        >
          {isPending ? d.distributing : d.submit}
        </button>
      </div>
    </form>
  );
}
