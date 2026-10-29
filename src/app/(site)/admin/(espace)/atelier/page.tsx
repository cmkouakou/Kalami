/**
 * =============================================================
 *  Fichier    : page.tsx (admin/atelier)
 *  Projet     : Kalami
 *  Description: Atelier des auteurs (v0.15.0) : réglages des outils IA, forfaits de Crédits
 *               Atelier (création, modification), octroi gratuit d'un forfait à un auteur
 *               et consommation par auteur (dollars : administrateur seulement).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/admin/workshop-actions.ts, lib/author/workshop/queries.ts,
 *               lib/admin/catalog-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { listAuthorsAdmin } from "@/lib/admin/catalog-queries";
import {
  grantWorkshopPack,
  saveWorkshopPack,
  saveWorkshopSettings,
} from "@/lib/admin/workshop-actions";
import { requireAdmin } from "@/lib/auth/dal";
import {
  getWorkshopSettings,
  listWorkshopPacksForAdmin,
  listWorkshopUsage,
  type WorkshopPackAdmin,
  type WorkshopSettings,
} from "@/lib/author/workshop/queries";
import { DATE_TIME_FORMAT } from "@/lib/format/date";
import { getWorkshopDictionary } from "@/i18n/workshop";

const w = getWorkshopDictionary().admin;
/** Coût moyen d'un chapitre relu (dollars US), comme workshop_chapter_cost() en base. */
const CHAPTER_COST = 0.25;

export const metadata: Metadata = { title: w.title };

export default function AdminWorkshopPage() {
  return (
    <main className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl font-semibold">{w.title}</h1>
      <p className="text-ink-muted">{w.intro}</p>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminWorkshop />
      </Suspense>
    </main>
  );
}

// ==================== FORMULAIRES ====================

/** Réglages des outils IA. */
function SettingsForm({ settings }: { settings: WorkshopSettings }) {
  const s = w.settings;
  return (
    <ActionForm action={saveWorkshopSettings} submitLabel={s.save}>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={settings.enabled}
          className="size-5"
        />
        {s.enabled}
      </label>
      <Field name="model" label={s.model} defaultValue={settings.model} maxLength={80} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="inputPrice"
          type="number"
          label={s.inputPrice}
          min={0}
          max={1000}
          step="0.0001"
          defaultValue={settings.inputPrice}
          required
        />
        <Field
          name="outputPrice"
          type="number"
          label={s.outputPrice}
          min={0}
          max={1000}
          step="0.0001"
          defaultValue={settings.outputPrice}
          required
        />
        <Field
          name="rateLimit"
          type="number"
          label={s.rateLimit}
          min={1}
          max={1000}
          step="1"
          defaultValue={settings.rateLimit}
          required
        />
        <Field
          name="rateWindow"
          type="number"
          label={s.rateWindow}
          min={1}
          max={1440}
          step="1"
          defaultValue={settings.rateWindow}
          required
        />
      </div>
    </ActionForm>
  );
}

/** Champs communs à la création et à la modification d'un forfait. */
function PackFields({ pack }: { pack?: WorkshopPackAdmin }) {
  const p = w.packs;
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

// ==================== CONTENU ====================

/** Réglages, octroi, forfaits et consommation (administrateur aal2). */
async function AdminWorkshop() {
  await requireAdmin();
  const [settings, packs, usage, authors] = await Promise.all([
    getWorkshopSettings(),
    listWorkshopPacksForAdmin(),
    listWorkshopUsage(),
    listAuthorsAdmin(),
  ]);
  const activePacks = packs.filter((pack) => pack.active);
  const section = `${CARD} flex flex-col gap-4 p-4 sm:p-6`;

  return (
    <>
      {/* ==================== RÉGLAGES ==================== */}
      <section className={section}>
        <h2 className="text-xl font-semibold">{w.settings.title}</h2>
        <SettingsForm settings={settings} />
      </section>

      {/* ==================== OCTROI ==================== */}
      {authors.length > 0 && activePacks.length > 0 && (
        <section className={section}>
          <h2 className="text-xl font-semibold">{w.grant.title}</h2>
          <p className="text-small text-ink-muted">{w.grant.intro}</p>
          <ActionForm action={grantWorkshopPack} submitLabel={w.grant.submit} resetOnSuccess>
            <SelectField
              name="authorId"
              label={w.grant.author}
              options={authors.map((author) => ({ value: author.id, label: author.display_name }))}
              required
            />
            <SelectField
              name="packId"
              label={w.grant.pack}
              options={activePacks.map((pack) => ({ value: pack.id, label: pack.name }))}
              required
            />
            <Field name="note" label={w.grant.note} maxLength={500} />
          </ActionForm>
        </section>
      )}

      {/* ==================== FORFAITS ==================== */}
      <h2 className="font-serif text-2xl font-semibold">{w.packs.title}</h2>
      {packs.length === 0 && <p className="text-ink-muted">{w.packs.none}</p>}
      {packs.map((pack) => (
        <section key={pack.id} className={section}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xl font-semibold">{pack.name}</h3>
            <p className="text-small text-ink-muted">
              {pack.active
                ? interpolate(w.packs.approx, {
                  count: String(Math.max(Math.floor(pack.costUsd / CHAPTER_COST), 1)),
                })
                : w.packs.inactive}
            </p>
          </div>
          <ActionForm action={saveWorkshopPack} submitLabel={w.packs.save}>
            <PackFields pack={pack} />
          </ActionForm>
        </section>
      ))}
      <section className={section}>
        <h3 className="text-xl font-semibold">{w.packs.newTitle}</h3>
        <ActionForm action={saveWorkshopPack} submitLabel={w.packs.create} resetOnSuccess>
          <PackFields />
        </ActionForm>
      </section>

      {/* ==================== CONSOMMATION ==================== */}
      <section className={section}>
        <h2 className="text-xl font-semibold">{w.usage.title}</h2>
        {usage.length === 0 ? (
          <p className="text-ink-muted">{w.usage.none}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3">{w.usage.author}</th>
                  <th scope="col" className="py-2 pr-3">{w.usage.requests}</th>
                  <th scope="col" className="py-2 pr-3">{w.usage.spent}</th>
                  <th scope="col" className="py-2 pr-3">{w.usage.budget}</th>
                  <th scope="col" className="py-2">{w.usage.last}</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.author_id} className="border-t border-line">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      {row.display_name}
                      <span className="block text-small text-ink-muted">{row.email ?? "—"}</span>
                    </th>
                    <td className="py-2 pr-3">{row.requests}</td>
                    <td className="py-2 pr-3">{row.spent.toFixed(2)}</td>
                    <td className="py-2 pr-3">{row.budget.toFixed(2)}</td>
                    <td className="py-2">
                      {row.last_at ? DATE_TIME_FORMAT.format(new Date(row.last_at)) : "—"}
                    </td>
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
