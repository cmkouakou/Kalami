/**
 * =============================================================
 *  Fichier    : page.tsx (admin/revenus)
 *  Projet     : Kalami
 *  Description: Administration des revenus (Sprint 10a, v0.12.0) : totaux du grand livre
 *               par devise, réglages (part de l'auteur, délai, seuils de versement), part
 *               propre par auteur et dernières écritures. Les frais Mobile Money se règlent
 *               sur la page « Mobile Money ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/revenue/actions.ts, lib/revenue/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/ui/form";
import { BADGE, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice, fromMinorUnits } from "@/lib/currency";
import { saveAuthorCommission, saveRevenueSettings } from "@/lib/revenue/actions";
import { bpsToPercent, type PlatformTotals } from "@/lib/revenue/ledger";
import {
  type AuthorCommissionRow,
  getPlatformTotals,
  getRevenueSettings,
  listAuthorCommissions,
  listPlatformEntries,
  type RevenueSettings,
} from "@/lib/revenue/queries";

const t = getDictionary();
const ar = t.admin.revenue;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export const metadata: Metadata = { title: ar.title };

export default function AdminRevenuePage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{ar.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{ar.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminRevenue />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Totaux, réglages, parts par auteur et écritures (administrateur aal2). */
async function AdminRevenue() {
  await requireAdmin();
  const [settings, totals, commissions, entries] = await Promise.all([
    getRevenueSettings(),
    getPlatformTotals(),
    listAuthorCommissions(),
    listPlatformEntries(),
  ]);

  return (
    <>
      {/* ==================== TOTAUX ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{ar.totalsTitle}</h2>
        {totals.length === 0 ? (
          <p className="text-ink-muted">{ar.none}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {totals.map((total) => (
              <TotalsCard key={total.currency} totals={total} />
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsForm settings={settings} />
        <CommissionsSection settings={settings} commissions={commissions} />
      </div>

      {/* ==================== ÉCRITURES ==================== */}
      {entries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{ar.entriesTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">{ar.date}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{ar.reference}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{ar.label}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{ar.type}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{ar.gross}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{ar.fees}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{ar.taxes}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    {ar.commission}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">{ar.authors}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const money = (amount: number) => formatPrice(amount, entry.currency);
                  return (
                    <tr key={entry.id} className="border-b border-line">
                      <td className="py-2 pr-3">
                        {DATE_FORMAT.format(new Date(entry.created_at))}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{entry.reference}</td>
                      <td className="py-2 pr-3">{entry.label}</td>
                      <td className="py-2 pr-3">
                        <span className={BADGE}>{ar.types[entry.entry_type]}</span>
                      </td>
                      <td className="py-2 pr-3 text-right">{money(entry.gross_minor)}</td>
                      <td className="py-2 pr-3 text-right">{money(entry.fee_minor)}</td>
                      <td className="py-2 pr-3 text-right">{money(entry.tax_minor)}</td>
                      <td className="py-2 pr-3 text-right">{money(entry.commission_minor)}</td>
                      <td className="py-2 text-right">{money(entry.author_minor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

/** Totaux d'une devise : brut, frais, taxes, commission Kalami et part des auteurs. */
function TotalsCard({ totals }: { totals: PlatformTotals }) {
  const money = (amount: number) => formatPrice(amount, totals.currency);
  const rows = [
    [ar.gross, totals.gross],
    [ar.fees, totals.fees],
    [ar.taxes, totals.taxes],
    [ar.commission, totals.commission],
    [ar.authors, totals.authors],
  ] as const;
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4`}>
      <p className="flex items-center justify-between font-semibold">
        {totals.currency}
        <span className={BADGE}>
          {ar.sales} : {totals.sales}
        </span>
      </p>
      <dl className="grid grid-cols-2 gap-1 text-sm">
        {rows.map(([label, amount]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right">{money(amount)}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

/** Part globale de l'auteur, délai de disponibilité et seuils de versement. */
function SettingsForm({ settings }: { settings: RevenueSettings }) {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 className="text-xl font-semibold">{ar.settingsTitle}</h2>
      <ActionForm action={saveRevenueSettings} submitLabel={ar.settingsSave}>
        <Field
          id="part-auteur"
          name="authorShare"
          label={ar.authorShare}
          hint={ar.authorShareHint}
          defaultValue={bpsToPercent(settings.authorShareBps)}
          inputMode="decimal"
          maxLength={6}
          required
        />
        <Field
          id="delai"
          name="holdDays"
          type="number"
          label={ar.holdDays}
          hint={ar.holdDaysHint}
          defaultValue={settings.holdDays}
          min={0}
          max={365}
          required
        />
        <Field
          id="seuil-xof"
          name="minXof"
          label={ar.minXof}
          defaultValue={fromMinorUnits(settings.payoutMin.XOF, "XOF")}
          inputMode="numeric"
          required
        />
        <Field
          id="seuil-eur"
          name="minEur"
          label={ar.minEur}
          defaultValue={fromMinorUnits(settings.payoutMin.EUR, "EUR")}
          inputMode="decimal"
          required
        />
        <Field
          id="seuil-cad"
          name="minCad"
          label={ar.minCad}
          defaultValue={fromMinorUnits(settings.payoutMin.CAD, "CAD")}
          inputMode="decimal"
          required
        />
        <p className="text-xs text-ink-muted">{ar.settingsNote}</p>
      </ActionForm>
    </section>
  );
}

type CommissionsProps = {
  settings: RevenueSettings;
  commissions: AuthorCommissionRow[];
};

/** Part propre de chaque auteur (vide : part globale). */
function CommissionsSection({ settings, commissions }: CommissionsProps) {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 className="text-xl font-semibold">{ar.commissionsTitle}</h2>
      <p className="text-sm text-ink-muted">
        {interpolate(ar.commissionsIntro, { share: bpsToPercent(settings.authorShareBps) })}
      </p>
      {commissions.length === 0 && <p className="text-ink-muted">{ar.noAuthors}</p>}
      <ul className="flex flex-col gap-3">
        {commissions.map((row) => (
          <li key={row.authorId} className="flex flex-col gap-1 border-t border-line pt-3">
            <p className="font-medium">
              {row.displayName}
              {row.shareBps !== null && <span className={`${BADGE} ml-2`}>{ar.custom}</span>}
            </p>
            <ActionForm action={saveAuthorCommission} submitLabel={ar.commissionSave}>
              <input type="hidden" name="authorId" value={row.authorId} />
              <Field
                id={`part-${row.authorId}`}
                name="authorShare"
                label={ar.authorShare}
                defaultValue={row.shareBps === null ? "" : bpsToPercent(row.shareBps)}
                inputMode="decimal"
                maxLength={6}
              />
            </ActionForm>
          </li>
        ))}
      </ul>
    </section>
  );
}
