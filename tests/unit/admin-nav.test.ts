/**
 * Fichier    : admin-nav.test.ts
 * Projet     : Kalami
 * Description: Tests du menu de l'administration : module mis en évidence selon la page,
 *              groupe repliable ouvert d'office (v0.24.0).
 * Auteur     : Claude Marcel
 * Version    : 1.1
 * Date       : 2026-11-16
 */

import { describe, expect, it } from "vitest";

import { activeHref, GROUPS, groupOf } from "@/components/admin/admin-nav";

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

  it("distingue le parcours PL-300 du chantier BRVM (groupe Formation)", () => {
    expect(activeHref("/powerbi")).toBe("/powerbi");
    expect(activeHref("/powerbi/chantier/sprint-2")).toBe("/powerbi/chantier");
  });
});

describe("groupes repliables", () => {
  it("ouvre le groupe qui contient la page courante", () => {
    expect(groupOf(activeHref("/admin/commandes"))).toBe("ventes");
    expect(groupOf(activeHref("/admin/strategie/coach/forfaits"))).toBe("strategie");
    expect(groupOf(activeHref("/admin/soumissions/42"))).toBe("livres");
    expect(groupOf(activeHref("/admin/fonctionnalites"))).toBe("reglages");
  });

  it("laisse tout replié sur le tableau de bord et l'audience", () => {
    expect(groupOf(activeHref("/admin"))).toBeNull();
    expect(groupOf(activeHref("/admin/audience/lecteurs/abc"))).toBeNull();
  });

  it("n'inscrit chaque module qu'une seule fois", () => {
    const hrefs = GROUPS.flatMap((group) => group.links.map((link) => link.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
