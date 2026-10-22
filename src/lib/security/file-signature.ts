/**
 * =============================================================
 *  Fichier    : file-signature.ts
 *  Projet     : Kalami
 *  Description: Contrôle du type réel d'un fichier déposé par le navigateur (Sprint 11s).
 *               Le seau ne vérifie que le type déclaré par le navigateur ; on lit ici les
 *               premiers octets (signature) et on refuse un fichier dont le contenu ne
 *               correspond pas à son extension (ex. : page HTML renommée en .png).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: lib/supabase/admin.ts
 * =============================================================
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// ==================== SIGNATURES ====================

/** Type reconnu d'après les premiers octets. */
export type SniffedType = "pdf" | "png" | "jpeg" | "gif" | "webp" | "zip";

/** Nombre d'octets lus au début du fichier. */
const HEAD_BYTES = 16;

/** Type attendu pour chaque extension admise au dépôt (DOCX et XLSX sont des archives ZIP). */
const EXPECTED: Record<string, SniffedType> = {
  pdf: "pdf",
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  gif: "gif",
  webp: "webp",
  docx: "zip",
  xlsx: "zip",
  epub: "zip",
};

/**
 * Vrai si les octets commencent par la séquence donnée.
 * @param bytes  - Octets lus
 * @param prefix - Séquence attendue
 * @param offset - Position de départ
 */
function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  return prefix.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Reconnaît le type d'un fichier d'après sa signature.
 * @param bytes - Premiers octets du fichier
 * @returns Type reconnu, ou null
 */
export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "gif"; // GIF8
  // RIFF....WEBP
  const riff = startsWith(bytes, [0x52, 0x49, 0x46, 0x46]);
  if (riff && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return "zip"; // PK..
  return null;
}

/**
 * Vrai si le contenu correspond à l'extension du fichier.
 * @param bytes     - Premiers octets du fichier
 * @param extension - Extension, sans le point (ex. « png »)
 */
export function matchesExtension(bytes: Uint8Array, extension: string): boolean {
  const expected = EXPECTED[extension.toLowerCase()];
  return expected !== undefined && sniffFileType(bytes) === expected;
}

// ==================== LECTURE DANS LE SEAU ====================

/**
 * Vérifie le contenu d'un fichier déjà déposé dans un seau, sans le télécharger en entier
 * (requête partielle sur une URL signée d'une minute).
 * @param bucket - Seau Supabase Storage
 * @param path   - Chemin du fichier ; son extension donne le type attendu
 * @returns false si le fichier manque, est illisible ou ne correspond pas à son extension
 */
export async function storedFileMatchesExtension(bucket: string, path: string): Promise<boolean> {
  const extension = path.split(".").pop() ?? "";
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return false;
  try {
    const response = await fetch(data.signedUrl, {
      headers: { Range: `bytes=0-${HEAD_BYTES - 1}` },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const bytes = new Uint8Array(await response.arrayBuffer()).subarray(0, HEAD_BYTES);
    return matchesExtension(bytes, extension);
  } catch {
    return false;
  }
}
