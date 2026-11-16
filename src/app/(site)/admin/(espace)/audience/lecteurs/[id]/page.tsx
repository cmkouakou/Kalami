/**
 * =============================================================
 *  Fichier    : page.tsx (admin/audience/lecteurs/[id])
 *  Projet     : Kalami
 *  Description: Fiche d'un membre (v0.24.0) : identité (courriel, inscription, dernière
 *               connexion), pages consultées jour par jour avec leur provenance, puis
 *               livres lus (avancement, temps) et activité de lecture sur 12 mois.
 *               Fonctionne aussi pour un membre qui n'a encore rien lu.
 *  Auteur     : Claude Marcel
 *  Version    : 2.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/admin/audience-queries.ts, components/admin/reader-line.tsx,
 *               components/admin/member-table.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { sourceLabel } from "@/components/admin/member-table";
import { countryName, ReaderHead, ReaderLine } from "@/components/admin/reader-line";
import { CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import {
  getMemberIdentity,
  listMemberPages,
  listReaderDays,
  listReaders,
  type MemberIdentity,
  type MemberPage,
  type ReaderDay,
} from "@/lib/admin/audience-queries";
import { isUuid } from "@/lib/admin/validation";
import { formatDuration, readerStatus } from "@/lib/analytics/audience";
import { requireAdmin } from "@/lib/auth/dal";
import { DATE_FORMAT, DATE_FULL_FORMAT, DATE_TIME_FORMAT } from "@/lib/format/date";

const a = getDictionary().admin.audience;
const m = a.members;
const NUMBER = new Intl.NumberFormat("fr-FR");

export const metadata: Metadata = { title: a.readerTitle };

export default function AdminReaderPage(props: PageProps<"/admin/audience/lecteurs/[id]">) {
  return (
    <main className="flex flex-col gap-8">
      <Link href="/admin/audience?onglet=members" className="text-sm text-encre underline">
        ← {a.back}
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ReaderDetail {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Identité, pages consultées, livres lus et activité quotidienne (administrateur aal2). */
async function ReaderDetail({ params }: PageProps<"/admin/audience/lecteurs/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return <NotFound />;
  const [identity, pages, readings, days] = await Promise.all([
    getMemberIdentity(id),
    listMemberPages(id),
    listReaders(id),
    listReaderDays(id),
  ]);
  if (!identity) return <NotFound />;

  const now = new Date();
  const titles = new Map(readings.map((row) => [row.book_id, row.book_title]));

  return (
    <>
      <Identity identity={identity} pages={pages} />
      <PagesTable pages={pages} />

      {/* ==================== LIVRES LUS ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">{a.readerBooks}</h2>
        {readings.length === 0 ? (
          <p className="text-ink-muted">{a.readerNotFound}</p>
        ) : (
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
        )}
      </section>

      {readings.length > 0 && <ReadingDays days={days} titles={titles} />}
    </>
  );
}

/** Membre introuvable ou adresse invalide. */
function NotFound() {
  return (
    <>
      <h1 className="font-serif text-3xl font-semibold">{a.readerTitle}</h1>
      <p className="text-ink-muted">{m.notFound}</p>
    </>
  );
}

// ==================== IDENTITÉ ====================

/** Nom, courriel et dates clés du membre. */
function Identity({ identity, pages }: { identity: MemberIdentity; pages: MemberPage[] }) {
  // Pages triées de la plus récente à la plus ancienne : la dernière est la première vue
  const first = pages.at(-1);
  const source = sourceLabel(first?.referrer || null);
  const facts = [
    { label: m.signedUp, value: DATE_FORMAT.format(new Date(identity.signed_up_at)) },
    {
      label: m.lastSignIn,
      value: identity.last_sign_in_at
        ? DATE_TIME_FORMAT.format(new Date(identity.last_sign_in_at))
        : "—",
    },
    {
      label: m.lastSeen,
      value: pages[0] ? DATE_TIME_FORMAT.format(new Date(pages[0].last_seen_at)) : m.neverSeen,
    },
    {
      label: m.source,
      value: first ? [source.kind, source.host].filter(Boolean).join(" — ") : "—",
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold break-all">
          {identity.display_name || identity.email}
        </h1>
        {identity.display_name && <p className="text-ink-muted">{identity.email}</p>}
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className={`${CARD} flex flex-col gap-1 p-4`}>
            <dt className="text-sm text-ink-muted">{fact.label}</dt>
            <dd className="font-semibold break-all">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ==================== PAGES CONSULTÉES ====================

/** Pages consultées par le membre (12 derniers mois, plus récentes d'abord). */
function PagesTable({ pages }: { pages: MemberPage[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl font-semibold">{m.pagesTitle}</h2>
      {pages.length === 0 ? (
        <p className="max-w-3xl text-ink-muted">{m.noPages}</p>
      ) : (
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="sticky top-0 border-b border-line bg-surface text-ink-muted">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">{a.day}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{a.page}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{a.views}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{m.source}</th>
                <th scope="col" className="py-2 font-medium">{a.country}</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((row) => (
                <tr key={`${row.day}-${row.path}`} className="border-b border-line">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {DATE_FORMAT.format(new Date(row.day))}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs break-all">{row.path}</td>
                  <td className="py-2 pr-3 text-right">{NUMBER.format(row.views)}</td>
                  <td className="py-2 pr-3 break-all text-ink-muted">{row.referrer || "—"}</td>
                  <td className="py-2">{row.country ? countryName(row.country) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ==================== ACTIVITÉ DE LECTURE ====================

/** Activité de lecture jour par jour. */
function ReadingDays({ days, titles }: { days: ReaderDay[]; titles: Map<string, string> }) {
  return (
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
                    {DATE_FULL_FORMAT.format(new Date(day.day))}
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
  );
}
