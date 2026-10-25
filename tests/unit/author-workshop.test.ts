/**
 * Fichier    : author-workshop.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires de l'atelier de l'auteur (v0.15.0) : statistiques du
 *              manuscrit, liste de vérification avant soumission et achat de Crédits
 *              Atelier (demande d'achat, chemin d'abandon, lien après achat).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-25
 */

import { describe, expect, it, vi } from "vitest";

import { bookChecklist, splitKeywords, type ChecklistBook } from "@/lib/author/checklist";
import {
  analyzeManuscript,
  blockText,
  countCloseRepeats,
  countPunctuationIssues,
  sentencesOf,
  wordsOf,
} from "@/lib/author/manuscript-stats";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { cancelPathFor, parseCheckoutBody } = await import("@/lib/payments/checkout-request");
const { orderItemLink } = await import("@/lib/payments/queries");

const PACK_ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

/** Phrase de n mots (« mot1 mot2 … »). */
function sentence(words: number, word = "mot"): string {
  return `${Array.from({ length: words }, () => word).join(" ")}.`;
}

// ==================== TEXTE ====================

describe("texte du manuscrit", () => {
  it("retire les balises et décode les entités courantes", () => {
    expect(blockText("<p>Le <em>chat</em> &amp; le&nbsp;chien</p>")).toBe(
      "Le chat & le chien",
    );
  });

  it("compte les mots avec apostrophes et traits d'union", () => {
    expect(wordsOf("L'arc-en-ciel brille, aujourd'hui !")).toEqual([
      "L'arc-en-ciel",
      "brille",
      "aujourd'hui",
    ]);
  });

  it("coupe les phrases après la ponctuation finale", () => {
    expect(sentencesOf("Il pleut. Viens-tu ? Oui… Bien !")).toHaveLength(4);
  });

  it("repère les répétitions rapprochées seulement", () => {
    const near = wordsOf("Le jardin est beau ; le jardin fleurit.");
    expect(countCloseRepeats(near)).toBe(1);
    const far = wordsOf(`jardin ${"un ".repeat(30)}jardin`);
    expect(countCloseRepeats(far)).toBe(0);
    // Mots courts et mots outils ignorés
    expect(countCloseRepeats(wordsOf("nous nous le le"))).toBe(0);
  });

  it("signale les espaces manquantes avant la ponctuation double", () => {
    expect(countPunctuationIssues("Quoi? Il dit: «Non»!")).toBe(5);
    expect(countPunctuationIssues("Quoi ? Il dit : « Non » !")).toBe(0);
  });
});

// ==================== STATISTIQUES ====================

describe("statistiques du manuscrit", () => {
  it("calcule les totaux, la part et le temps de lecture", () => {
    const stats = analyzeManuscript([
      { position: 1, title: "Un", blocks: [`<p>${sentence(300)}</p>`] },
      { position: 2, title: "Deux", blocks: [`<p>${sentence(160)}</p>`] },
    ]);
    expect(stats.words).toBe(460);
    expect(stats.readingMinutes).toBe(2);
    expect(stats.chapters.map((c) => c.sharePct)).toEqual([65, 35]);
    expect(stats.longSentences).toHaveLength(2);
    expect(stats.longSentences[0]).toMatchObject({ position: 1, words: 300 });
  });

  it("signale un chapitre très court par rapport à la médiane", () => {
    const stats = analyzeManuscript([
      { position: 1, title: "A", blocks: [sentence(10)] },
      { position: 2, title: "B", blocks: [sentence(100)] },
      { position: 3, title: "C", blocks: [sentence(100)] },
    ]);
    expect(stats.chapters.map((c) => c.flag)).toEqual(["short", null, null]);
  });

  it("classe les mots fréquents et gère un manuscrit vide", () => {
    const stats = analyzeManuscript([
      { position: 1, title: "A", blocks: ["Maison maison maison. Jardin jardin."] },
    ]);
    expect(stats.topWords[0]).toEqual({ word: "maison", count: 3 });
    const empty = analyzeManuscript([]);
    expect(empty).toMatchObject({ words: 0, readingMinutes: 0, averageSentence: 0 });
  });
});

// ==================== VÉRIFICATION ====================

describe("liste de vérification", () => {
  const complete: ChecklistBook = {
    title: "Mon livre",
    summary: "x".repeat(200),
    keywords: "stratégie, gestion; Afrique",
    category_id: "c1",
    cover_path: "a.jpg",
    back_cover_path: "b.jpg",
    book_prices: [{}],
    current: null,
    pending: {},
  };

  it("sépare les mots-clés par virgules ou points-virgules", () => {
    expect(splitKeywords(" a, ,b; c ")).toEqual(["a", "b", "c"]);
    expect(splitKeywords(null)).toEqual([]);
  });

  it("valide un livre complet et signale chaque manque", () => {
    expect(bookChecklist(complete).every((item) => item.done)).toBe(true);
    const missing = bookChecklist({
      ...complete,
      summary: "court",
      keywords: "un, deux",
      back_cover_path: null,
      book_prices: [],
      pending: null,
    });
    expect(missing.filter((item) => !item.done).map((item) => item.key)).toEqual([
      "backCover",
      "summary",
      "keywords",
      "prices",
      "manuscript",
    ]);
  });
});

// ==================== ACHAT DE CRÉDITS ====================

describe("achat de Crédits Atelier", () => {
  it("lit un forfait bien formé et refuse le reste", () => {
    expect(parseCheckoutBody({ item: "workshop_pack", packId: PACK_ID, currency: "EUR" }))
      .toEqual({ item: "workshop_pack", packId: PACK_ID, currency: "EUR" });
    expect(parseCheckoutBody({ item: "workshop_pack", packId: "x", currency: "EUR" }))
      .toBeNull();
  });

  it("revient sur l'atelier si le paiement est abandonné", () => {
    expect(cancelPathFor({ item: "workshop_pack", packId: PACK_ID }, null)).toBe(
      "/auteur/atelier?paiement=annule",
    );
  });

  it("ouvre l'atelier après l'achat", () => {
    const item = {
      label: "Crédits Atelier",
      kind: "workshop_pack",
      study_id: null,
      credits: null,
      book: null,
      practice_case: null,
    };
    expect(orderItemLink(item)).toEqual({ href: "/auteur/atelier", kind: "workshop" });
  });
});
