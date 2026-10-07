/**
 * =============================================================
 *  Fichier    : types.ts (content)
 *  Projet     : Kalami
 *  Description: Types partagés de la conversion des manuscrits et du service des chapitres.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Chapitre issu d'une conversion : HTML nettoyé, découpé en blocs de premier niveau. */
export type ConvertedChapter = {
  title: string;
  blocks: string[];
  word_count: number;
};

/** Formats de manuscrit acceptés. */
export const MANUSCRIPT_FORMATS = ["docx", "epub"] as const;
export type ManuscriptFormat = (typeof MANUSCRIPT_FORMATS)[number];

/** Types MIME enregistrés dans le seau « manuscripts » (identiques à allowed_mime_types). */
export const MANUSCRIPT_MIME_TYPES: Record<ManuscriptFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip",
};

/** Seau privé des manuscrits ; limite identique à file_size_limit (20 Mo). */
export const MANUSCRIPTS_BUCKET = "manuscripts";
export const MANUSCRIPT_MAX_BYTES = 20 * 1024 * 1024;

/** Causes d'échec de conversion, traduites dans le dictionnaire (admin.content.errors). */
export type ConversionErrorCode = "invalid_file" | "empty" | "too_large" | "too_many_chapters";

/** Erreur de conversion attendue (fichier invalide, vide ou hors limites). */
export class ConversionError extends Error {
  readonly code: ConversionErrorCode;

  constructor(code: ConversionErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ConversionError";
    this.code = code;
  }
}

/** Chapitre renvoyé par l'API de contenu. */
export type ChapterPayload = {
  book_id: string;
  position: number;
  title: string;
  blocks: string[];
  chapter_count: number;
  /** Accès par l'extrait gratuit (et non par un droit de lecture). */
  is_preview: boolean;
  /** Chapitre coupé : la suite exige un droit de lecture. */
  truncated: boolean;
};
