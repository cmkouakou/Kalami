/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie/coach/regles)
 *  Projet     : Kalami Stratégie
 *  Description: Erreurs classiques signalées par le coach IA : modification du titre, de
 *               l'étape, de l'ordre, de l'activation et de l'explication selon le livre,
 *               création d'une erreur (code définitif), historique des états précédents.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/coach/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField, TextArea } from "@/components/ui/form";
import { BADGE, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { saveCoachRule } from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { listCoachRulesForAdmin, type CoachRuleAdmin } from "@/lib/strategy/coach/queries";
import { STEPS, type StepNo } from "@/lib/strategy/steps";

const t = getDictionary();
const r = t.strategy.admin.coachRules;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Choix de l'étape : générale ou une des étapes. */
const STEP_OPTIONS = [
  { value: "", label: r.general },
  ...STEPS.map(({ no }) => ({
    value: String(no),
    label: `${interpolate(r.stepLabel, { no: String(no) })} · ${t.strategy.steps[no].title}`,
  })),
];

export const metadata: Metadata = { title: r.title };

/** Libellé court de l'étape d'une règle. */
function stepLabel(stepNo: StepNo | null): string {
  return stepNo === null ? r.general : interpolate(r.stepLabel, { no: String(stepNo) });
}

// ==================== PAGE ====================

export default function AdminCoachRulesPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{r.title}</h1>
        <Link href="/admin/strategie/coach" className={BUTTON_TERTIARY}>
          {r.back}
        </Link>
      </div>
      <p className="text-small text-ink-muted">{r.intro}</p>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminCoachRules />
      </Suspense>
    </main>
  );
}

/** Liste des erreurs classiques et formulaire de création (administrateur aal2). */
async function AdminCoachRules() {
  await requireAdmin();
  const rules = await listCoachRulesForAdmin();

  return (
    <>
      {rules.map((rule) => <RuleSection key={rule.id} rule={rule} />)}

      {/* ==================== NOUVELLE ERREUR ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
        <h2 className="text-xl font-semibold">{r.newTitle}</h2>
        <ActionForm action={saveCoachRule} submitLabel={r.create} resetOnSuccess>
          <Field
            id="nouvelle-code"
            name="code"
            label={r.code}
            hint={r.codeHint}
            pattern="[a-z0-9_]{2,60}"
            autoComplete="off"
            required
          />
          <RuleFields id="nouvelle" rule={null} nextPosition={rules.length + 1} />
        </ActionForm>
      </section>
    </>
  );
}

// ==================== SOUS-COMPOSANTS ====================

/** Une erreur classique : formulaire et historique. */
function RuleSection({ rule }: { rule: CoachRuleAdmin }) {
  return (
    <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{rule.title}</h2>
        <span className={BADGE}>{rule.active ? r.active : r.inactive}</span>
      </div>
      <p className="text-small text-ink-muted">
        {r.code} : <code>{rule.code}</code> · {stepLabel(rule.stepNo)}
      </p>
      {!rule.bookExplanation && <p className="text-small text-warning">{r.emptyExplanation}</p>}

      <ActionForm action={saveCoachRule} submitLabel={r.save}>
        <input type="hidden" name="id" value={rule.id} />
        <RuleFields id={rule.code} rule={rule} nextPosition={rule.position} />
      </ActionForm>

      {rule.history.length > 0 && (
        <details className="border-t border-line pt-4">
          <summary className="cursor-pointer text-small font-medium">
            {interpolate(r.history, { count: String(rule.history.length) })}
          </summary>
          <ol className="mt-3 flex flex-col divide-y divide-line text-small">
            {rule.history.map((version, index) => (
              <li key={index} className="flex flex-col gap-1 py-2">
                <p className="text-ink-muted">
                  {interpolate(r.changedAt, {
                    date: DATE_FORMAT.format(new Date(version.changedAt)),
                  })}
                  {" · "}
                  {stepLabel(version.stepNo)} · {r.position} {version.position} ·{" "}
                  {version.active ? r.active : r.inactive}
                </p>
                <p className="font-medium">{version.title}</p>
                {version.bookExplanation && (
                  <p className="whitespace-pre-wrap">{version.bookExplanation}</p>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

type RuleFieldsProps = {
  /** Préfixe unique des identifiants de champs. */
  id: string;
  rule: CoachRuleAdmin | null;
  nextPosition: number;
};

/** Champs modifiables d'une erreur classique (le code n'en fait pas partie). */
function RuleFields({ id, rule, nextPosition }: RuleFieldsProps) {
  return (
    <>
      <Field
        id={`${id}-title`}
        name="title"
        label={r.ruleTitle}
        maxLength={300}
        defaultValue={rule?.title ?? ""}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id={`${id}-step`}
          name="stepNo"
          label={r.step}
          options={STEP_OPTIONS}
          defaultValue={rule?.stepNo === null || !rule ? "" : String(rule.stepNo)}
        />
        <Field
          id={`${id}-position`}
          name="position"
          type="number"
          label={r.position}
          min={0}
          max={1000}
          defaultValue={nextPosition}
          required
        />
      </div>
      <TextArea
        id={`${id}-explanation`}
        name="explanation"
        label={r.explanation}
        rows={4}
        maxLength={5000}
        defaultValue={rule?.bookExplanation ?? ""}
      />
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={rule?.active ?? true}
          className="size-5"
        />
        {r.active}
      </label>
    </>
  );
}
