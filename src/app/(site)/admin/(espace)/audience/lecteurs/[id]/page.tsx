/**
 * =============================================================
 *  Fichier    : page.tsx (admin/audience/lecteurs/[id])
 *  Projet     : Kalami
 *  Description: Fiche d'un lecteur (v0.16.1) : livres lus avec avancement, début, dernière
 *               lecture et temps total, puis activité jour par jour (temps, chapitres
 *               ouverts, pays) sur les 12 derniers mois.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/admin/audience-queries.ts, components/admin/reader-line.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { countryName, ReaderHead, ReaderLine } from "@/components/admin/reader-line";
import { getDictionary } from "@/i18n";
import { listReaderDays, listReaders } from "@/lib/admin/audience-queries";
import { isUuid } from "@/lib/admin/validation";
import { formatDuration, readerStatus } from "@/lib/analytics/audience";
import { requireAdmin } from "@/lib/auth/dal";

const a = getDictionary().admin.audience;

const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "UTC" });

export const metadata: Metadata = { title: a.readerTitle };

export default function AdminReaderPage(props: PageProps<"/admin/audience/lecteurs/[id]">) {
  return (
    <main className="flex flex-col gap-8">
      <Link href="/admin/audience" className="text-sm text-encre underline">
        ← {a.back}
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ReaderDetail {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Identité, livres lus et activité quotidienne (administrateur aal2). */
async function ReaderDetail({ params }: PageProps<"/admin/audience/lecteurs/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [readings, days] = isUuid(id)
    ? await Promise.all([listReaders(id), listReaderDays(id)])
    : [[], []];
  const reader = readings[0];
  if (!reader) {
    return (
      <>
        <h1 className="font-serif text-3xl font-semibold">{a.readerTitle}</h1>
        <p className="text-ink-muted">{a.readerNotFound}</p>
      </>
    );
  }

  const now = new Date();
  const titles = new Map(readings.map((row) => [row.book_id, row.book_title]));

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold">
          {reader.display_name || reader.email}
        </h1>
        {reader.display_name && <p className="text-ink-muted">{reader.email}</p>}
      </div>

      {/* ==================== LIVRES LUS ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">{a.readerBooks}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <ReaderHead showReader={false} />
            <tbody>
              {readings.map((row) => (
                <ReaderLine
                  key={row.book_id}
                  row={row}
                  status={readerStatus(row.progress, row.last_read_at, now)}
                  now={now}
                  showReader={false}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== ACTIVITÉ JOUR PAR JOUR ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">{a.readerDays}</h2>
        {days.length === 0 ? (
          <p className="max-w-3xl text-ink-muted">{a.untilTracking}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">{a.day}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{a.book}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{a.time}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{a.chapters}</th>
                  <th scope="col" className="py-2 font-medium">{a.country}</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={`${day.day}-${day.book_id}`} className="border-b border-line">
                    <td className="whitespace-nowrap py-2 pr-3">
                      {DAY_FORMAT.format(new Date(day.day))}
                    </td>
                    <td className="py-2 pr-3">{titles.get(day.book_id) ?? "—"}</td>
                    <td className="py-2 pr-3">{formatDuration(day.seconds)}</td>
                    <td className="py-2 pr-3">
                      {[...day.chapters].sort((x, y) => x - y).join(", ")}
                    </td>
                    <td className="py-2">{countryName(day.country)}</td>
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
