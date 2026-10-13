/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Administration de l'assistant stratégie : octroi de crédits d'étude et
 *               liste des études (métadonnées seulement, jamais leur contenu), lien vers
 *               le guide des étapes et vers le coach IA.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-13
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/ui/form";
import { BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { grantStudyCredits } from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { listStudiesForAdmin } from "@/lib/strategy/queries";

const t = getDictionary();
const a = t.strategy.admin;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const metadata: Metadata = { title: a.title };

export default function AdminStrategyPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{a.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/strategie/etapes" className={BUTTON_TERTIARY}>
            {a.guides.link}
          </Link>
          <Link href="/admin/strategie/coach" className={BUTTON_TERTIARY}>
            {a.coach.link}
          </Link>
        </div>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminStrategy />
      </Suspense>
    </main>
  );
}

/** Formulaire d'octroi et tableau des études (administrateur aal2). */
async function AdminStrategy() {
  await requireAdmin();
  const studies = await listStudiesForAdmin();

  return (
    <>
      {/* ==================== CRÉDITS ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
        <h2 className="text-xl font-semibold">{a.grantTitle}</h2>
        <p className="text-small text-ink-muted">{a.grantIntro}</p>
        <ActionForm action={grantStudyCredits} submitLabel={a.grant} resetOnSuccess>
          <Field name="email" type="email" label={a.email} required autoComplete="off" />
          <Field
            name="quantity"
            type="number"
            label={a.quantity}
            min={1}
            max={100}
            defaultValue={1}
            required
          />
          <Field name="note" label={a.note} maxLength={500} />
        </ActionForm>
      </section>

      {/* ==================== ÉTUDES ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{a.studiesTitle}</h2>
        {studies.length === 0 ? (
          <p className="text-ink-muted">{a.noStudies}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">{a.columns.company}</th>
                  <th className="py-2 pr-4 font-medium">{a.columns.owner}</th>
                  <th className="py-2 pr-4 font-medium">{a.columns.created}</th>
                  <th className="py-2 pr-4 font-medium">{a.columns.updated}</th>
                  <th className="py-2 font-medium">{a.columns.progress}</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => (
                  <tr key={study.id} className="border-b border-line">
                    <td className="py-2 pr-4">{study.company_name}</td>
                    <td className="py-2 pr-4">{study.owner_email ?? "—"}</td>
                    <td className="py-2 pr-4">{DATE_FORMAT.format(new Date(study.created_at))}</td>
                    <td className="py-2 pr-4">{DATE_FORMAT.format(new Date(study.updated_at))}</td>
                    <td className="py-2">{study.validated_steps} / 9</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
