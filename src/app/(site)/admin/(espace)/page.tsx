/**
 * =============================================================
 *  Fichier    : page.tsx (admin)
 *  Projet     : Kalami
 *  Description: Tableau de bord de l'administration (/admin) : travail en attente
 *               (soumissions, versements, paiements Mobile Money à valider), ventes du mois
 *               en cours par devise et compteurs du catalogue. Exige un administrateur aal2.
 *  Auteur     : Claude Marcel
 *  Version    : 2.2 (À traiter et ventes du mois, v0.12.1)
 *  Date       : 2026-10-19
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts, lib/admin/dashboard-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { getDashboardCounts } from "@/lib/admin/catalog-queries";
import { getDashboardTodo, getMonthTotals } from "@/lib/admin/dashboard-queries";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import type { PlatformTotals } from "@/lib/revenue/ledger";

const t = getDictionary();
const d = t.admin.dashboard;

const TILE =
  "flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 hover:border-encre";

type Tile = { label: string; value: number; href: string };

export const metadata: Metadata = { title: { absolute: t.admin.title } };

export default function AdminPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{t.admin.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Contenu protégé : accueil, travail en attente, ventes du mois et catalogue. */
async function Dashboard() {
  const { profile, user } = await requireAdmin();
  const [counts, todo, month] = await Promise.all([
    getDashboardCounts(),
    getDashboardTodo(),
    getMonthTotals(),
  ]);
  const todoTiles: Tile[] = [
    { label: d.submissions, value: counts.submissions, href: "/admin/soumissions" },
    { label: d.payoutsOpen, value: todo.payoutsOpen, href: "/admin/versements" },
    {
      label: d.mmToReview,
      value: todo.mobileMoneyToReview,
      href: "/admin/commandes?statut=to_review",
    },
  ];
  const catalogTiles: Tile[] = [
    { label: d.published, value: counts.published, href: "/admin/livres" },
    { label: d.drafts, value: counts.drafts, href: "/admin/livres" },
    { label: d.authors, value: counts.authors, href: "/admin/auteurs" },
    { label: d.categories, value: counts.categories, href: "/admin/categories" },
  ];

  return (
    <>
      <p className="text-ink-muted">
        {t.admin.welcome} ({profile.display_name ?? user.email})
      </p>
      <TileSection title={d.todoTitle} tiles={todoTiles} />
      <MonthSection totals={month} />
      <TileSection title={d.catalogTitle} tiles={catalogTiles} />
    </>
  );
}

/** Section de compteurs cliquables. */
function TileSection({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link href={tile.href} className={TILE}>
              <span className="text-3xl font-semibold">{tile.value}</span>
              <span className="text-sm text-ink-muted">{tile.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Ventes du mois en cours : une carte par devise. */
function MonthSection({ totals }: { totals: PlatformTotals[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">{d.monthTitle}</h2>
        <Link href="/admin/revenus" className="text-sm text-encre underline">
          {d.revenueLink}
        </Link>
      </div>
      {totals.length === 0 ? (
        <p className="text-ink-muted">{d.monthNone}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {totals.map((row) => (
            <li key={row.currency} className={`${CARD} flex flex-col gap-2 p-4`}>
              <p className="font-serif text-2xl font-semibold">
                {formatPrice(row.gross, row.currency)}
              </p>
              <p className="text-sm text-ink-muted">
                {d.monthGross} · {interpolate(d.monthSales, { count: String(row.sales) })}
              </p>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt className="text-ink-muted">{d.monthCommission}</dt>
                <dd className="text-right">{formatPrice(row.commission, row.currency)}</dd>
                <dt className="text-ink-muted">{d.monthAuthors}</dt>
                <dd className="text-right">{formatPrice(row.authors, row.currency)}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
