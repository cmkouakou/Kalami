/**
 * =============================================================
 *  Fichier    : member-table.tsx
 *  Projet     : Kalami
 *  Description: Tableau des membres connectés (onglet « Membres » de Lecture et audience,
 *               v0.24.0) : courriel, inscription, dernière visite, jours actifs, pages
 *               vues, page la plus vue, provenance, pays, achats et lien vers la fiche.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/admin/audience-queries.ts, lib/analytics/visit.ts,
 *               components/admin/reader-line.tsx
 * =============================================================
 */

import Link from "next/link";

import { countryName } from "@/components/admin/reader-line";
import { getDictionary, interpolate } from "@/i18n";
import type { MemberRow } from "@/lib/admin/audience-queries";
import { daysSince } from "@/lib/analytics/audience";
import { sourceKind } from "@/lib/analytics/visit";
import { DATE_FORMAT } from "@/lib/format/date";

const a = getDictionary().admin.audience;
const m = a.members;
const NUMBER = new Intl.NumberFormat("fr-FR");

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Provenance lisible : famille (« Moteurs de recherche ») et site d'origine.
 * @param referrer - Site d'origine de la première visite, vide si accès direct
 */
export function sourceLabel(referrer: string | null): { kind: string; host: string } {
  return { kind: a.sources[sourceKind(referrer ?? "")], host: referrer ?? "" };
}

/**
 * Dernière visite : « aujourd'hui », « il y a 3 j », ou « jamais vu ».
 * @param iso - Date ISO de la dernière page vue, ou null
 * @param now - Instant de référence
 */
function lastSeenLabel(iso: string | null, now: Date): string {
  if (!iso) return m.neverSeen;
  const days = daysSince(iso, now);
  return days === 0 ? a.idleToday : interpolate(a.sinceStart, { days: String(days) });
}

// ==================== COMPOSANT ====================

/** Tableau des membres ; défilement horizontal sur téléphone. */
export function MemberTable({ members, now }: { members: MemberRow[]; now: Date }) {
  if (members.length === 0) return <p className="text-ink-muted">{m.none}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[68rem] text-left text-sm">
        <thead className="border-b border-line text-ink-muted">
          <tr>
            <th scope="col" className="py-2 pr-3 font-medium">{m.member}</th>
            <th scope="col" className="py-2 pr-3 font-medium">{m.signedUp}</th>
            <th scope="col" className="py-2 pr-3 font-medium">{m.lastSeen}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{m.activeDays}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{a.views}</th>
            <th scope="col" className="py-2 pr-3 font-medium">{m.topPage}</th>
            <th scope="col" className="py-2 pr-3 font-medium">{m.source}</th>
            <th scope="col" className="py-2 pr-3 font-medium">{a.country}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{m.purchases}</th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">{a.details}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((row) => {
            const source = sourceLabel(row.first_referrer);
            return (
              <tr key={row.user_id} className="border-b border-line align-top">
                <td className="py-2 pr-3">
                  <span className="block font-semibold break-all">{row.email}</span>
                  {row.display_name && (
                    <span className="text-caption text-ink-muted">{row.display_name}</span>
                  )}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {DATE_FORMAT.format(new Date(row.signed_up_at))}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {lastSeenLabel(row.last_seen_at, now)}
                </td>
                <td className="py-2 pr-3 text-right">{NUMBER.format(row.active_days)}</td>
                <td className="py-2 pr-3 text-right">
                  {NUMBER.format(row.views)}
                  <span className="block text-caption text-ink-muted">
                    {interpolate(m.distinctPages, { count: NUMBER.format(row.pages) })}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <span className="font-mono text-xs break-all">{row.top_path ?? "—"}</span>
                </td>
                <td className="py-2 pr-3">
                  {row.views > 0 ? source.kind : "—"}
                  {source.host && (
                    <span className="block text-caption break-all text-ink-muted">
                      {source.host}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">{row.country ? countryName(row.country) : "—"}</td>
                <td className="py-2 pr-3 text-right">{NUMBER.format(row.paid_orders)}</td>
                <td className="py-2">
                  <Link
                    href={`/admin/audience/lecteurs/${row.user_id}`}
                    className="text-encre underline"
                  >
                    {a.details}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
