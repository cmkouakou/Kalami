/**
 * Fichier    : seo.test.ts
 * Projet     : Kalami
 * Description: Tests du référencement : plan du site, règles des robots et données
 *              structurées « Book » (JSON-LD).
 * Auteur     : Claude Marcel
 * Version    : 1.2
 * Date       : 2026-10-28
 */

import { describe, expect, it } from "vitest";

import type { BookDetail } from "@/lib/catalog/types";
import { bookJsonLd, serializeJsonLd } from "@/lib/seo/book-json-ld";
import {
  buildRobots,
  buildSitemap,
  DISALLOWED_PATHS,
} from "@/lib/seo/site-map";

const APP = "https://kalami-livres.com";

// ==================== PLAN DU SITE ====================

describe("buildSitemap", () => {
  const sitemap = buildSitemap(APP, {
    categories: [
      { slug: "roman", published_count: 1 },
      { slug: "vide", published_count: 0 },
    ],
    books: [
      { slug: "livre-a", updated_at: "2026-10-01T00:00:00Z", author: { slug: "awa" } },
      { slug: "livre-b", updated_at: "2026-10-20T00:00:00Z", author: { slug: "awa" } },
    ],
  });
  const urls = sitemap.map((entry) => entry.url);

  it("liste l'accueil, les catégories, les livres et les textes légaux", () => {
    expect(urls).toContain(APP);
    expect(urls).toContain(`${APP}/categories/roman`);
    expect(urls).toContain(`${APP}/livres/livre-a`);
    expect(urls).toContain(`${APP}/livres/livre-b`);
    expect(urls).toContain(`${APP}/confidentialite`);
  });

  it("écarte les catégories sans livre publié", () => {
    expect(urls).not.toContain(`${APP}/categories/vide`);
  });

  it("liste chaque auteur une fois, daté de son livre le plus récent", () => {
    const authors = sitemap.filter(
      (entry) => entry.url === `${APP}/auteurs/awa`,
    );
    expect(authors).toHaveLength(1);
    expect(authors[0].lastModified).toBe("2026-10-20T00:00:00Z");
  });

  it("n'a aucun doublon", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});

// ==================== ROBOTS ====================

describe("buildRobots", () => {
  it("ferme les espaces privés et la liseuse, pas les pages auteurs publiques", () => {
    const robots = buildRobots(APP);
    expect(robots.sitemap).toBe(`${APP}/sitemap.xml`);
    expect(DISALLOWED_PATHS).toEqual(
      expect.arrayContaining(["/admin", "/compte", "/api/", "/livres/*/lire"]),
    );
    // « /auteur » sans « $ » bloquerait aussi /auteurs/…
    expect(DISALLOWED_PATHS).not.toContain("/auteur");
    expect(DISALLOWED_PATHS.some((path) => path.startsWith("/auteurs"))).toBe(
      false,
    );
  });
});

// ==================== JSON-LD ====================

describe("bookJsonLd", () => {
  const book = {
    id: "b1",
    slug: "livre-a",
    title: "Le titre </script><script>",
    subtitle: null,
    cover_path: null,
    language: "fr",
    book_prices: [],
    edition: null,
    back_cover_path: null,
    summary: "Résumé",
    keywords: null,
    page_count: 120,
    chapter_count: 8,
    publication_year: 2026,
    published_at: "2026-10-01T00:00:00Z",
    author: {
      id: "a1",
      slug: "awa",
      display_name: "Awa K.",
      bio: null,
      photo_path: null,
    },
    category: { slug: "roman", name: "Roman" },
  } satisfies BookDetail;

  it("décrit le livre et son auteur, sans champ vide", () => {
    const data = bookJsonLd(book, APP, "https://cdn/couverture.webp");
    expect(data["@type"]).toBe("Book");
    expect(data.url).toBe(`${APP}/livres/livre-a`);
    expect(data.author).toMatchObject({
      name: "Awa K.",
      url: `${APP}/auteurs/awa`,
    });
    expect(data.numberOfPages).toBe(120);
    expect(data.genre).toBe("Roman");
    expect(data).not.toHaveProperty("alternativeHeadline");
    expect(data).not.toHaveProperty("keywords");
  });

  it("échappe « < » pour qu'un titre ne ferme pas la balise script", () => {
    const json = serializeJsonLd(bookJsonLd(book, APP, null));
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).name).toBe(book.title);
  });
});
