/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/annotations)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: « Mes annotations » : surlignages et notes de l'apprenant dans toutes les
 *               leçons, avec recherche, filtre de couleur, retour au passage et retrait.
 *               Réservée aux inscrits, non indexée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/acces.ts, components/cours/mes-annotations.tsx, cours.css
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MesAnnotations } from "@/components/cours/mes-annotations";
import { SansAcces } from "@/components/cours/sans-acces";
import { BUTTON_TERTIARY } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";
import { annotationsApprenant, exigerConnexionCours } from "@/lib/cours/acces";

import "../cours.css";

const t = getCourseDictionary();

/** Adresse de cette page (retour après connexion). */
const ADRESSE = "/strategie/cours/annotations";

export const metadata: Metadata = {
  title: t.annotations.titre,
  robots: { index: false },
};

// ==================== CONTENU PRIVÉ ====================

/** Annotations de l'apprenant connecté. */
async function AnnotationsPrivees() {
  const { user, acces } = await exigerConnexionCours(ADRESSE);
  if (!acces) return <SansAcces email={user.email} />;
  const annotations = await annotationsApprenant();
  return <MesAnnotations initiales={annotations} />;
}

// ==================== PAGE ====================

export default function AnnotationsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-3">
        <Link href="/strategie/cours" className={`${BUTTON_TERTIARY} self-start`}>
          ← {t.lecon.retour}
        </Link>
        <h1 className="font-serif text-h1 font-semibold">{t.annotations.titre}</h1>
        <p className="text-ink-muted">{t.annotations.intro}</p>
      </header>

      {/* ==================== ANNOTATIONS ==================== */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AnnotationsPrivees />
      </Suspense>
    </main>
  );
}
