/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Accueil de l'administration du cours (v0.29.0) : chiffres clés
 *               (apprenants actifs, cohortes, vente en ligne) et accès aux quatre
 *               rubriques (apprenants, cohortes, suivi, prix).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, components/admin/cours/cours-nav.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CoursNav, RUBRIQUES } from "@/components/admin/cours/cours-nav";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { requireAdmin } from "@/lib/auth/dal";
import {
  listerApprenants,
  listerCohortes,
  lireReglagesCours,
} from "@/lib/cours/admin-queries";

const a = getCourseDictionary().admin;

export const metadata: Metadata = { title: a.titre };

export default function AdminCoursPage() {
  return (
    <main className="flex flex-col gap-8">
      <CoursNav titre={a.titre} />
      <p className="max-w-3xl text-small text-ink-muted">{a.intro}</p>
      <Suspense
        fallback={<div aria-hidden="true" className="h-40 animate-pulse" />}
      >
        <Chiffres />
      </Suspense>

      {/* ==================== RUBRIQUES ==================== */}
      <ul className="grid gap-4 sm:grid-cols-2">
        {RUBRIQUES.map((r) => (
          <li key={r.cle}>
            <Link
              href={r.href}
              className={`${CARD} flex h-full flex-col gap-2 p-5 hover:border-encre`}
            >
              <span className="font-serif text-xl font-semibold text-encre">
                {a.nav[r.cle]}
              </span>
              <span className="text-small text-ink-muted">{a.aide[r.cle]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

// ==================== CHIFFRES ====================

/** Apprenants actifs, cohortes et état de la vente (administrateur aal2). */
async function Chiffres() {
  await requireAdmin();
  const [apprenants, cohortes, reglages] = await Promise.all([
    listerApprenants(),
    listerCohortes(),
    lireReglagesCours(),
  ]);
  const tuiles = [
    interpolate(a.chiffres.apprenants, { n: String(apprenants.length) }),
    interpolate(a.chiffres.cohortes, { n: String(cohortes.length) }),
    reglages.on_sale ? a.chiffres.enVente : a.chiffres.horsVente,
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {tuiles.map((texte) => (
        <li key={texte} className={`${PANEL_SAND} p-4 font-semibold`}>
          {texte}
        </li>
      ))}
    </ul>
  );
}
