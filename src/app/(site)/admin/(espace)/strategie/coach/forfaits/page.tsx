/**
 * =============================================================
 *  Fichier    : page.tsx (admin/strategie/coach/forfaits)
 *  Projet     : Kalami Stratégie
 *  Description: Forfaits du coach IA (v0.11.1) : création et modification (nom, coût
 *               Anthropic couvert, prix facultatifs en FCFA, euros et dollars canadiens,
 *               état, ordre) et octroi d'un forfait à une étude, en attendant le paiement
 *               en ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/admin/strategy-actions.ts, lib/strategy/coach/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { BUTTON_TERTIARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { grantCoachPack, saveCoachPack } from "@/lib/admin/strategy-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { listCoachPacksForAdmin, type CoachPackAdmin } from "@/lib/strategy/coach/queries";
import { listStudiesForAdmin } from "@/lib/strategy/queries";

const t = getDictionary();
const p = t.strategy.admin.coachPacks;

export const metadata: Metadata = { title: p.title };

export default function AdminCoachPacksPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{p.title}</h1>
        <Link href="/admin/strategie/coach" className={BUTTON_TERTIARY}>
          {p.back}
        </Link>
      </div>
      <p className="text-ink-muted">{p.intro}</p>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminCoachPacks />
      </Suspense>
    </main>
  );
}

/** Champs communs à la création et à la modification d'un forfait. */
function PackFields({ pack }: { pack?: CoachPackAdmin }) {
  const suffix = pack?.id ?? "nouveau";
  return (
    <>
      {pack && <input type="hidden" name="packId" value={pack.id} />}
      <Field
        id={`nom-${suffix}`}
        name="name"
        label={p.name}
        defaultValue={pack?.name}
        maxLength={80}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`cout-${suffix}`}
          name="cost"
          type="number"
          label={p.cost}
          min={0.01}
          max={1000}
          step="0.01"
          defaultValue={pack?.costUsd}
          required
        />
        <Field
          id={`ordre-${suffix}`}
          name="position"
          type="number"
          label={p.position}
          min={0}
          max={1000}
          defaultValue={pack?.position ?? 0}
          required
        />
        <Field
          id={`xof-${suffix}`}
          name="priceXof"
          type="number"
          label={p.priceXof}
          min={1}
          step="1"
          defaultValue={pack?.priceXof ?? undefined}
        />
        <Field
          id={`eur-${suffix}`}
          name="priceEur"
          type="number"
          label={p.priceEur}
          min={0.01}
          step="0.01"
          defaultValue={pack?.priceEur ?? undefined}
        />
        <Field
          id={`cad-${suffix}`}
          name="priceCad"
          type="number"
          label={p.priceCad}
          min={0.01}
          step="0.01"
          defaultValue={pack?.priceCad ?? undefined}
        />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={pack?.active ?? true}
          className="size-5"
        />
        {p.active}
      </label>
    </>
  );
}

/** Liste des forfaits, création et octroi (administrateur aal2). */
async function AdminCoachPacks() {
  await requireAdmin();
  const [packs, studies] = await Promise.all([listCoachPacksForAdmin(), listStudiesForAdmin()]);
  const activePacks = packs.filter((pack) => pack.active);

  return (
    <>
      {/* ==================== OCTROI ==================== */}
      {studies.length > 0 && activePacks.length > 0 && (
        <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
          <h2 className="text-xl font-semibold">{p.grantTitle}</h2>
          <p className="text-small text-ink-muted">{p.grantIntro}</p>
          <ActionForm action={grantCoachPack} submitLabel={p.grant} resetOnSuccess>
            <SelectField
              name="studyId"
              label={p.study}
              options={studies.map((study) => ({
                value: study.id,
                label: `${study.company_name} — ${study.owner_email ?? "—"}`,
              }))}
              required
            />
            <SelectField
              name="packId"
              label={p.pack}
              options={activePacks.map((pack) => ({ value: pack.id, label: pack.name }))}
              required
            />
            <Field name="note" label={p.note} maxLength={500} />
          </ActionForm>
        </section>
      )}

      {/* ==================== FORFAITS EXISTANTS ==================== */}
      {packs.length === 0 ? (
        <p className="text-ink-muted">{p.none}</p>
      ) : (
        packs.map((pack) => (
          <section key={pack.id} className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">{pack.name}</h2>
              <p className="text-small text-ink-muted">
                {pack.approxReviews === null
                  ? p.inactive
                  : interpolate(p.approx, { count: String(pack.approxReviews) })}
              </p>
            </div>
            <ActionForm action={saveCoachPack} submitLabel={p.save}>
              <PackFields pack={pack} />
            </ActionForm>
          </section>
        ))
      )}

      {/* ==================== NOUVEAU FORFAIT ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
        <h2 className="text-xl font-semibold">{p.newTitle}</h2>
        <ActionForm action={saveCoachPack} submitLabel={p.create} resetOnSuccess>
          <PackFields />
        </ActionForm>
      </section>
    </>
  );
}
