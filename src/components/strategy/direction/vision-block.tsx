/**
 * =============================================================
 *  Fichier    : vision-block.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Vision de l'étape 6 et test du remplacement du nom : l'équipe choisit un
 *               concurrent (du profil ou saisi), lit sa vision réécrite à son nom et répond
 *               « la phrase reste-t-elle vraie ? ». Le test est réussi si la réponse est
 *               « non » ; il est à refaire si la vision change ensuite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/templates/direction.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { CommentBadge } from "@/components/strategy/comments/comments-context";
import { CARD, CONTROL, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import {
  COMPETITOR_MAX,
  NAME_TEST_ANSWERS,
  nameTestState,
  STATEMENT_MAX,
  swapName,
  type DirectionPayload,
  type NameTest,
  type NameTestAnswer,
} from "@/lib/strategy/templates/direction";
import { getStrategyDictionary } from "@/i18n/strategy";

const tStrategy = getStrategyDictionary();
const s = tStrategy.direction;

/** Valeur du menu qui ouvre la saisie libre d'un nom. */
const OTHER = "__autre__";

/** Couleur du message d'état du test. */
const STATE_CLASS = {
  pending: "text-ink-muted",
  stale: "text-warning",
  passed: "text-success",
  failed: "text-danger",
} as const;

type VisionBlockProps = {
  payload: DirectionPayload;
  companyName: string;
  /** Concurrents connus du profil. */
  competitors: string[];
  readOnly: boolean;
  onVision: (text: string) => void;
  onNameTest: (test: NameTest) => void;
};

/** Vision et test du remplacement du nom. */
export function VisionBlock({
  payload,
  companyName,
  competitors,
  readOnly,
  onVision,
  onNameTest,
}: VisionBlockProps) {
  const { competitor, answer } = payload.nameTest;
  const known = competitors.filter((name) => name.trim());
  const [custom, setCustom] = useState(competitor !== "" && !known.includes(competitor));
  const rewritten = swapName(payload.vision.text, companyName, competitor);
  const state = nameTestState(payload);

  /** Change de concurrent : la réponse précédente ne vaut plus. */
  const chooseCompetitor = (name: string) =>
    onNameTest({ competitor: name, answer: null, testedVision: "" });

  /** Enregistre la réponse pour la vision actuelle. */
  const chooseAnswer = (value: NameTestAnswer) =>
    onNameTest({ competitor, answer: value, testedVision: payload.vision.text });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-h2 font-semibold">{s.visionTitle}</h2>
          <CommentBadge targetId="vision" label={s.visionTitle} />
        </div>
        <p className="text-small text-ink-muted">{s.visionIntro}</p>
      </div>
      <label className="flex flex-col gap-1 text-small font-semibold">
        {s.visionLabel}
        <textarea
          className={`${CONTROL} py-2`}
          rows={3}
          value={payload.vision.text}
          maxLength={STATEMENT_MAX}
          readOnly={readOnly}
          onChange={(event) => onVision(event.target.value)}
        />
      </label>

      {/* ==================== TEST DU NOM ==================== */}
      <div className={`${CARD} flex flex-col gap-3 p-4`}>
        <h3 className="font-semibold">{s.nameTestTitle}</h3>
        <p className="text-small text-ink-muted">{s.nameTestIntro}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-small font-semibold">
            {s.competitorLabel}
            <select
              className={CONTROL}
              value={custom ? OTHER : competitor}
              disabled={readOnly}
              onChange={(event) => {
                const value = event.target.value;
                setCustom(value === OTHER);
                chooseCompetitor(value === OTHER ? "" : value);
              }}
            >
              <option value="">{s.competitorNone}</option>
              {known.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value={OTHER}>{s.competitorOther}</option>
            </select>
            <span className="font-normal text-ink-muted">{s.competitorHint}</span>
          </label>
          {custom && (
            <label className="flex flex-col gap-1 text-small font-semibold">
              {s.competitorCustom}
              <input
                className={CONTROL}
                value={competitor}
                maxLength={COMPETITOR_MAX}
                readOnly={readOnly}
                onChange={(event) => chooseCompetitor(event.target.value)}
              />
            </label>
          )}
        </div>

        {rewritten ? (
          <>
            <figure className="flex flex-col gap-1">
              <figcaption className="text-small text-ink-muted">
                {interpolate(s.rewritten, { competitor: competitor.trim() })}
              </figcaption>
              <blockquote className="rounded-md bg-sand p-3 font-serif">{rewritten}</blockquote>
            </figure>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-small font-semibold">{s.question}</legend>
              <div className="flex flex-wrap gap-2">
                {NAME_TEST_ANSWERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={answer === value && state !== "stale" ? PILL_ACTIVE : PILL}
                    aria-pressed={answer === value && state !== "stale"}
                    disabled={readOnly}
                    onClick={() => chooseAnswer(value)}
                  >
                    {s.answers[value]}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <p className="text-small text-ink-muted">{s.rewrittenEmpty}</p>
        )}
        <p role="status" className={`text-small font-semibold ${STATE_CLASS[state]}`}>
          {s.states[state]}
        </p>
      </div>
    </section>
  );
}
