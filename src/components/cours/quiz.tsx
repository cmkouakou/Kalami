/**
 * =============================================================
 *  Fichier    : quiz.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz de module interactif. Le navigateur ne reçoit que la version
 *               « publique » des questions (sans réponses) ; le serveur corrige
 *               (soumettreQuiz) et ne renvoie le corrigé complet qu'en cas de réussite.
 *               En cas d'échec, seule la note globale s'affiche. Essais
 *               illimités ; la meilleure note compte. v0.38.0 : squelette() et
 *               Question exportés pour l'examen final.
 *               v0.43.0 : rang de la tentative en bas du quiz (« 3e tentative »).
 *               v0.44.0 : réponses gardées en brouillon jusqu'à l'envoi.
 *               v0.46.0 : après une réussite, « Module N terminé » (ou leçons restantes)
 *               et lien vers le module suivant ou l'examen.
 *               v0.50.0 : plus de note par question sous les réponses ; à partir du
 *               3e échec, les leçons à revoir s'affichent avec leur lien.
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-11-21
 *  Dépendances: components/cours/exercices.tsx, lib/cours/actions.ts,
 *               lib/cours/evaluation.ts, lib/cours/brouillon.ts, use-brouillon.ts,
 *               i18n/course.ts
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  Classement,
  Decompte,
  Qcm,
  VraiFaux,
  construire,
  reponseVide,
  type Notable,
} from "@/components/cours/exercices";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { soumettreQuiz } from "@/lib/cours/actions";
import {
  brouillonReponses,
  cleBrouillon,
  lireReponses,
} from "@/lib/cours/brouillon";
import type { QuestionQuiz } from "@/lib/cours/content";
import {
  reponseModele,
  type QuestionPublique,
} from "@/lib/cours/evaluation";

import { useBrouillon } from "./use-brouillon";
import type { Correction, Reponse } from "@/lib/cours/notation";
import type { LeconARevoir } from "@/lib/cours/quiz/lecons";

const t = getCourseDictionary();

export type Valeurs = (number | boolean | null)[];

/** Corrigé affichable : questions complètes, réponses et corrections. */
type Corrige = {
  questions: QuestionQuiz[];
  valeurs: Valeurs[];
  corrections: Correction[];
};

type Props = {
  moduleId: string;
  questions: QuestionPublique[];
  seuil: number;
  /** Meilleure note déjà obtenue (null : jamais tenté). */
  meilleure: number | null;
  /** Compte connecté : clé du brouillon (absent : rien n'est gardé). */
  compte?: string;
  /** Tentatives déjà enregistrées (0 : jamais tenté). */
  essais: number;
  /** Corrigé modèle, fourni seulement si le quiz a déjà été réussi. */
  corrigeModele: QuestionQuiz[] | null;
  /** Numéro du module (message « Module N terminé »). */
  numero?: number;
  /** Leçons du module pas encore terminées (0 : toutes terminées). */
  leconsRestantes?: number;
  /** Étape suivante proposée après une réussite (module suivant ou examen). */
  suite?: { adresse: string; libelle: string } | null;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Squelette complet d'une question publique, pour la saisie : les champs de réponse
 * sont fictifs et ne sont jamais lus tant qu'aucune correction n'est affichée.
 * @param q - Question sans réponses
 */
export function squelette(q: QuestionPublique): Notable {
  if (q.type === "qcm") {
    return {
      type: "qcm",
      id: q.id,
      question: q.question,
      choix: q.choix.map((texte) => ({ texte, explication: "" })),
      bonne: -1,
    };
  }
  if (q.type === "vrai-faux") {
    return {
      type: "vrai-faux",
      id: q.id,
      consigne: q.consigne,
      affirmations: q.affirmations.map((texte) => ({ texte, vrai: false, explication: "" })),
    };
  }
  return {
    type: "classement",
    id: q.id,
    consigne: q.consigne,
    categories: q.categories,
    elements: q.elements.map((texte) => ({ texte, categorie: -1 })),
  };
}

/** Valeurs de saisie correspondant à une réponse. */
function valeursDe(r: Reponse): Valeurs {
  if (r.type === "qcm") return [r.choix];
  if (r.type === "vrai-faux") return [...r.valeurs];
  if (r.type === "classement") return [...r.categories];
  return [];
}

/**
 * Corrigé modèle : chaque question avec sa bonne réponse, toutes parties justes.
 * @param questions - Questions complètes
 */
function corrigeDepuisModele(questions: QuestionQuiz[]): Corrige {
  return {
    questions,
    valeurs: questions.map((q) => valeursDe(reponseModele(q))),
    corrections: questions.map((q) => ({
      score: 100,
      justes: valeursDe(reponseModele(q)).map(() => true),
    })),
  };
}

// ==================== QUESTION ====================

/** Une question : saisie, ou corrigé quand une correction est fournie. */
export function Question({
  ex,
  valeurs,
  correction,
  onChoix,
}: {
  ex: Notable;
  valeurs: Valeurs;
  correction: Correction | null;
  onChoix: (i: number, v: number | boolean) => void;
}) {
  if (ex.type === "qcm") {
    return (
      <Qcm
        ex={ex}
        valeur={valeurs[0] as number | null}
        correction={correction}
        onChoix={(v) => onChoix(0, v)}
      />
    );
  }
  if (ex.type === "vrai-faux") {
    return (
      <VraiFaux
        ex={ex}
        valeurs={valeurs as (boolean | null)[]}
        correction={correction}
        onChoix={onChoix}
      />
    );
  }
  return (
    <Classement
      ex={ex}
      valeurs={valeurs as (number | null)[]}
      correction={correction}
      onChoix={onChoix}
    />
  );
}

// ==================== QUIZ ====================

/** Quiz de module : saisie, envoi, note, corrigé après réussite. */
export function QuizModule({
  moduleId,
  questions,
  seuil,
  meilleure,
  compte,
  essais,
  corrigeModele,
  numero,
  leconsRestantes = 0,
  suite = null,
}: Props) {
  const [squelettes] = useState(() => questions.map(squelette));
  const [valeurs, setValeurs] = useState<Valeurs[]>(() => squelettes.map(reponseVide));
  const [aRevoir, setARevoir] = useState<LeconARevoir[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [corrige, setCorrige] = useState<Corrige | null>(null);
  const [record, setRecord] = useState(meilleure);
  const [nbEssais, setNbEssais] = useState(essais);
  const [modele, setModele] = useState(corrigeModele);
  const [voirModele, setVoirModele] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();
  const effacerBrouillon = useBrouillon(
    compte ? cleBrouillon(compte, `${moduleId}-quiz`) : null,
    valeurs,
    {
      lire: (brut) => lireReponses(brut, squelettes),
      appliquer: setValeurs,
      aGarder: (v) => brouillonReponses(squelettes, v),
    },
  );

  const termine = score !== null;

  /** Change la réponse d'une partie d'une question (bloqué après l'envoi). */
  const choisir = (q: number, i: number, v: number | boolean) => {
    if (termine) return;
    setValeurs((prev) =>
      prev.map((vals, j) => (j === q ? vals.map((x, k) => (k === i ? v : x)) : vals)),
    );
    setMessage(null);
  };

  /** Envoie toutes les réponses au serveur. */
  const valider = () => {
    const reponses = squelettes.map((ex, i) => construire(ex, valeurs[i]));
    if (reponses.some((r) => r === null)) {
      setMessage(t.quiz.incomplet);
      return;
    }
    startEnvoi(async () => {
      const r = await soumettreQuiz(moduleId, reponses);
      if (!r.ok) {
        setMessage(r.error);
        return;
      }
      effacerBrouillon();
      setScore(r.score);
      setARevoir(r.aRevoir ?? []);
      setRecord((m) => Math.max(m ?? 0, r.score));
      setNbEssais((n) => n + 1);
      if (r.reussi && r.questions && r.corrections) {
        setCorrige({ questions: r.questions, valeurs, corrections: r.corrections });
        setModele(r.questions);
      }
    });
  };

  /** Efface les réponses pour un nouvel essai. */
  const recommencer = () => {
    setValeurs(squelettes.map(reponseVide));
    setScore(null);
    setARevoir([]);
    setCorrige(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const affiche =
    corrige ?? (voirModele && modele && !termine ? corrigeDepuisModele(modele) : null);

  return (
    <div className="flex flex-col gap-5">
      {modele && !termine && (
        <button
          type="button"
          onClick={() => setVoirModele((v) => !v)}
          aria-expanded={voirModele}
          className={`${BUTTON_SECONDARY} self-start`}
        >
          {voirModele ? t.quiz.masquerCorrige : t.quiz.voirCorrige}
        </button>
      )}

      <ol className="flex flex-col gap-5">
        {squelettes.map((ex, i) => {
          return (
            <li key={ex.id}>
              <section
                className={`${CARD} flex flex-col gap-4 p-5`}
                aria-label={interpolate(t.quiz.question, { n: String(i + 1) })}
              >
                <p className="text-caption font-semibold uppercase text-encre">
                  {interpolate(t.quiz.question, { n: String(i + 1) })}
                </p>
                {affiche ? (
                  <Question
                    ex={affiche.questions[i]}
                    valeurs={affiche.valeurs[i]}
                    correction={affiche.corrections[i]}
                    onChoix={() => undefined}
                  />
                ) : (
                  <Question
                    ex={ex}
                    valeurs={valeurs[i]}
                    correction={null}
                    onChoix={(k, v) => choisir(i, k, v)}
                  />
                )}
              </section>
            </li>
          );
        })}
      </ol>

      {termine && (
        <div
          className={`rounded-md p-4 ${corrige ? "bg-success-soft" : "bg-sand"}`}
          role="status"
        >
          <p className="font-semibold">
            {interpolate(t.quiz.score, { score: String(score) })}
          </p>
          <p className="text-small">
            {corrige
              ? t.quiz.reussi
              : interpolate(t.quiz.echoue, { seuil: String(seuil) })}
          </p>
          {!corrige && aRevoir.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-small font-semibold">{t.quiz.aRevoir}</p>
              <ul className="flex flex-col gap-1">
                {aRevoir.map((l) => (
                  <li key={l.adresse}>
                    <Link href={l.adresse} className="text-small text-encre underline">
                      {interpolate(t.quiz.leconARevoir, {
                        n: String(l.numero),
                        titre: l.titre,
                      })}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {corrige && numero !== undefined && (
            <p className="mt-2 text-small font-semibold">
              {leconsRestantes === 0
                ? interpolate(t.quiz.moduleTermine, { n: String(numero) })
                : interpolate(t.quiz.lecons, { n: String(leconsRestantes) })}
            </p>
          )}
          {corrige && suite && (
            <Link href={suite.adresse} className={`${BUTTON_PRIMARY} mt-3 inline-flex`}>
              {suite.libelle}
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {termine ? (
          <button type="button" onClick={recommencer} className={BUTTON_SECONDARY}>
            {t.quiz.recommencer}
          </button>
        ) : (
          !voirModele && (
            <button
              type="button"
              onClick={valider}
              disabled={envoi}
              className={BUTTON_PRIMARY}
            >
              {envoi ? t.quiz.envoi : t.quiz.valider}
            </button>
          )
        )}
        {record !== null && (
          <span className="text-small text-ink-muted">
            {interpolate(t.quiz.meilleure, { score: String(record) })}
          </span>
        )}
      </div>
      <Decompte essais={nbEssais} corrige={termine} />
      <p
        role="alert"
        aria-live="polite"
        className="text-small text-danger empty:hidden"
      >
        {message}
      </p>
    </div>
  );
}
