/**
 * =============================================================
 *  Fichier    : page.tsx (admin)
 *  Projet     : Kalami
 *  Description: Tableau de bord de l'administration (/admin) : compteurs du catalogue.
 *               Exige un administrateur en aal2. Paiements et ventes : sprints suivants.
 *  Auteur     : Claude Marcel
 *  Version    : 2.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getDictionary } from "@/i18n";
import { getDashboardCounts } from "@/lib/admin/catalog-queries";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: { absolute: t.admin.title } };

export default function AdminPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{t.admin.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-28 animate-pulse" />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

/** Contenu protégé : message d'accueil et compteurs. */
async function Dashboard() {
  const { profile, user } = await requireAdmin();
  const counts = await getDashboardCounts();
  const d = t.admin.dashboard;
  const tiles = [
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
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4
                hover:border-encre"
            >
              <span className="text-3xl font-semibold">{tile.value}</span>
              <span className="text-sm text-ink-muted">{tile.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
