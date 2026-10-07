/**
 * =============================================================
 *  Fichier    : convert-docx.ts
 *  Projet     : Kalami
 *  Description: Conversion d'un manuscrit DOCX en chapitres HTML nettoyés (mammoth).
 *               Un chapitre commence à chaque titre de niveau 1 (style « Titre 1 » de Word) ;
 *               à défaut de titre 1, au niveau 2 ; à défaut, le livre forme un seul chapitre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: mammoth, htmlparser2, sanitize.ts, zip.ts
 * =============================================================
 */

import "server-only";

import { parseDocument } from "htmlparser2";
import mammoth from "mammoth";

import { assertLimits, flattenNodes, isHeading, splitByHeading } from "./sanitize";
import { ConversionError, type ConvertedChapter } from "./types";
import { openZip } from "./zip";

/** Titres par défaut, fournis par l'appelant (dictionnaire de langue). */
export type DocxTitles = {
  /** Titre du livre : utilisé quand le document n'a aucun titre de chapitre. */
  book: string;
  /** Titre du texte placé avant le premier chapitre (page de titre, avant-propos…). */
  opening: string;
};

/**
 * Convertit un fichier DOCX en chapitres.
 * @param data   - Contenu binaire du fichier
 * @param titles - Titres par défaut
 * @returns Chapitres nettoyés, dans l'ordre du document
 * @throws ConversionError si le fichier est invalide, vide ou hors limites
 *
 * Exemple : const chapitres = await convertDocx(buffer, { book: "Mon livre", opening: "Début" });
 */
export async function convertDocx(
  data: Uint8Array,
  titles: DocxTitles,
): Promise<ConvertedChapter[]> {
  // Contrôle de l'archive avant que mammoth ne la décompresse
  await openZip(data);

  let html: string;
  try {
    const result = await mammoth.convertToHtml(
      { buffer: Buffer.from(data) },
      // Images non conservées en v1 : on évite de les lire et de les encoder en base64
      { convertImage: mammoth.images.imgElement(async () => ({ src: "" })) },
    );
    html = result.value;
  } catch {
    throw new ConversionError("invalid_file");
  }

  const nodes = flattenNodes(parseDocument(html).children);
  const level = [1, 2].find((n) => nodes.some((node) => isHeading(node, n)));

  const chapters = level
    ? splitByHeading(nodes, level, titles.opening)
    : splitByHeading(nodes, 1, titles.book);

  assertLimits(chapters);
  return chapters;
}
