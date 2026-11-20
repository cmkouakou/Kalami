/**
 * =============================================================
 *  Fichier    : content.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Blocs de contenu d'une leçon du cours de stratégie : textes, encadrés
 *               (à retenir, piège, sur le terrain, définition), notions dépliables,
 *               tableaux, schémas SVG, exercices corrigés, renvoi vers une étape de Kalami
 *               Stratégie et fiche de fin de leçon. Écrits en TypeScript, comme les
 *               leçons de Kalami Données, pour rester typés et relus en revue de code.
 *
 *               Balisage en ligne : **gras**, *italique*, `code`, [lien](https://…)
 *               (analyseur partagé : lib/powerbi/inline.ts).
 *
 *               Les identifiants d'exercice (« e1 », « e2 »…) sont stables : les
 *               tentatives sont enregistrées sous « <leçon>-<exercice> ». Ne jamais
 *               renommer un identifiant publié.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/strategy/steps.ts (numéros d'étape)
 * =============================================================
 */

import type { StepNo } from "@/lib/strategy/steps";

// ==================== BLOCS DE TEXTE ====================

/** Titre intermédiaire de la leçon. */
export type TitreBlock = { kind: "titre"; texte: string };

/** Paragraphe de texte courant. */
export type ParagrapheBlock = { kind: "paragraphe"; texte: string };

/** Liste à puces ou numérotée. */
export type ListeBlock = { kind: "liste"; ordonnee?: boolean; items: string[] };

/** Tableau à en-tête : chaque ligne a autant de cellules que d'en-têtes. */
export type TableauBlock = {
  kind: "tableau";
  entetes: string[];
  lignes: string[][];
  legende?: string;
};

/**
 * Ton d'un encadré :
 * - retenir    : l'idée à garder ;
 * - piege      : l'erreur fréquente ;
 * - terrain    : expérience vécue de l'auteur (« Sur le terrain ») ;
 * - definition : terme défini avec précision.
 */
export type EncadreTon = "retenir" | "piege" | "terrain" | "definition";

/** Encadré mis en valeur, avec un titre facultatif et des points. */
export type EncadreBlock = {
  kind: "encadre";
  ton: EncadreTon;
  titre?: string;
  texte: string;
  points?: string[];
};

/** Notion dépliable : un approfondissement qu'on ouvre si on en a besoin. */
export type NotionBlock = {
  kind: "notion";
  titre: string;
  contenu: TexteBlock[];
};

/** Blocs de texte simples, admis dans une notion dépliable. */
export type TexteBlock = ParagrapheBlock | ListeBlock | TableauBlock;

// ==================== SCHÉMAS ====================

/** Schémas dessinés pour le cours (composants SVG de components/cours/schemas). */
export const SCHEMA_IDS = [
  "choisir-renoncer",
  "trois-niveaux",
  "demarche",
] as const;

export type SchemaId = (typeof SCHEMA_IDS)[number];

/** Schéma SVG original, avec sa légende (lue aussi par les lecteurs d'écran). */
export type SchemaBlock = { kind: "schema"; schema: SchemaId; legende: string };

// ==================== EXERCICES ====================

/** Choix multiple : une seule bonne réponse, chaque choix a son explication. */
export type QcmExercice = {
  type: "qcm";
  id: string;
  question: string;
  choix: { texte: string; explication: string }[];
  /** Indice de la bonne réponse dans `choix`. */
  bonne: number;
};

/** Suite d'affirmations à juger vraies ou fausses, chacune justifiée. */
export type VraiFauxExercice = {
  type: "vrai-faux";
  id: string;
  consigne: string;
  affirmations: { texte: string; vrai: boolean; explication: string }[];
};

/** Classement : ranger des éléments dans des catégories. */
export type ClassementExercice = {
  type: "classement";
  id: string;
  consigne: string;
  categories: string[];
  /** Chaque élément porte l'indice de sa catégorie dans `categories`. */
  elements: { texte: string; categorie: number; explication?: string }[];
};

/** Question ouverte : l'apprenant répond pour lui, puis révèle le corrigé modèle. */
export type OuvertExercice = {
  type: "ouvert";
  id: string;
  question: string;
  /** Corrigé modèle : points attendus. */
  corrige: string[];
};

/** Un exercice, quel que soit son type. */
export type Exercice =
  QcmExercice | VraiFauxExercice | ClassementExercice | OuvertExercice;

/** Exercice placé dans la leçon. */
export type ExerciceBlock = { kind: "exercice"; exercice: Exercice };

// ==================== LIENS ET SYNTHÈSE ====================

/** « Appliquez-le » : renvoi vers une étape de Kalami Stratégie. */
export type AppliquezBlock = {
  kind: "appliquez";
  etape: StepNo | null;
  texte: string;
};

/** Fiche de fin de leçon : l'essentiel en quelques points. */
export type FicheBlock = { kind: "fiche"; points: string[] };

/** Un bloc de contenu, quel que soit son type. */
export type CoursBlock =
  | TitreBlock
  | ParagrapheBlock
  | ListeBlock
  | TableauBlock
  | EncadreBlock
  | NotionBlock
  | SchemaBlock
  | ExerciceBlock
  | AppliquezBlock
  | FicheBlock;

/** Contenu complet d'une leçon. */
export type ContenuLecon = CoursBlock[];

// ==================== FABRIQUES ====================
// Raccourcis d'écriture : une leçon se lit comme une suite d'appels courts.

/** Titre intermédiaire. */
export const titre = (texte: string): TitreBlock => ({ kind: "titre", texte });

/** Paragraphe. */
export const p = (texte: string): ParagrapheBlock => ({
  kind: "paragraphe",
  texte,
});

/** Liste à puces. */
export const liste = (...items: string[]): ListeBlock => ({
  kind: "liste",
  items,
});

/** Liste numérotée. */
export const etapes = (...items: string[]): ListeBlock => ({
  kind: "liste",
  ordonnee: true,
  items,
});

/** Tableau à en-tête. */
export const tableau = (
  entetes: string[],
  lignes: string[][],
  legende?: string,
): TableauBlock => ({ kind: "tableau", entetes, lignes, legende });

/** Encadré « À retenir ». */
export const retenir = (texte: string, points?: string[]): EncadreBlock => ({
  kind: "encadre",
  ton: "retenir",
  texte,
  points,
});

/** Encadré « Piège fréquent ». */
export const piege = (texte: string): EncadreBlock => ({
  kind: "encadre",
  ton: "piege",
  texte,
});

/** Encadré « Sur le terrain » : un titre et le récit. */
export const terrain = (titreEncadre: string, texte: string): EncadreBlock => ({
  kind: "encadre",
  ton: "terrain",
  titre: titreEncadre,
  texte,
});

/** Encadré « Définition » : le terme et sa définition. */
export const definition = (terme: string, texte: string): EncadreBlock => ({
  kind: "encadre",
  ton: "definition",
  titre: terme,
  texte,
});

/** Notion dépliable. */
export const notion = (
  titreNotion: string,
  ...contenu: TexteBlock[]
): NotionBlock => ({
  kind: "notion",
  titre: titreNotion,
  contenu,
});

/** Schéma SVG du cours. */
export const schema = (id: SchemaId, legende: string): SchemaBlock => ({
  kind: "schema",
  schema: id,
  legende,
});

/** Exercice. */
export const exercice = (ex: Exercice): ExerciceBlock => ({
  kind: "exercice",
  exercice: ex,
});

/** Renvoi vers une étape de Kalami Stratégie (null : l'accueil de l'assistant). */
export const appliquez = (
  etape: StepNo | null,
  texte: string,
): AppliquezBlock => ({
  kind: "appliquez",
  etape,
  texte,
});

/** Fiche de fin de leçon. */
export const fiche = (...points: string[]): FicheBlock => ({
  kind: "fiche",
  points,
});

// ==================== OUTILS ====================

/** Exercices d'une leçon, dans l'ordre. */
export function exercicesDe(contenu: ContenuLecon): Exercice[] {
  return contenu.flatMap((bloc) =>
    bloc.kind === "exercice" ? [bloc.exercice] : [],
  );
}
