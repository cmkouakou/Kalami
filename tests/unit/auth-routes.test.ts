/**
 * Fichier    : auth-routes.test.ts
 * Projet     : Kalami
 * Description: Tests des chemins protégés, de la validation des redirections et du renvoi
 *              d'un code de connexion égaré vers /auth/callback.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-09
 */

import { describe, expect, it } from "vitest";

import { isProtectedPath, safeNextPath, strayAuthCallback } from "@/lib/auth/routes";

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

describe("strayAuthCallback", () => {
  const SITE = "https://www.kalami-livres.com";

  it("renvoie un code arrivé sur l'accueil vers /auth/callback", () => {
    const target = strayAuthCallback(new URL(`${SITE}/?code=abc&suivant=/a`));
    expect(target?.toString()).toBe(`${SITE}/auth/callback?code=abc&suivant=/a`);
  });

  it("ignore l'accueil sans code et les autres pages", () => {
    expect(strayAuthCallback(new URL(`${SITE}/`))).toBeNull();
    expect(strayAuthCallback(new URL(`${SITE}/?code=`))).toBeNull();
    expect(strayAuthCallback(new URL(`${SITE}/livres?code=abc`))).toBeNull();
  });
});
