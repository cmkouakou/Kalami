/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/apprenants)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Apprenants et accès (v0.29.0) : donner l'accès à une liste de courriels
 *               (cohorte, livre associé, note), puis la liste des inscrits avec leur
 *               origine, le changement de cohorte et le retrait de l'accès.
 *               v0.42.0 : recherche et filtres, cohorte affichée, sélection et dates
 *               individuelles d'ouverture et de fermeture par module ou leçon.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/admin-queries.ts, components/admin/cours/*
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { CoursNav } from "@/components/admin/cours/cours-nav";
import { FormulaireAccord } from "@/components/admin/cours/formulaire-accord";
import { ListeApprenants } from "@/components/admin/cours/liste-apprenants";
import { CARD } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";
import { requireAdmin } from "@/lib/auth/dal";
import {
  listerApprenants,
  listerCohortes,
  listerDatesIndividuelles,
  lireReglagesCours,
} from "@/lib/cours/admin-queries";
import type { LigneInscrit } from "@/lib/cours/liste-apprenants";
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
  const [apprenants, cohortes, reglages, dates] = await Promise.all([
    listerApprenants(),
    listerCohortes(),
    lireReglagesCours(),
    listerDatesIndividuelles(),
  ]);
  const options = cohortes.map((c) => ({ value: c.id, label: c.name }));
  // Données utiles au navigateur seulement, dates déjà mises en forme
  const lignes: LigneInscrit[] = apprenants.map((ap) => ({
    accessId: ap.access_id,
    userId: ap.user_id,
    email: ap.email,
    nom: ap.display_name,
    source: ap.source,
    depuis: DATE_FORMAT.format(new Date(ap.granted_at)),
    cohorteId: ap.cohort_id,
    cohorteNom: ap.cohort_name,
  }));

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

      {/* ==================== INSCRITS ET DATES INDIVIDUELLES ==================== */}
      {apprenants.length === 0 ? (
        <p className="text-ink-muted">{a.aucunApprenant}</p>
      ) : (
        <ListeApprenants lignes={lignes} cohortes={options} dates={dates} />
      )}
    </>
  );
}
