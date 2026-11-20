/**
 * =============================================================
 *  Fichier    : exercices.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Exercices interactifs d'une leçon : QCM, vrai ou faux, classement et
 *               question ouverte. La réponse est corrigée par le serveur (actions.ts),
 *               qui renvoie la note et la justesse de chaque partie ; les explications
 *               s'affichent alors. Une question ouverte révèle son corrigé modèle.
 *               v0.37.0 : composants de saisie exportés pour les quiz de module.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/actions.ts, lib/cours/content.ts, i18n/course.ts
 * =============================================================
 */

"use client";

import { useState, useTransition, type ReactNode } from "react";

import { InlineText } from "@/components/powerbi/inline-text";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  CONTROL,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { soumettreReponse } from "@/lib/cours/actions";
import type {
  ClassementExercice,
  Exercice,
  OuvertExercice,
  QcmExercice,
  VraiFauxExercice,
} from "@/lib/cours/content";
import type { Correction, Reponse } from "@/lib/cours/notation";

const t = getCourseDictionary();

type Props = {
  leconId: string;
  numero: number;
  exercice: Exercice;
  /** Meilleure note déjà obtenue (null : jamais tenté). */
  meilleure: number | null;
};

// ==================== CADRE ====================

/** Exercice affiché dans sa carte, avec son numéro. */
export function ExerciceCours({ leconId, numero, exercice, meilleure }: Props) {
  return (
    <section
      className={`${CARD} flex flex-col gap-4 p-5`}
      aria-label={interpolate(t.exercices.exercice, { n: String(numero) })}
    >
      <p className="text-caption font-semibold uppercase text-encre">
        {interpolate(t.exercices.exercice, { n: String(numero) })}
      </p>
      {exercice.type === "ouvert" ? (
        <Ouvert exercice={exercice} />
      ) : (
        <Note leconId={leconId} exercice={exercice} meilleure={meilleure} />
      )}
    </section>
  );
}

// ==================== EXERCICES NOTÉS ====================

export type Notable = QcmExercice | VraiFauxExercice | ClassementExercice;

/** Réponse vide de départ selon le type. */
export function reponseVide(ex: Notable): (number | boolean | null)[] {
  if (ex.type === "qcm") return [null];
  if (ex.type === "vrai-faux") return ex.affirmations.map(() => null);
  return ex.elements.map(() => null);
}

/** Construit la réponse envoyée au serveur ; null si incomplète. */
export function construire(
  ex: Notable,
  valeurs: (number | boolean | null)[],
): Reponse | null {
  if (valeurs.some((v) => v === null)) return null;
  if (ex.type === "qcm") return { type: "qcm", choix: valeurs[0] as number };
  if (ex.type === "vrai-faux")
    return { type: "vrai-faux", valeurs: valeurs as boolean[] };
  return { type: "classement", categories: valeurs as number[] };
}

/** Exercice noté : saisie, envoi, correction. */
function Note({
  leconId,
  exercice,
  meilleure,
}: {
  leconId: string;
  exercice: Notable;
  meilleure: number | null;
}) {
  const [valeurs, setValeurs] = useState(() => reponseVide(exercice));
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [record, setRecord] = useState(meilleure);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();

  /** Change la réponse d'une partie (désactivé une fois corrigé). */
  const choisir = (i: number, v: number | boolean) => {
    if (correction) return;
    setValeurs((prev) => prev.map((x, j) => (j === i ? v : x)));
    setMessage(null);
  };

  /** Envoie la réponse au serveur et affiche la correction. */
  const valider = () => {
    const reponse = construire(exercice, valeurs);
    if (!reponse) {
      setMessage(t.exercices.incomplet);
      return;
    }
    startEnvoi(async () => {
      const r = await soumettreReponse(leconId, exercice.id, reponse);
      if (!r.ok) {
        setMessage(r.error);
        return;
      }
      setCorrection(r.correction);
      setRecord((m) => Math.max(m ?? 0, r.correction.score));
    });
  };

  /** Efface la réponse pour une nouvelle tentative. */
  const recommencer = () => {
    setValeurs(reponseVide(exercice));
    setCorrection(null);
    setMessage(null);
  };

  return (
    <>
      {exercice.type === "qcm" && (
        <Qcm
          ex={exercice}
          valeur={valeurs[0] as number | null}
          correction={correction}
          onChoix={(v) => choisir(0, v)}
        />
      )}
      {exercice.type === "vrai-faux" && (
        <VraiFaux
          ex={exercice}
          valeurs={valeurs as (boolean | null)[]}
          correction={correction}
          onChoix={choisir}
        />
      )}
      {exercice.type === "classement" && (
        <Classement
          ex={exercice}
          valeurs={valeurs as (number | null)[]}
          correction={correction}
          onChoix={choisir}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {correction ? (
          <button
            type="button"
            onClick={recommencer}
            className={BUTTON_SECONDARY}
          >
            {t.exercices.recommencer}
          </button>
        ) : (
          <button
            type="button"
            onClick={valider}
            disabled={envoi}
            className={BUTTON_PRIMARY}
          >
            {envoi ? t.exercices.envoi : t.exercices.valider}
          </button>
        )}
        {correction && (
          <span className="font-semibold">
            {interpolate(t.exercices.score, {
              score: String(correction.score),
            })}
          </span>
        )}
        {record !== null && (
          <span className="text-small text-ink-muted">
            {interpolate(t.exercices.meilleure, { score: String(record) })}
          </span>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="text-small text-danger empty:hidden"
      >
        {message}
      </p>
    </>
  );
}

/** Pastille « bonne réponse / pas tout à fait » suivie de l'explication. */
function Retour({ juste, children }: { juste: boolean; children: ReactNode }) {
  return (
    <p className={`text-small ${juste ? "text-success" : "text-danger"}`}>
      <span className="font-semibold">
        {juste ? t.exercices.juste : t.exercices.faux}
      </span>
      {" — "}
      <span className="text-ink">{children}</span>
    </p>
  );
}

// ==================== QCM ====================

export function Qcm({
  ex,
  valeur,
  correction,
  onChoix,
}: {
  ex: QcmExercice;
  valeur: number | null;
  correction: Correction | null;
  onChoix: (v: number) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">
        <InlineText texte={ex.question} />
      </legend>
      {ex.choix.map((c, i) => {
        const choisi = valeur === i;
        return (
          <div key={c.texte} className="flex flex-col gap-1">
            <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-sand">
              <input
                type="radio"
                name={`qcm-${ex.id}`}
                checked={choisi}
                disabled={correction !== null}
                onChange={() => onChoix(i)}
                className="mt-1"
              />
              <span>
                <InlineText texte={c.texte} />
              </span>
            </label>
            {correction && (choisi || i === ex.bonne) && (
              <div className="ml-9">
                <Retour juste={i === ex.bonne}>
                  <InlineText texte={c.explication} />
                </Retour>
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}

// ==================== VRAI OU FAUX ====================

export function VraiFaux({
  ex,
  valeurs,
  correction,
  onChoix,
}: {
  ex: VraiFauxExercice;
  valeurs: (boolean | null)[];
  correction: Correction | null;
  onChoix: (i: number, v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        <InlineText texte={ex.consigne} />
      </p>
      <ol className="flex flex-col gap-3">
        {ex.affirmations.map((a, i) => (
          <li
            key={a.texte}
            className="flex flex-col gap-2 border-b border-line pb-3 last:border-0"
          >
            <InlineText texte={a.texte} />
            <span className="flex gap-2" role="group" aria-label={a.texte}>
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={valeurs[i] === v}
                  disabled={correction !== null}
                  onClick={() => onChoix(i, v)}
                  className={`min-h-11 min-w-20 rounded-md border px-3 text-small ${
                    valeurs[i] === v
                      ? "border-encre bg-encre-soft text-encre"
                      : "border-line hover:bg-sand"
                  }`}
                >
                  {v ? t.exercices.vrai : t.exercices.fauxChoix}
                </button>
              ))}
            </span>
            {correction && (
              <Retour juste={correction.justes[i]}>
                <InlineText texte={a.explication} />
              </Retour>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ==================== CLASSEMENT ====================

export function Classement({
  ex,
  valeurs,
  correction,
  onChoix,
}: {
  ex: ClassementExercice;
  valeurs: (number | null)[];
  correction: Correction | null;
  onChoix: (i: number, v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        <InlineText texte={ex.consigne} />
      </p>
      <ol className="flex flex-col gap-3">
        {ex.elements.map((e, i) => (
          <li
            key={e.texte}
            className="flex flex-col gap-2 border-b border-line pb-3 last:border-0"
          >
            <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <InlineText texte={e.texte} />
              </span>
              <select
                value={valeurs[i] ?? ""}
                disabled={correction !== null}
                onChange={(ev) => onChoix(i, Number(ev.target.value))}
                className={`${CONTROL} sm:w-56`}
              >
                <option value="" disabled>
                  {t.exercices.choisir}
                </option>
                {ex.categories.map((c, j) => (
                  <option key={c} value={j}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {correction && (
              <Retour juste={correction.justes[i]}>
                {ex.categories[e.categorie]}
                {e.explication ? (
                  <>
                    {" "}
                    : <InlineText texte={e.explication} />
                  </>
                ) : null}
              </Retour>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ==================== QUESTION OUVERTE ====================

/** Question ouverte : brouillon local, puis corrigé modèle à la demande. */
function Ouvert({ exercice }: { exercice: OuvertExercice }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        <InlineText texte={exercice.question} />
      </p>
      <label className="flex flex-col gap-1 text-small text-ink-muted">
        {t.exercices.votreReponse}
        <textarea rows={4} className={`${CONTROL} text-ink`} />
      </label>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className={`${BUTTON_SECONDARY} self-start`}
      >
        {ouvert ? t.exercices.masquerCorrige : t.exercices.voirCorrige}
      </button>
      {ouvert && (
        <div className="rounded-md bg-sand p-4">
          <p className="mb-2 font-semibold">{t.exercices.corrige}</p>
          <ul className="list-disc space-y-1 pl-5">
            {exercice.corrige.map((point) => (
              <li key={point}>
                <InlineText texte={point} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
