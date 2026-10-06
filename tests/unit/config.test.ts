/**
 * Fichier    : config.test.ts
 * Projet     : Kalami
 * Description: Tests des utilitaires de configuration et d'interpolation des textes.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-06
 */

import { describe, expect, it } from "vitest";

import { getDictionary, interpolate } from "@/i18n";
import { normalizeUrl, parseDomainList } from "@/lib/config";

describe("normalizeUrl", () => {
  it("retire les barres obliques finales et les espaces", () => {
    expect(normalizeUrl(" https://kalami-livres.com// ")).toBe("https://kalami-livres.com");
  });
});

describe("parseDomainList", () => {
  it("découpe, nettoie et dédoublonne", () => {
    expect(parseDomainList(" Kalami-Books.com, ,kalami-books.com,www.kalami-livres.com")).toEqual([
      "kalami-books.com",
      "www.kalami-livres.com",
    ]);
  });

  it("retourne une liste vide si la variable est absente", () => {
    expect(parseDomainList(undefined)).toEqual([]);
  });
});

describe("i18n", () => {
  it("fournit le dictionnaire français par défaut", () => {
    expect(getDictionary().nav.catalog).toBe("Catalogue");
  });

  it("interpole les variables connues et conserve les inconnues", () => {
    expect(interpolate("Bienvenue sur {appName} {x}", { appName: "Kalami" })).toBe(
      "Bienvenue sur Kalami {x}",
    );
  });
});
