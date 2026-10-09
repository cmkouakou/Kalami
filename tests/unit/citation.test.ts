/**
 * Fichier    : citation.test.ts
 * Projet     : Kalami
 * Description: Tests des références bibliographiques (APA, MLA, Chicago) : noms d'auteur,
 *              édition et année facultatives, titre séparé (italique), texte copié.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-10
 */

import { describe, expect, it } from "vitest";

import {
  apaName,
  type CitationSource,
  citationText,
  formatCitation,
  invertName,
} from "@/lib/reader/citation";

const SOURCE: CitationSource = {
  author: "Claude Marcel Kouakou",
  title: "Stratégie d'entreprise",
  chapterTitle: "Le diagnostic",
  edition: "2e éd.",
  year: 2024,
  platform: "Kalami",
  url: "https://kalami-livres.com/livres/strategie/lire?chapitre=2",
};

describe("noms d'auteur", () => {
  it("inverse nom et prénoms", () => {
    expect(invertName("Claude Marcel Kouakou")).toBe("Kouakou, Claude Marcel");
    expect(invertName("  Ahmadou   Kourouma ")).toBe("Kourouma, Ahmadou");
    expect(invertName("Collectif")).toBe("Collectif");
  });

  it("abrège les prénoms au format APA", () => {
    expect(apaName("Claude Marcel Kouakou")).toBe("Kouakou, C. M.");
    expect(apaName("Jean-Paul Diallo")).toBe("Diallo, J.-P.");
  });
});

describe("formatCitation", () => {
  it("APA", () => {
    const citation = formatCitation("apa", SOURCE);
    expect(citation.title).toBe("Stratégie d'entreprise");
    expect(citationText(citation)).toBe(
      "Kouakou, C. M. (2024). Le diagnostic. Dans Stratégie d'entreprise (2e éd.). Kalami. " +
        SOURCE.url,
    );
  });

  it("MLA", () => {
    expect(citationText(formatCitation("mla", SOURCE))).toBe(
      "Kouakou, Claude Marcel. « Le diagnostic. » Stratégie d'entreprise, 2e éd., Kalami, " +
        `2024, ${SOURCE.url}.`,
    );
  });

  it("Chicago", () => {
    expect(citationText(formatCitation("chicago", SOURCE))).toBe(
      "Kouakou, Claude Marcel. « Le diagnostic. » Dans Stratégie d'entreprise. 2e éd. " +
        `Kalami, 2024. ${SOURCE.url}.`,
    );
  });

  it("gère l'absence d'édition et d'année", () => {
    const source = { ...SOURCE, edition: null, year: null };
    expect(citationText(formatCitation("apa", source))).toContain("(s. d.)");
    expect(citationText(formatCitation("apa", source))).not.toContain("()");
    expect(citationText(formatCitation("mla", source))).not.toMatch(/, ,/);
    expect(citationText(formatCitation("chicago", source))).toContain("Kalami, s. d.");
  });

  it("n'ajoute pas de point après une ponctuation finale", () => {
    const source = { ...SOURCE, chapterTitle: "Pourquoi changer ?" };
    expect(citationText(formatCitation("apa", source))).toContain("Pourquoi changer ? Dans");
  });
});
