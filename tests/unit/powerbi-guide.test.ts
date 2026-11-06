/**
 * Fichier    : powerbi-guide.test.ts
 * Projet     : Kalami Données
 * Description: Tests du chantier BRVM Power BI : balisage en ligne (sans HTML injecté,
 *              marqueurs orphelins laissés tels quels), intégrité des 7 sprints (cases
 *              uniques et conformes à la base, tableaux complets, schémas cohérents) et
 *              calcul d'avancement.
 * Auteur     : Claude Marcel
 * Date       : 2026-11-05
 */

import { describe, expect, it } from "vitest";

import type { ContentBlock } from "@/lib/powerbi/content";
import {
  getAvancementSprint,
  getCases,
  getSprint,
  getSprintsVoisins,
  SPRINTS,
  TOUTES_LES_CASES,
} from "@/lib/powerbi/guide/sprints";
import { parseInline, texteBrut } from "@/lib/powerbi/inline";

// ==================== BALISAGE EN LIGNE ====================

describe("parseInline", () => {
  it("lit gras, italique, code et lien", () => {
    expect(parseInline("Le **mode** *Import* et `v_stocks`, [doc](https://learn.microsoft.com)"))
      .toEqual([
        { type: "texte", texte: "Le " },
        { type: "gras", enfants: [{ type: "texte", texte: "mode" }] },
        { type: "texte", texte: " " },
        { type: "italique", enfants: [{ type: "texte", texte: "Import" }] },
        { type: "texte", texte: " et " },
        { type: "code", texte: "v_stocks" },
        { type: "texte", texte: ", " },
        {
          type: "lien",
          url: "https://learn.microsoft.com",
          enfants: [{ type: "texte", texte: "doc" }],
        },
      ]);
  });

  it("laisse les astérisques orphelins en texte", () => {
    expect(texteBrut("Cardinalité 1:* (un vers plusieurs)")).toBe(
      "Cardinalité 1:* (un vers plusieurs)",
    );
    expect(texteBrut("**Un vers plusieurs (1:*)**")).toBe("Un vers plusieurs (1:*)");
    expect(texteBrut("a * b")).toBe("a * b");
  });

  it("ne rend pas cliquable une adresse non sûre", () => {
    const noeuds = parseInline("[clic](javascript:alert(1))");
    expect(noeuds.every((n) => n.type === "texte")).toBe(true);
  });

  it("garde le HTML comme du texte", () => {
    expect(parseInline("<b>x</b>")).toEqual([{ type: "texte", texte: "<b>x</b>" }]);
  });
});

// ==================== INTÉGRITÉ DES SPRINTS ====================

/** Tous les blocs d'un contenu, notions comprises. */
function tousLesBlocs(blocs: readonly ContentBlock[]): ContentBlock[] {
  return blocs.flatMap((b) => (b.kind === "notion" ? [b, ...tousLesBlocs(b.contenu)] : [b]));
}

describe("sprints du chantier", () => {
  it("sont 7, numérotés dans l'ordre, avec des adresses uniques", () => {
    expect(SPRINTS.map((s) => s.numero)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(SPRINTS.map((s) => s.slug)).size).toBe(7);
  });

  it("ont chacun des cases, toutes uniques et au format accepté par la base", () => {
    const toutes = SPRINTS.flatMap(getCases);
    expect(new Set(toutes).size).toBe(toutes.length);
    expect(TOUTES_LES_CASES.size).toBe(toutes.length);
    for (const sprint of SPRINTS) {
      const cases = getCases(sprint);
      expect(cases.length).toBeGreaterThan(0);
      for (const id of cases) {
        // Même contrôle que la migration powerbi_guide_progress
        expect(id).toMatch(/^c[1-9]-[0-9]{1,2}$/);
        expect(id.startsWith(`c${sprint.numero}-`)).toBe(true);
      }
    }
  });

  it("ont des tableaux complets et des schémas cohérents", () => {
    for (const sprint of SPRINTS) {
      for (const bloc of tousLesBlocs(sprint.contenu)) {
        if (bloc.kind === "tableau") {
          for (const ligne of bloc.lignes) expect(ligne).toHaveLength(bloc.entetes.length);
        }
        if (bloc.kind === "schema") {
          for (const lien of bloc.liens) {
            expect(bloc.gauche[lien.de]).toBeDefined();
            expect(bloc.droite[lien.vers]).toBeDefined();
          }
        }
        if (bloc.kind === "maquette-fusion") {
          expect(bloc.jointures).toContain(bloc.choisie);
          for (const t of bloc.tables) expect(t.colonnes).toContain(t.cle);
        }
      }
    }
  });

  it("ont des passages en couleur qui visent des cellules et du code existants", () => {
    for (const sprint of SPRINTS) {
      for (const bloc of tousLesBlocs(sprint.contenu)) {
        if (bloc.kind === "tableau") {
          for (const c of bloc.colonnesMono ?? []) {
            expect(c).toBeLessThan(bloc.entetes.length);
          }
          if (bloc.pastilles) {
            expect(bloc.pastilles.colonne).toBeLessThan(bloc.entetes.length);
            expect(bloc.pastilles.teintes).toHaveLength(bloc.lignes.length);
          }
        }
        if (bloc.kind === "code") {
          for (const accent of bloc.accents ?? []) expect(bloc.texte).toContain(accent);
        }
      }
    }
  });

  it("ne relient pas v_fundamentals au calendrier (sprint 4.6)", () => {
    const schema = tousLesBlocs(SPRINTS[0].contenu).find((b) => b.kind === "schema");
    expect(schema?.kind).toBe("schema");
    if (schema?.kind !== "schema") return;
    const date = schema.gauche.indexOf("v_dim_date");
    const fondamentaux = schema.droite.indexOf("v_fundamentals");
    expect(schema.liens.some((l) => l.de === date && l.vers === fondamentaux)).toBe(false);
  });
});

// ==================== NAVIGATION ET AVANCEMENT ====================

describe("navigation et avancement", () => {
  it("trouve les voisins d'un sprint", () => {
    expect(getSprint("sprint-3")?.numero).toBe(3);
    expect(getSprint("inconnu")).toBeNull();
    const { precedent, suivant } = getSprintsVoisins("sprint-1");
    expect(precedent).toBeNull();
    expect(suivant?.numero).toBe(2);
    expect(getSprintsVoisins("sprint-7").suivant).toBeNull();
  });

  it("termine un sprint quand toutes ses cases sont cochées", () => {
    const sprint = SPRINTS[0];
    const cases = getCases(sprint);
    expect(getAvancementSprint(sprint, new Set(cases.slice(1))).termine).toBe(false);
    const complet = getAvancementSprint(sprint, new Set([...cases, "c2-1"]));
    expect(complet).toEqual({ cochees: cases.length, total: cases.length, termine: true });
  });
});
