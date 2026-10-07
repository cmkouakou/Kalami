/**
 * =============================================================
 *  Fichier    : images.ts
 *  Projet     : Kalami
 *  Description: Construction des URL publiques des images du catalogue (seau « covers »).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 * =============================================================
 */

/** Seau Supabase Storage public des couvertures et photos d'auteurs. */
export const COVERS_BUCKET = "covers";

/**
 * Retourne l'URL publique d'une image du seau « covers ».
 * @param path - Chemin de l'objet (ex. « livres/{id}/{uuid}.webp »), ou null
 * @returns URL absolue, ou null si aucune image
 */
export function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${COVERS_BUCKET}/${encoded}`;
}
