/**
 * =============================================================
 *  Fichier    : formulaire-accord.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Formulaire « Donner l'accès » (v0.29.0) : liste de courriels collée,
 *               cohorte, case « livre associé » et note ; affiche ensuite le rapport
 *               courriel par courriel (accès donné, déjà inscrit, sans compte…).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-actions.ts, components/ui/form.tsx
 * =============================================================
 */

"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
} from "react";

import {
  FormMessage,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/ui/form";
import { BADGE } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { accorderAcces, type StatutAccord } from "@/lib/cours/admin-actions";

const a = getCourseDictionary().admin;

/** Statuts mis en avant (à traiter par l'administrateur). */
const A_SUIVRE: StatutAccord[] = ["no_account", "invalid"];

const BADGE_ALERTE =
  "inline-flex items-center rounded-full bg-danger/10 px-3 py-1 text-caption uppercase " +
  "text-danger";

type FormulaireAccordProps = {
  cohortes: { value: string; label: string }[];
  /** Faux si aucun livre n'est associé au cours : la case est alors désactivée. */
  livreAssocie: boolean;
};

/** Donne l'accès au cours à une liste de courriels. */
export function FormulaireAccord({
  cohortes,
  livreAssocie,
}: FormulaireAccordProps) {
  const [etat, envoyer, enCours] = useActionState(accorderAcces, undefined);
  const formulaire = useRef<HTMLFormElement>(null);

  // Après un envoi réussi, la liste est vidée (le rapport reste affiché)
  useEffect(() => {
    if (etat?.message) {
      const zone = formulaire.current?.elements.namedItem("emails");
      if (zone instanceof HTMLTextAreaElement) zone.value = "";
    }
  }, [etat]);

  /** Envoie sans réinitialiser les autres champs (cohorte, case, note). */
  function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const donnees = new FormData(event.currentTarget);
    startTransition(() => envoyer(donnees));
  }

  const rapport = etat?.rapport ?? [];
  return (
    <form
      ref={formulaire}
      action={envoyer}
      onSubmit={soumettre}
      className="flex flex-col gap-4"
    >
      <TextArea
        label={a.accorder.courriels}
        name="emails"
        rows={6}
        required
        hint={a.accorder.aideCourriels}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={a.accorder.cohorte}
          name="cohort_id"
          options={[{ value: "", label: a.sansCohorte }, ...cohortes]}
        />
        <TextArea
          label={a.accorder.note}
          name="note"
          rows={1}
          maxLength={500}
        />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-body">
        <input
          type="checkbox"
          name="grant_book"
          defaultChecked={livreAssocie}
          disabled={!livreAssocie}
          className="size-5"
        />
        {a.accorder.livre}
      </label>

      <FormMessage error={etat?.error} message={etat?.message} />
      {etat?.ignores && etat.ignores.length > 0 && (
        <p className="text-small text-ink-muted">
          {interpolate(a.accorder.ignores, { liste: etat.ignores.join(", ") })}
        </p>
      )}
      {rapport.length > 0 && (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto text-small">
          {rapport.map((ligne) => (
            <li key={ligne.email} className="flex flex-wrap items-center gap-2">
              <span className="break-all">{ligne.email}</span>
              <span
                className={
                  A_SUIVRE.includes(ligne.status) ? BADGE_ALERTE : BADGE
                }
              >
                {a.accorder.statuts[ligne.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="sm:w-60">
        <SubmitButton pending={enCours}>{a.accorder.envoyer}</SubmitButton>
      </div>
    </form>
  );
}
