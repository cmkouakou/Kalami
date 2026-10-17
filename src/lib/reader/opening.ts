/**
 * =============================================================
 *  Fichier    : opening.ts
 *  Projet     : Kalami
 *  Description: Ouverture d'un chapitre (fonctions pures, client et serveur) : surtitre
 *               (« MODULE 3 ») posé par la conversion en premier bloc, affiché au-dessus du
 *               titre par la liseuse et le PDF (le bloc lui-même est masqué).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Premier bloc d'un chapitre ouvert par un surtitre. */
const KICKER_BLOCK = /^<p class="chapitre-surtitre">([^<]*)<\/p>$/;

/** Entités possibles dans un texte nettoyé. */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Surtitre du chapitre, en texte brut.
 * @param blocks - Blocs HTML du chapitre
 * @returns Surtitre (ex. « MODULE 3 »), ou null si le chapitre n'en a pas
 *
 * Exemple : chapterKicker(['<p class="chapitre-surtitre">MODULE 3</p>', …]) → "MODULE 3"
 */
export function chapterKicker(blocks: string[]): string | null {
  const match = KICKER_BLOCK.exec(blocks[0] ?? "");
  if (!match) return null;
  return match[1].replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (entity) => ENTITIES[entity]);
}
