/**
 * Fichier    : strategy-templates.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests des gabarits PESTEL et cinq forces : lecture tolérante, contenu de
 *              départ, listes de contrôle (miroir de strategy_checklist_ok), candidats aux
 *              axes des scénarios, moyenne par acteur et validation stricte avant envoi.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { describe, expect, it } from "vitest";

import { checklistOk } from "@/lib/strategy/templates/common";
import {
  actorAverage,
  ACTORS_MAX,
  FORCES,
  forcesChecklist,
  initialForces,
  readForces,
  type ForcesPayload,
} from "@/lib/strategy/templates/forces";
import { hasTemplate, parsePayload } from "@/lib/strategy/templates";
import {
  emptyPestel,
  FACTORS_MAX,
  newFactor,
  pestelChecklist,
  pivotCandidates,
  readPestel,
  type PestelFactor,
} from "@/lib/strategy/templates/pestel";

/** Facteur nommé, avec une nature et une case facultatives. */
function factor(id: string, patch: Partial<PestelFactor> = {}): PestelFactor {
  return { ...newFactor(id, "economic"), factor: `Facteur ${id}`, ...patch };
}

/** Cinq forces toutes remplies. */
function filledForces(): ForcesPayload {
  const payload = initialForces("Atelier", ["Rival"]);
  for (const key of FORCES) {
    payload.forces[key] = { intensity: "medium", justification: "Constat chiffré." };
  }
  return payload;
}

// ==================== PESTEL ====================

describe("readPestel", () => {
  it("rend un gabarit vide pour un contenu absent ou invalide", () => {
    expect(readPestel({})).toEqual(emptyPestel());
    expect(readPestel(null)).toEqual(emptyPestel());
    expect(readPestel("texte")).toEqual(emptyPestel());
  });

  it("écarte les facteurs invalides et garde les autres", () => {
    const result = readPestel({
      factors: [factor("f1"), { id: "f2", dimension: "inconnue" }, factor("f3")],
    });
    expect(result.factors.map((f) => f.id)).toEqual(["f1", "f3"]);
  });

  it("limite le nombre de facteurs", () => {
    const many = Array.from({ length: FACTORS_MAX + 5 }, (_, i) => factor(`f${i}`));
    expect(readPestel({ factors: many }).factors).toHaveLength(FACTORS_MAX);
  });

  it("remet à zéro un axe qui pointe vers un facteur supprimé", () => {
    const result = readPestel({
      factors: [factor("f1")],
      scenarios: {
        axes: [
          { factorId: "f1", low: "bas", high: "haut" },
          { factorId: "disparu", low: "b", high: "h" },
        ],
        cells: { hh: { name: "Envol", description: "" } },
      },
    });
    expect(result.scenarios.axes[0].factorId).toBe("f1");
    expect(result.scenarios.axes[1]).toEqual({ factorId: null, low: "b", high: "h" });
    expect(result.scenarios.cells.hh.name).toBe("Envol");
    expect(result.scenarios.cells.ll).toEqual({ name: "", description: "" });
  });
});

describe("pestelChecklist", () => {
  it("exige une opportunité et une menace parmi les facteurs nommés", () => {
    const payload = emptyPestel();
    expect(checklistOk(pestelChecklist(payload))).toBe(false);

    payload.factors = [factor("f1", { nature: "opportunity" })];
    expect(pestelChecklist(payload)).toEqual([
      { key: "opportunity", ok: true },
      { key: "threat", ok: false },
    ]);

    payload.factors.push(factor("f2", { nature: "threat" }));
    expect(checklistOk(pestelChecklist(payload))).toBe(true);
  });

  it("compte « les deux » comme opportunité et menace", () => {
    const payload = emptyPestel();
    payload.factors = [factor("f1", { nature: "both" })];
    expect(checklistOk(pestelChecklist(payload))).toBe(true);
  });

  it("ignore les facteurs sans nom", () => {
    const payload = emptyPestel();
    payload.factors = [factor("f1", { nature: "both", factor: "   " })];
    expect(checklistOk(pestelChecklist(payload))).toBe(false);
  });
});

describe("pivotCandidates", () => {
  it("propose les pivots, ou tous les facteurs nommés s'il n'y en a aucun", () => {
    const payload = emptyPestel();
    payload.factors = [factor("f1"), factor("f2", { factor: "" }), factor("f3")];
    expect(pivotCandidates(payload).map((f) => f.id)).toEqual(["f1", "f3"]);

    payload.factors[2].quadrant = "pivot";
    expect(pivotCandidates(payload).map((f) => f.id)).toEqual(["f3"]);
  });
});

// ==================== CINQ FORCES ====================

describe("initialForces / readForces", () => {
  it("met l'entreprise puis les concurrents du profil en colonnes", () => {
    const payload = initialForces("Atelier", ["Rival A", "Rival B"]);
    expect(payload.comparison.actors).toEqual([
      { id: "a0", name: "Atelier" },
      { id: "a1", name: "Rival A" },
      { id: "a2", name: "Rival B" },
    ]);
    expect(payload.comparison.criteria).toEqual([]);
    expect(payload.forces.rivalry).toEqual({ intensity: null, justification: "" });
  });

  it("limite le nombre d'acteurs de départ", () => {
    const rivals = Array.from({ length: 20 }, (_, i) => `Rival ${i}`);
    expect(initialForces("Atelier", rivals).comparison.actors).toHaveLength(ACTORS_MAX);
  });

  it("part du profil seulement si rien n'a été enregistré", () => {
    expect(readForces({}, "Atelier", ["Rival"])).toEqual(initialForces("Atelier", ["Rival"]));
    const saved = readForces(
      { comparison: { actors: [{ id: "x", name: "Autre" }], criteria: [] } },
      "Atelier",
      ["Rival"],
    );
    expect(saved.comparison.actors).toEqual([{ id: "x", name: "Autre" }]);
  });

  it("retire les notes des acteurs supprimés et les forces invalides", () => {
    const result = readForces(
      {
        forces: { rivalry: { intensity: "extrême", justification: "" } },
        comparison: {
          actors: [{ id: "a0", name: "Atelier" }],
          criteria: [
            {
              id: "c1",
              name: "Prix",
              scores: { a0: { score: 4, note: "" }, a9: { score: 2, note: "" } },
            },
          ],
        },
      },
      "Atelier",
      [],
    );
    expect(result.forces.rivalry).toEqual({ intensity: null, justification: "" });
    expect(Object.keys(result.comparison.criteria[0].scores)).toEqual(["a0"]);
  });
});

describe("forcesChecklist", () => {
  it("exige une intensité et une justification pour chaque force", () => {
    expect(checklistOk(forcesChecklist(initialForces("Atelier", [])))).toBe(false);

    const payload = filledForces();
    expect(checklistOk(forcesChecklist(payload))).toBe(true);

    payload.forces.buyers.justification = "  ";
    const items = forcesChecklist(payload);
    expect(items.find((item) => item.key === "buyers")?.ok).toBe(false);
    expect(items.filter((item) => item.ok)).toHaveLength(4);
  });
});

describe("actorAverage", () => {
  it("fait la moyenne des seules cases notées", () => {
    const payload = initialForces("Atelier", []);
    expect(actorAverage(payload, "a0")).toBeNull();
    payload.comparison.criteria = [
      { id: "c1", name: "Prix", scores: { a0: { score: 4, note: "" } } },
      { id: "c2", name: "Délais", scores: { a0: { score: null, note: "à voir" } } },
      { id: "c3", name: "Service", scores: { a0: { score: 5, note: "" } } },
    ];
    expect(actorAverage(payload, "a0")).toBe(4.5);
  });
});

// ==================== VALIDATION AVANT ENVOI ====================

describe("parsePayload", () => {
  it("ne connaît que les étapes 1 et 2", () => {
    expect(hasTemplate(1)).toBe(true);
    expect(hasTemplate(2)).toBe(true);
    expect(hasTemplate(3)).toBe(false);
  });

  it("accepte un contenu complet et refuse un contenu mal formé", () => {
    expect(parsePayload(1, emptyPestel())).not.toBeNull();
    expect(parsePayload(2, filledForces())).not.toBeNull();
    expect(parsePayload(1, { factors: [] })).toBeNull();
    expect(parsePayload(2, emptyPestel())).toBeNull();
  });

  it("refuse les notes hors de 1 à 5 et les identifiants douteux", () => {
    const payload = filledForces();
    payload.comparison.criteria = [
      { id: "c1", name: "Prix", scores: { a0: { score: 6, note: "" } } },
    ];
    expect(parsePayload(2, payload)).toBeNull();

    const pestel = emptyPestel();
    pestel.factors = [factor("<script>")];
    expect(parsePayload(1, pestel)).toBeNull();
  });

  it("refuse les textes trop longs", () => {
    const pestel = emptyPestel();
    pestel.factors = [factor("f1", { factor: "x".repeat(301) })];
    expect(parsePayload(1, pestel)).toBeNull();
  });
});
