/**
 * =============================================================
 *  Fichier    : site-map.ts
 *  Projet     : Kalami
 *  Description: Référencement Google : entrées du plan du site (sitemap.xml) et règles
 *               des robots (robots.txt). Fonctions pures, lues par app/sitemap.ts et
 *               app/robots.ts.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-28
 *  Dépendances: lib/legal/kinds.ts
 * =============================================================
 */

import type { MetadataRoute } from "next";

import { LEGAL_KINDS, legalPath } from "@/lib/legal/kinds";

// ==================== CONSTANTES ====================

/**
 * Chemins jamais indexés : espaces privés, liseuse (contenu payant), routes techniques.
 * « $ » limite la règle au chemin exact (/auteur ne doit pas bloquer /auteurs).
 */
export const DISALLOWED_PATHS = [
  "/admin",
  "/compte",
  "/auteur$",
  "/auteur/",
  "/api/",
  "/auth/",
  "/apercu",
  "/hors-ligne",
  "/recherche",
  "/livres/*/lire",
  "/strategie/etudes",
  "/strategie/nouvelle",
  "/strategie/compte",
  "/strategie/notifications",
  "/strategie/invitation",
  "/strategie/classe",
  "/strategie/hors-ligne",
];

// ==================== TYPES ====================

/** Données du catalogue nécessaires au plan du site. */
export type SitemapSource = {
  books: {
    slug: string;
    updated_at: string;
    author: { slug: string };
    category: { slug: string } | null;
  }[];
  categories: { slug: string }[];
};

// ==================== FONCTIONS ====================

/**
 * Entrées du plan du site : accueil, Kalami Stratégie, catégories ayant au moins un livre
 * publié (une catégorie vide n'est pas proposée à Google), livres publiés,
 * auteurs ayant au moins un livre publié, textes légaux.
 * @param appUrl - URL publique sans « / » final
 * @param source - Livres publiés et catégories
 * @returns Entrées sans doublon, au format de Next.js
 */
export function buildSitemap(appUrl: string, source: SitemapSource): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: appUrl, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/strategie`, changeFrequency: "monthly", priority: 0.6 },
  ];
  const filled = new Set(source.books.map((book) => book.category?.slug));
  for (const category of source.categories) {
    if (!filled.has(category.slug)) continue;
    entries.push({ url: `${appUrl}/categories/${category.slug}`, priority: 0.6 });
  }

  // Un auteur prend la date de son livre le plus récemment modifié
  const authors = new Map<string, string>();
  for (const book of source.books) {
    entries.push({
      url: `${appUrl}/livres/${book.slug}`,
      lastModified: book.updated_at,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    const known = authors.get(book.author.slug);
    if (!known || book.updated_at > known) authors.set(book.author.slug, book.updated_at);
  }
  for (const [slug, lastModified] of authors) {
    entries.push({ url: `${appUrl}/auteurs/${slug}`, lastModified, priority: 0.5 });
  }

  for (const kind of LEGAL_KINDS) {
    entries.push({ url: `${appUrl}${legalPath(kind)}`, changeFrequency: "yearly", priority: 0.2 });
  }
  return entries;
}

/**
 * Règles de robots.txt : tout le catalogue public, sauf les chemins privés.
 * @param appUrl - URL publique sans « / » final
 */
export function buildRobots(appUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
