/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Administration de l'assistant stratégie : octroi de crédits d'étude et
 *               liste des études (métadonnées seulement, jamais leur contenu), lien vers
 *               le guide des étapes et vers le coach IA. Statut enseignant et liste des
 *               enseignants (S10a).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-16
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/queries.ts,
 *               lib/strategy/class-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/ui/form";
import { BUTTON_TERTIARY, CARD, CONTROL } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { grantStudyCredits, setStrategyTeacher } from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { type AdminTeacherRow, listTeachersForAdmin } from "@/lib/strategy/class-queries";
import { listStudiesForAdmin } from "@/lib/strategy/queries";
import { DATE_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const a = t.strategy.admin;

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
  const [studies, teachers] = await Promise.all([listStudiesForAdmin(), listTeachersForAdmin()]);

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

      {/* ==================== ENSEIGNANTS ==================== */}
      <Teachers teachers={teachers} />

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

/** Statut enseignant (activer ou retirer) et liste des enseignants (S10a). */
function Teachers({ teachers }: { teachers: AdminTeacherRow[] }) {
  const te = a.teachers;
  return (
    <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
      <h2 className="text-xl font-semibold">{te.title}</h2>
      <p className="text-small text-ink-muted">{te.intro}</p>
      <ActionForm action={setStrategyTeacher} submitLabel={te.submit} resetOnSuccess>
        <Field name="email" type="email" label={a.email} required autoComplete="off" />
        <label className="flex flex-col gap-1 text-small font-medium">
          {te.action}
          <select name="action" defaultValue="enable" className={CONTROL}>
            <option value="enable">{te.enable}</option>
            <option value="disable">{te.disable}</option>
          </select>
        </label>
      </ActionForm>
      {teachers.length === 0 ? (
        <p className="text-ink-muted">{te.none}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">{te.columns.email}</th>
                <th className="py-2 pr-4 font-medium">{te.columns.since}</th>
                <th className="py-2 pr-4 font-medium">{te.columns.credits}</th>
                <th className="py-2 font-medium">{te.columns.classes}</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((row) => (
                <tr key={row.user_id} className="border-b border-line">
                  <td className="break-all py-2 pr-4">{row.email}</td>
                  <td className="py-2 pr-4">{DATE_FORMAT.format(new Date(row.created_at))}</td>
                  <td className="py-2 pr-4">{row.credits_available}</td>
                  <td className="py-2">{row.classes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
