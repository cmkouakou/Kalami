/**
 * Fichier    : admin-nav.test.ts
 * Projet     : Kalami
 * Description: Tests du menu de l'administration : module mis en évidence selon la page.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-28
 */

import { describe, expect, it } from "vitest";

import { activeHref } from "@/components/admin/admin-nav";

describe("activeHref", () => {
  it("met en évidence le tableau de bord seulement sur /admin", () => {
    expect(activeHref("/admin")).toBe("/admin");
    expect(activeHref("/admin/inconnu")).toBeNull();
  });

  it("retient le module le plus précis", () => {
    expect(activeHref("/admin/strategie")).toBe("/admin/strategie");
    expect(activeHref("/admin/strategie/coach/regles")).toBe("/admin/strategie/coach");
    expect(activeHref("/admin/livres/123")).toBe("/admin/livres");
  });

  it("ne confond pas deux modules au début semblable", () => {
    expect(activeHref("/admin/livres-archives")).toBeNull();
  });
});
