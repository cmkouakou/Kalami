/**
 * =============================================================
 *  Fichier    : profile-form.tsx
 *  Projet     : Kalami
 *  Description: Formulaire de profil (composant client).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/account/actions.ts, components/ui/form.tsx
 * =============================================================
 */

"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { updateProfile } from "@/lib/account/actions";

const t = getDictionary();

type ProfileFormProps = {
  displayName: string | null;
  preferredCurrency: string | null;
};

/** Modification du nom affiché et de la devise préférée. */
export function ProfileForm({ displayName, preferredCurrency }: ProfileFormProps) {
  const [state, action] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label={t.auth.displayName}
        name="display_name"
        defaultValue={displayName ?? ""}
        maxLength={120}
        autoComplete="name"
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="champ-devise" className="text-sm font-medium">
          {t.account.currency}
        </label>
        <select
          id="champ-devise"
          name="preferred_currency"
          defaultValue={preferredCurrency ?? ""}
          className="min-h-11 rounded-md border border-bordure bg-surface px-3"
        >
          <option value="">{t.account.currencyAuto}</option>
          <option value="XOF">FCFA (XOF)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="CAD">Dollar canadien (CAD)</option>
        </select>
      </div>
      <FormMessage {...state} />
      <SubmitButton>{t.account.save}</SubmitButton>
    </form>
  );
}
