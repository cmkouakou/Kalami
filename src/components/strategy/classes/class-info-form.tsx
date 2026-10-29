/**
 * =============================================================
 *  Fichier    : class-info-form.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Description d'une classe (S10a) : nom, établissement, session et date de
 *               remise indicative. Sert à la création (sans classe) et aux réglages.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-actions.ts, lib/strategy/classes.ts
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { createClass, updateClassInfo } from "@/lib/strategy/class-actions";
import {
  CLASS_NAME_MAX,
  type ClassRow,
  INSTITUTION_MAX,
  TERM_MAX,
} from "@/lib/strategy/classes";
import { getStrategyDictionary } from "@/i18n/strategy";

const cl = getStrategyDictionary().classes;

type ClassInfoFormProps = {
  /** Classe à modifier ; absente pour une création. */
  current?: Pick<ClassRow, "id" | "name" | "institution" | "term" | "due_date">;
};

/** Formulaire de création ou de modification d'une classe. */
export function ClassInfoForm({ current }: ClassInfoFormProps) {
  const [state, action] = useActionState(
    current ? updateClassInfo.bind(null, current.id) : createClass,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label={cl.create.name}
        name="name"
        required
        maxLength={CLASS_NAME_MAX}
        placeholder={cl.create.namePlaceholder}
        defaultValue={current?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={cl.create.institution}
          name="institution"
          maxLength={INSTITUTION_MAX}
          defaultValue={current?.institution}
        />
        <Field
          label={cl.create.term}
          name="term"
          maxLength={TERM_MAX}
          placeholder={cl.create.termPlaceholder}
          defaultValue={current?.term}
        />
      </div>
      <Field
        label={cl.create.dueDate}
        name="due_date"
        type="date"
        hint={cl.create.dueHelp}
        defaultValue={current?.due_date ?? ""}
      />
      <FormMessage error={state?.error} message={state?.message} />
      <div>
        <SubmitButton>{current ? cl.settings.save : cl.create.submit}</SubmitButton>
      </div>
    </form>
  );
}
