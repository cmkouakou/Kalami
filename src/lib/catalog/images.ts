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

/** Chemin d'une image envoyée par le navigateur : « {dossier}/{id}/{uuid}.{ext} ». */
const UUID_SOURCE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const IMAGE_PATH_PATTERN = new RegExp(
  `^(livres|auteurs)/(${UUID_SOURCE})/${UUID_SOURCE}[.](jpg|png|webp)$`,
);

/**
 * Vérifie qu'un chemin d'image appartient bien à l'élément modifié.
 * @param path   - Chemin envoyé par le navigateur
 * @param folder - « livres » ou « auteurs »
 * @param id     - Identifiant de l'élément
 */
export function isOwnImagePath(path: unknown, folder: "livres" | "auteurs", id: string): boolean {
  if (typeof path !== "string") return false;
  const match = IMAGE_PATH_PATTERN.exec(path);
  return match !== null && match[1] === folder && match[2] === id;
}
