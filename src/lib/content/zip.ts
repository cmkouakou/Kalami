/**
 * =============================================================
 *  Fichier    : zip.ts
 *  Projet     : Kalami
 *  Description: Ouverture contrôlée des archives ZIP (DOCX et EPUB) : refuse les fichiers
 *               invalides et les « bombes ZIP » avant toute décompression.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: jszip
 * =============================================================
 */

import "server-only";

import JSZip from "jszip";

import { ConversionError } from "./types";

/** Taille décompressée maximale d'un manuscrit (toutes entrées confondues). */
export const MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;

/** Nombre maximal d'entrées dans l'archive. */
const MAX_ENTRIES = 5000;

/** Champ interne de JSZip donnant la taille décompressée annoncée par l'archive. */
type ZipEntryInternals = { _data?: { uncompressedSize?: number } };

/**
 * Ouvre une archive ZIP en vérifiant sa taille décompressée annoncée.
 * @param data - Contenu binaire du fichier
 * @returns Archive prête à être lue
 * @throws ConversionError « invalid_file » (pas une archive) ou « too_large »
 */
export async function openZip(data: ArrayBuffer | Uint8Array): Promise<JSZip> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new ConversionError("invalid_file");
  }

  const entries = Object.values(zip.files);
  if (entries.length > MAX_ENTRIES) throw new ConversionError("too_large");

  const total = entries.reduce(
    (sum, entry) => sum + ((entry as unknown as ZipEntryInternals)._data?.uncompressedSize ?? 0),
    0,
  );
  if (total > MAX_UNCOMPRESSED_BYTES) throw new ConversionError("too_large");
  return zip;
}
