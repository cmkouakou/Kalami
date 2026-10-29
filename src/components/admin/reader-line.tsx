/**
 * =============================================================
 *  Fichier    : reader-line.tsx
 *  Projet     : Kalami
 *  Description: Ligne de tableau d'une lecture (lecteur, livre, avancement, début, dernière
 *               lecture, temps total, pays, statut), partagée par « Lecture et audience »
 *               et la fiche d'un lecteur (v0.16.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/admin/audience-queries.ts, lib/analytics/audience.ts, i18n
 * =============================================================
 */

import Link from "next/link";

import { getDictionary, interpolate } from "@/i18n";
import type { ReaderRow } from "@/lib/admin/audience-queries";
import { daysSince, formatDuration, type ReaderStatus } from "@/lib/analytics/audience";

const a = getDictionary().admin.audience;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const PERCENT = new Intl.NumberFormat("fr-FR", { style: "percent" });
const REGIONS = new Intl.DisplayNames(["fr"], { type: "region" });

const STATUS_CLASS: Record<ReaderStatus, string> = {
  active: "bg-encre-soft text-encre",
  paused: "bg-sand text-ink",
  abandoned: "bg-sand text-ink-muted",
  finished: "bg-encre text-on-encre",
};

/**
 * Nom du pays en français, ou « Inconnu ».
 * @param code - Code ISO à 2 lettres, "" ou null
 */
export function countryName(code: string | null): string {
  if (!code) return a.unknownCountry;
  try {
    return REGIONS.of(code) ?? code;
  } catch {
    return code;
  }
}

/** En-têtes du tableau des lectures (colonne « Lecteur » facultative). */
export function ReaderHead({ showReader = true }: { showReader?: boolean }) {
  const headers = [
    ...(showReader ? [a.reader] : []),
    a.book,
    a.progress,
    a.started,
    a.lastRead,
    a.totalTime,
    a.country,
    a.statusLabel,
  ];
  return (
    <thead className="border-b border-line text-ink-muted">
      <tr>
        {headers.map((header) => (
          <th key={header} scope="col" className="py-2 pr-3 font-medium">
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** Une lecture : lecteur, livre, avancement, dates, temps, pays et statut. */
export function ReaderLine({
  row,
  status,
  now,
  showReader = true,
}: {
  row: ReaderRow;
  status: ReaderStatus;
  now: Date;
  showReader?: boolean;
}) {
  const idle = daysSince(row.last_read_at, now);
  return (
    <tr className="border-b border-line align-top">
      {showReader && (
        <td className="py-2 pr-3">
          <Link href={`/admin/audience/lecteurs/${row.user_id}`} className="text-encre underline">
            {row.display_name || row.email}
          </Link>
          {row.display_name && <span className="block text-xs text-ink-muted">{row.email}</span>}
        </td>
      )}
      <td className="py-2 pr-3">{row.book_title}</td>
      <td className="py-2 pr-3">
        <span className="font-semibold">{PERCENT.format(row.progress)}</span>
        <span className="block text-xs text-ink-muted">
          {interpolate(a.chapter, {
            current: String(row.chapter_position),
            total: String(row.chapter_count ?? "?"),
          })}
          {row.chapters_opened > 0 &&
            ` · ${interpolate(a.chaptersOpened, { count: String(row.chapters_opened) })}`}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-3">
        {DATE_FORMAT.format(new Date(row.started_at))}
        <span className="block text-xs text-ink-muted">
          {interpolate(a.sinceStart, { days: String(daysSince(row.started_at, now)) })}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-3">
        {DATE_FORMAT.format(new Date(row.last_read_at))}
        <span className="block text-xs text-ink-muted">
          {idle === 0 ? a.idleToday : interpolate(a.idle, { days: String(idle) })}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-3">
        {formatDuration(row.total_seconds)}
        <span className="block text-xs text-ink-muted">
          {interpolate(a.activeDays, { count: String(row.active_days) })}
        </span>
      </td>
      <td className="py-2 pr-3">{countryName(row.country)}</td>
      <td className="py-2 pr-3">
        <span className={`rounded-full px-2 py-0.5 text-caption ${STATUS_CLASS[status]}`}>
          {a.status[status]}
        </span>
      </td>
    </tr>
  );
}
