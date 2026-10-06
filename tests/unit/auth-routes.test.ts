/**
 * Fichier    : auth-routes.test.ts
 * Projet     : Kalami
 * Description: Tests des chemins protégés et de la validation des redirections.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-06
 */

import { describe, expect, it } from "vitest";

import { isProtectedPath, safeNextPath } from "@/lib/auth/routes";

describe("isProtectedPath", () => {
  it("protège /compte, /admin et leurs sous-pages", () => {
    expect(isProtectedPath("/compte")).toBe(true);
    expect(isProtectedPath("/admin/mfa")).toBe(true);
  });

  it("laisse publics l'accueil, la connexion et les chemins voisins", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/connexion")).toBe(false);
    expect(isProtectedPath("/comptes-rendus")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("accepte un chemin interne", () => {
    expect(safeNextPath("/livres/abc?x=1")).toBe("/livres/abc?x=1");
  });

  it("refuse les redirections vers un autre site", () => {
    expect(safeNextPath("//malveillant.com")).toBe("/compte");
    expect(safeNextPath("/\\malveillant.com")).toBe("/compte");
    expect(safeNextPath("https://malveillant.com")).toBe("/compte");
  });

  it("utilise la valeur par défaut si vide", () => {
    expect(safeNextPath(null, "/")).toBe("/");
    expect(safeNextPath("")).toBe("/compte");
  });
});
