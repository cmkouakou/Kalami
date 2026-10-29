/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie/etapes)
 *  Projet     : Kalami Stratégie
 *  Description: Guide des étapes : choix du livre guide, puis pour chaque étape
 *               l'explication et l'exemple Infosystem fournis par l'auteur, la raison du
 *               verrou et le chapitre du livre guide. Un champ vide n'est pas affiché aux
 *               utilisateurs.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField, TextArea } from "@/components/ui/form";
import { BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { saveStepGuide, setGuideBook } from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { getGuideSettings, listStepGuidesForAdmin } from "@/lib/strategy/queries";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const a = tStrategy.admin;
const g = a.guides;

export const metadata: Metadata = { title: g.title };

export default function AdminStrategyGuidesPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/strategie" className={`${BUTTON_TERTIARY} w-fit`}>
          {g.back}
        </Link>
        <h1 className="font-serif text-3xl font-semibold">{g.title}</h1>
        <p className="text-small text-ink-muted">{g.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminGuides />
      </Suspense>
    </main>
  );
}

/** Livre guide et formulaire de chaque étape (administrateur aal2). */
async function AdminGuides() {
  await requireAdmin();
  const [settings, steps] = await Promise.all([getGuideSettings(), listStepGuidesForAdmin()]);

  return (
    <>
      {/* ==================== LIVRE GUIDE ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
        <h2 className="text-xl font-semibold">{g.bookTitle}</h2>
        <p className="text-small text-ink-muted">{g.bookIntro}</p>
        <ActionForm action={setGuideBook} submitLabel={g.bookSave}>
          <SelectField
            name="bookId"
            label={g.bookTitle}
            defaultValue={settings.guideBookId ?? ""}
            options={[
              { value: "", label: g.bookNone },
              ...settings.books.map((book) => ({ value: book.id, label: book.title })),
            ]}
          />
        </ActionForm>
      </section>

      {/* ==================== ÉTAPES ==================== */}
      {steps.map((step) => {
        const prefix = `etape-${step.step_no}`;
        return (
          <section key={step.step_no} className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
            <h2 className="text-xl font-semibold">
              {interpolate(g.stepTitle, {
                no: String(step.step_no),
                title: tStrategy.steps[step.step_no].title,
              })}
            </h2>
            <ActionForm action={saveStepGuide} submitLabel={g.save}>
              <input type="hidden" name="stepNo" value={step.step_no} />
              <TextArea
                id={`${prefix}-explication`}
                name="explanation"
                label={g.explanation}
                defaultValue={step.explanation}
                maxLength={5000}
                rows={6}
              />
              <TextArea
                id={`${prefix}-exemple`}
                name="example"
                label={g.example}
                defaultValue={step.example}
                maxLength={5000}
                rows={6}
              />
              <TextArea
                id={`${prefix}-verrou`}
                name="lockReason"
                label={g.lockReason}
                defaultValue={step.lock_reason}
                maxLength={500}
                rows={2}
              />
              <Field
                id={`${prefix}-chapitre`}
                name="chapter"
                type="number"
                label={g.chapter}
                min={1}
                max={1000}
                defaultValue={step.chapter_position ?? ""}
              />
            </ActionForm>
          </section>
        );
      })}
    </>
  );
}
