/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/[module]/[lecon])
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Page d'une leçon. L'en-tête et la navigation sont statiques (toutes les
 *               leçons du programme sont générées à la construction) ; le contenu est
 *               réservé aux inscrits et chargé à la demande : connexion exigée, accès
 *               vérifié, surlignages, meilleures notes et état « terminée » de l'apprenant.
 *               v0.33.0 : diffusion programmée (leçon fermée : date d'ouverture ; lecture
 *               en avance : contenu sans exercices ni bouton « terminé »).
 *               v0.37.0 : lien vers le quiz du module sur la dernière leçon.
 *               v0.38.2 : lien vers « Mes annotations » dans l'en-tête.
 *               v0.39.0 : leçon offerte (1.1) lisible par un membre non inscrit, sans
 *               exercices ni progression, avec un lien vers l'offre.
 *               v0.39.1 : leçon offerte lisible sans compte (proposée à Google).
 *               v0.40.0 : corrections déjà obtenues aux ateliers corrigés par l'IA.
 *               v0.42.0 : leçon fermée par une date individuelle (rien n'est servi).
 *  Auteur     : Claude Marcel
 *  Version    : 1.7
 *  Date       : 2026-11-20
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
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCourseDictionary } from "@/i18n/course";
import {
  aAccesAuCours,
  annotationsLecon,
  correctionsAteliers,
  diffusionApprenant,
  exigerConnexionCours,
  meilleuresNotes,
  progressionApprenant,
} from "@/lib/cours/acces";
import { dateLisible } from "@/lib/cours/calendrier";
import { contenuLecon } from "@/lib/cours/lecons";
import {
  LECON_OFFERTE,
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
  if (!trouve) return { title: t.title };
  const adresse = adresseLecon(trouve.module, trouve.lecon);
  if (trouve.lecon.id !== LECON_OFFERTE) return { title: trouve.lecon.titre };
  // Leçon offerte : publique, donc décrite pour Google et les partages
  const description = `${t.lecon.offerte} — ${t.title}. ${t.vente.accroche}`;
  return {
    title: trouve.lecon.titre,
    description,
    alternates: { canonical: adresse },
    openGraph: { title: trouve.lecon.titre, description, url: adresse, type: "article" },
  };
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

// ==================== LEÇON OFFERTE ====================

/** Leçon offerte lue sans inscription (visiteur ou membre) : texte seul, exercices fermés. */
function LeconOfferte({
  leconId,
  adresse,
  contenu,
  connecte,
}: {
  leconId: string;
  adresse: string;
  contenu: NonNullable<ReturnType<typeof contenuLecon>>;
  /** Faux pour un visiteur : surligner propose alors de se connecter. */
  connecte: boolean;
}) {
  const appel = (
    <aside className={`${PANEL_SAND} flex flex-col gap-3 p-5`}>
      <p>
        <span className="font-semibold">{t.lecon.offerte}.</span> {t.lecon.offerteTexte}
      </p>
      <Link href="/strategie/cours#offre" className={`${BUTTON_PRIMARY} self-start`}>
        {t.vente.voirOffre}
      </Link>
    </aside>
  );
  return (
    <>
      {appel}
      <LiseuseLecon
        leconId={leconId}
        adresse={adresse}
        connecte={connecte}
        surlignages={[]}
      >
        <BlocsLecon
          leconId={leconId}
          contenu={contenu}
          meilleures={{}}
          exercicesFermes={t.lecon.exerciceReserve}
        />
      </LiseuseLecon>
      {appel}
    </>
  );
}

// ==================== CONTENU PRIVÉ ====================

/** Contenu de la leçon pour l'apprenant connecté. */
async function ContenuPrive({
  leconId,
  adresse,
  quiz,
}: {
  leconId: string;
  adresse: string;
  /** Quiz du module, proposé seulement sur sa dernière leçon. */
  quiz: { adresse: string; numero: number } | null;
}) {
  const contenu = contenuLecon(leconId);

  // Leçon offerte : lisible sans compte ; les inscrits gardent la version complète
  if (leconId === LECON_OFFERTE) {
    const visiteur = await getCurrentUser();
    if (!visiteur || !(await aAccesAuCours())) {
      if (!contenu) return <p className={`${PANEL_SAND} p-6`}>{t.lecon.bientot}</p>;
      return (
        <LeconOfferte
          leconId={leconId}
          adresse={adresse}
          contenu={contenu}
          connecte={Boolean(visiteur)}
        />
      );
    }
  }

  const { user, acces } = await exigerConnexionCours(adresse);
  if (!acces) return <SansAcces email={user.email} />;
  if (!contenu) {
    return <p className={`${PANEL_SAND} p-6`}>{t.lecon.bientot}</p>;
  }

  // Diffusion programmée : leçon fermée (rien n'est servi) ou lue en avance
  const { calendrier, etats } = await diffusionApprenant();
  const diffusion = etats.get(leconId);
  const date =
    calendrier && diffusion?.ouvreLe
      ? dateLisible(diffusion.ouvreLe, calendrier.fuseau)
      : "";
  if (diffusion?.etat === "expiree" && calendrier && diffusion.fermeLe) {
    return (
      <section className={`${PANEL_SAND} flex flex-col gap-2 p-6`}>
        <h2 className="font-serif text-h3">{t.diffusion.expireeTitre}</h2>
        <p>
          {interpolate(t.diffusion.expireeTexte, {
            date: dateLisible(diffusion.fermeLe, calendrier.fuseau),
          })}
        </p>
      </section>
    );
  }
  if (diffusion?.etat === "fermee") {
    return (
      <section className={`${PANEL_SAND} flex flex-col gap-2 p-6`}>
        <h2 className="font-serif text-h3">{t.diffusion.fermeeTitre}</h2>
        <p>{interpolate(t.diffusion.fermeeTexte, { date })}</p>
      </section>
    );
  }
  const apercu = diffusion?.etat === "apercu";

  const [surlignages, meilleures, progression, ateliers] = await Promise.all([
    annotationsLecon(leconId),
    meilleuresNotes(leconId),
    progressionApprenant(),
    correctionsAteliers(leconId),
  ]);
  const terminee = progression.some(
    (p) => p.lesson_id === leconId && p.completed_at,
  );

  return (
    <>
      {apercu && (
        <p role="note" className={`${PANEL_SAND} p-4 text-small`}>
          {interpolate(t.diffusion.apercuTexte, { date })}
        </p>
      )}
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
          ateliers={ateliers}
          exercicesFermes={
            apercu ? interpolate(t.diffusion.exerciceFerme, { date }) : undefined
          }
        />
      </LiseuseLecon>
      {!apercu && <BoutonTerminer leconId={leconId} terminee={terminee} />}
      {!apercu && quiz && (
        <Link href={quiz.adresse} className={`${BUTTON_SECONDARY} self-start`}>
          {interpolate(t.quiz.passer, { n: String(quiz.numero) })}
        </Link>
      )}
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
  const derniere = mod.lecons[mod.lecons.length - 1]?.id === lecon.id;
  const quiz = derniere
    ? { adresse: `/strategie/cours/${mod.slug}/quiz`, numero: mod.numero }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-3">
        <nav className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/strategie/cours" className={BUTTON_TERTIARY}>
            ← {t.lecon.retour}
          </Link>
          <Link href="/strategie/cours/annotations" className={BUTTON_TERTIARY}>
            {t.annotations.lien}
          </Link>
        </nav>
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
        <ContenuPrive leconId={lecon.id} adresse={adresse} quiz={quiz} />
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
