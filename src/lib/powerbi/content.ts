/**
 * =============================================================
 *  Fichier    : content.ts
 *  Projet     : Kalami Données
 *  Description: Blocs de contenu d'une leçon : titres, paragraphes, listes, tableaux,
 *               encadrés et code. Les leçons sont écrites en TypeScript plutôt qu'en
 *               Markdown pour rester typées, relues en revue de code et versionnées
 *               avec le reste du dépôt, sans ajouter de dépendance de rendu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

/** Ton d'un encadré : information, piège d'examen ou astuce de mémorisation. */
export type NoteTone = "info" | "examen" | "memo";

/** Titre intermédiaire à l'intérieur d'une leçon. */
export type HeadingBlock = { kind: "titre"; texte: string };

/** Paragraphe de texte courant. */
export type ParagraphBlock = { kind: "paragraphe"; texte: string };

/** Liste à puces ou numérotée. */
export type ListBlock = { kind: "liste"; ordonnee?: boolean; items: string[] };

/** Tableau à en-tête : chaque ligne doit avoir autant de cellules que d'en-têtes. */
export type TableBlock = { kind: "tableau"; entetes: string[]; lignes: string[][] };

/** Encadré mis en valeur : concept clé, piège d'examen ou moyen mnémotechnique. */
export type NoteBlock = { kind: "encadre"; ton: NoteTone; titre?: string; texte: string };

/** Extrait de code ou de formule, affiché en police à chasse fixe. */
export type CodeBlock = { kind: "code"; langage?: string; texte: string };

/** Un bloc de contenu, quel que soit son type. */
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | NoteBlock
  | CodeBlock;

/** Contenu complet d'une leçon. */
export type LessonContent = ContentBlock[];

// ==================== FABRIQUES ====================
// Raccourcis d'écriture : une leçon se lit comme une suite d'appels courts.

/** Titre intermédiaire. */
export const titre = (texte: string): HeadingBlock => ({ kind: "titre", texte });

/** Paragraphe. */
export const p = (texte: string): ParagraphBlock => ({ kind: "paragraphe", texte });

/** Liste à puces. */
export const liste = (...items: string[]): ListBlock => ({ kind: "liste", items });

/** Liste numérotée, pour une marche à suivre. */
export const etapes = (...items: string[]): ListBlock => ({
  kind: "liste",
  ordonnee: true,
  items,
});

/** Tableau à en-tête. */
export const tableau = (entetes: string[], lignes: string[][]): TableBlock => ({
  kind: "tableau",
  entetes,
  lignes,
});

/** Encadré d'information. */
export const note = (texte: string, titreEncadre?: string): NoteBlock => ({
  kind: "encadre",
  ton: "info",
  titre: titreEncadre,
  texte,
});

/** Encadré « piège d'examen ». */
export const examen = (texte: string): NoteBlock => ({
  kind: "encadre",
  ton: "examen",
  titre: "À l'examen",
  texte,
});

/** Encadré « moyen mnémotechnique ». */
export const memo = (texte: string): NoteBlock => ({
  kind: "encadre",
  ton: "memo",
  titre: "Pour retenir",
  texte,
});

/** Extrait de code. */
export const code = (texte: string, langage?: string): CodeBlock => ({
  kind: "code",
  langage,
  texte,
});
