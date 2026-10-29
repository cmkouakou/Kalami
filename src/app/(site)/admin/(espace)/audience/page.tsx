/**
 * =============================================================
 *  Fichier    : page.tsx (admin/audience)
 *  Projet     : Kalami
 *  Description: Tableau de bord « Lecture et audience » (v0.16.1) : chiffres clés de la
 *               période, visites et lecture jour par jour, pages les plus vues, pays,
 *               provenance des visites, et liste des lecteurs (avancement, début, dernière
 *               lecture, jours sans lecture, temps total, pays, statut) avec filtre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/admin/audience-queries.ts, lib/analytics, components/admin/reader-line
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { countryName, ReaderHead, ReaderLine } from "@/components/admin/reader-line";
import { CARD, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  type AudienceDay,
  type AudienceSummary,
  getAudienceSummary,
  listReaders,
  type ReaderRow,
} from "@/lib/admin/audience-queries";
import {
  ABANDONED_DAYS,
  formatDuration,
  parsePeriod,
  type Period,
  PERIODS,
  periodStart,
  READER_STATUSES,
  type ReaderStatus,
  readerStatus,
} from "@/lib/analytics/audience";
import { type SourceKind, sourceKind } from "@/lib/analytics/visit";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();
const a = t.admin.audience;

const PAGE_URL = "/admin/audience";
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const NUMBER = new Intl.NumberFormat("fr-FR");

export const metadata: Metadata = { title: a.title };

export default function AdminAudiencePage(props: PageProps<"/admin/audience">) {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{a.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{a.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <Audience {...props} />
      </Suspense>
    </main>
  );
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Adresse du tableau de bord avec ses filtres.
 * @param period - Période en jours
 * @param status - Statut des lecteurs filtré, ou null
 * @param anchor - Ajoute l'ancre de la liste des lecteurs
 */
function pageHref(period: Period, status: ReaderStatus | null, anchor = false): string {
  const params = new URLSearchParams({ periode: String(period) });
  if (status) params.set("statut", status);
  return `${PAGE_URL}?${params.toString()}${anchor ? "#lecteurs" : ""}`;
}

// ==================== CONTENU ====================

/** Filtres, chiffres clés, graphiques et tableaux (administrateur aal2). */
async function Audience({ searchParams }: PageProps<"/admin/audience">) {
  await requireAdmin();
  const params = await searchParams;
  const period = parsePeriod(params.periode);
  const status = READER_STATUSES.find((value) => value === params.statut) ?? null;
  const since = periodStart(period);
  const [summary, readers] = await Promise.all([getAudienceSummary(since), listReaders()]);
  const now = new Date();
  const newReaders = readers.filter((row) => row.started_at.slice(0, 10) >= since).length;
  const inactive = readers.filter(
    (row) => readerStatus(row.progress, row.last_read_at, now) === "abandoned",
  ).length;

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label={a.period} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-muted">{a.period} :</span>
        {PERIODS.map((value) => (
          <Link
            key={value}
            href={pageHref(value, status)}
            className={value === period ? PILL_ACTIVE : PILL}
            aria-current={value === period ? "page" : undefined}
          >
            {value === 365 ? a.periodYear : interpolate(a.periodDays, { days: String(value) })}
          </Link>
        ))}
      </nav>

      {/* ==================== CHIFFRES CLÉS ==================== */}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Tile label={a.tiles.entries} value={NUMBER.format(summary.totals.entries)} />
        <Tile label={a.tiles.views} value={NUMBER.format(summary.totals.views)} />
        <Tile label={a.tiles.readers} value={NUMBER.format(summary.totals.readers)} />
        <Tile label={a.tiles.readingTime} value={formatDuration(summary.totals.seconds)} />
        <Tile label={a.tiles.newReaders} value={NUMBER.format(newReaders)} />
        <Tile
          label={interpolate(a.tiles.inactive, { days: String(ABANDONED_DAYS) })}
          value={NUMBER.format(inactive)}
        />
      </ul>

      <DaysSection days={summary.days} />

      <div className="grid gap-8 xl:grid-cols-3">
        <PagesSection pages={summary.pages} />
        <CountriesSection countries={summary.countries} />
        <SourcesSection referrers={summary.referrers} />
      </div>

      <ReadersSection readers={readers} period={period} status={status} now={now} />
    </div>
  );
}

/** Chiffre clé. */
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <li className={`${CARD} flex flex-col gap-1 p-4`}>
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-sm text-ink-muted">{label}</span>
    </li>
  );
}

// ==================== JOUR PAR JOUR ====================

/** Deux histogrammes : visites et temps de lecture par jour. */
function DaysSection({ days }: { days: AudienceDay[] }) {
  const empty = days.every((day) => day.views === 0 && day.seconds === 0);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-xl font-semibold">{a.daysTitle}</h2>
      {empty ? (
        <p className="text-ink-muted">{a.noData}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Bars
            title={a.tiles.entries}
            days={days}
            value={(day) => day.entries}
            label={(day) =>
              interpolate(a.dayVisits, {
                entries: NUMBER.format(day.entries),
                views: NUMBER.format(day.views),
              })
            }
          />
          <Bars
            title={a.tiles.readingTime}
            days={days}
            value={(day) => day.seconds}
            label={(day) =>
              interpolate(a.dayReading, {
                readers: NUMBER.format(day.readers),
                time: formatDuration(day.seconds),
              })
            }
          />
        </div>
      )}
    </section>
  );
}

/** Histogramme simple ; chaque barre donne sa valeur au survol et aux lecteurs d'écran. */
function Bars({
  title,
  days,
  value,
  label,
}: {
  title: string;
  days: AudienceDay[];
  value: (day: AudienceDay) => number;
  label: (day: AudienceDay) => string;
}) {
  const max = Math.max(1, ...days.map(value));
  const first = days[0];
  const last = days.at(-1);
  return (
    <figure className={`${CARD} flex flex-col gap-2 p-4`}>
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <ol className="flex h-32 items-end gap-px">
        {days.map((day) => {
          const text = `${DAY_FORMAT.format(new Date(day.day))} : ${label(day)}`;
          const height = (value(day) / max) * 100;
          return (
            <li key={day.day} className="flex h-full flex-1 items-end" title={text}>
              <span
                className="block w-full rounded-t-sm bg-encre"
                style={{ height: `${height}%`, minHeight: value(day) ? 2 : 0 }}
              />
              <span className="sr-only">{text}</span>
            </li>
          );
        })}
      </ol>
      {first && last && (
        <div className="flex justify-between text-caption text-ink-muted" aria-hidden="true">
          <span>{DAY_FORMAT.format(new Date(first.day))}</span>
          <span>{DAY_FORMAT.format(new Date(last.day))}</span>
        </div>
      )}
    </figure>
  );
}

// ==================== PAGES, PAYS, PROVENANCE ====================

/** Pages les plus vues. */
function PagesSection({ pages }: { pages: AudienceSummary["pages"] }) {
  return (
    <SmallTable
      title={a.pagesTitle}
      headers={[a.page, a.views, a.entries]}
      rows={pages.map((row) => [
        <span key="p" className="break-all font-mono text-xs">{row.path}</span>,
        NUMBER.format(row.views),
        NUMBER.format(row.entries),
      ])}
    />
  );
}

/** Visites et lecteurs par pays. */
function CountriesSection({ countries }: { countries: AudienceSummary["countries"] }) {
  return (
    <SmallTable
      title={a.countriesTitle}
      headers={[a.country, a.entries, a.readers]}
      rows={countries.map((row) => [
        countryName(row.country),
        NUMBER.format(row.entries),
        NUMBER.format(row.readers),
      ])}
    />
  );
}

/** Arrivées par famille de provenance, puis par site d'origine. */
function SourcesSection({ referrers }: { referrers: AudienceSummary["referrers"] }) {
  const byKind = new Map<SourceKind, number>();
  for (const row of referrers) {
    const kind = sourceKind(row.referrer);
    byKind.set(kind, (byKind.get(kind) ?? 0) + row.entries);
  }
  const kinds = [...byKind.entries()].sort((x, y) => y[1] - x[1]);
  const sites = referrers.filter((row) => row.referrer);
  return (
    <SmallTable
      title={a.sourcesTitle}
      headers={[a.source, a.entries]}
      rows={[
        ...kinds.map(([kind, entries]) => [
          <strong key="k">{a.sources[kind]}</strong>,
          NUMBER.format(entries),
        ]),
        ...sites.map((row) => [
          <span key="s" className="break-all pl-3 text-ink-muted">{row.referrer}</span>,
          NUMBER.format(row.entries),
        ]),
      ]}
    />
  );
}

/** Petit tableau à deux ou trois colonnes, chiffres alignés à droite. */
function SmallTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-ink-muted">{a.noData}</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={`py-2 font-medium ${index ? "pl-3 text-right" : ""}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, rowIndex) => (
                <tr key={rowIndex} className="border-b border-line">
                  {cells.map((cell, index) => (
                    <td key={index} className={`py-2 ${index ? "pl-3 text-right" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ==================== LECTEURS ====================

/** Liste des lecteurs, filtrable par statut. */
function ReadersSection({
  readers,
  period,
  status,
  now,
}: {
  readers: ReaderRow[];
  period: Period;
  status: ReaderStatus | null;
  now: Date;
}) {
  const withStatus = readers.map((row) => ({
    row,
    status: readerStatus(row.progress, row.last_read_at, now),
  }));
  const shown = status ? withStatus.filter((item) => item.status === status) : withStatus;
  const count = (value: ReaderStatus) => withStatus.filter((item) => item.status === value).length;

  return (
    <section id="lecteurs" className="flex scroll-mt-6 flex-col gap-4">
      <h2 className="font-serif text-xl font-semibold">{a.readersTitle}</h2>
      <p className="max-w-3xl text-small text-ink-muted">{a.untilTracking}</p>
      <nav aria-label={a.readersTitle}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href={pageHref(period, null, true)} className={status ? PILL : PILL_ACTIVE}>
              {a.allStatuses} ({withStatus.length})
            </Link>
          </li>
          {READER_STATUSES.map((value) => (
            <li key={value}>
              <Link
                href={pageHref(period, value, true)}
                className={value === status ? PILL_ACTIVE : PILL}
                aria-current={value === status ? "page" : undefined}
              >
                {a.status[value]} ({count(value)})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {shown.length === 0 ? (
        <p className="text-ink-muted">{a.readersNone}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <ReaderHead />
            <tbody>
              {shown.map((item) => (
                <ReaderLine
                  key={`${item.row.user_id}-${item.row.book_id}`}
                  row={item.row}
                  status={item.status}
                  now={now}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
