/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Accueil du cours : présentation, programme (13 modules), et pour
 *               l'apprenant connecté sa progression (leçons terminées, pourcentage,
 *               temps de formation), le lien « Reprendre » et l'état de chaque leçon.
 *               Le programme est public ; la partie personnelle est chargée à part.
 *               v0.33.0 : diffusion programmée (leçons à venir verrouillées, avec leur
 *               date ; prochaine leçon en lecture en avance). v0.37.0 : ligne « Quiz du
 *               module » sous chaque module (meilleure note, réussi ou à faire).
 *               v0.38.0 : carte « Examen final et diplôme » ; seuil des quiz réglable.
 *  Auteur     : Claude Marcel
 *  Version    : 1.4 (v0.33.0 : diffusion ; v0.37.0 : quiz ; v0.38.0 : examen)
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/*, lib/auth/dal.ts, components/cours/sans-acces.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SansAcces } from "@/components/cours/sans-acces";
import {
  BADGE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import {
  aAccesAuCours,
  bilanConnecte,
  diffusionApprenant,
  diplomeApprenant,
  progressionApprenant,
  reglagesEvaluation,
  resultatsQuizApprenant,
} from "@/lib/cours/acces";
import {
  dateLisible,
  type EtatDiffusion,
  type Fuseau,
} from "@/lib/cours/calendrier";
import {
  estReussi,
  quizOuvert,
  type ResultatQuiz,
} from "@/lib/cours/evaluation";
import { estRedigee } from "@/lib/cours/lecons";
import type { Bilan } from "@/lib/cours/note-finale";
import { LECONS, MODULES, adresseLecon, leconParId } from "@/lib/cours/modules";
import {
  dureeLisible,
  synthese,
  type LigneProgression,
} from "@/lib/cours/notation";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath } from "@/lib/auth/routes";

const t = getCourseDictionary();

/** Adresse de cette page (retour après connexion). */
const ACCUEIL = "/strategie/cours";

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
};

/** État d'une leçon pour l'apprenant. */
type Etat = "terminee" | "enCours";

/** Diffusion programmée de la cohorte de l'apprenant (absente : tout est ouvert). */
type Diffusion = { etats: Map<string, EtatDiffusion>; fuseau: Fuseau };

/**
 * Mention de diffusion d'une leçon : date d'ouverture si fermée, lecture en avance.
 * @param d - État de la leçon et fuseau de la cohorte
 */
function mentionDiffusion(
  d: EtatDiffusion | undefined,
  fuseau: Fuseau | undefined,
): string | null {
  if (!d || !fuseau) return null;
  if (d.etat === "apercu") return t.diffusion.lectureAvance;
  if (d.etat === "fermee" && d.ouvreLe) {
    return interpolate(t.diffusion.disponibleLe, {
      date: dateLisible(d.ouvreLe, fuseau),
    });
  }
  return null;
}

// ==================== PROGRAMME ====================

/** Ligne « Quiz du module » : lien si ouvert, meilleure note ou « à faire ». */
function LigneQuiz({
  mod,
  resultat,
  ouvert,
  seuil,
}: {
  mod: (typeof MODULES)[number];
  resultat: ResultatQuiz | undefined;
  ouvert: boolean;
  seuil: number;
}) {
  const libelle = interpolate(t.quiz.titre, { n: String(mod.numero) });
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      {ouvert ? (
        <Link
          href={`/strategie/cours/${mod.slug}/quiz`}
          className="font-semibold text-encre underline-offset-4 hover:underline"
        >
          {libelle}
        </Link>
      ) : (
        <span className="text-ink-muted">{libelle}</span>
      )}
      <span className="flex items-center gap-2 text-small text-ink-muted">
        {resultat && estReussi(resultat.meilleure, seuil) && (
          <span className={BADGE}>{t.quiz.reussiBadge}</span>
        )}
        {resultat
          ? interpolate(t.quiz.meilleure, { score: String(resultat.meilleure) })
          : ouvert && t.quiz.aFaire}
      </span>
    </li>
  );
}

/** Programme complet ; avec les états de l'apprenant quand ils sont connus. */
function Programme({
  etats,
  diffusion,
  quiz,
  seuilQuiz = 70,
}: {
  etats?: Map<string, Etat>;
  diffusion?: Diffusion;
  /** Résultats aux quiz : présent seulement pour un apprenant qui a accès. */
  quiz?: Map<string, ResultatQuiz>;
  /** Seuil de réussite des quiz (réglages d'évaluation). */
  seuilQuiz?: number;
}) {
  return (
    <ol className="flex flex-col gap-4">
      {MODULES.map((m) => (
        <li key={m.id} className={`${CARD} flex flex-col gap-3 p-5`}>
          <div className="flex flex-col gap-1">
            <p className="text-caption uppercase text-ink-muted">
              {interpolate(t.accueil.module, { n: String(m.numero) })}
              {" · "}
              {interpolate(t.accueil.chapitre, { n: String(m.chapitreLivre) })}
            </p>
            <h2 className="font-serif text-h3">{m.titre}</h2>
          </div>
          <ol className="flex flex-col divide-y divide-line">
            {m.lecons.map((l) => {
              const etat = etats?.get(l.id);
              const d = diffusion?.etats.get(l.id);
              const mention = mentionDiffusion(d, diffusion?.fuseau);
              const lisible = estRedigee(l.id) && d?.etat !== "fermee";
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  {lisible ? (
                    <Link
                      href={adresseLecon(m, l)}
                      className="text-encre underline-offset-4 hover:underline"
                    >
                      {l.numero}. {l.titre}
                    </Link>
                  ) : (
                    <span className="text-ink-muted">
                      {l.numero}. {l.titre}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-small text-ink-muted">
                    {etat && <span className={BADGE}>{t.accueil[etat]}</span>}
                    {mention && <span className={BADGE}>{mention}</span>}
                    {!estRedigee(l.id) && <span>{t.accueil.bientot}</span>}
                    {interpolate(t.accueil.minutes, { n: String(l.minutes) })}
                  </span>
                </li>
              );
            })}
            {quiz && (
              <LigneQuiz
                mod={m}
                resultat={quiz.get(m.id)}
                seuil={seuilQuiz}
                ouvert={quizOuvert(
                  m.lecons.map((l) => l.id),
                  diffusion?.etats ?? new Map(),
                )}
              />
            )}
          </ol>
        </li>
      ))}
    </ol>
  );
}

// ==================== PROGRESSION ====================

/**
 * Leçon à reprendre : première commencée non terminée, sinon première non terminée,
 * parmi les leçons rédigées et ouvertes (ou lues en avance).
 */
function aReprendre(lignes: LigneProgression[], diffusion?: Diffusion) {
  const terminees = new Set(
    lignes.filter((l) => l.completed_at).map((l) => l.lesson_id),
  );
  const commencees = new Set(lignes.map((l) => l.lesson_id));
  const restantes = LECONS.filter(
    (l) =>
      !terminees.has(l.id) &&
      estRedigee(l.id) &&
      diffusion?.etats.get(l.id)?.etat !== "fermee",
  );
  const lecon = restantes.find((l) => commencees.has(l.id)) ?? restantes[0];
  return lecon ? leconParId(lecon.id) : null;
}

/** Panneau de progression de l'apprenant. */
function Progression({
  lignes,
  diffusion,
}: {
  lignes: LigneProgression[];
  diffusion?: Diffusion;
}) {
  const s = synthese(lignes);
  const reprise = aReprendre(lignes, diffusion);
  return (
    <section className={`${PANEL_SAND} flex flex-col gap-4 p-6`}>
      <h2 className="font-serif text-h2">{t.accueil.progression}</h2>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s.pourcentage}
        aria-label={t.accueil.progression}
        className="h-3 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full bg-encre"
          style={{ width: `${s.pourcentage}%` }}
        />
      </div>
      <p>
        <span className="font-semibold">{s.pourcentage} %</span>
        {" · "}
        {interpolate(t.accueil.terminees, {
          n: String(s.terminees),
          total: String(s.total),
        })}
        {" · "}
        {interpolate(t.accueil.temps, { duree: dureeLisible(s.secondes) })}
      </p>
      {reprise && (
        <Link
          href={adresseLecon(reprise.module, reprise.lecon)}
          className={`${BUTTON_PRIMARY} self-start`}
        >
          {lignes.length === 0
            ? t.accueil.commencer
            : interpolate(t.accueil.reprendre, { titre: reprise.lecon.titre })}
        </Link>
      )}
    </section>
  );
}

// ==================== EXAMEN ET DIPLÔME ====================

/** Carte de fin de cours : quiz réussis, examen et diplôme. */
function FinDuCours({ bilan, diplome }: { bilan: Bilan; diplome: boolean }) {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-5`}>
      <h2 className="font-serif text-h3">{t.examen.carte}</h2>
      <p className="text-small text-ink-muted">
        {interpolate(t.diplome.quizReussis, {
          n: String(bilan.quizReussis),
          total: String(bilan.quizTotal),
        })}
        {" · "}
        {bilan.examenReussi ? t.diplome.examenFait : t.diplome.examenAFaire}
      </p>
      <div className="flex flex-wrap gap-3">
        {!diplome && (
          <Link href="/strategie/cours/examen" className={BUTTON_SECONDARY}>
            {t.examen.lien}
          </Link>
        )}
        {(bilan.admissible || diplome) && (
          <Link href="/strategie/cours/diplome" className={BUTTON_PRIMARY}>
            {t.diplome.lien}
          </Link>
        )}
      </div>
    </section>
  );
}

/** Partie personnelle : connexion, accès, progression et programme annoté. */
async function EspaceApprenant({
  searchParams,
}: {
  searchParams: PageProps<"/strategie/cours">["searchParams"];
}) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) {
    return (
      <>
        <Link
          href={authPath("connexion", ACCUEIL)}
          className={`${BUTTON_PRIMARY} self-start`}
        >
          {t.erreurs.connexion}
        </Link>
        <Programme />
      </>
    );
  }
  if (!(await aAccesAuCours())) {
    return (
      <>
        <SansAcces email={user.email} paiementAnnule={query.paiement === "annule"} />
        <Programme />
      </>
    );
  }

  const [lignes, { calendrier, etats: etatsDiffusion }, quiz, reglages, bilan, diplome] =
    await Promise.all([
      progressionApprenant(),
      diffusionApprenant(),
      resultatsQuizApprenant(),
      reglagesEvaluation(),
      bilanConnecte(),
      diplomeApprenant(),
    ]);
  const etats = new Map<string, Etat>(
    lignes.map((l) => [l.lesson_id, l.completed_at ? "terminee" : "enCours"]),
  );
  const diffusion = calendrier
    ? { etats: etatsDiffusion, fuseau: calendrier.fuseau }
    : undefined;
  return (
    <>
      <Progression lignes={lignes} diffusion={diffusion} />
      <Programme
        etats={etats}
        diffusion={diffusion}
        quiz={quiz}
        seuilQuiz={reglages.seuilQuiz}
      />
      <FinDuCours bilan={bilan} diplome={diplome !== null} />
    </>
  );
}

// ==================== PAGE ====================

export default function CoursPage({ searchParams }: PageProps<"/strategie/cours">) {
  return (
    <main className="flex flex-col gap-10">
      {/* ==================== PRÉSENTATION ==================== */}
      <header className="flex flex-col gap-3">
        <p className="text-caption uppercase text-ink-muted">
          {t.accueil.eyebrow}
        </p>
        <h1 className="font-serif text-h1 font-semibold">{t.title}</h1>
        <p className="max-w-2xl text-ink-muted">{t.description}</p>
      </header>

      {/* ==================== PROGRESSION ET PROGRAMME ==================== */}
      <Suspense fallback={<Programme />}>
        <EspaceApprenant searchParams={searchParams} />
      </Suspense>

      <p className="max-w-2xl text-small text-ink-muted">{t.privacy}</p>
    </main>
  );
}
