/**
 * =============================================================
 *  Fichier    : book-json-ld.ts
 *  Projet     : Kalami
 *  Description: Données structurées schema.org « Book » d'une fiche de livre (JSON-LD),
 *               lues par Google pour enrichir les résultats de recherche. Le prix n'y
 *               figure pas : il dépend de la devise du lecteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-26
 *  Dépendances: lib/catalog/types.ts
 * =============================================================
 */

import type { BookDetail } from "@/lib/catalog/types";

/**
 * Objet JSON-LD d'un livre ; les champs vides sont omis.
 * @param book     - Fiche publique du livre
 * @param appUrl   - URL publique sans « / » final
 * @param coverUrl - URL absolue de la couverture, ou null
 * @returns Objet prêt pour JSON.stringify
 */
export function bookJsonLd(
  book: BookDetail,
  appUrl: string,
  coverUrl: string | null,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    url: `${appUrl}/livres/${book.slug}`,
    inLanguage: book.language,
    bookFormat: "https://schema.org/EBook",
    author: {
      "@type": "Person",
      name: book.author.display_name,
      url: `${appUrl}/auteurs/${book.author.slug}`,
    },
  };
  if (book.subtitle) data.alternativeHeadline = book.subtitle;
  if (book.summary) data.description = book.summary;
  if (coverUrl) data.image = coverUrl;
  if (book.edition) data.bookEdition = book.edition;
  if (book.publication_year) data.datePublished = String(book.publication_year);
  if (book.page_count) data.numberOfPages = book.page_count;
  if (book.keywords) data.keywords = book.keywords;
  if (book.category) data.genre = book.category.name;
  return data;
}

/**
 * Sérialise le JSON-LD pour une balise <script> : « < » échappé pour qu'aucun texte
 * saisi (titre, résumé) ne puisse fermer la balise.
 * @param data - Objet JSON-LD
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
