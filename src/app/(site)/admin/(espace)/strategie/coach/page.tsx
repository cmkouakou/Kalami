/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie/coach)
 *  Projet     : Kalami Stratégie
 *  Description: Administration du coach IA : réglages (activation, modèle, prix par million
 *               de jetons, plafond par étude, débit), supplément de plafond pour une étude
 *               et consommation par étude (chiffres seulement, jamais le contenu). Liens
 *               vers les consignes et les erreurs classiques.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-13
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/coach/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { grantCoachAllowance, saveCoachSettings } from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { getCoachSettings, listCoachUsageForAdmin } from "@/lib/strategy/coach/queries";
import { listStudiesForAdmin } from "@/lib/strategy/queries";

const t = getDictionary();
const c = t.strategy.admin.coach;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const MONEY_FORMAT = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const metadata: Metadata = { title: c.title };

export default function AdminCoachPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{c.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/strategie/coach/consignes" className={BUTTON_TERTIARY}>
            {c.promptsLink}
          </Link>
          <Link href="/admin/strategie/coach/regles" className={BUTTON_TERTIARY}>
            {c.rulesLink}
          </Link>
          <Link href="/admin/strategie" className={BUTTON_TERTIARY}>
            {c.back}
          </Link>
        </div>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminCoach />
      </Suspense>
    </main>
  );
}

/** Réglages, supplément et consommation (administrateur aal2). */
async function AdminCoach() {
  await requireAdmin();
  const [settings, usage, studies] = await Promise.all([
    getCoachSettings(),
    listCoachUsageForAdmin(),
    listStudiesForAdmin(),
  ]);

  return (
    <>
      {/* ==================== RÉGLAGES ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
        <h2 className="text-xl font-semibold">{c.settingsTitle}</h2>
        <p className="text-small text-ink-muted">{c.settingsIntro}</p>
        <ActionForm action={saveCoachSettings} submitLabel={c.save}>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="size-5"
            />
            {c.enabled}
          </label>
          <Field
            name="model"
            label={c.model}
            defaultValue={settings.model}
            required
            autoComplete="off"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="inputPrice"
              type="number"
              label={c.inputPrice}
              min={0}
              step="0.0001"
              defaultValue={settings.inputPrice}
              required
            />
            <Field
              name="outputPrice"
              type="number"
              label={c.outputPrice}
              min={0}
              step="0.0001"
              defaultValue={settings.outputPrice}
              required
            />
            <Field
              name="budget"
              type="number"
              label={c.budget}
              min={0.01}
              step="0.01"
              defaultValue={settings.budget}
              required
            />
            <Field
              name="rateLimit"
              type="number"
              label={c.rateLimit}
              min={1}
              max={100}
              defaultValue={settings.rateLimit}
              required
            />
            <Field
              name="rateWindow"
              type="number"
              label={c.rateWindow}
              min={1}
              max={1440}
              defaultValue={settings.rateWindow}
              required
            />
          </div>
        </ActionForm>
      </section>

      {/* ==================== SUPPLÉMENT ==================== */}
      {studies.length > 0 && (
        <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
          <h2 className="text-xl font-semibold">{c.allowanceTitle}</h2>
          <p className="text-small text-ink-muted">{c.allowanceIntro}</p>
          <ActionForm action={grantCoachAllowance} submitLabel={c.grant} resetOnSuccess>
            <SelectField
              name="studyId"
              label={c.study}
              options={studies.map((study) => ({
                value: study.id,
                label: `${study.company_name} — ${study.owner_email ?? "—"}`,
              }))}
              required
            />
            <Field
              name="amount"
              type="number"
              label={c.amount}
              min={0.01}
              max={1000}
              step="0.01"
              required
            />
            <Field name="note" label={c.note} maxLength={500} />
          </ActionForm>
        </section>
      )}

      {/* ==================== CONSOMMATION ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{c.usageTitle}</h2>
        <p className="text-small text-ink-muted">{c.usageIntro}</p>
        {usage.length === 0 ? (
          <p className="text-ink-muted">{c.noUsage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">{c.columns.company}</th>
                  <th className="py-2 pr-4 font-medium">{c.columns.owner}</th>
                  <th className="py-2 pr-4 font-medium">{c.columns.requests}</th>
                  <th className="py-2 pr-4 font-medium">{c.columns.spent}</th>
                  <th className="py-2 pr-4 font-medium">{c.columns.budget}</th>
                  <th className="py-2 font-medium">{c.columns.last}</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.study_id} className="border-b border-line">
                    <td className="py-2 pr-4">{row.company_name}</td>
                    <td className="py-2 pr-4">{row.owner_email ?? "—"}</td>
                    <td className="py-2 pr-4">{row.requests}</td>
                    <td className="py-2 pr-4">{MONEY_FORMAT.format(row.spent)}</td>
                    <td className="py-2 pr-4">{MONEY_FORMAT.format(row.budget)}</td>
                    <td className="py-2">{DATE_FORMAT.format(new Date(row.last_at))}</td>
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
