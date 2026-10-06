/**
 * Fichier    : domain-redirect.test.ts
 * Projet     : Kalami
 * Description: Tests de la redirection 301 des domaines secondaires.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-06
 */

import { describe, expect, it } from "vitest";

import { getDomainRedirect } from "@/lib/domain-redirect";

const APP = "https://kalami-livres.com";
const SECONDAIRES = ["kalami-books.com", "www.kalami-livres.com"];

describe("getDomainRedirect", () => {
  it("redirige un domaine secondaire en conservant chemin et paramètres", () => {
    const cible = getDomainRedirect(
      "https://kalami-books.com/livres/strategie?ref=x",
      "kalami-books.com",
      APP,
      SECONDAIRES,
    );
    expect(cible).toBe("https://kalami-livres.com/livres/strategie?ref=x");
  });

  it("ignore la casse et le port de l'en-tête Host", () => {
    const cible = getDomainRedirect("https://x/", "WWW.Kalami-Livres.com:443", APP, SECONDAIRES);
    expect(cible).toBe("https://kalami-livres.com/");
  });

  it("ne redirige pas le domaine principal", () => {
    expect(getDomainRedirect(`${APP}/`, "kalami-livres.com", APP, SECONDAIRES)).toBeNull();
  });

  it("ne fait rien sans liste de domaines ou sans Host", () => {
    expect(getDomainRedirect("https://kalami-books.com/", "kalami-books.com", APP, [])).toBeNull();
    expect(getDomainRedirect("https://kalami-books.com/", null, APP, SECONDAIRES)).toBeNull();
  });
});
