/**
 * Fichier    : auth-routes.test.ts
 * Projet     : Kalami
 * Description: Tests des chemins protégés, de la validation des redirections, des pages
 *              de connexion de Kalami Stratégie et du renvoi
 *              d'un code de connexion égaré vers /auth/callback.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-09
 */

import { describe, expect, it } from "vitest";

import {
  authPath,
  isProtectedPath,
  isStrategyPath,
  safeNextPath,
  strayAuthCallback,
} from "@/lib/auth/routes";

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

  it("protège les études stratégiques mais laisse publique la présentation", () => {
    expect(isProtectedPath("/strategie/etudes/abc/profil")).toBe(true);
    expect(isProtectedPath("/strategie/nouvelle")).toBe(true);
    expect(isProtectedPath("/strategie/invitation/jeton")).toBe(true);
    expect(isProtectedPath("/strategie")).toBe(false);
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

describe("isStrategyPath", () => {
  it("reconnaît l'accueil et les pages de Kalami Stratégie", () => {
    expect(isStrategyPath("/strategie")).toBe(true);
    expect(isStrategyPath("/strategie/etudes/abc")).toBe(true);
    expect(isStrategyPath("/strategie?x=1")).toBe(true);
  });

  it("ignore le site et les chemins voisins", () => {
    expect(isStrategyPath("/compte")).toBe(false);
    expect(isStrategyPath("/strategies")).toBe(false);
    expect(isStrategyPath("/admin/strategie")).toBe(false);
    expect(isStrategyPath("")).toBe(false);
    expect(isStrategyPath(null)).toBe(false);
  });
});

describe("authPath", () => {
  it("garde un utilisateur de Kalami Stratégie dans l'application", () => {
    expect(authPath("connexion", "/strategie/nouvelle")).toBe(
      "/strategie/connexion?suivant=%2Fstrategie%2Fnouvelle",
    );
    expect(authPath("inscription", "/strategie")).toBe(
      "/strategie/inscription?suivant=%2Fstrategie",
    );
    expect(authPath("reinitialiser-mot-de-passe", "/strategie")).toBe(
      "/strategie/reinitialiser-mot-de-passe?suivant=%2Fstrategie",
    );
  });

  it("utilise les pages du site pour tout autre chemin", () => {
    expect(authPath("connexion", "/livres/abc/lire")).toBe(
      "/connexion?suivant=%2Flivres%2Fabc%2Flire",
    );
    expect(authPath("connexion")).toBe("/connexion");
    expect(authPath("mot-de-passe-oublie", "")).toBe("/mot-de-passe-oublie");
  });
});
