/**
 * =============================================================
 *  Fichier    : classement-cases.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Exercice de classement dont chaque élément occupe une case d'une grille
 *               2 × 2 (v0.48.0), par exemple les quatre scénarios d'Infosystem : la
 *               grille et ses axes restent sous les yeux, et la catégorie se choisit
 *               dans la case elle-même. Après correction, chaque case est bordée de vert
 *               ou de rouge et les explications suivent la grille.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-21
 *  Dépendances: classement-grille.tsx, lib/cours/content.ts, lib/cours/notation.ts,
 *               i18n/course.ts
 * =============================================================
 */

"use client";

import { InlineText } from "@/components/powerbi/inline-text";
import { getCourseDictionary } from "@/i18n/course";
import type { ClassementExercice, GrilleElements } from "@/lib/cours/content";
import type { Correction } from "@/lib/cours/notation";

import { CadreGrille, CorrectionGrille } from "./classement-grille";

const t = getCourseDictionary();

type Props = {
  ex: ClassementExercice & { grilleElements: GrilleElements };
  valeurs: (number | null)[];
  correction: Correction | null;
  onChoix: (i: number, v: number) => void;
};

// ==================== COMPOSANT ====================

/** Grille 2 × 2 d'éléments, chacun avec ses boutons de catégorie. */
export function ClassementCases({ ex, valeurs, correction, onChoix }: Props) {
  const { axeVertical, axeHorizontal, cases, rappels } = ex.grilleElements;

  /** Une case : nom de l'élément, rappel, puis un bouton par catégorie. */
  const cellule = (i: number) => {
    const bord = correction
      ? correction.justes[i]
        ? "border-success"
        : "border-danger"
      : "border-transparent";
    const nom = ex.elements[i].texte;
    return (
      <div
        key={nom}
        className={`flex min-h-36 flex-col gap-2 rounded-md border-2 bg-sand p-2 sm:p-3 ${bord}`}
      >
        <p className="font-semibold">
          <InlineText texte={nom} />
        </p>
        {rappels?.[i] && (
          <p className="text-caption text-ink-muted">
            <InlineText texte={rappels[i]} />
          </p>
        )}
        <span className="mt-auto flex flex-wrap gap-2" role="group" aria-label={nom}>
          {ex.categories.map((c, j) => (
            <button
              key={c}
              type="button"
              aria-pressed={valeurs[i] === j}
              disabled={correction !== null}
              onClick={() => onChoix(i, j)}
              className={`min-h-11 min-w-20 rounded-md border px-3 text-small ${
                valeurs[i] === j
                  ? "border-encre bg-encre-soft text-encre"
                  : "border-line bg-surface hover:bg-encre-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        <InlineText texte={ex.consigne} />
      </p>
      {correction === null && (
        <p className="text-small text-ink-muted">{t.exercices.casesAide}</p>
      )}
      <CadreGrille
        axeVertical={axeVertical}
        axeHorizontal={axeHorizontal}
        cellules={[cellule(cases[0]), cellule(cases[1]), cellule(cases[2]), cellule(cases[3])]}
      />
      {correction && <CorrectionGrille ex={ex} correction={correction} />}
    </div>
  );
}
