/**
 * =============================================================
 *  Fichier    : docx-images.ts
 *  Projet     : Kalami
 *  Description: Images d'un manuscrit Word (schémas, illustrations) : recompressées en WebP,
 *               réduites à une largeur de lecture et intégrées au bloc (data:image/webp).
 *               Elles suivent ainsi le texte : mêmes droits d'accès, lecture hors ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: sharp
 * =============================================================
 */

import "server-only";

import sharp from "sharp";

// ==================== CONSTANTES ====================

/** Nombre maximal d'images gardées par livre (au-delà : ignorées). */
export const MAX_IMAGES = 200;

/** Largeur maximale d'une image (px) : nette sur une double page, sans poids inutile. */
const MAX_WIDTH = 1200;

/** Poids maximal d'une image recompressée (octets) ; au-delà, seconde passe plus légère. */
const MAX_IMAGE_BYTES = 400 * 1024;

/** Formats que sharp sait lire (les EMF/WMF de Word sont ignorés). */
const READABLE_TYPES = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/tiff", "image/bmp",
]);

// ==================== TYPES ====================

/** Attributs de l'élément img produit (src vide : image ignorée). */
export type ImageAttributes = { src: string; width?: string; height?: string };

/** Image telle que mammoth la présente. */
export type DocxImage = { contentType: string; read: () => Promise<Buffer> };

// ==================== CONVERSION ====================

/**
 * Recompresse une image en WebP.
 * @param data    - Image d'origine
 * @param width   - Largeur maximale
 * @param quality - Qualité WebP (1 à 100)
 * @returns Image et dimensions finales
 */
async function toWebp(data: Buffer, width: number, quality: number) {
  return sharp(data, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
}

/**
 * Prépare le convertisseur d'images d'un manuscrit (un par conversion : il compte les images).
 * @returns Fonction donnant les attributs de chaque image
 *
 * Exemple : mammoth.images.imgElement(createImageConverter())
 */
export function createImageConverter(): (image: DocxImage) => Promise<ImageAttributes> {
  let count = 0;
  return async (image) => {
    if (count >= MAX_IMAGES || !READABLE_TYPES.has(image.contentType.toLowerCase())) {
      return { src: "" };
    }
    try {
      const original = await image.read();
      let result = await toWebp(original, MAX_WIDTH, 80);
      if (result.data.length > MAX_IMAGE_BYTES) result = await toWebp(original, 900, 65);
      if (result.data.length > MAX_IMAGE_BYTES) return { src: "" };
      count++;
      return {
        src: `data:image/webp;base64,${result.data.toString("base64")}`,
        width: String(result.info.width),
        height: String(result.info.height),
      };
    } catch {
      // Image illisible ou corrompue : le texte reste converti sans elle
      return { src: "" };
    }
  };
}
