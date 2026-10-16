/**
 * Fichier    : strategy-direction-choice.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests des gabarits des étapes 6 (cap) et 7 (choix) (S7a) : réécriture de la
 *              vision au nom d'un concurrent, état du test du nom, objectifs SMART, alertes
 *              des options retenues, listes de contrôle (miroir de strategy_checklist_ok),
 *              lecture tolérante et validation stricte avant envoi.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { describe, expect, it } from "vitest";

import { parsePayload } from "@/lib/strategy/templates";
import {
  choiceChecklist,
  emptyChoice,
  isEvaluated,
  newOption,
  newRenunciation,
  optionWarnings,
  readChoice,
  type ChoicePayload,
  type StrategicOption,
} from "@/lib/strategy/templates/choice";
import { checklistOk } from "@/lib/strategy/templates/common";
import {
  directionChecklist,
  emptyDirection,
  isSmart,
  nameTestState,
  newObjective,
  newValue,
  readDirection,
  swapName,
  type DirectionPayload,
  type Objective,
} from "@/lib/strategy/templates/direction";

// ==================== JEUX DE DONNÉES ====================

const VISION = "Infosystem sera le partenaire numérique des PME de Lasalle.";

/** Objectif rédigé, coché sur tous les critères SMART. */
function smartObjective(id: string): Objective {
  return {
    ...newObjective(id),
    text: "Doubler les contrats",
    smart: {
      specific: true,
      measurable: true,
      achievable: true,
      realistic: true,
      timeBound: true,
    },
  };
}

/** Cap complet, qui passe la liste de contrôle. */
function fullDirection(): DirectionPayload {
  return {
    vision: { id: "vision", text: VISION },
    nameTest: { competitor: "Alpha", answer: "no", testedVision: VISION },
    mission: { id: "mission", text: "Simplifier le numérique des PME." },
    values: [
      { ...newValue("v1"), name: "Proximité", gesture: "Visite mensuelle" },
      { ...newValue("v2"), name: "Clarté", gesture: "Devis en une page" },
    ],
    objectives: [smartObjective("o1")],
  };
}

/** Option rédigée, notée et décidée. */
function option(id: string, patch: Partial<StrategicOption> = {}): StrategicOption {
  return {
    ...newOption(id, "penetration"),
    text: `Option ${id}`,
    relevance: "yes",
    acceptability: "partial",
    feasibility: "yes",
    decision: "rejected",
    ...patch,
  };
}

/** Choix complet, qui passe la liste de contrôle. */
function fullChoice(): ChoicePayload {
  return {
    generic: { id: "generic", position: "differentiation", justification: "" },
    options: [option("a", { decision: "retained", issueLinks: ["e1"] }), option("b")],
    statement: { id: "statement", text: "Nous différencions par le service." },
    renunciations: [{ ...newRenunciation("r1"), text: "Pas de grands comptes" }],
  };
}

/** Liste de contrôle réussie (toutes les cases cochées). */
const passesDirection = (payload: DirectionPayload) => checklistOk(directionChecklist(payload));
const passesChoice = (payload: ChoicePayload) => checklistOk(choiceChecklist(payload));

// ==================== TEST DU NOM ====================

describe("swapName", () => {
  it("remplace chaque mention du nom, sans tenir compte de la casse", () => {
    expect(swapName("INFOSYSTEM aide ; infosystem écoute.", "Infosystem", "Alpha")).toBe(
      "Alpha aide ; Alpha écoute.",
    );
  });

  it("fait du concurrent le sujet si la vision ne cite pas le nom", () => {
    expect(swapName(" Être le partenaire des PME ", "Infosystem", " Alpha ")).toBe(
      "Alpha : « Être le partenaire des PME »",
    );
  });

  it("traite le nom comme du texte, pas comme une expression régulière", () => {
    expect(swapName("A.B+ grandit", "A.B+", "Alpha")).toBe("Alpha grandit");
    expect(swapName("AxB grandit", "A.B", "Alpha")).toBe("Alpha : « AxB grandit »");
  });

  it("ne réécrit rien sans vision ou sans concurrent", () => {
    expect(swapName("", "Infosystem", "Alpha")).toBe("");
    expect(swapName(VISION, "Infosystem", "  ")).toBe("");
  });
});

describe("nameTestState", () => {
  it("suit la réponse et les changements de la vision", () => {
    const payload = fullDirection();
    expect(nameTestState(payload)).toBe("passed");
    expect(nameTestState({ ...payload, nameTest: { ...payload.nameTest, answer: "yes" } }))
      .toBe("failed");
    expect(nameTestState({ ...payload, nameTest: { ...payload.nameTest, answer: null } }))
      .toBe("pending");
    expect(nameTestState({ ...payload, vision: { id: "vision", text: `${VISION} ` } }))
      .toBe("stale");
  });
});

// ==================== ÉTAPE 6 : CAP ====================

describe("directionChecklist", () => {
  it("passe avec un cap complet et échoue sur un contenu vide", () => {
    expect(passesDirection(fullDirection())).toBe(true);
    expect(passesDirection(emptyDirection())).toBe(false);
  });

  it("exige un test du nom réussi sur la vision actuelle", () => {
    const payload = fullDirection();
    const changed = { ...payload, vision: { id: "vision" as const, text: "Autre vision" } };
    expect(passesDirection(changed)).toBe(false);
    const failed = { ...payload, nameTest: { ...payload.nameTest, answer: "yes" as const } };
    expect(passesDirection(failed)).toBe(false);
  });

  it("exige deux valeurs avec leur geste", () => {
    const payload = fullDirection();
    const values = [payload.values[0], { ...payload.values[1], gesture: "  " }];
    expect(passesDirection({ ...payload, values })).toBe(false);
  });

  it("exige un objectif rédigé et coché sur les cinq critères", () => {
    const payload = fullDirection();
    const partial = smartObjective("o2");
    partial.smart.timeBound = false;
    expect(isSmart(partial)).toBe(false);
    expect(isSmart({ ...smartObjective("o3"), text: " " })).toBe(false);
    expect(passesDirection({ ...payload, objectives: [partial] })).toBe(false);
  });
});

describe("readDirection", () => {
  it("écarte les éléments invalides et garde les ids fixes", () => {
    const read = readDirection({
      vision: { id: "autre", text: VISION },
      nameTest: { competitor: "Alpha", answer: "peut-être", testedVision: "" },
      values: [{ id: "v1", name: "Proximité", gesture: "Visite" }, { id: 3 }],
      objectives: "rien",
    });
    expect(read.vision).toEqual({ id: "vision", text: VISION });
    expect(read.nameTest.answer).toBeNull();
    expect(read.mission).toEqual({ id: "mission", text: "" });
    expect(read.values).toHaveLength(1);
    expect(read.objectives).toEqual([]);
  });

  it("valide strictement avant envoi", () => {
    expect(parsePayload(6, fullDirection())).not.toBeNull();
    const objectives = [{ ...smartObjective("o"), deadline: "2027-13" }];
    const badDeadline = { ...fullDirection(), objectives };
    expect(parsePayload(6, badDeadline)).toBeNull();
    expect(parsePayload(6, emptyChoice())).toBeNull();
  });
});

// ==================== ÉTAPE 7 : CHOIX ====================

describe("optionWarnings", () => {
  it("signale une option retenue malgré un « non » ou sans enjeu", () => {
    expect(optionWarnings(option("a", { decision: "retained", issueLinks: ["e1"] }))).toEqual([]);
    expect(optionWarnings(option("a", { decision: "retained", feasibility: "no" }))).toEqual([
      "failedCriterion",
      "noIssue",
    ]);
  });

  it("ne signale rien pour une option écartée ou non décidée", () => {
    expect(optionWarnings(option("a", { feasibility: "no" }))).toEqual([]);
    expect(optionWarnings(option("a", { decision: null, feasibility: "no" }))).toEqual([]);
  });
});

describe("choiceChecklist", () => {
  it("passe avec un choix complet et échoue sur un contenu vide", () => {
    expect(passesChoice(fullChoice())).toBe(true);
    expect(passesChoice(emptyChoice())).toBe(false);
  });

  it("exige deux options évaluées, dont une retenue", () => {
    const payload = fullChoice();
    const unrated = option("b", { acceptability: null });
    expect(isEvaluated(unrated)).toBe(false);
    expect(passesChoice({ ...payload, options: [payload.options[0], unrated] })).toBe(false);
    const noneRetained = payload.options.map((item) => ({ ...item, decision: null }));
    expect(passesChoice({ ...payload, options: noneRetained })).toBe(false);
  });

  it("exige une position, un énoncé et un renoncement", () => {
    const payload = fullChoice();
    expect(passesChoice({ ...payload, generic: { ...payload.generic, position: null } }))
      .toBe(false);
    expect(passesChoice({ ...payload, statement: { id: "statement", text: " " } })).toBe(false);
    expect(passesChoice({ ...payload, renunciations: [newRenunciation("r")] })).toBe(false);
  });
});

describe("readChoice", () => {
  it("écarte les éléments invalides", () => {
    const read = readChoice({
      generic: { id: "generic", position: "luxe", justification: "" },
      options: [option("a"), { ...option("b"), relevance: "peut-être" }],
      statement: { text: 4 },
    });
    expect(read.generic.position).toBeNull();
    expect(read.options.map((item) => item.id)).toEqual(["a"]);
    expect(read.statement).toEqual({ id: "statement", text: "" });
    expect(read.renunciations).toEqual([]);
  });

  it("valide strictement avant envoi", () => {
    expect(parsePayload(7, fullChoice())).not.toBeNull();
    const options = [option("a", { issueLinks: ["1", "2", "3", "4"] })];
    const tooManyLinks = { ...fullChoice(), options };
    expect(parsePayload(7, tooManyLinks)).toBeNull();
  });
});
