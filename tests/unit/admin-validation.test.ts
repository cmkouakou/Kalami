/**
 * Fichier    : admin-validation.test.ts
 * Projet     : Kalami
 * Description: Tests de la validation des formulaires d'administration du catalogue.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-07
 */

import { describe, expect, it } from "vitest";

import { parseAuthor, parseBook, parseCategory } from "@/lib/admin/validation";

const AUTHOR_ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

/** Construit un FormData à partir d'un objet simple. */
function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("parseCategory", () => {
  it("génère le slug depuis le nom et met la position à 0 par défaut", () => {
    const result = parseCategory(form({ name: "  Gestion et stratégie " }));
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Gestion et stratégie",
        slug: "gestion-et-strategie",
        description: null,
        position: 0,
      },
    });
  });

  it("refuse un nom vide, un slug invalide ou une position non entière", () => {
    expect(parseCategory(form({ name: "" })).ok).toBe(false);
    expect(parseCategory(form({ name: "Finance", slug: "fi nance" })).ok).toBe(false);
    expect(parseCategory(form({ name: "Finance", position: "1.5" })).ok).toBe(false);
  });
});

describe("parseAuthor", () => {
  it("accepte un auteur avec biographie et slug explicite", () => {
    const result = parseAuthor(
      form({ display_name: "Aminata Diallo", slug: "a-diallo", bio: "Économiste." }),
    );
    expect(result.ok && result.value).toEqual({
      display_name: "Aminata Diallo",
      slug: "a-diallo",
      bio: "Économiste.",
    });
  });

  it("refuse une biographie trop longue", () => {
    const result = parseAuthor(form({ display_name: "X", bio: "a".repeat(5001) }));
    expect(result.ok).toBe(false);
  });
});

describe("parseBook", () => {
  const base = { title: "La stratégie d'entreprise", language: "fr", status: "draft" };

  it("valide un livre complet et convertit les prix en unité mineure", () => {
    const result = parseBook(
      form({
        ...base,
        author_id: AUTHOR_ID,
        page_count: "212",
        is_featured: "on",
        price_XOF: "6 500",
        price_EUR: "9,99",
        price_CAD: "",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.book.slug).toBe("la-strategie-d-entreprise");
    expect(result.value.book.page_count).toBe(212);
    expect(result.value.book.is_featured).toBe(true);
    expect(result.value.book.category_id).toBeNull();
    expect(result.value.prices).toEqual({ XOF: 6500, EUR: 999, CAD: null });
  });

  it("exige un auteur, un statut et une langue autorisés", () => {
    expect(parseBook(form(base)).ok).toBe(false);
    expect(parseBook(form({ ...base, author_id: "pas-un-uuid" })).ok).toBe(false);
    expect(parseBook(form({ ...base, author_id: AUTHOR_ID, status: "vendu" })).ok).toBe(false);
    expect(parseBook(form({ ...base, author_id: AUTHOR_ID, language: "de" })).ok).toBe(false);
  });

  it("exige un motif de refus et l'efface pour les autres statuts", () => {
    const rejected = { ...base, author_id: AUTHOR_ID, status: "rejected" };
    expect(parseBook(form(rejected)).ok).toBe(false);

    const withReason = parseBook(form({ ...rejected, rejection_reason: "Qualité" }));
    expect(withReason.ok && withReason.value.book.rejection_reason).toBe("Qualité");

    const draft = parseBook(form({ ...base, author_id: AUTHOR_ID, rejection_reason: "x" }));
    expect(draft.ok && draft.value.book.rejection_reason).toBeNull();
  });

  it("refuse un prix mal saisi ou une année hors limites", () => {
    const withAuthor = { ...base, author_id: AUTHOR_ID };
    expect(parseBook(form({ ...withAuthor, price_EUR: "9,999" })).ok).toBe(false);
    expect(parseBook(form({ ...withAuthor, price_XOF: "gratuit" })).ok).toBe(false);
    expect(parseBook(form({ ...withAuthor, publication_year: "1850" })).ok).toBe(false);
  });
});
