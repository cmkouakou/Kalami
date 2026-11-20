/**
 * =============================================================
 *  Fichier    : cours-essentiel.test.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Tests de l'essentiel du cours transmis au coach (v0.41.0) : modules
 *               rattachés à l'étape, fiches et encadrés retenus, récits écartés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: vitest, lib/cours/essentiel.ts
 * =============================================================
 */

import { describe, expect, it } from "vitest";

import { essentielDuCours, essentielDuPlan } from "@/lib/cours/essentiel";
import { STEPS } from "@/lib/strategy/steps";

describe("essentielDuCours", () => {
  it("donne les leçons des modules rattachés à l'étape", () => {
    const pestel = essentielDuCours(1);
    expect(pestel).toContain("Leçon 2.2 — Le PESTEL, sans en faire une liste d'épicerie");
    expect(pestel).toContain("À retenir");
    expect(pestel).not.toContain("Leçon 3.1");
  });

  it("couvre toutes les étapes, sans gras Markdown, en taille raisonnable", () => {
    for (const step of STEPS) {
      const texte = essentielDuCours(step.no);
      expect(texte.length, `étape ${step.no}`).toBeGreaterThan(500);
      expect(texte.length, `étape ${step.no}`).toBeLessThan(25_000);
      expect(texte).not.toContain("**");
    }
  });

  it("réunit les quatre modules du choix stratégique à l'étape 7", () => {
    const choix = essentielDuCours(7);
    for (const m of [8, 9, 10, 11]) expect(choix).toContain(`Leçon ${m}.1 — `);
  });

  it("ajoute les fondements aux étapes de décision seulement", () => {
    for (const etape of [6, 7, 8] as const) {
      expect(essentielDuCours(etape)).toContain("Leçon 1.2 — ");
    }
    for (const etape of [1, 5, 9] as const) {
      expect(essentielDuCours(etape)).not.toContain("Leçon 1.2 — ");
    }
  });

  it("donne au plan la mise en œuvre et le cas intégrateur", () => {
    const plan = essentielDuPlan();
    expect(plan).toContain("Leçon 12.1 — ");
    expect(plan).toContain("Leçon 13.1 — ");
    expect(plan.split("Leçon 1.2 — ")).toHaveLength(2);
  });

  it("renvoie le même texte au second appel", () => {
    expect(essentielDuCours(3)).toBe(essentielDuCours(3));
  });
});
