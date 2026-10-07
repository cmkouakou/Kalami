/**
 * Fichier    : slug.test.ts
 * Projet     : Kalami
 * Description: Tests de la génération et de la validation des slugs.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-07
 */

import { describe, expect, it } from "vitest";

import { isValidSlug, SLUG_MAX_LENGTH, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("retire accents, apostrophes et majuscules", () => {
    expect(slugify("La stratégie d'entreprise")).toBe("la-strategie-d-entreprise");
    expect(slugify("Développement personnel")).toBe("developpement-personnel");
    expect(slugify("Gestion et stratégie")).toBe("gestion-et-strategie");
  });

  it("gère les ligatures et la ponctuation", () => {
    expect(slugify("Œuvres complètes : tome 2 !")).toBe("oeuvres-completes-tome-2");
    expect(slugify("  --Économie & Société--  ")).toBe("economie-societe");
  });

  it("retourne une chaîne vide sans lettre ni chiffre", () => {
    expect(slugify("¿ !!! ?")).toBe("");
  });

  it("produit toujours un slug valide et limité en longueur", () => {
    const long = slugify("mot ".repeat(60));
    expect(long.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(isValidSlug(long)).toBe(true);
  });
});

describe("isValidSlug", () => {
  it("accepte le format de la base et refuse le reste", () => {
    expect(isValidSlug("finance")).toBe(true);
    expect(isValidSlug("la-strategie-d-entreprise")).toBe(true);
    expect(isValidSlug("La-Strategie")).toBe(false);
    expect(isValidSlug("double--tiret")).toBe(false);
    expect(isValidSlug("-debut")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});
