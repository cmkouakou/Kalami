/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/apprenants)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Apprenants et accès (v0.29.0) : donner l'accès à une liste de courriels
 *               (cohorte, livre associé, note), puis la liste des inscrits avec leur
 *               origine, le changement de cohorte et le retrait de l'accès.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, components/admin/cours/*
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  ChoixCohorte,
  RetraitAcces,
} from "@/components/admin/cours/actions-apprenant";
import { CoursNav } from "@/components/admin/cours/cours-nav";
import { FormulaireAccord } from "@/components/admin/cours/formulaire-accord";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { requireAdmin } from "@/lib/auth/dal";
import {
  listerApprenants,
  listerCohortes,
  lireReglagesCours,
} from "@/lib/cours/admin-queries";
import { DATE_FORMAT } from "@/lib/format/date";

const a = getCourseDictionary().admin;

export const metadata: Metadata = { title: a.nav.apprenants };

export default function AdminCoursApprenantsPage() {
  return (
    <main className="flex flex-col gap-8">
      <CoursNav actif="apprenants" titre={a.nav.apprenants} />
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <Contenu />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Formulaire d'accès et liste des inscrits (administrateur aal2). */
async function Contenu() {
  await requireAdmin();
  const [apprenants, cohortes, reglages] = await Promise.all([
    listerApprenants(),
    listerCohortes(),
    lireReglagesCours(),
  ]);
  const options = cohortes.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      {/* ==================== DONNER L'ACCÈS ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <h2 className="font-serif text-xl font-semibold">{a.accorder.titre}</h2>
        <FormulaireAccord
          cohortes={options}
          livreAssocie={reglages.book_id !== null}
        />
      </section>

      {/* ==================== INSCRITS ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">
          {interpolate(a.liste.titre, { n: String(apprenants.length) })}
        </h2>
        {apprenants.length === 0 ? (
          <p className="text-ink-muted">{a.aucunApprenant}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4">
                    {a.liste.courriel}
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    {a.liste.origine}
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    {a.liste.depuis}
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    {a.liste.cohorte}
                  </th>
                  <th scope="col" className="py-2">
                    <span className="sr-only">{a.liste.retirer}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {apprenants.map((ap) => (
                  <tr
                    key={ap.access_id}
                    className="border-b border-line align-top"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/cours/suivi/${ap.user_id}`}
                        className="break-all text-encre underline"
                      >
                        {ap.email ?? ap.user_id}
                      </Link>
                      {ap.display_name && (
                        <p className="text-small text-ink-muted">
                          {ap.display_name}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">{a.source[ap.source]}</td>
                    <td className="py-3 pr-4">
                      {DATE_FORMAT.format(new Date(ap.granted_at))}
                    </td>
                    <td className="py-3 pr-4">
                      <ChoixCohorte
                        accessId={ap.access_id}
                        cohorteActuelle={ap.cohort_id}
                        cohortes={options}
                        email={ap.email ?? ap.user_id}
                      />
                    </td>
                    <td className="py-3">
                      <RetraitAcces
                        accessId={ap.access_id}
                        achat={ap.source === "purchase"}
                      />
                    </td>
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
