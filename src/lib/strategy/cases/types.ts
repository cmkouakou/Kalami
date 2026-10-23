/**
 * =============================================================
 *  Fichier    : types.ts
 *  Projet     : Kalami Stratégie
 *  Description: Types communs aux cas d'entraînement : énoncé et épilogue sous forme de
 *               blocs (titres, paragraphes, listes, tableaux) que la page du cas affiche,
 *               et questions reliées aux étapes de la démarche.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/steps.ts
 * =============================================================
 */

import type { StepNo } from "@/lib/strategy/steps";

// ==================== BLOCS DE TEXTE ====================

export type CaseTable = {
  caption: string;
  headers: string[];
  rows: string[][];
  /** Ligne mise en gras (total), par son indice dans rows. */
  totalRow?: number;
  source?: string;
};

export type CaseBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; table: CaseTable };

// ==================== QUESTIONS ====================

export type CaseQuestion = {
  id: string;
  title: string;
  /** Module du livre où se trouvent les outils. */
  module: number | null;
  /** Étape de l'application où l'on répond (et dont le corrigé se déverrouille). */
  step: StepNo;
  text: string;
};

// ==================== ÉNONCÉ ====================

export type CaseStatement = {
  title: string;
  lead: string;
  /** Consignes de lecture, avant le récit. */
  intro: CaseBlock[];
  /** Récit et mission. */
  story: CaseBlock[];
  annexes: CaseBlock[];
  questions: CaseQuestion[];
  /** Pistes de réflexion, sans réponses. */
  hints: string[];
  sources: string[];
};

export type CaseEpilogue = {
  title: string;
  blocks: CaseBlock[];
};
