/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie/coach/consignes)
 *  Projet     : Kalami Stratégie
 *  Description: Versions des consignes du coach IA, par fonction (relecture, questions,
 *               évaluation, recherche, analyse des documents joints) et par étape : version
 *               en vigueur, brouillon modifiable et comparé ligne à ligne à la version en
 *               vigueur, publication ou abandon du brouillon, anciennes versions restaurables
 *               comme brouillon. L'analyse des documents n'a qu'une consigne générale.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-14
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/coach (queries, diff)
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea } from "@/components/ui/form";
import { BADGE, BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  discardCoachPromptDraft,
  publishCoachPrompt,
  restoreCoachPrompt,
  saveCoachPromptDraft,
} from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { PROMPT_FUNCTIONS, type PromptFunction } from "@/lib/strategy/coach/context";
import { diffLines, hasChanges } from "@/lib/strategy/coach/diff";
import { listCoachPromptsForAdmin, type CoachPromptVersion } from "@/lib/strategy/coach/queries";
import type { StepNo } from "@/lib/strategy/steps";
import { DATE_TIME_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const p = t.strategy.admin.coachPrompts;

export const metadata: Metadata = { title: p.title };

/** Consigne d'une fonction pour une étape (ou générale), avec toutes ses versions. */
type PromptGroup = {
  key: string;
  fn: PromptFunction;
  stepNo: StepNo | null;
  current: CoachPromptVersion | null;
  draft: CoachPromptVersion | null;
  archived: CoachPromptVersion[];
};

// ==================== REGROUPEMENT ====================

/**
 * Regroupe les versions par fonction et par étape. Chaque fonction a au moins son groupe
 * général, pour pouvoir y créer un premier brouillon.
 * @param versions - Versions triées de la plus récente à la plus ancienne
 */
function groupPrompts(versions: readonly CoachPromptVersion[]): PromptGroup[] {
  const groups = new Map<string, PromptGroup>();
  const ensure = (fn: PromptFunction, stepNo: StepNo | null): PromptGroup => {
    const key = `${fn}-${stepNo ?? "general"}`;
    const group = groups.get(key)
      ?? { key, fn, stepNo, current: null, draft: null, archived: [] };
    groups.set(key, group);
    return group;
  };

  for (const fn of PROMPT_FUNCTIONS) ensure(fn, null);
  for (const version of versions) {
    const group = ensure(version.fn, version.stepNo);
    if (version.publishedAt === null) group.draft = version;
    else if (group.current === null) group.current = version;
    else group.archived.push(version);
  }

  return [...groups.values()].sort((a, b) =>
    PROMPT_FUNCTIONS.indexOf(a.fn) - PROMPT_FUNCTIONS.indexOf(b.fn)
    || (a.stepNo ?? 0) - (b.stepNo ?? 0));
}

// ==================== PAGE ====================

export default function AdminCoachPromptsPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{p.title}</h1>
        <Link href="/admin/strategie/coach" className={BUTTON_TERTIARY}>
          {p.back}
        </Link>
      </div>
      <p className="text-small text-ink-muted">{p.intro}</p>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminCoachPrompts />
      </Suspense>
    </main>
  );
}

/** Liste des consignes (administrateur aal2). */
async function AdminCoachPrompts() {
  await requireAdmin();
  const groups = groupPrompts(await listCoachPromptsForAdmin());
  return (
    <>
      {groups.map((group) => <PromptSection key={group.key} group={group} />)}
    </>
  );
}

// ==================== SOUS-COMPOSANTS ====================

/** Une consigne : version en vigueur, brouillon et anciennes versions. */
function PromptSection({ group }: { group: PromptGroup }) {
  const { key, fn, stepNo, current, draft, archived } = group;
  let scope = stepNo === null ? p.general : interpolate(p.stepLabel, { no: String(stepNo) });
  if (fn === "extract") scope = p.profileScope;

  return (
    <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
      <h2 className="text-xl font-semibold">
        {p.functions[fn]} · {scope}
      </h2>

      {/* ==================== VERSION EN VIGUEUR ==================== */}
      {current ? (
        <details className="flex flex-col gap-2">
          <summary className="cursor-pointer text-small">
            <span className={BADGE}>{p.status.current}</span>{" "}
            {interpolate(p.version, { version: String(current.version) })} ·{" "}
            {current.publishedAt && interpolate(p.publishedAt, {
              date: DATE_TIME_FORMAT.format(new Date(current.publishedAt)),
            })}
          </summary>
          {current.note && <p className="mt-2 text-small text-ink-muted">{current.note}</p>}
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-sand p-3 text-small">
            {current.body}
          </pre>
        </details>
      ) : (
        <p className="text-small text-warning">{p.none}</p>
      )}

      {/* ==================== BROUILLON ==================== */}
      {draft ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <p className="text-small">
            <span className={BADGE}>{p.status.draft}</span>{" "}
            {interpolate(p.version, { version: String(draft.version) })} ·{" "}
            {interpolate(p.createdAt, { date: DATE_TIME_FORMAT.format(new Date(draft.createdAt)) })}
          </p>
          <DraftForm
            key={`${draft.id}-${draft.createdAt}`}
            id={key}
            fn={fn}
            stepNo={stepNo}
            body={draft.body}
            note={draft.note ?? ""}
          />
          <PromptDiff before={current?.body ?? null} after={draft.body} />
          <div className="flex flex-wrap gap-4">
            <ActionForm action={publishCoachPrompt} submitLabel={p.publish}>
              <input type="hidden" name="id" value={draft.id} />
            </ActionForm>
            <ActionForm action={discardCoachPromptDraft} submitLabel={p.discard}>
              <input type="hidden" name="id" value={draft.id} />
            </ActionForm>
          </div>
        </div>
      ) : (
        <details className="border-t border-line pt-4">
          <summary className="cursor-pointer text-small font-medium">{p.newDraft}</summary>
          <p className="mt-2 text-small text-ink-muted">{p.newDraftHint}</p>
          <div className="mt-3">
            <DraftForm id={key} fn={fn} stepNo={stepNo} body={current?.body ?? ""} note="" />
          </div>
        </details>
      )}

      {/* ==================== ANCIENNES VERSIONS ==================== */}
      {archived.length > 0 && (
        <details className="border-t border-line pt-4">
          <summary className="cursor-pointer text-small font-medium">
            {interpolate(p.history, { count: String(archived.length) })}
          </summary>
          <ol className="mt-3 flex flex-col divide-y divide-line">
            {archived.map((version) => (
              <li key={version.id} className="flex flex-col gap-2 py-3">
                <p className="text-small">
                  <span className={BADGE}>{p.status.archived}</span>{" "}
                  {interpolate(p.version, { version: String(version.version) })}
                  {version.publishedAt && ` · ${interpolate(p.publishedAt, {
                    date: DATE_TIME_FORMAT.format(new Date(version.publishedAt)),
                  })}`}
                </p>
                {version.note && <p className="text-small text-ink-muted">{version.note}</p>}
                <details>
                  <summary className="cursor-pointer text-small">{p.show}</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-sand p-3 text-small">
                    {version.body}
                  </pre>
                </details>
                <ActionForm action={restoreCoachPrompt} submitLabel={p.restore}>
                  <input type="hidden" name="id" value={version.id} />
                </ActionForm>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

type DraftFormProps = {
  /** Préfixe unique des identifiants de champs. */
  id: string;
  fn: PromptFunction;
  stepNo: StepNo | null;
  body: string;
  note: string;
};

/** Formulaire d'enregistrement du brouillon (rien n'est publié). */
function DraftForm({ id, fn, stepNo, body, note }: DraftFormProps) {
  return (
    <ActionForm action={saveCoachPromptDraft} submitLabel={p.saveDraft}>
      <input type="hidden" name="fn" value={fn} />
      <input type="hidden" name="stepNo" value={stepNo ?? ""} />
      <TextArea
        id={`${id}-body`}
        name="body"
        label={p.body}
        rows={16}
        maxLength={20000}
        defaultValue={body}
        required
      />
      <Field id={`${id}-note`} name="note" label={p.note} maxLength={500} defaultValue={note} />
    </ActionForm>
  );
}

/** Comparaison ligne à ligne du brouillon avec la version en vigueur. */
function PromptDiff({ before, after }: { before: string | null; after: string }) {
  if (before === null) return <p className="text-small text-ink-muted">{p.allNew}</p>;
  const lines = diffLines(before, after);
  if (!hasChanges(lines)) return <p className="text-small text-ink-muted">{p.noDiff}</p>;

  return (
    <details open>
      <summary className="cursor-pointer text-small font-medium">{p.diffTitle}</summary>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-line p-3 text-small">
        {lines.map((line, index) => {
          if (line.kind === "same") return <span key={index} className="block">  {line.text}</span>;
          const added = line.kind === "added";
          return (
            <span
              key={index}
              className={`block ${added ? "bg-encre-soft" : "bg-sand text-ink-muted line-through"}`}
            >
              {added ? "+ " : "− "}
              {line.text}
            </span>
          );
        })}
      </pre>
    </details>
  );
}
