/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/examen)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Examen final du cours. L'en-tête est statique ; l'examen est réservé aux
 *               inscrits (connexion exigée, accès vérifié) et ne s'ouvre qu'après les
 *               13 quiz réussis. 3 essais espacés de 24 h ; fermé une fois le diplôme
 *               délivré. Le navigateur ne reçoit jamais les bonnes réponses.
 *               v0.44.0 : compte transmis à l'examen (brouillon des réponses).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/{acces,examen,note-finale,evaluation}.ts,
 *               components/cours/examen.tsx, cours.css
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ExamenFinal } from "@/components/cours/examen";
import { SansAcces } from "@/components/cours/sans-acces";
import {
  BUTTON_PRIMARY,
  BUTTON_TERTIARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import {
  bilanConnecte,
  etatExamenConnecte,
  exigerConnexionCours,
  reglagesEvaluation,
} from "@/lib/cours/acces";
import { versionPublique } from "@/lib/cours/evaluation";
import { CAS_EXAMEN, QUESTIONS_EXAMEN } from "@/lib/cours/examen";
import { ESSAIS_EXAMEN } from "@/lib/cours/note-finale";

import "../cours.css";

const t = getCourseDictionary();

/** Adresse de cette page (retour après connexion). */
const ADRESSE = "/strategie/cours/examen";

export const metadata: Metadata = {
  title: t.examen.titre,
  robots: { index: false },
};

/** Date et heure lisibles (fuseau d'Abidjan, celui de la plupart des cohortes). */
function dateHeure(ms: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(ms));
}

// ==================== CONTENU PRIVÉ ====================

/** Le cas, à lire avant de répondre. */
function Cas() {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-5`}>
      <h2 className="font-serif text-h3">
        {t.examen.cas} : {CAS_EXAMEN.titre}
      </h2>
      {CAS_EXAMEN.paragraphes.map((p) => (
        <p key={p.slice(0, 24)}>{p}</p>
      ))}
    </section>
  );
}

/** Examen pour l'apprenant connecté, selon son état (verrouillé, ouvert, en attente…). */
async function ExamenPrive() {
  const { user, acces } = await exigerConnexionCours(ADRESSE);
  if (!acces) return <SansAcces email={user.email} />;

  const [bilan, etat, reglages] = await Promise.all([
    bilanConnecte(),
    etatExamenConnecte(),
    reglagesEvaluation(),
  ]);

  const intro = (
    <p className="text-small text-ink-muted">
      {interpolate(t.examen.intro, {
        n: String(QUESTIONS_EXAMEN.length),
        seuil: String(reglages.seuilExamen),
        essais: String(ESSAIS_EXAMEN),
      })}
    </p>
  );

  const meilleure = bilan.examen !== null && (
    <p className="text-small text-ink-muted">
      {interpolate(t.examen.meilleure, { score: String(bilan.examen) })}
    </p>
  );
  const versDiplome = bilan.admissible && (
    <Link href="/strategie/cours/diplome" className={`${BUTTON_PRIMARY} self-start`}>
      {t.examen.versDiplome}
    </Link>
  );

  if (etat.etat !== "ouvert") {
    const texte =
      etat.etat === "verrouille"
        ? interpolate(t.examen.verrouille, {
            n: String(bilan.quizReussis),
            total: String(bilan.quizTotal),
          })
        : etat.etat === "attente"
          ? interpolate(t.examen.attente, { date: dateHeure(etat.prochain) })
          : etat.etat === "epuise"
            ? interpolate(t.examen.epuise, { essais: String(ESSAIS_EXAMEN) })
            : t.examen.termine;
    return (
      <div className={`${PANEL_SAND} flex flex-col gap-3 p-6`}>
        {intro}
        <p>{texte}</p>
        {etat.etat === "attente" && (
          <p className="text-small text-ink-muted">
            {interpolate(t.examen.restants, { n: String(etat.restants) })}
          </p>
        )}
        {meilleure}
        {versDiplome}
      </div>
    );
  }

  return (
    <>
      {intro}
      <p className="text-small text-ink-muted">
        {interpolate(t.examen.restants, { n: String(etat.restants) })}
      </p>
      {meilleure}
      {versDiplome}
      <Cas />
      <h2 className="font-serif text-h2">{t.examen.questions}</h2>
      <ExamenFinal
        questions={QUESTIONS_EXAMEN.map(versionPublique)}
        seuil={reglages.seuilExamen}
        essais={ESSAIS_EXAMEN}
        compte={user.id}
      />
    </>
  );
}

// ==================== PAGE ====================

export default function ExamenPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-3">
        <Link href="/strategie/cours" className={`${BUTTON_TERTIARY} self-start`}>
          ← {t.lecon.retour}
        </Link>
        <h1 className="font-serif text-h1 font-semibold">{t.examen.titre}</h1>
      </header>

      {/* ==================== EXAMEN ==================== */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ExamenPrive />
      </Suspense>
    </main>
  );
}
