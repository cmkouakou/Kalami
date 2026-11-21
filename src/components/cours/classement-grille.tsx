/**
 * =============================================================
 *  Fichier    : classement-grille.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Exercice de classement présenté en grille 2 × 2 (v0.47.0) : la grille
 *               reste sous les yeux et les énoncés à placer attendent en dessous. Ils se
 *               glissent dans une case (souris) ou se placent en touchant l'énoncé puis
 *               la case (écran tactile, clavier). Après correction, chaque énoncé reste
 *               dans la case choisie, bordé de vert ou de rouge, et les explications
 *               suivent la grille.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-21
 *  Dépendances: lib/cours/content.ts, lib/cours/notation.ts, i18n/course.ts
 * =============================================================
 */

"use client";

import { useState, type DragEvent } from "react";

import { InlineText } from "@/components/powerbi/inline-text";
import { getCourseDictionary } from "@/i18n/course";
import type { ClassementExercice, GrilleClassement } from "@/lib/cours/content";
import type { Correction } from "@/lib/cours/notation";

const t = getCourseDictionary();

const DRAG_TYPE = "text/plain";

/** Zone de dépôt : indice de catégorie d'une case, ou « bas » pour la réserve. */
type Zone = number | "bas";

type Props = {
  ex: ClassementExercice & { grille: GrilleClassement };
  valeurs: (number | null)[];
  correction: Correction | null;
  /** Place l'élément i dans une catégorie (null : le remet dans la réserve). */
  onChoix: (i: number, v: number | null) => void;
};

// ==================== COMPOSANT ====================

/** Grille 2 × 2, réserve des énoncés et correction. */
export function ClassementGrille({ ex, valeurs, correction, onChoix }: Props) {
  const [selection, setSelection] = useState<number | null>(null);
  const [survol, setSurvol] = useState<Zone | null>(null);
  const actif = correction === null;
  const { axeVertical, axeHorizontal, cases } = ex.grille;

  /** Dépose l'élément i dans une zone et efface la sélection. */
  const deposer = (i: number, zone: Zone) => {
    onChoix(i, zone === "bas" ? null : zone);
    setSelection(null);
  };

  /** Propriétés de dépôt d'une zone (aucune une fois corrigé). */
  const depot = (zone: Zone) => {
    if (!actif) return {};
    return {
      onDragOver: (ev: DragEvent) => {
        ev.preventDefault();
        setSurvol(zone);
      },
      onDragLeave: () => setSurvol((z) => (z === zone ? null : z)),
      onDrop: (ev: DragEvent) => {
        ev.preventDefault();
        setSurvol(null);
        const i = Number(ev.dataTransfer.getData(DRAG_TYPE));
        if (Number.isInteger(i) && i >= 0 && i < ex.elements.length) deposer(i, zone);
      },
    };
  };

  /** Étiquette d'un énoncé : glissable, et sélectionnable d'un toucher. */
  const etiquette = (i: number) => {
    const choisi = selection === i;
    const bord = correction
      ? correction.justes[i]
        ? "border-success"
        : "border-danger"
      : choisi
        ? "border-encre ring-2 ring-encre"
        : "border-line";
    return (
      <li key={ex.elements[i].texte}>
        <button
          type="button"
          draggable={actif}
          disabled={!actif}
          aria-pressed={actif ? choisi : undefined}
          onDragStart={(ev) => {
            ev.dataTransfer.setData(DRAG_TYPE, String(i));
            setSelection(null);
          }}
          onClick={(ev) => {
            ev.stopPropagation();
            setSelection(choisi ? null : i);
          }}
          className={`w-full rounded-md border-2 bg-surface p-2 text-left text-small ${bord} ${
            actif ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          <span className="mr-1 font-semibold text-ink-muted">{i + 1}.</span>
          <InlineText texte={ex.elements[i].texte} />
        </button>
      </li>
    );
  };

  /** Bouton « Placer ici » ou « Remettre en bas », visible pendant une sélection. */
  const boutonDepot = (zone: Zone) => {
    if (selection === null) return null;
    if (zone === "bas" && valeurs[selection] === null) return null;
    if (zone !== "bas" && valeurs[selection] === zone) return null;
    return (
      <button
        type="button"
        onClick={(ev) => {
          ev.stopPropagation();
          deposer(selection, zone);
        }}
        className="min-h-11 self-start rounded-md border border-encre px-3 text-small text-encre hover:bg-encre-soft"
      >
        {zone === "bas" ? t.exercices.remettre : t.exercices.placerIci}
      </button>
    );
  };

  /** Une case de la grille. */
  const caseGrille = (categorie: number) => {
    const dedans = ex.elements.flatMap((_, i) => (valeurs[i] === categorie ? [i] : []));
    return (
      <div
        key={categorie}
        {...depot(categorie)}
        onClick={() => selection !== null && deposer(selection, categorie)}
        className={`flex min-h-36 flex-col gap-2 rounded-md p-2 transition-colors sm:p-3 ${
          survol === categorie ? "bg-encre-soft" : "bg-sand"
        }`}
      >
        <p className="font-semibold">{ex.categories[categorie]}</p>
        <ul className="flex flex-col gap-2">{dedans.map(etiquette)}</ul>
        {boutonDepot(categorie)}
      </div>
    );
  };

  const restants = ex.elements.flatMap((_, i) => (valeurs[i] === null ? [i] : []));
  const axe = "text-caption uppercase text-ink-muted";

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        <InlineText texte={ex.consigne} />
      </p>
      {actif && <p className="text-small text-ink-muted">{t.exercices.grilleAide}</p>}

      {/* Grille : impact en lignes (fort en haut), incertitude en colonnes */}
      <div className="grid grid-cols-[1.5rem_1fr_1fr] gap-2">
        <span aria-hidden="true" />
        <p className={`${axe} text-center`}>
          {axeHorizontal[0]} {axeHorizontal[1]}
        </p>
        <p className={`${axe} text-center`}>
          {axeHorizontal[0]} {axeHorizontal[2]} →
        </p>
        <p className={`${axe} rotate-180 text-center [writing-mode:vertical-rl]`}>
          ↑ {axeVertical[0]} {axeVertical[2]}
        </p>
        {caseGrille(cases[0])}
        {caseGrille(cases[1])}
        <p className={`${axe} rotate-180 text-center [writing-mode:vertical-rl]`}>
          {axeVertical[0]} {axeVertical[1]}
        </p>
        {caseGrille(cases[2])}
        {caseGrille(cases[3])}
      </div>

      {/* Réserve des énoncés à placer, sous la grille */}
      {actif && (
        <div
          {...depot("bas")}
          onClick={() => selection !== null && deposer(selection, "bas")}
          className={`flex flex-col gap-2 rounded-md border border-dashed border-line p-3 ${
            survol === "bas" ? "bg-encre-soft" : ""
          }`}
        >
          <p className="font-semibold">{t.exercices.aPlacer}</p>
          {restants.length === 0 ? (
            <p className="text-small text-ink-muted">{t.exercices.tousPlaces}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">{restants.map(etiquette)}</ul>
          )}
          {boutonDepot("bas")}
        </div>
      )}

      {/* Correction : catégorie attendue et explication de chaque énoncé */}
      {correction && (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">{t.exercices.grilleCorrection}</p>
          <ol className="flex flex-col gap-2">
            {ex.elements.map((e, i) => (
              <li key={e.texte} className="text-small">
                <span className="font-semibold text-ink-muted">{i + 1}. </span>
                <span className={correction.justes[i] ? "text-success" : "text-danger"}>
                  <span className="font-semibold">
                    {correction.justes[i] ? t.exercices.juste : t.exercices.faux}
                  </span>
                  {" — "}
                </span>
                {ex.categories[e.categorie]}
                {e.explication ? (
                  <>
                    {" "}
                    : <InlineText texte={e.explication} />
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
