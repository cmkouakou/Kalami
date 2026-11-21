/**
 * =============================================================
 *  Fichier    : cours-brouillon.test.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Tests des brouillons (v0.44.0) : clé par compte, brouillon vide écarté,
 *               relecture validée des réponses, du texte libre et de la saisie d'atelier.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: vitest, lib/cours/brouillon.ts
 * =============================================================
 */

import { describe, expect, it } from "vitest";

import {
  brouillonReponses,
  cleBrouillon,
  type FormeQuestion,
  lireReponses,
  lireSaisieAtelier,
  lireTexte,
  TEXTE_MAX,
} from "@/lib/cours/brouillon";

const QUESTIONS: FormeQuestion[] = [
  { type: "qcm", id: "q1", choix: ["a", "b", "c"] },
  { type: "vrai-faux", id: "q2", affirmations: ["x", "y"] },
  { type: "classement", id: "q3", elements: ["e1", "e2"], categories: ["c1", "c2"] },
];

describe("cleBrouillon", () => {
  it("sépare les comptes", () => {
    expect(cleBrouillon("u1", "m01-quiz")).toBe("kalami:cours:brouillon:u1:m01-quiz");
    expect(cleBrouillon("u2", "m01-quiz")).not.toBe(cleBrouillon("u1", "m01-quiz"));
  });
});

describe("brouillonReponses", () => {
  it("ne garde rien tant que rien n'est répondu", () => {
    expect(brouillonReponses(QUESTIONS, [[null], [null, null], [null, null]])).toBeNull();
  });

  it("garde les identifiants et les réponses", () => {
    const valeurs = [[1], [true, null], [null, 0]];
    expect(brouillonReponses(QUESTIONS, valeurs)).toEqual({
      ids: ["q1", "q2", "q3"],
      valeurs,
    });
  });
});

describe("lireReponses", () => {
  const valeurs = [[2], [false, true], [1, null]];
  const garde = { ids: ["q1", "q2", "q3"], valeurs };

  it("remet en place un brouillon valide", () => {
    expect(lireReponses(garde, QUESTIONS)).toEqual(valeurs);
  });

  it("écarte un brouillon périmé (questions changées)", () => {
    expect(lireReponses({ ...garde, ids: ["q1", "q9", "q3"] }, QUESTIONS)).toBeNull();
    expect(lireReponses(garde, QUESTIONS.slice(0, 2))).toBeNull();
  });

  it("écarte une valeur hors limites ou du mauvais type", () => {
    expect(lireReponses({ ...garde, valeurs: [[3], [false, true], [1, null]] }, QUESTIONS))
      .toBeNull();
    expect(lireReponses({ ...garde, valeurs: [[2], [1, true], [1, null]] }, QUESTIONS))
      .toBeNull();
    expect(lireReponses({ ...garde, valeurs: [[2], [false], [1, null]] }, QUESTIONS))
      .toBeNull();
    expect(lireReponses({ ...garde, valeurs: [[2], [false, true], [2, null]] }, QUESTIONS))
      .toBeNull();
  });

  it("écarte une valeur illisible", () => {
    expect(lireReponses("abc", QUESTIONS)).toBeNull();
    expect(lireReponses(null, QUESTIONS)).toBeNull();
    expect(lireReponses({ ids: "q1" }, QUESTIONS)).toBeNull();
  });
});

describe("lireTexte", () => {
  it("garde un texte non vide de longueur permise", () => {
    expect(lireTexte("Ma réponse")).toBe("Ma réponse");
    expect(lireTexte("")).toBeNull();
    expect(lireTexte(42)).toBeNull();
    expect(lireTexte("x".repeat(TEXTE_MAX + 1))).toBeNull();
  });
});

describe("lireSaisieAtelier", () => {
  const champs = [
    { type: "texte" as const, id: "decision", max: 20 },
    { type: "choix" as const, id: "conclusion", options: [{ valeur: "oui" }, { valeur: "non" }] },
  ];
  const depart = { decision: "ancienne", conclusion: "" };

  it("reprend les champs valides et garde les autres", () => {
    expect(lireSaisieAtelier({ decision: "nouvelle", inconnu: "x" }, champs, depart)).toEqual(
      { decision: "nouvelle", conclusion: "" },
    );
    expect(lireSaisieAtelier({ conclusion: "non" }, champs, depart)).toEqual({
      decision: "ancienne",
      conclusion: "non",
    });
  });

  it("écarte un texte trop long ou un choix inconnu", () => {
    expect(lireSaisieAtelier({ decision: "x".repeat(21) }, champs, depart)).toBeNull();
    expect(lireSaisieAtelier({ conclusion: "peut-être" }, champs, depart)).toBeNull();
    expect(lireSaisieAtelier(["a"], champs, depart)).toBeNull();
  });
});
