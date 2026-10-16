/**
 * =============================================================
 *  Fichier    : class-coach-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Réglages du coach d'une classe (S10a, enseignant) : étapes 1 à 8 où le
 *               coach est coupé, et plafond d'IA par étude propre à la classe (vide : le
 *               plafond général s'applique).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, lib/strategy/classes.ts
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { getDictionary, interpolate } from "@/i18n";
import { updateClassCoach } from "@/lib/strategy/class-actions";
import { type ClassRow, COACH_STEPS } from "@/lib/strategy/classes";

const s = getDictionary().strategy;
const st = s.classes.settings;

type ClassCoachFormProps = {
  current: Pick<ClassRow, "id" | "coach_disabled_steps" | "study_budget_usd">;
};

/** Formulaire des réglages du coach. */
export function ClassCoachForm({ current }: ClassCoachFormProps) {
  const [state, action] = useActionState(updateClassCoach.bind(null, current.id), undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-small text-ink-muted">{st.coachIntro}</legend>
        {COACH_STEPS.map((no) => (
          <label key={no} className="flex min-h-11 items-center gap-3 text-small">
            <input
              type="checkbox"
              name="coach_steps"
              value={no}
              className="size-5"
              defaultChecked={current.coach_disabled_steps.includes(no)}
            />
            {interpolate(st.coachStep, { no: String(no), title: s.steps[no].title })}
          </label>
        ))}
      </fieldset>
      <Field
        label={st.budget}
        name="study_budget"
        inputMode="decimal"
        hint={st.budgetHelp}
        defaultValue={current.study_budget_usd === null ? "" : String(current.study_budget_usd)}
      />
      <FormMessage error={state?.error} message={state?.message} />
      <div className="sm:w-64">
        <SubmitButton>{st.save}</SubmitButton>
      </div>
    </form>
  );
}
