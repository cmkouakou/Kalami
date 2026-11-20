/**
 * =============================================================
 *  Fichier    : notation.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Correction des exercices (côté serveur : la note enregistrée ne vient
 *               jamais du navigateur) et calcul de la progression d'un apprenant.
 *               Fonctions pures, sans accès à la base.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts, lib/cours/modules.ts
 * =============================================================
 */

import type { Exercice } from "@/lib/cours/content";
import { LECONS } from "@/lib/cours/modules";

// ==================== RÉPONSES ====================

/**
 * Réponses de l'apprenant, selon le type d'exercice :
 * - qcm        : indice du choix ;
 * - vrai-faux  : un booléen par affirmation ;
 * - classement : indice de catégorie par élément ;
 * - ouvert     : aucune réponse notée (corrigé révélé).
 */
export type Reponse =
  | { type: "qcm"; choix: number }
  | { type: "vrai-faux"; valeurs: boolean[] }
  | { type: "classement"; categories: number[] }
  | { type: "ouvert" };

/** Résultat de la correction : note sur 100 et justesse de chaque partie. */
export type Correction = { score: number; justes: boolean[] };

// ==================== CORRECTION ====================

/** Note sur 100, arrondie à deux décimales. */
const note = (bonnes: number, total: number) =>
  total === 0 ? 0 : Math.round((bonnes / total) * 10000) / 100;

/**
 * Corrige une réponse.
 *
 * @param ex      - Exercice tel que défini dans la leçon
 * @param reponse - Réponse reçue du navigateur (non fiable)
 * @returns La correction, ou null si la réponse ne correspond pas à l'exercice
 *
 * Exemple : corriger(qcm, { type: "qcm", choix: 2 }) → { score: 100, justes: [true] }
 */
export function corriger(ex: Exercice, reponse: Reponse): Correction | null {
  if (ex.type !== reponse.type) return null;
  switch (ex.type) {
    case "qcm": {
      const r = reponse as Extract<Reponse, { type: "qcm" }>;
      if (
        !Number.isInteger(r.choix) ||
        r.choix < 0 ||
        r.choix >= ex.choix.length
      )
        return null;
      const juste = r.choix === ex.bonne;
      return { score: juste ? 100 : 0, justes: [juste] };
    }
    case "vrai-faux": {
      const r = reponse as Extract<Reponse, { type: "vrai-faux" }>;
      if (
        !Array.isArray(r.valeurs) ||
        r.valeurs.length !== ex.affirmations.length
      )
        return null;
      if (r.valeurs.some((v) => typeof v !== "boolean")) return null;
      const justes = ex.affirmations.map((a, i) => a.vrai === r.valeurs[i]);
      return {
        score: note(justes.filter(Boolean).length, justes.length),
        justes,
      };
    }
    case "classement": {
      const r = reponse as Extract<Reponse, { type: "classement" }>;
      const n = ex.categories.length;
      if (
        !Array.isArray(r.categories) ||
        r.categories.length !== ex.elements.length
      )
        return null;
      if (r.categories.some((c) => !Number.isInteger(c) || c < 0 || c >= n))
        return null;
      const justes = ex.elements.map((e, i) => e.categorie === r.categories[i]);
      return {
        score: note(justes.filter(Boolean).length, justes.length),
        justes,
      };
    }
    case "ouvert":
      // Rien à noter : l'apprenant compare sa réponse au corrigé
      return { score: 100, justes: [] };
  }
}

/** Vrai si l'exercice est noté (les questions ouvertes ne le sont pas). */
export function estNote(ex: Exercice): boolean {
  return ex.type !== "ouvert";
}

// ==================== PROGRESSION ====================

/** Ligne de progression lue en base. */
export type LigneProgression = {
  lesson_id: string;
  completed_at: string | null;
  seconds: number;
};

/** Synthèse de la progression d'un apprenant. */
export type Synthese = {
  terminees: number;
  enCours: number;
  total: number;
  /** Pourcentage d'achèvement, entier de 0 à 100. */
  pourcentage: number;
  secondes: number;
};

/**
 * Résume la progression : seules les leçons du programme comptent (une leçon retirée
 * du programme ne fausse pas le pourcentage).
 *
 * @param lignes - Progression de l'apprenant
 * @param total  - Nombre de leçons du cours (par défaut : tout le programme)
 */
export function synthese(
  lignes: LigneProgression[],
  total = LECONS.length,
): Synthese {
  const connues = new Set(LECONS.map((l) => l.id));
  const utiles = lignes.filter((l) => connues.has(l.lesson_id));
  const terminees = utiles.filter((l) => l.completed_at !== null).length;
  return {
    terminees,
    enCours: utiles.length - terminees,
    total,
    pourcentage: total === 0 ? 0 : Math.floor((terminees / total) * 100),
    secondes: utiles.reduce((s, l) => s + Math.max(0, l.seconds), 0),
  };
}

/** Durée lisible : « 45 min », « 2 h 05 ». */
export function dureeLisible(secondes: number): string {
  const minutes = Math.floor(Math.max(0, secondes) / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  return `${h} h ${String(minutes % 60).padStart(2, "0")}`;
}
