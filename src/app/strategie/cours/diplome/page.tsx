/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/diplome)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: « Mon diplôme » : bilan de l'apprenant (moyenne des quiz, des exercices,
 *               examen, note finale pondérée), conditions du diplôme, confirmation du
 *               nom puis délivrance ; une fois délivré : numéro, mention, téléchargement
 *               du PDF (produit à la demande) et lien vers la page de vérification.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/{acces,note-finale}.ts, components/cours/diplome-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FormulaireDiplome } from "@/components/cours/diplome-form";
import { SansAcces } from "@/components/cours/sans-acces";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_TERTIARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { getCurrentProfile } from "@/lib/auth/dal";
import {
  bilanConnecte,
  diplomeApprenant,
  exigerConnexionCours,
  reglagesEvaluation,
  type Diplome,
} from "@/lib/cours/acces";
import type { Bilan, ReglagesEvaluation } from "@/lib/cours/note-finale";

import "../cours.css";

const t = getCourseDictionary();

/** Adresse de cette page (retour après connexion). */
const ADRESSE = "/strategie/cours/diplome";

export const metadata: Metadata = {
  title: t.diplome.titre,
  robots: { index: false },
};

/** Date lisible (« 20 novembre 2026 »). */
function dateDiplome(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Africa/Abidjan",
  }).format(new Date(iso));
}

// ==================== BILAN ====================

/** Tableau du bilan : chaque composante, son poids et la note finale. */
function TableauBilan({
  bilan,
  reglages,
  diplome,
}: {
  bilan: Bilan;
  reglages: ReglagesEvaluation;
  diplome: Diplome | null;
}) {
  // Une fois délivré, le diplôme garde les notes figées à sa délivrance
  const lignes = [
    [t.diplome.quiz, reglages.poidsQuiz, diplome?.quiz ?? bilan.quiz],
    [t.diplome.exercices, reglages.poidsExercices, diplome?.exercices ?? bilan.exercices],
    [t.diplome.examen, reglages.poidsExamen, diplome?.examen ?? bilan.examen],
  ] as const;
  const note = (n: number | null) =>
    n === null ? t.diplome.nonFait : interpolate(t.diplome.note, { score: String(n) });
  return (
    <table className="w-full text-left text-small">
      <caption className="sr-only">{t.diplome.bilan}</caption>
      <tbody className="divide-y divide-line">
        {lignes.map(([libelle, poids, valeur]) => (
          <tr key={libelle}>
            <th scope="row" className="py-2 font-normal">
              {libelle}
            </th>
            <td className="py-2 text-ink-muted">
              {interpolate(t.diplome.poids, { n: String(poids) })}
            </td>
            <td className="py-2 text-right">{note(valeur)}</td>
          </tr>
        ))}
        <tr>
          <th scope="row" className="py-2 font-semibold">
            {t.diplome.finale}
          </th>
          <td />
          <td className="py-2 text-right font-semibold">
            {note(diplome?.finale ?? bilan.finale)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ==================== DIPLÔME DÉLIVRÉ ====================

/** Diplôme délivré : numéro, mention, téléchargement et vérification. */
function DiplomeDelivre({ diplome }: { diplome: Diplome }) {
  return (
    <section className={`${PANEL_SAND} flex flex-col gap-3 p-6`}>
      <p className="font-serif text-h3">{diplome.nom}</p>
      <p>{interpolate(t.diplome.delivre, { date: dateDiplome(diplome.delivreLe) })}</p>
      <p>
        {interpolate(t.diplome.mention, {
          mention: t.diplome.mentions[diplome.mention],
        })}
      </p>
      <p className="font-mono text-small">
        {interpolate(t.diplome.numero, { numero: diplome.numero })}
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/strategie/cours/diplome/${diplome.numero}`}
          className={BUTTON_PRIMARY}
          download
        >
          {t.diplome.telecharger}
        </a>
        <Link
          href={`/strategie/cours/diplome/${diplome.numero}`}
          className={BUTTON_SECONDARY}
        >
          {t.diplome.verifier}
        </Link>
      </div>
      <p className="text-small text-ink-muted">{t.diplome.correction}</p>
    </section>
  );
}

// ==================== CONTENU PRIVÉ ====================

/** Bilan, puis formulaire ou diplôme, pour l'apprenant connecté. */
async function DiplomePrive() {
  const { user, acces } = await exigerConnexionCours(ADRESSE);
  if (!acces) return <SansAcces email={user.email} />;

  const [bilan, diplome, reglages, profil] = await Promise.all([
    bilanConnecte(),
    diplomeApprenant(),
    reglagesEvaluation(),
    getCurrentProfile(),
  ]);

  return (
    <>
      <section className={`${CARD} flex flex-col gap-3 p-5`}>
        <h2 className="font-serif text-h3">{t.diplome.bilan}</h2>
        <TableauBilan bilan={bilan} reglages={reglages} diplome={diplome} />
        {!diplome && (
          <>
            <p className="text-small text-ink-muted">
              {interpolate(t.diplome.conditions, {
                seuilQuiz: String(reglages.seuilQuiz),
                seuilExamen: String(reglages.seuilExamen),
              })}
            </p>
            <p className="text-small">
              {interpolate(t.diplome.quizReussis, {
                n: String(bilan.quizReussis),
                total: String(bilan.quizTotal),
              })}
              {" · "}
              {bilan.examenReussi ? t.diplome.examenFait : t.diplome.examenAFaire}
            </p>
          </>
        )}
      </section>

      {diplome ? (
        <DiplomeDelivre diplome={diplome} />
      ) : bilan.admissible ? (
        <section className={`${CARD} flex flex-col gap-3 p-5`}>
          <h2 className="font-serif text-h3">{t.diplome.nomTitre}</h2>
          <FormulaireDiplome nomPropose={profil?.display_name ?? ""} />
        </section>
      ) : (
        <p className={`${PANEL_SAND} p-6`}>{t.diplome.nonAdmissible}</p>
      )}
    </>
  );
}

// ==================== PAGE ====================

export default function DiplomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-3">
        <Link href="/strategie/cours" className={`${BUTTON_TERTIARY} self-start`}>
          ← {t.lecon.retour}
        </Link>
        <h1 className="font-serif text-h1 font-semibold">{t.diplome.titre}</h1>
      </header>

      {/* ==================== BILAN ET DIPLÔME ==================== */}
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <DiplomePrive />
      </Suspense>
    </main>
  );
}
