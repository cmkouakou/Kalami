/**
 * =============================================================
 *  Fichier    : convert-docx.ts
 *  Projet     : Kalami
 *  Description: Conversion d'un manuscrit DOCX en chapitres HTML nettoyés (mammoth).
 *               Un chapitre commence à chaque titre de niveau 1 (style « Titre 1 » de Word) ;
 *               à défaut de titre 1, au niveau 2 ; à défaut, le livre forme un seul chapitre.
 *               v1.1 : sans styles « Titre », titres repérés à leur allure (headings.ts).
 *               v1.2 : images (schémas, illustrations) et encadrés conservés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-17
 *  Dépendances: mammoth, htmlparser2, docx-images.ts, docx-layout.ts, headings.ts,
 *               sanitize.ts, zip.ts
 * =============================================================
 */

import "server-only";

import { parseDocument } from "htmlparser2";
import mammoth from "mammoth";

import { createImageConverter } from "./docx-images";
import { arrangeLayout, BOX_STYLE_MAP, markBoxes } from "./docx-layout";
import { promoteHeadings } from "./headings";
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

/** Chemin du corps du document dans l'archive Word. */
const DOCUMENT_PATH = "word/document.xml";

/**
 * Prépare l'archive pour mammoth : paragraphes d'encadré marqués d'un style fictif.
 * @param data - Contenu binaire du fichier
 * @returns Archive réécrite (ou d'origine si le corps est introuvable)
 */
async function prepareArchive(data: Uint8Array): Promise<Buffer> {
  const zip = await openZip(data);
  const document = zip.file(DOCUMENT_PATH);
  if (!document) return Buffer.from(data);
  try {
    zip.file(DOCUMENT_PATH, markBoxes(await document.async("string")));
    return await zip.generateAsync({ type: "nodebuffer" });
  } catch {
    throw new ConversionError("invalid_file");
  }
}

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
  const buffer = await prepareArchive(data);

  let html: string;
  try {
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: BOX_STYLE_MAP,
        // Schémas et illustrations recompressés en WebP, intégrés au texte
        convertImage: mammoth.images.imgElement(createImageConverter()),
      },
    );
    html = result.value;
  } catch {
    throw new ConversionError("invalid_file");
  }

  const nodes = arrangeLayout(flattenNodes(parseDocument(html).children));
  let level = [1, 2].find((n) => nodes.some((node) => isHeading(node, n)));
  // Manuscrit sans styles « Titre » : titres repérés à leur allure (gras, « Chapitre 2 »…) ;
  // seuls les marqueurs de chapitre (h1) découpent, les autres restent des intertitres
  if (!level) {
    promoteHeadings(nodes);
    level = nodes.some((node) => isHeading(node, 1)) ? 1 : undefined;
  }

  const chapters = level
    ? splitByHeading(nodes, level, titles.opening)
    : splitByHeading(nodes, 1, titles.book);

  assertLimits(chapters);
  return chapters;
}
