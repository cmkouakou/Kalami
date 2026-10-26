/**
 * Fichier    : author-workshop-listing.test.ts
 * Projet     : Kalami
 * Description: Tests de la fiche du livre rédigée par Claude (v0.15.2) : nettoyage de la
 *              sortie (mots-clés, titres, longueurs), relecture d'une fiche enregistrée,
 *              mots-clés en texte borné, extrait du manuscrit et message envoyé.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-25
 */

import { describe, expect, it } from "vitest";

import {
  EXCERPT_CHARS,
  KEYWORDS_TEXT_MAX,
  keywordsText,
  listingMessage,
  manuscriptExcerpt,
  readListing,
  sanitizeListing,
  SUMMARY_MAX,
} from "@/lib/author/workshop/listing";

const RAW = {
  summary: "  Un résumé.  ",
  hook: " Une accroche. ",
  keywords: ["roman, Afrique", "Roman  Afrique", "  ", "exil; mémoire", "famille"],
  bio: "",
  titles: [
    { title: "Le fleuve", subtitle: "" },
    { title: "Le fleuve", subtitle: "" },
    { title: "  ", subtitle: "Sans titre" },
    { title: "Les rives", subtitle: "Roman" },
  ],
};

describe("sanitizeListing", () => {
  it("retire séparateurs, doublons et titres vides", () => {
    const listing = sanitizeListing(RAW);
    expect(listing.summary).toBe("Un résumé.");
    expect(listing.hook).toBe("Une accroche.");
    expect(listing.keywords).toEqual(["roman Afrique", "exil mémoire", "famille"]);
    expect(listing.bio).toBe("");
    expect(listing.titles).toEqual([
      { title: "Le fleuve", subtitle: null },
      { title: "Les rives", subtitle: "Roman" },
    ]);
  });

  it("borne les longueurs et le nombre de mots-clés", () => {
    const listing = sanitizeListing({
      ...RAW,
      summary: "a".repeat(SUMMARY_MAX + 50),
      keywords: Array.from({ length: 30 }, (_, index) => `mot${index}`),
    });
    expect(listing.summary).toHaveLength(SUMMARY_MAX);
    expect(listing.keywords).toHaveLength(12);
  });
});

describe("readListing", () => {
  it("relit une fiche enregistrée et rejette une sortie mal formée", () => {
    const listing = sanitizeListing(RAW);
    expect(readListing(JSON.parse(JSON.stringify(listing)))).toEqual(listing);
    expect(readListing({ summary: "x" })).toBeNull();
    expect(readListing(null)).toBeNull();
  });
});

describe("keywordsText", () => {
  it("joint par des virgules sans dépasser la limite de la fiche", () => {
    expect(keywordsText(["a", "b"])).toBe("a, b");
    const long = keywordsText(Array.from({ length: 12 }, () => "x".repeat(60)));
    expect(long.length).toBeLessThanOrEqual(KEYWORDS_TEXT_MAX);
    expect(long.split(", ")).toHaveLength(8);
  });
});

describe("manuscriptExcerpt", () => {
  it("garde tout un court manuscrit en texte brut", () => {
    const excerpt = manuscriptExcerpt([
      { title: "Un", blocks: ["<p>Bonjour &amp; bienvenue</p>"] },
    ]);
    expect(excerpt).toEqual({ text: "## Un\nBonjour & bienvenue", truncated: false });
  });

  it("coupe un long manuscrit et le signale", () => {
    const block = `<p>${"mot ".repeat(10_000)}</p>`;
    const excerpt = manuscriptExcerpt([
      { title: "Un", blocks: [block] },
      { title: "Deux", blocks: [block] },
    ]);
    expect(excerpt.truncated).toBe(true);
    expect(excerpt.text.length).toBeLessThanOrEqual(EXCERPT_CHARS);
    expect(excerpt.text).toContain("## Deux");
  });
});

describe("listingMessage", () => {
  it("décrit la fiche actuelle, l'absence de biographie et la table des chapitres", () => {
    const message = listingMessage({
      title: "Le fleuve",
      subtitle: null,
      summary: null,
      keywords: "roman; exil",
      language: "fr",
      authorName: "A. Auteur",
      bio: "  ",
      chapters: [
        { title: "Départ", blocks: ["<p>Il partit.</p>"] },
        { title: "Retour", blocks: ["<p>Il revint.</p>"] },
      ],
    });
    expect(message).toContain("Biographie fournie par l'auteur : (aucune)");
    expect(message).toContain("Mots-clés actuels : roman, exil");
    expect(message).toContain("1. Départ\n2. Retour");
    expect(message).toContain("Texte du manuscrit :\n## Départ\nIl partit.");
  });
});
