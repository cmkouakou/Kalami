/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/nouvelle)
 *  Projet     : Kalami Stratégie
 *  Description: Création d'une étude (/strategie/nouvelle) : nom de l'entreprise et
 *               question stratégique. Consomme un crédit d'étude ; sans crédit, propose
 *               d'acheter une étude ou un lot (v0.10.2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/strategy/actions.ts, lib/strategy/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { StudyOffers } from "@/components/strategy/study-offers";
import { Field, TextArea } from "@/components/ui/form";
import { BUTTON_TERTIARY, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { createStudy } from "@/lib/strategy/actions";
import { COMPANY_NAME_MAX, QUESTION_MAX } from "@/lib/strategy/profile";
import { countAvailableCredits } from "@/lib/strategy/queries";

const t = getDictionary();
const s = t.strategy;

export const metadata: Metadata = { title: s.create.title };

export default function NewStudyPage() {
  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-h1 font-semibold">{s.create.title}</h1>
        <p className="text-ink-muted">{s.create.intro}</p>
      </header>
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
        <NewStudyForm />
      </Suspense>
    </main>
  );
}

/** Formulaire de création, ou offres d'achat si aucun crédit n'est disponible. */
async function NewStudyForm() {
  const user = await requireUser("/strategie/nouvelle");
  const credits = await countAvailableCredits(user.id);

  if (credits === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className={`${PANEL_SAND} p-4`}>{s.studies.noCredit}</p>
        <StudyOffers />
        <Link href="/strategie" className={`${BUTTON_TERTIARY} self-start`}>
          {s.nav.studies}
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-small text-ink-muted">
        {interpolate(s.studies.credits, { count: String(credits) })}
      </p>
      <ActionForm action={createStudy} submitLabel={s.create.submit}>
        <Field
          name="companyName"
          label={s.create.companyName}
          required
          maxLength={COMPANY_NAME_MAX}
        />
        <TextArea
          name="strategicQuestion"
          label={s.create.question}
          hint={s.create.questionHint}
          rows={3}
          maxLength={QUESTION_MAX}
        />
      </ActionForm>
    </>
  );
}
