/**
 * =============================================================
 *  Fichier    : share.ts
 *  Projet     : Kalami
 *  Description: Partage du lien public d'un livre (page /livres/[slug]) : menu de partage
 *               natif du téléphone, sinon copie du texte et du lien. Commun à la liseuse et
 *               à la page du livre (v0.15.8). Code navigateur uniquement.
 *               v1.1 : couverture jointe au partage quand l'appareil accepte les fichiers.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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
 * Charge la couverture d'un livre sous forme de fichier, pour la joindre au partage.
 * À appeler avant le clic : le menu de partage doit s'ouvrir sans attente.
 * @param url - Adresse publique de la couverture
 * @param slug - Slug du livre (nom du fichier)
 * @returns Fichier image, ou null si le chargement échoue
 */
export async function loadCoverFile(url: string, slug: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;
    const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    return new File([blob], `${slug}.${extension}`, { type: blob.type });
  } catch {
    return null;
  }
}

/**
 * Partage le lien public d'un livre, avec sa couverture si l'appareil le permet.
 * @param book - Slug, titre, nom de l'auteur et couverture déjà chargée (facultative)
 * @returns Issue du partage, pour afficher le bon message
 *
 * Exemple :
 *   const outcome = await shareBookLink({ slug, title, authorName });
 */
export async function shareBookLink(book: {
  slug: string;
  title: string;
  authorName: string;
  cover?: File | null;
}): Promise<ShareOutcome> {
  const url = `${APP_URL}/livres/${book.slug}`;
  const text = interpolate(t.reader.share.bookText, {
    title: book.title,
    author: book.authorName,
    app: APP_NAME,
  });
  try {
    if (typeof navigator.share === "function") {
      const files = book.cover ? [book.cover] : [];
      if (files.length > 0 && navigator.canShare?.({ files })) {
        // Avec une image, plusieurs applications ignorent « url » : le lien va dans le texte
        await navigator.share({ title: book.title, text: `${text} ${url}`, files });
        return "shared";
      }
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
