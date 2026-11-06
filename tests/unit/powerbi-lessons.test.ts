/**
 * Fichier    : powerbi-lessons.test.ts
 * Projet     : Kalami Données
 * Description: Tests d'intégrité des résumés de leçons PL-300 : chaque résumé inscrit au
 *              registre se charge, s'ouvre sur un titre, et ses tableaux sont complets.
 * Auteur     : Claude Marcel
 * Date       : 2026-11-05
 */

import { describe, expect, it } from "vitest";

import { aUnResume, compterResumes, getResume } from "@/lib/powerbi/lessons";
import { getToutesLesLecons } from "@/lib/powerbi/modules";

// ==================== RÉSUMÉS DE LEÇONS ====================

const AVEC_RESUME = getToutesLesLecons().filter(({ module, lecon }) =>
  aUnResume(module.slug, lecon.slug),
);

describe("résumés de leçons", () => {
  it("sont comptés à l'identique par le registre et la carte", () => {
    expect(AVEC_RESUME.length).toBe(compterResumes());
    expect(compterResumes()).toBeGreaterThanOrEqual(13);
  });

  it.each(AVEC_RESUME.map(({ module, lecon }) => [`${module.slug}/${lecon.slug}`]))(
    "%s se charge et a des tableaux complets",
    async (cle) => {
      const [moduleSlug, lessonSlug] = cle.split("/");
      const contenu = await getResume(moduleSlug, lessonSlug);
      expect(contenu).not.toBeNull();
      if (!contenu) return;
      expect(contenu[0]?.kind).toBe("titre");
      for (const bloc of contenu) {
        if (bloc.kind === "tableau") {
          for (const ligne of bloc.lignes) expect(ligne).toHaveLength(bloc.entetes.length);
        }
      }
    },
  );
});
