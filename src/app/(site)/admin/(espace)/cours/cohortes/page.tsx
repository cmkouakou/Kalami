/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/cohortes)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Cohortes du cours (v0.29.0) : création, liste avec le nombre
 *               d'apprenants, modification en place et suppression (les apprenants
 *               gardent leur accès, sans cohorte). v0.33.0 : lien vers le calendrier de
 *               diffusion de chaque cohorte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, lib/cours/admin-actions.ts,
 *               components/admin/action-form.tsx, components/admin/delete-button.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { CoursNav } from "@/components/admin/cours/cours-nav";
import { DeleteButton } from "@/components/admin/delete-button";
import { countryName } from "@/components/admin/reader-line";
import { Field, TextArea } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { requireAdmin } from "@/lib/auth/dal";
import {
  enregistrerCohorte,
  supprimerCohorte,
} from "@/lib/cours/admin-actions";
import {
  type Cohorte,
  listerApprenants,
  listerCohortes,
} from "@/lib/cours/admin-queries";
import { DATE_FORMAT } from "@/lib/format/date";

const a = getCourseDictionary().admin;
/** Pastille « Diffusion programmée » à côté du nom de la cohorte. */
const BADGE_PROGRAMMEE =
  "ml-2 rounded-full bg-encre-soft px-2 py-0.5 align-middle font-sans text-caption " +
  "font-normal text-encre";

const c = a.cohortes;

export const metadata: Metadata = { title: c.titre };

export default function AdminCoursCohortesPage() {
  return (
    <main className="flex flex-col gap-8">
      <CoursNav actif="cohortes" titre={c.titre} />
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <Contenu />
      </Suspense>
    </main>
  );
}

// ==================== OUTILS ====================

/**
 * Date d'une colonne « date » (AAAA-MM-JJ), lisible ; « … » si absente.
 * @param jour - Date lue en base
 */
function jourLisible(jour: string | null): string {
  return jour ? DATE_FORMAT.format(new Date(`${jour}T12:00:00Z`)) : "…";
}

// ==================== CONTENU ====================

/** Formulaire de création et liste des cohortes (administrateur aal2). */
async function Contenu() {
  await requireAdmin();
  const [cohortes, apprenants] = await Promise.all([
    listerCohortes(),
    listerApprenants(),
  ]);
  const effectifs = new Map<string, number>();
  for (const ap of apprenants) {
    if (ap.cohort_id)
      effectifs.set(ap.cohort_id, (effectifs.get(ap.cohort_id) ?? 0) + 1);
  }

  return (
    <>
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <h2 className="font-serif text-xl font-semibold">{c.nouvelle}</h2>
        <ActionForm
          action={enregistrerCohorte}
          submitLabel={c.creer}
          resetOnSuccess
        >
          <ChampsCohorte />
        </ActionForm>
      </section>

      <section className="flex flex-col gap-3">
        {cohortes.length === 0 ? (
          <p className="text-ink-muted">{c.aucune}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {cohortes.map((cohorte) => (
              <LigneCohorte
                key={cohorte.id}
                cohorte={cohorte}
                effectif={effectifs.get(cohorte.id) ?? 0}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/**
 * Champs d'une cohorte, vides (création) ou préremplis (modification).
 * @param cohorte - Cohorte modifiée (absente à la création)
 */
function ChampsCohorte({ cohorte }: { cohorte?: Cohorte }) {
  const suffixe = cohorte ? `-${cohorte.id}` : "";
  return (
    <>
      {cohorte && <input type="hidden" name="id" value={cohorte.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`nom${suffixe}`}
          label={c.nom}
          name="name"
          required
          maxLength={120}
          defaultValue={cohorte?.name}
        />
        <Field
          id={`pays${suffixe}`}
          label={c.pays}
          name="country"
          maxLength={2}
          autoCapitalize="characters"
          defaultValue={cohorte?.country ?? ""}
        />
        <Field
          id={`debut${suffixe}`}
          label={c.debut}
          name="starts_on"
          type="date"
          defaultValue={cohorte?.starts_on ?? ""}
        />
        <Field
          id={`fin${suffixe}`}
          label={c.fin}
          name="ends_on"
          type="date"
          defaultValue={cohorte?.ends_on ?? ""}
        />
      </div>
      <TextArea
        id={`note${suffixe}`}
        label={c.note}
        name="note"
        rows={2}
        maxLength={1000}
        defaultValue={cohorte?.note ?? ""}
      />
    </>
  );
}

/** Une cohorte : résumé, modification repliable et suppression. */
function LigneCohorte({
  cohorte,
  effectif,
}: {
  cohorte: Cohorte;
  effectif: number;
}) {
  const datee = cohorte.starts_on || cohorte.ends_on;
  return (
    <li className={`${CARD} flex flex-col gap-3 p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">
          {cohorte.name}
          {cohorte.schedule_enabled && (
            <span className={BADGE_PROGRAMMEE}>
              {c.programmee}
            </span>
          )}
        </h2>
        <span className="text-small text-ink-muted">
          {interpolate(c.apprenants, { n: String(effectif) })}
        </span>
      </div>
      <p className="text-small text-ink-muted">
        {[
          cohorte.country ? countryName(cohorte.country) : null,
          datee
            ? interpolate(c.periode, {
                debut: jourLisible(cohorte.starts_on),
                fin: jourLisible(cohorte.ends_on),
              })
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {cohorte.note && (
        <p className="whitespace-pre-line text-small">{cohorte.note}</p>
      )}
      <Link
        href={`/admin/cours/cohortes/${cohorte.id}`}
        className="min-h-11 self-start py-2 text-encre underline"
      >
        {c.calendrier}
      </Link>
      <details>
        <summary className="min-h-11 cursor-pointer py-2 text-encre underline">
          {c.modifier}
        </summary>
        <div className="flex flex-col gap-4 pt-3">
          <ActionForm action={enregistrerCohorte} submitLabel={c.enregistrer}>
            <ChampsCohorte cohorte={cohorte} />
          </ActionForm>
          <DeleteButton
            action={supprimerCohorte.bind(null, cohorte.id)}
            label={c.supprimer}
          />
        </div>
      </details>
    </li>
  );
}
