/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/[module]/[lecon])
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Page d'une leçon. L'en-tête et la navigation sont statiques (toutes les
 *               leçons du programme sont générées à la construction) ; le contenu est
 *               réservé aux inscrits et chargé à la demande : connexion exigée, accès
 *               vérifié, surlignages, meilleures notes et état « terminée » de l'apprenant.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/*, components/cours/*, cours.css
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlocsLecon } from "@/components/cours/blocs-lecon";
import { BoutonTerminer } from "@/components/cours/bouton-terminer";
import { LiseuseLecon } from "@/components/cours/liseuse-lecon";
import { SansAcces } from "@/components/cours/sans-acces";
import { BUTTON_TERTIARY, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import {
  annotationsLecon,
  exigerConnexionCours,
  meilleuresNotes,
  progressionApprenant,
} from "@/lib/cours/acces";
import { contenuLecon } from "@/lib/cours/lecons";
import {
  MODULES,
  adresseLecon,
  leconParId,
  trouverLecon,
  voisines,
  type LeconInfo,
} from "@/lib/cours/modules";

import "../../cours.css";

const t = getCourseDictionary();

/** Toutes les leçons du programme, générées à la construction. */
export function generateStaticParams() {
  return MODULES.flatMap((m) =>
    m.lecons.map((l) => ({ module: m.slug, lecon: l.slug })),
  );
}

/** Titre de l'onglet : titre de la leçon. */
export async function generateMetadata({
  params,
}: PageProps<"/strategie/cours/[module]/[lecon]">): Promise<Metadata> {
  const { module: moduleSlug, lecon: leconSlug } = await params;
  const trouve = trouverLecon(moduleSlug, leconSlug);
  return { title: trouve ? trouve.lecon.titre : t.title };
}

// ==================== NAVIGATION ====================

/** Lien vers une leçon voisine (précédente ou suivante). */
function LienVoisine({
  lecon,
  sens,
}: {
  lecon: LeconInfo | null;
  sens: "avant" | "apres";
}) {
  const cible = lecon ? leconParId(lecon.id) : null;
  if (!cible) return <span />;
  return (
    <Link
      href={adresseLecon(cible.module, cible.lecon)}
      className={`flex flex-col gap-1 ${sens === "apres" ? "items-end text-right" : ""}`}
    >
      <span className="text-caption uppercase text-ink-muted">
        {sens === "avant" ? t.lecon.precedente : t.lecon.suivante}
      </span>
      <span className="font-semibold text-encre underline-offset-4 hover:underline">
        {cible.lecon.titre}
      </span>
    </Link>
  );
}

// ==================== CONTENU PRIVÉ ====================

/** Contenu de la leçon pour l'apprenant connecté. */
async function ContenuPrive({
  leconId,
  adresse,
}: {
  leconId: string;
  adresse: string;
}) {
  const { user, acces } = await exigerConnexionCours(adresse);
  if (!acces) return <SansAcces email={user.email} />;

  const contenu = contenuLecon(leconId);
  if (!contenu) {
    return <p className={`${PANEL_SAND} p-6`}>{t.lecon.bientot}</p>;
  }

  const [surlignages, meilleures, progression] = await Promise.all([
    annotationsLecon(leconId),
    meilleuresNotes(leconId),
    progressionApprenant(),
  ]);
  const terminee = progression.some(
    (p) => p.lesson_id === leconId && p.completed_at,
  );

  return (
    <>
      <LiseuseLecon
        leconId={leconId}
        adresse={adresse}
        connecte
        surlignages={surlignages}
      >
        <BlocsLecon
          leconId={leconId}
          contenu={contenu}
          meilleures={meilleures}
        />
      </LiseuseLecon>
      <BoutonTerminer leconId={leconId} terminee={terminee} />
    </>
  );
}

// ==================== PAGE ====================

export default async function LeconPage({
  params,
}: PageProps<"/strategie/cours/[module]/[lecon]">) {
  const { module: moduleSlug, lecon: leconSlug } = await params;
  const trouve = trouverLecon(moduleSlug, leconSlug);
  if (!trouve) notFound();
  const { module: mod, lecon } = trouve;
  const adresse = adresseLecon(mod, lecon);
  const { avant, apres } = voisines(lecon.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-3">
        <Link
          href="/strategie/cours"
          className={`${BUTTON_TERTIARY} self-start`}
        >
          ← {t.lecon.retour}
        </Link>
        <p className="text-caption uppercase text-ink-muted">
          {interpolate(t.lecon.moduleLecon, {
            m: String(mod.numero),
            l: String(lecon.numero),
          })}
          {" · "}
          {mod.titre}
        </p>
        <h1 className="font-serif text-h1 font-semibold">{lecon.titre}</h1>
        <p className="text-small text-ink-muted">
          {interpolate(t.lecon.duree, { n: String(lecon.minutes) })}
        </p>
      </header>

      {/* ==================== CONTENU ==================== */}
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <ContenuPrive leconId={lecon.id} adresse={adresse} />
      </Suspense>

      {/* ==================== LEÇONS VOISINES ==================== */}
      <nav
        aria-label={t.lecon.retour}
        className="grid grid-cols-2 gap-4 border-t border-line pt-6"
      >
        <LienVoisine lecon={avant} sens="avant" />
        <LienVoisine lecon={apres} sens="apres" />
      </nav>
    </main>
  );
}
