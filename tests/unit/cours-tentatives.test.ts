/**
 * =============================================================
 *  Fichier    : cours-tentatives.test.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Tests du décompte des tentatives (v0.43.0) : rang ordinal, accord,
 *               meilleure note et nombre de tentatives par exercice, total par apprenant.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: vitest, lib/cours/tentatives.ts, lib/cours/suivi.ts
 * =============================================================
 */

import { describe, expect, it } from "vitest";

import { ficheParModule } from "@/lib/cours/suivi";
import {
  nombreTentatives,
  rangTentative,
  resultatsParExercice,
  totalTentatives,
} from "@/lib/cours/tentatives";

describe("rangTentative", () => {
  it("écrit 1re puis 2e, 3e…", () => {
    expect(rangTentative(1)).toBe("1re");
    expect(rangTentative(2)).toBe("2e");
    expect(rangTentative(3)).toBe("3e");
    expect(rangTentative(11)).toBe("11e");
  });
});

describe("nombreTentatives", () => {
  it("accorde au pluriel à partir de 2", () => {
    expect(nombreTentatives(1)).toBe("1 tentative");
    expect(nombreTentatives(3)).toBe("3 tentatives");
  });
});

describe("resultatsParExercice", () => {
  it("compte chaque tentative et garde la meilleure note", () => {
    const r = resultatsParExercice([
      { exercise_id: "m01-l01-e1", score: 40 },
      { exercise_id: "m01-l01-e1", score: "80.00" },
      { exercise_id: "m01-l01-e1", score: 60 },
      { exercise_id: "m01-quiz", score: 70 },
    ]);
    expect(r.get("m01-l01-e1")).toEqual({ meilleure: 80, essais: 3 });
    expect(r.get("m01-quiz")).toEqual({ meilleure: 70, essais: 1 });
  });

  it("ignore une note illisible", () => {
    const r = resultatsParExercice([{ exercise_id: "m01-l01-e1", score: "abc" }]);
    expect(r.size).toBe(0);
  });
});

describe("totalTentatives", () => {
  it("sépare exercices et quiz, sans compter l'examen", () => {
    expect(
      totalTentatives([
        { exercise_id: "m01-l01-e1" },
        { exercise_id: "m01-l01-e1" },
        { exercise_id: "m02-l03-e12" },
        { exercise_id: "m01-quiz" },
        { exercise_id: "examen" },
      ]),
    ).toEqual({ exercices: 3, quiz: 1 });
  });
});

describe("ficheParModule — tentatives", () => {
  it("rattache le nombre de tentatives aux exercices et au quiz", () => {
    const creeLe = "2026-11-20T12:00:00Z";
    const [mod] = ficheParModule(
      [],
      [
        { exercise_id: "m01-l01-e1", score: 50, created_at: creeLe },
        { exercise_id: "m01-l01-e1", score: 90, created_at: creeLe },
        { exercise_id: "m01-quiz", score: 60, created_at: creeLe },
        { exercise_id: "m01-quiz", score: 75, created_at: creeLe },
      ],
    );
    expect(mod.lecons[0].notes).toEqual([
      { exercice: "m01-l01-e1", meilleure: 90, essais: 2 },
    ]);
    expect(mod.quiz).toEqual({ meilleure: 75, essais: 2 });
  });
});
