/**
 * =============================================================
 *  Fichier    : examen.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Examen final interactif. Le navigateur ne reçoit que la version
 *               « publique » des questions ; le serveur corrige (soumettreExamen) et ne
 *               renvoie que la note et les numéros des questions manquées, jamais les
 *               bonnes réponses. La remise se fait en deux temps (confirmation dans la
 *               page) puisque chaque essai compte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: components/cours/{exercices,quiz}.tsx, lib/cours/actions.ts
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { construire, reponseVide } from "@/components/cours/exercices";
import { Question, squelette, type Valeurs } from "@/components/cours/quiz";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { soumettreExamen } from "@/lib/cours/actions";
import type { QuestionPublique } from "@/lib/cours/evaluation";

const t = getCourseDictionary();

type Props = {
  questions: QuestionPublique[];
  seuil: number;
  /** Nombre d'essais permis (affiché dans la confirmation). */
  essais: number;
};

/** Résultat affiché après la remise. */
type Bilan = { score: number; reussi: boolean; manquees: number[] };

// ==================== EXAMEN ====================

/** Examen final : saisie, confirmation, remise, note et questions manquées. */
export function ExamenFinal({ questions, seuil, essais }: Props) {
  const [squelettes] = useState(() => questions.map(squelette));
  const [valeurs, setValeurs] = useState<Valeurs[]>(() => squelettes.map(reponseVide));
  const [confirmation, setConfirmation] = useState(false);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();

  /** Change la réponse d'une partie d'une question (bloqué après la remise). */
  const choisir = (q: number, i: number, v: number | boolean) => {
    if (bilan) return;
    setValeurs((prev) =>
      prev.map((vals, j) => (j === q ? vals.map((x, k) => (k === i ? v : x)) : vals)),
    );
    setMessage(null);
    setConfirmation(false);
  };

  /** Premier clic : vérifie que tout est rempli, puis demande confirmation. */
  const preparer = () => {
    const reponses = squelettes.map((ex, i) => construire(ex, valeurs[i]));
    if (reponses.some((r) => r === null)) {
      setMessage(t.examen.incomplet);
      return;
    }
    setConfirmation(true);
  };

  /** Second clic : envoie toutes les réponses au serveur. */
  const remettre = () => {
    const reponses = squelettes.map((ex, i) => construire(ex, valeurs[i]));
    startEnvoi(async () => {
      const r = await soumettreExamen(reponses);
      setConfirmation(false);
      if (!r.ok) {
        setMessage(r.error);
        return;
      }
      setBilan({ score: r.score, reussi: r.reussi, manquees: r.manquees });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {bilan && (
        <div
          className={`flex flex-col gap-2 rounded-md p-4 ${
            bilan.reussi ? "bg-success-soft" : "bg-sand"
          }`}
          role="status"
        >
          <p className="font-semibold">
            {interpolate(t.examen.score, { score: String(bilan.score) })}
          </p>
          <p className="text-small">
            {bilan.reussi
              ? t.examen.reussi
              : interpolate(t.examen.echoue, { seuil: String(seuil) })}
          </p>
          <p className="text-small">
            {bilan.manquees.length
              ? interpolate(t.examen.manquees, { liste: bilan.manquees.join(", ") })
              : t.examen.aucuneManquee}
          </p>
          {bilan.reussi && (
            <Link href="/strategie/cours/diplome" className={`${BUTTON_PRIMARY} self-start`}>
              {t.examen.versDiplome}
            </Link>
          )}
        </div>
      )}

      <ol className="flex flex-col gap-5">
        {squelettes.map((ex, i) => (
          <li key={ex.id}>
            <section
              className={`${CARD} flex flex-col gap-4 p-5`}
              aria-label={interpolate(t.quiz.question, { n: String(i + 1) })}
            >
              <p className="text-caption font-semibold uppercase text-encre">
                {interpolate(t.quiz.question, { n: String(i + 1) })}
              </p>
              <Question
                ex={ex}
                valeurs={valeurs[i]}
                correction={null}
                onChoix={(k, v) => choisir(i, k, v)}
              />
            </section>
          </li>
        ))}
      </ol>

      {!bilan && (
        <div className="flex flex-col gap-3">
          {confirmation && (
            <p className="text-small font-semibold">
              {interpolate(t.examen.confirmer, { essais: String(essais) })}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {confirmation ? (
              <>
                <button
                  type="button"
                  onClick={remettre}
                  disabled={envoi}
                  className={BUTTON_PRIMARY}
                >
                  {envoi ? t.examen.envoi : t.examen.valider}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmation(false)}
                  disabled={envoi}
                  className={BUTTON_SECONDARY}
                >
                  {t.examen.continuer}
                </button>
              </>
            ) : (
              <button type="button" onClick={preparer} className={BUTTON_PRIMARY}>
                {t.examen.valider}
              </button>
            )}
          </div>
        </div>
      )}
      <p role="alert" aria-live="polite" className="text-small text-danger empty:hidden">
        {message}
      </p>
    </div>
  );
}
