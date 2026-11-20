/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/suivi)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Suivi des apprenants (v0.29.0) : tableau par cohorte (achèvement,
 *               leçons, temps de formation, dernière activité, moyenne), tri par
 *               colonne (?tri=…&sens=…), export CSV et lien vers la fiche de chacun.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, lib/cours/suivi.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CoursNav } from "@/components/admin/cours/cours-nav";
import { BUTTON_SECONDARY, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { isUuid } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/dal";
import { listerApprenants, listerCohortes } from "@/lib/cours/admin-queries";
import { dureeLisible } from "@/lib/cours/notation";
import { type CleTri, lireTri, trier } from "@/lib/cours/suivi";
import { DATE_FORMAT } from "@/lib/format/date";

const a = getCourseDictionary().admin;
const s = a.suivi;
const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const metadata: Metadata = { title: s.titre };

type Props = PageProps<"/admin/cours/suivi">;

export default function AdminCoursSuiviPage(props: Props) {
  return (
    <main className="flex flex-col gap-8">
      <CoursNav actif="suivi" titre={s.titre} />
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <Tableau {...props} />
      </Suspense>
    </main>
  );
}

// ==================== OUTILS ====================

/**
 * Adresse de la page avec une cohorte et un tri.
 * @param cohorte - Cohorte filtrée (null : toutes)
 * @param cle - Colonne de tri
 * @param sens - Sens du tri
 */
function adresse(
  cohorte: string | null,
  cle: CleTri,
  sens: "asc" | "desc",
): string {
  const params = new URLSearchParams({ tri: cle, sens });
  if (cohorte) params.set("cohorte", cohorte);
  return `/admin/cours/suivi?${params.toString()}`;
}

// ==================== TABLEAU ====================

/** Filtre, résumé et tableau trié (administrateur aal2). */
async function Tableau({ searchParams }: Props) {
  await requireAdmin();
  const query = await searchParams;
  const cohorte = isUuid(query.cohorte) ? query.cohorte : null;
  const { cle, sens } = lireTri(query.tri, query.sens);
  const [apprenants, cohortes] = await Promise.all([
    listerApprenants(cohorte),
    listerCohortes(),
  ]);
  const lignes = trier(apprenants, cle, sens);
  const moyenne =
    lignes.length === 0
      ? 0
      : Math.round(
          lignes.reduce((t, l) => t + l.pourcentage, 0) / lignes.length,
        );
  const tempsTotal = lignes.reduce((t, l) => t + (l.seconds ?? 0), 0);
  const exportHref = `/admin/cours/suivi/export${cohorte ? `?cohorte=${cohorte}` : ""}`;

  /** En-tête de colonne cliquable (un second clic inverse le sens). */
  const entete = (colonne: CleTri, libelle: string) => {
    const actif = colonne === cle;
    const parDefaut = colonne === "email" ? "asc" : "desc";
    const inverse = sens === "asc" ? "desc" : "asc";
    const prochain = actif ? inverse : parDefaut;
    return (
      <th
        scope="col"
        className="py-2 pr-4"
        aria-sort={
          actif ? (sens === "asc" ? "ascending" : "descending") : undefined
        }
      >
        <Link
          href={adresse(cohorte, colonne, prochain)}
          aria-label={interpolate(s.trierPar, { colonne: libelle })}
          className="underline-offset-2 hover:underline"
        >
          {libelle}
          {actif ? (sens === "asc" ? " ↑" : " ↓") : ""}
        </Link>
      </th>
    );
  };

  return (
    <>
      {/* ==================== FILTRE ET EXPORT ==================== */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="tri" value={cle} />
          <input type="hidden" name="sens" value={sens} />
          <label className="flex flex-col gap-1 text-label">
            {s.filtre}
            <select
              name="cohorte"
              defaultValue={cohorte ?? ""}
              className={CONTROL}
            >
              <option value="">{a.toutes}</option>
              {cohortes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={BUTTON_SECONDARY}>
            {s.filtrer}
          </button>
        </form>
        <a href={exportHref} className={BUTTON_SECONDARY} download>
          {s.exporter}
        </a>
      </div>

      <p className="text-small text-ink-muted">
        {interpolate(s.resume, {
          n: String(lignes.length),
          pourcentage: String(moyenne),
          temps: dureeLisible(tempsTotal),
        })}
      </p>

      {lignes.length === 0 ? (
        <p className="text-ink-muted">{a.aucunApprenant}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                {entete("email", s.apprenant)}
                <th scope="col" className="py-2 pr-4">
                  {a.liste.cohorte}
                </th>
                {entete("pourcentage", s.achevement)}
                <th scope="col" className="py-2 pr-4">
                  {s.lecons}
                </th>
                {entete("temps", s.temps)}
                {entete("derniere", s.derniere)}
                {entete("moyenne", s.moyenne)}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.access_id} className="border-b border-line">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/cours/suivi/${l.user_id}`}
                      className="break-all text-encre underline"
                    >
                      {l.email ?? l.user_id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {l.cohort_name ?? a.sansCohorte}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-20 overflow-hidden rounded-full bg-sand"
                      >
                        <span
                          className="block h-full bg-encre"
                          style={{ width: `${l.pourcentage}%` }}
                        />
                      </span>
                      {l.pourcentage} %
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {l.terminees}
                    {l.enCours > 0 ? ` (+${l.enCours})` : ""}
                  </td>
                  <td className="py-3 pr-4">{dureeLisible(l.seconds ?? 0)}</td>
                  <td className="py-3 pr-4">
                    {l.last_seen_at
                      ? DATE_FORMAT.format(new Date(l.last_seen_at))
                      : s.jamais}
                  </td>
                  <td className="py-3 pr-4">
                    {l.moyenne === null
                      ? "—"
                      : `${NOMBRE.format(l.moyenne)} / 100`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
