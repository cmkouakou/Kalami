/**
 * =============================================================
 *  Fichier    : page.tsx (admin/journal)
 *  Projet     : Kalami
 *  Description: Journal d'audit consultable (Sprint 10b, v0.12.1, cahier §3.10) : actions
 *               sensibles les plus récentes d'abord, filtre par catégorie (préfixe de
 *               l'action), pages de 50 entrées. Lecture seule.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/admin/audit-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BUTTON_SECONDARY, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  type AuditEntry,
  listAuditCategories,
  listAuditEntries,
} from "@/lib/admin/audit-queries";
import { requireAdmin } from "@/lib/auth/dal";
import { DATE_TIME_SECONDS_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const au = t.admin.audit;

const PAGE_URL = "/admin/journal";

export const metadata: Metadata = { title: au.title };

export default function AdminAuditPage(props: PageProps<"/admin/journal">) {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{au.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{au.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AuditLog {...props} />
      </Suspense>
    </main>
  );
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Adresse d'une page du journal.
 * @param category - Catégorie filtrée, ou null
 * @param page - Numéro de page
 */
function pageHref(category: string | null, page: number): string {
  const params = new URLSearchParams();
  if (category) params.set("categorie", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${PAGE_URL}?${query}` : PAGE_URL;
}

// ==================== CONTENU ====================

/** Filtre, entrées et pagination (administrateur aal2). */
async function AuditLog({ searchParams }: PageProps<"/admin/journal">) {
  await requireAdmin();
  const params = await searchParams;
  const categories = await listAuditCategories();
  const known = categories.map((row) => row.category);
  const category = typeof params.categorie === "string" && known.includes(params.categorie)
    ? params.categorie
    : null;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const { entries, hasMore } = await listAuditEntries(category, page);

  return (
    <section className="flex flex-col gap-4">
      <nav aria-label={au.title}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href={PAGE_URL} className={category === null ? PILL_ACTIVE : PILL}>
              {au.all}
            </Link>
          </li>
          {categories.map((row) => (
            <li key={row.category}>
              <Link
                href={pageHref(row.category, 1)}
                className={row.category === category ? PILL_ACTIVE : PILL}
                aria-current={row.category === category ? "page" : undefined}
              >
                {row.category} ({row.entries})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {entries.length === 0 ? (
        <p className="text-ink-muted">{au.none}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">{au.date}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{au.actor}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{au.action}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{au.target}</th>
                <th scope="col" className="py-2 font-medium">{au.details}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== PAGINATION ==================== */}
      <div className="flex flex-wrap items-center gap-3">
        {page > 1 && (
          <Link href={pageHref(category, page - 1)} className={BUTTON_SECONDARY}>
            {au.previous}
          </Link>
        )}
        <span className="text-sm text-ink-muted">
          {interpolate(au.page, { page: String(page) })}
        </span>
        {hasMore && (
          <Link href={pageHref(category, page + 1)} className={BUTTON_SECONDARY}>
            {au.next}
          </Link>
        )}
      </div>
    </section>
  );
}

/** Une entrée : date, auteur de l'action, action, cible et détails bruts. */
function AuditRow({ entry }: { entry: AuditEntry }) {
  const details = entry.details && Object.keys(entry.details).length > 0
    ? JSON.stringify(entry.details)
    : "—";
  return (
    <tr className="border-b border-line align-top">
      <td className="whitespace-nowrap py-2 pr-3">
        {DATE_TIME_SECONDS_FORMAT.format(new Date(entry.created_at))}
      </td>
      <td className="py-2 pr-3">{entry.actor_email ?? au.system}</td>
      <td className="py-2 pr-3 font-mono text-xs">{entry.action}</td>
      <td className="py-2 pr-3 text-xs">
        {entry.target_type ?? "—"}
        {entry.target_id && (
          <span className="block break-all font-mono text-ink-muted">{entry.target_id}</span>
        )}
      </td>
      <td className="max-w-md break-all py-2 font-mono text-xs">{details}</td>
    </tr>
  );
}
