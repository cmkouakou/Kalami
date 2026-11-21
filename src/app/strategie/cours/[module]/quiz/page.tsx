/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/[module]/quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz de fin de module. L'en-tête est statique (un quiz par module,
 *               généré à la construction) ; le quiz est réservé aux inscrits : connexion
 *               exigée, accès vérifié, ouverture quand toutes les leçons du module sont
 *               ouvertes. Le navigateur ne reçoit les bonnes réponses que si le quiz a
 *               déjà été réussi. v0.38.0 : seuil de réussite lu dans les réglages.
 *               v0.43.0 : nombre de tentatives transmis au quiz (décompte en bas).
 *               v0.44.0 : compte transmis au quiz (brouillon des réponses).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/*, components/cours/quiz.tsx, cours.css
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QuizModule } from "@/components/cours/quiz";
import { SansAcces } from "@/components/cours/sans-acces";
import { BUTTON_TERTIARY, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import {
  diffusionApprenant,
  exigerConnexionCours,
  reglagesEvaluation,
  resultatsQuizApprenant,
} from "@/lib/cours/acces";
import {
  estReussi,
  quizOuvert,
  versionPublique,
} from "@/lib/cours/evaluation";
import { MODULES, type ModuleInfo } from "@/lib/cours/modules";
import { quizDe } from "@/lib/cours/quiz";

import "../../cours.css";

const t = getCourseDictionary();

/** Un quiz par module, généré à la construction. */
export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.slug }));
}

/** Module correspondant à l'adresse, s'il a un quiz. */
function moduleDuQuiz(slug: string): ModuleInfo | null {
  const mod = MODULES.find((m) => m.slug === slug);
  return mod && quizDe(mod.id) ? mod : null;
}

/** Titre de l'onglet : « Quiz du module N ». */
export async function generateMetadata({
  params,
}: PageProps<"/strategie/cours/[module]/quiz">): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = moduleDuQuiz(slug);
  return {
    title: mod ? interpolate(t.quiz.titre, { n: String(mod.numero) }) : t.title,
  };
}

// ==================== CONTENU PRIVÉ ====================

/** Quiz pour l'apprenant connecté ; fermé tant que le module n'est pas ouvert. */
async function QuizPrive({ mod, adresse }: { mod: ModuleInfo; adresse: string }) {
  const { user, acces } = await exigerConnexionCours(adresse);
  if (!acces) return <SansAcces email={user.email} />;

  const questions = quizDe(mod.id);
  if (!questions) notFound();

  const { etats } = await diffusionApprenant();
  if (!quizOuvert(mod.lecons.map((l) => l.id), etats)) {
    return <p className={`${PANEL_SAND} p-6`}>{t.quiz.verrouille}</p>;
  }

  const [quiz, { seuilQuiz }] = await Promise.all([
    resultatsQuizApprenant(),
    reglagesEvaluation(),
  ]);
  const resultat = quiz.get(mod.id) ?? null;
  const meilleure = resultat?.meilleure ?? null;

  return (
    <>
      <p className="text-small text-ink-muted">
        {interpolate(t.quiz.intro, {
          n: String(questions.length),
          seuil: String(seuilQuiz),
        })}
      </p>
      <QuizModule
        moduleId={mod.id}
        questions={questions.map(versionPublique)}
        seuil={seuilQuiz}
        meilleure={meilleure}
        essais={resultat?.essais ?? 0}
        compte={user.id}
        corrigeModele={estReussi(meilleure, seuilQuiz) ? [...questions] : null}
      />
    </>
  );
}

// ==================== PAGE ====================

export default async function QuizPage({
  params,
}: PageProps<"/strategie/cours/[module]/quiz">) {
  const { module: slug } = await params;
  const mod = moduleDuQuiz(slug);
  if (!mod) notFound();
  const adresse = `/strategie/cours/${mod.slug}/quiz`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-3">
        <Link href="/strategie/cours" className={`${BUTTON_TERTIARY} self-start`}>
          ← {t.lecon.retour}
        </Link>
        <p className="text-caption uppercase text-ink-muted">{mod.titre}</p>
        <h1 className="font-serif text-h1 font-semibold">
          {interpolate(t.quiz.titre, { n: String(mod.numero) })}
        </h1>
      </header>

      {/* ==================== QUIZ ==================== */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <QuizPrive mod={mod} adresse={adresse} />
      </Suspense>
    </main>
  );
}
