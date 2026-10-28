/**
 * =============================================================
 *  Fichier    : share.ts
 *  Projet     : Kalami
 *  Description: Partage du lien public d'un livre (page /livres/[slug]) : menu de partage
 *               natif du téléphone, sinon copie du texte et du lien. Commun à la liseuse et
 *               à la page du livre (v0.15.8). Code navigateur uniquement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/config.ts, i18n
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import { APP_NAME, APP_URL } from "@/lib/config";

const t = getDictionary();

/** Résultat du partage : menu natif utilisé, lien copié, annulé ou échec. */
export type ShareOutcome = "shared" | "copied" | "cancelled" | "error";

/**
 * Partage le lien public d'un livre.
 * @param book - Slug, titre et nom de l'auteur
 * @returns Issue du partage, pour afficher le bon message
 *
 * Exemple :
 *   const outcome = await shareBookLink({ slug, title, authorName });
 */
export async function shareBookLink(book: {
  slug: string;
  title: string;
  authorName: string;
}): Promise<ShareOutcome> {
  const url = `${APP_URL}/livres/${book.slug}`;
  const text = interpolate(t.reader.share.bookText, {
    title: book.title,
    author: book.authorName,
    app: APP_NAME,
  });
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: book.title, text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch (error) {
    // Annulation du menu de partage : rien à signaler
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    return "error";
  }
}
