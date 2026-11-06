/**
 * Fichier    : powerbi-modules.test.ts
 * Projet     : Kalami Données
 * Description: Tests de la carte du parcours PL-300 : liste complète des leçons (adresses
 *              pré-affichées) et navigation entre leçons, qui saute les leçons non rédigées.
 * Auteur     : Claude Marcel
 * Date       : 2026-11-05
 */

import { describe, expect, it } from "vitest";

import { aUnResume } from "@/lib/powerbi/lessons";
import { getAvancement, getToutesLesLecons, getVoisines } from "@/lib/powerbi/modules";

const toutes = getToutesLesLecons();
const redigees = toutes.filter((e) => aUnResume(e.module.slug, e.lecon.slug));

describe("getToutesLesLecons", () => {
  it("couvre tout le parcours, sans adresse en double", () => {
    expect(toutes).toHaveLength(getAvancement().total);
    const cles = toutes.map((e) => `${e.module.slug}/${e.lecon.slug}`);
    expect(new Set(cles).size).toBe(cles.length);
  });
});

describe("getVoisines", () => {
  it("ne mène jamais à une leçon « à venir »", () => {
    for (const { module, lecon } of toutes) {
      const { precedente, suivante } = getVoisines(module.slug, lecon.slug);
      for (const voisine of [precedente, suivante]) {
        if (voisine) expect(aUnResume(voisine.module.slug, voisine.lecon.slug)).toBe(true);
      }
    }
  });

  it("enchaîne les leçons rédigées dans l'ordre du parcours", () => {
    expect(redigees.length).toBeGreaterThan(1);
    for (let i = 0; i < redigees.length; i++) {
      const { module, lecon } = redigees[i];
      const { precedente, suivante } = getVoisines(module.slug, lecon.slug);
      expect(precedente?.lecon.slug).toBe(redigees[i - 1]?.lecon.slug);
      expect(suivante?.lecon.slug).toBe(redigees[i + 1]?.lecon.slug);
    }
  });

  it("depuis une leçon non rédigée, propose les résumés écrits les plus proches", () => {
    const iAVenir = toutes.findIndex((e) => !aUnResume(e.module.slug, e.lecon.slug));
    // Parcours entièrement rédigé : il n'y a plus de leçon « à venir » à tester
    if (iAVenir === -1) {
      expect(redigees).toHaveLength(toutes.length);
      return;
    }
    const { module, lecon } = toutes[iAVenir];
    const { suivante } = getVoisines(module.slug, lecon.slug);
    const attendue = toutes
      .slice(iAVenir + 1)
      .find((e) => aUnResume(e.module.slug, e.lecon.slug));
    expect(suivante?.lecon.slug).toBe(attendue?.lecon.slug);
  });

  it("ne renvoie rien pour une leçon inconnue", () => {
    expect(getVoisines("inexistant", "xyz")).toEqual({});
  });
});
