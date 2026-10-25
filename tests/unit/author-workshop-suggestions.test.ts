/**
 * Fichier    : author-workshop-suggestions.test.ts
 * Projet     : Kalami
 * Description: Tests du relecteur de l'atelier (v0.15.1) : nettoyage de la sortie de Claude,
 *              repérage d'un extrait dans le HTML d'un bloc (espaces insécables, apostrophes,
 *              balises), application des suggestions acceptées et message envoyé.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-25
 */

import { describe, expect, it } from "vitest";

import {
  applySuggestions,
  chapterMessage,
  locate,
  readChapterReview,
  replaceInBlock,
  sanitizeChapterOutput,
} from "@/lib/author/workshop/suggestions";

const NBSP = " ";
const NNBSP = " ";

describe("locate", () => {
  it("retrouve un extrait malgré les espaces insécables et l'apostrophe typographique", () => {
    const html = `<p>L’homme dit${NNBSP}: «${NBSP}bonjour${NBSP}».</p>`;
    expect(locate(html, "L'homme dit :")).not.toBeNull();
    expect(locate(html, "« bonjour »")).not.toBeNull();
  });

  it("ne traverse pas une balise et ignore les attributs", () => {
    const html = `<p class="note">Un <em>mot</em> fort</p>`;
    expect(locate(html, "Un mot")).toBeNull();
    expect(locate(html, "note")).toBeNull();
    expect(locate(html, "mot")).toEqual({ start: 23, end: 26 });
  });

  it("gère les caractères spéciaux du HTML et des expressions régulières", () => {
    const html = "<p>Prix (1 + 1) &amp; taxes ?</p>";
    expect(locate(html, "(1 + 1) & taxes")).not.toBeNull();
    expect(locate(html, "")).toBeNull();
  });
});

describe("replaceInBlock", () => {
  it("remplace la première occurrence et échappe le remplacement", () => {
    expect(replaceInBlock("<p>Il sont la. Il sont</p>", "Il sont", "Ils sont"))
      .toBe("<p>Ils sont la. Il sont</p>");
    expect(replaceInBlock("<p>A et B</p>", "A et B", "A & B")).toBe("<p>A &amp; B</p>");
    expect(replaceInBlock("<p>Rien</p>", "absent", "x")).toBeNull();
  });
});

describe("applySuggestions", () => {
  it("applique dans l'ordre et compte les suggestions introuvables", () => {
    const result = applySuggestions(
      ["<p>Il sont la.</p>", "<p>Fin.</p>"],
      [
        { block: 0, original: "Il sont", replacement: "Ils sont" },
        { block: 0, original: "Il sont la", replacement: "x" },
        { block: 0, original: "sont la.", replacement: "sont là." },
        { block: 5, original: "Fin", replacement: "FIN" },
      ],
    );
    expect(result.blocks).toEqual(["<p>Ils sont là.</p>", "<p>Fin.</p>"]);
    expect(result.applied).toBe(2);
    expect(result.skipped).toBe(2);
    expect([...result.changed]).toEqual([0]);
  });
});

describe("sanitizeChapterOutput", () => {
  it("écarte les blocs inexistants, les extraits inchangés et les doublons", () => {
    const blocks = ["<p>Il sont la.</p>", "<p>Un <em>mot</em> fort</p>"];
    const review = sanitizeChapterOutput(
      {
        summary: "  Bon chapitre.  ",
        suggestions: [
          { block: 0, original: "Il sont", replacement: "Ils sont", kind: "agreement",
            explanation: "Accord" },
          { block: 0, original: "Il sont", replacement: "Ils sont", kind: "agreement",
            explanation: "Doublon" },
          { block: 3, original: "x", replacement: "y", kind: "spelling", explanation: "" },
          { block: 0, original: "la", replacement: "la", kind: "spelling", explanation: "" },
          { block: 1, original: "Un mot", replacement: "Un terme", kind: "inconnu",
            explanation: "" },
        ],
      },
      blocks,
      "proofread",
    );
    expect(review.summary).toBe("Bon chapitre.");
    expect(review.suggestions).toHaveLength(2);
    expect(review.suggestions[0]).toMatchObject({ kind: "agreement", applicable: true });
    expect(review.suggestions[1]).toMatchObject({ kind: "other", applicable: false });
  });

  it("relit une revue enregistrée et ignore une sortie mal formée", () => {
    expect(readChapterReview(null)).toEqual({ summary: "", suggestions: [] });
    const saved = { summary: "Ok", suggestions: [] };
    expect(readChapterReview(saved)).toEqual(saved);
  });
});

describe("chapterMessage", () => {
  it("numérote les blocs en texte brut et omet les blocs vides", () => {
    const message = chapterMessage("Début", ["<p>Un &amp; deux</p>", "<hr />", "<p>Trois</p>"]);
    expect(message).toBe("Chapitre : Début\n\n[0] Un & deux\n\n[2] Trois");
  });
});
