/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/prix)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Prix et vente en ligne du cours (v0.29.0) : interrupteur « en vente »,
 *               prix en FCFA, euros et dollars canadiens, et livre associé (donné avec
 *               l'achat et, sur demande, avec un accès accordé).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, lib/cours/admin-actions.ts,
 *               components/admin/action-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { CoursNav } from "@/components/admin/cours/cours-nav";
import { Field, SelectField } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { requireAdmin } from "@/lib/auth/dal";
import { enregistrerReglages } from "@/lib/cours/admin-actions";
import {
  listerLivresChoix,
  lireReglagesCours,
} from "@/lib/cours/admin-queries";
import { DATE_TIME_FORMAT } from "@/lib/format/date";

const p = getCourseDictionary().admin.prix;

export const metadata: Metadata = { title: p.titre };

export default function AdminCoursPrixPage() {
  return (
    <main className="flex flex-col gap-8">
      <CoursNav actif="prix" titre={p.titre} />
      <p className="max-w-3xl text-small text-ink-muted">{p.intro}</p>
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <Formulaire />
      </Suspense>
    </main>
  );
}

// ==================== FORMULAIRE ====================

/** Réglages de vente préremplis (administrateur aal2). */
async function Formulaire() {
  await requireAdmin();
  const [reglages, livres] = await Promise.all([
    lireReglagesCours(),
    listerLivresChoix(),
  ]);
  const montant = (n: number | null) => (n === null ? "" : String(n));

  return (
    <section className={`${CARD} flex flex-col gap-4 p-6`}>
      <ActionForm action={enregistrerReglages} submitLabel={p.enregistrer}>
        <label className="flex min-h-11 items-center gap-3 text-body font-semibold">
          <input
            type="checkbox"
            name="on_sale"
            defaultChecked={reglages.on_sale}
            className="size-5"
          />
          {p.enVente}
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={p.xof}
            name="price_xof"
            inputMode="numeric"
            defaultValue={montant(reglages.price_xof)}
            hint={p.aideDevise}
          />
          <Field
            label={p.eur}
            name="price_eur"
            inputMode="decimal"
            defaultValue={montant(reglages.price_eur)}
          />
          <Field
            label={p.cad}
            name="price_cad"
            inputMode="decimal"
            defaultValue={montant(reglages.price_cad)}
          />
        </div>
        <SelectField
          label={p.livre}
          name="book_id"
          defaultValue={reglages.book_id ?? ""}
          options={[
            { value: "", label: p.aucunLivre },
            ...livres.map((l) => ({ value: l.id, label: l.title })),
          ]}
        />
      </ActionForm>
      {reglages.updated_at && (
        <p className="text-small text-ink-muted">
          {interpolate(p.maj, {
            date: DATE_TIME_FORMAT.format(new Date(reglages.updated_at)),
          })}
        </p>
      )}
    </section>
  );
}
