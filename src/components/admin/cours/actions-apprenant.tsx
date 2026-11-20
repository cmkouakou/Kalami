/**
 * =============================================================
 *  Fichier    : actions-apprenant.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Actions sur la ligne d'un apprenant (v0.29.0) : changer sa cohorte, et
 *               retirer son accès en deux temps (avec la case « retirer aussi le
 *               livre »), sans boîte de dialogue du navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-actions.ts, components/ui/form.tsx
 * =============================================================
 */

"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/ui/form";
import { CONTROL } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { changerCohorte, retirerAcces } from "@/lib/cours/admin-actions";

const a = getCourseDictionary().admin;
const annuler = getDictionary().admin.common.cancel;

const BOUTON =
  "min-h-11 rounded-md px-3 text-sm font-medium disabled:opacity-60";

// ==================== COHORTE ====================

type ChoixCohorteProps = {
  accessId: string;
  cohorteActuelle: string | null;
  cohortes: { value: string; label: string }[];
  /** Courriel de l'apprenant, pour le libellé accessible. */
  email: string;
};

/** Liste des cohortes et bouton « Changer » pour un apprenant. */
export function ChoixCohorte({
  accessId,
  cohorteActuelle,
  cohortes,
  email,
}: ChoixCohorteProps) {
  const [etat, envoyer, enCours] = useActionState(
    changerCohorte.bind(null, accessId),
    undefined,
  );
  return (
    <form action={envoyer} className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <select
          name="cohort_id"
          defaultValue={cohorteActuelle ?? ""}
          aria-label={`${a.liste.cohorte} : ${email}`}
          className={`${CONTROL} min-w-40`}
        >
          <option value="">{a.sansCohorte}</option>
          {cohortes.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enCours}
          className={`${BOUTON} border border-encre text-encre hover:bg-encre-soft`}
        >
          {a.liste.changer}
        </button>
      </div>
      <FormMessage {...etat} />
    </form>
  );
}

// ==================== RETRAIT ====================

type RetraitAccesProps = {
  accessId: string;
  /** Vrai pour un accès acheté : un rappel s'affiche avant la confirmation. */
  achat: boolean;
};

/** Retrait de l'accès confirmé par un second clic. */
export function RetraitAcces({ accessId, achat }: RetraitAccesProps) {
  const [confirmation, setConfirmation] = useState(false);
  const [etat, envoyer, enCours] = useActionState(
    retirerAcces.bind(null, accessId),
    undefined,
  );

  if (!confirmation) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className={`${BOUTON} w-fit border border-danger text-danger hover:bg-danger/10`}
        >
          {a.liste.retirer}
        </button>
        <FormMessage {...etat} />
      </div>
    );
  }
  return (
    <form action={envoyer} className="flex flex-col gap-2">
      {achat && (
        <p className="text-small text-ink-muted">{a.liste.achatNote}</p>
      )}
      {!achat && (
        <label className="flex min-h-11 items-center gap-2 text-small">
          <input type="checkbox" name="revoke_book" className="size-5" />
          {a.liste.retirerLivre}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enCours}
          className={`${BOUTON} bg-danger text-on-encre hover:opacity-90`}
        >
          {a.liste.confirmer}
        </button>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className={`${BOUTON} border border-line`}
        >
          {annuler}
        </button>
      </div>
      <FormMessage {...etat} />
    </form>
  );
}
