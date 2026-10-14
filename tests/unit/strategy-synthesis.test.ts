/**
 * Fichier    : strategy-synthesis.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests du gabarit de l'étape 5 (S6a) : lecture tolérante, suppression qui
 *              retire les liens orphelins, liste de contrôle (miroir de
 *              strategy_checklist_ok), validation stricte avant envoi, et reprise des
 *              étapes 1 à 3 vers la SWOT (règles de case, étiquettes, sans doublon).
 * Auteur     : Claude Marcel
 * Date       : 2026-10-14
 */

import { describe, expect, it } from "vitest";

import { parsePayload } from "@/lib/strategy/templates";
import { checklistOk } from "@/lib/strategy/templates/common";
import { FORCES, initialForces, type ForceKey } from "@/lib/strategy/templates/forces";
import {
  emptyInternal,
  newActivity,
  newResource,
  type Answer,
  type Resource,
} from "@/lib/strategy/templates/internal";
import { emptyPestel, newFactor, type Nature } from "@/lib/strategy/templates/pestel";
import {
  importCandidates,
  swotCandidates,
  type SynthesisSources,
} from "@/lib/strategy/synthesis-sources";
import {
  emptySynthesis,
  ISSUES_MAX,
  newIssue,
  newSwotItem,
  newTowsItem,
  originLabel,
  readSynthesis,
  removeItem,
  SWOT_ITEMS_MAX,
  synthesisChecklist,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

const LABELS = Object.fromEntries(FORCES.map((key) => [key, `Force ${key}`])) as Record<
  ForceKey,
  string
>;

/** Synthèse complète : un élément par case, une piste, deux enjeux. */
function complete(): SynthesisPayload {
  return {
    swot: {
      strengths: [newSwotItem("s1", "Marque connue")],
      weaknesses: [newSwotItem("w1", "Coûts élevés")],
      opportunities: [newSwotItem("o1", "Marché en croissance", { step: 1, ref: "f1" })],
      threats: [newSwotItem("t1", "Nouveaux entrants", { step: 2, ref: "newEntrants" })],
    },
    tows: [{ ...newTowsItem("p1", "so"), text: "Lancer une gamme", links: ["s1", "o1"] }],
    issues: [
      { ...newIssue("e1"), title: "Croître", links: ["p1", "s1"] },
      { ...newIssue("e2"), title: "Réduire les coûts", links: ["w1"] },
    ],
  };
}

/** Ressource VRIO dont les réponses sont données dans l'ordre V, R, I, O. */
function resource(id: string, name: string, answers: Answer[]): Resource {
  const base = newResource(id);
  const [value, rarity, imitability, organization] = answers;
  const test = (answer: Answer | undefined) => ({ answer: answer ?? null, justification: "" });
  return {
    ...base,
    name,
    tests: {
      value: test(value),
      rarity: test(rarity),
      imitability: test(imitability),
      organization: test(organization),
    },
  };
}

/** Étapes sources de test. */
function sources(): SynthesisSources {
  const factor = (id: string, text: string, nature: Nature | null) => ({
    ...newFactor(id, "economic"),
    factor: text,
    nature,
  });
  const pestel = {
    ...emptyPestel(),
    factors: [
      factor("f1", "Croissance du marché", "opportunity"),
      factor("f2", "Hausse des taux", "threat"),
      factor("f3", "Numérique", "both"),
      factor("f4", "Sans nature", null),
      factor("f5", "   ", "threat"),
    ],
  };
  const forces = initialForces("Kalami", []);
  forces.forces.newEntrants = { intensity: "high", justification: "Barrières faibles" };
  forces.forces.buyers = { intensity: "medium", justification: "Clients dispersés" };
  const activity = (id: string, name: string, evaluation: "strength" | "weakness" | "improve"
    | "marginal") => ({ ...newActivity(id, "primary", name), evaluation });
  const internal = {
    ...emptyInternal(),
    activities: [
      activity("a1", "Marketing", "strength"),
      activity("a2", "Logistique", "weakness"),
      activity("a3", "Service", "improve"),
      activity("a4", "Achats", "marginal"),
    ],
    resources: [
      resource("r1", "Savoir-faire", ["yes", "yes", "yes", "yes"]),
      resource("r2", "Locaux", ["no"]),
      resource("r3", "Réseau", ["yes", "no"]),
    ],
  };
  return { pestel, forces, internal };
}

// ==================== LECTURE ET SUPPRESSION ====================

describe("gabarit de synthèse", () => {
  it("relit un contenu vide ou invalide sans erreur", () => {
    expect(readSynthesis(null)).toEqual(emptySynthesis());
    const raw = {
      swot: { strengths: [{ id: "x", text: 3 }, newSwotItem("ok", "Bon")], threats: "non" },
      tows: [{ id: "p", quadrant: "zz", text: "", links: [] }],
      issues: Array.from({ length: ISSUES_MAX + 2 }, (_, i) => newIssue(`e${i}`)),
    };
    const read = readSynthesis(raw);
    expect(read.swot.strengths).toEqual([newSwotItem("ok", "Bon")]);
    expect(read.swot.threats).toEqual([]);
    expect(read.tows).toEqual([]);
    expect(read.issues).toHaveLength(ISSUES_MAX);
  });

  it("retire les liens vers un élément supprimé", () => {
    const next = removeItem(complete(), "s1");
    expect(next.swot.strengths).toEqual([]);
    expect(next.tows[0].links).toEqual(["o1"]);
    expect(next.issues[0].links).toEqual(["p1"]);
    expect(complete().swot.strengths).toHaveLength(1);
  });

  it("retire une piste TOWS et les enjeux qui s'y appuyaient perdent le lien", () => {
    const next = removeItem(complete(), "p1");
    expect(next.tows).toEqual([]);
    expect(next.issues[0].links).toEqual(["s1"]);
  });

  it("affiche l'étiquette d'origine", () => {
    expect(originLabel({ step: 3, ref: "a1" })).toBe("É3");
    expect(originLabel(null)).toBeNull();
  });
});

// ==================== LISTE DE CONTRÔLE ====================

describe("liste de contrôle de la synthèse", () => {
  it("est complète avec une case remplie partout, une piste et deux enjeux", () => {
    expect(checklistOk(synthesisChecklist(complete()))).toBe(true);
  });

  it("exige chaque case de la SWOT rédigée", () => {
    const payload = complete();
    payload.swot.threats = [newSwotItem("t1", "   ")];
    expect(synthesisChecklist(payload).find((item) => item.key === "swot")?.ok).toBe(false);
  });

  it("exige une piste TOWS rédigée", () => {
    const payload = { ...complete(), tows: [newTowsItem("p1", "wt")] };
    expect(synthesisChecklist(payload).find((item) => item.key === "tows")?.ok).toBe(false);
  });

  it("exige deux ou trois enjeux nommés", () => {
    const one = { ...complete(), issues: [{ ...newIssue("e1"), title: "Seul" }, newIssue("e2")] };
    expect(synthesisChecklist(one).find((item) => item.key === "issues")?.ok).toBe(false);
    const three = {
      ...complete(),
      issues: ["A", "B", "C"].map((title, i) => ({ ...newIssue(`e${i}`), title })),
    };
    expect(checklistOk(synthesisChecklist(three))).toBe(true);
  });

  it("valide strictement le contenu avant envoi", () => {
    expect(parsePayload(5, complete())).not.toBeNull();
    expect(parsePayload(5, { ...complete(), issues: Array(4).fill(newIssue("e")) })).toBeNull();
    const badOrigin = complete();
    badOrigin.swot.strengths = [{ id: "s1", text: "x", origin: { step: 5, ref: "a" } as never }];
    expect(parsePayload(5, badOrigin)).toBeNull();
  });
});

// ==================== REPRISE DES ÉTAPES 1 À 3 ====================

describe("reprise vers la SWOT", () => {
  it("range chaque élément dans sa case avec son origine", () => {
    const candidates = swotCandidates(sources(), LABELS, emptySynthesis());
    const summary = candidates.map((c) => `${c.key}:${originLabel(c.origin)}:${c.origin.ref}`);
    expect(summary).toEqual([
      "strengths:É3:a1",
      "strengths:É3:r1",
      "weaknesses:É3:a2",
      "weaknesses:É3:a3",
      "weaknesses:É3:r2",
      "opportunities:É1:f1",
      "opportunities:É1:f3",
      "threats:É1:f2",
      "threats:É1:f3",
      "threats:É2:newEntrants",
    ]);
    const entrants = candidates.find((c) => c.origin.ref === "newEntrants");
    expect(entrants?.text).toBe("Force newEntrants : Barrières faibles");
  });

  it("signale les éléments déjà repris et ne les ajoute pas deux fois", () => {
    let payload = emptySynthesis();
    let n = 0;
    const id = () => `n${n++}`;
    const first = swotCandidates(sources(), LABELS, payload);
    payload = importCandidates(payload, first.slice(0, 2), id);
    expect(payload.swot.strengths.map((item) => item.text)).toEqual([
      "Marketing",
      "Savoir-faire",
    ]);

    const again = swotCandidates(sources(), LABELS, payload);
    expect(again.filter((c) => c.present)).toHaveLength(2);
    payload = importCandidates(payload, again, id);
    expect(payload.swot.strengths).toHaveLength(2);
    expect(payload.swot.threats).toHaveLength(3);
  });

  it("respecte la limite d'éléments par case", () => {
    const full = emptySynthesis();
    full.swot.strengths = Array.from({ length: SWOT_ITEMS_MAX }, (_, i) =>
      newSwotItem(`s${i}`, "x"),
    );
    const candidates = swotCandidates(sources(), LABELS, full);
    const next = importCandidates(full, candidates, () => crypto.randomUUID());
    expect(next.swot.strengths).toHaveLength(SWOT_ITEMS_MAX);
    expect(next.swot.weaknesses).toHaveLength(3);
  });
});
