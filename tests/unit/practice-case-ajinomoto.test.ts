/**
 * Fichier    : practice-case-ajinomoto.test.ts
 * Projet     : Kalami Stratégie
 * Description: Vérifie que le corrigé du cas Ajinomoto Afrique de l'Ouest passe la même
 *              validation que les études réelles : profil, puis contenu de chaque étape
 *              contre le schéma de son gabarit (longueurs, valeurs permises, références).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-23
 */

import { describe, expect, it, vi } from "vitest";

// Les fichiers du cas sont réservés au serveur (contenu payant)
vi.mock("server-only", () => ({}));

import {
  CASE_COMPANY_NAME,
  CASE_PROFILE,
  CASE_STRATEGIC_QUESTION,
} from "@/lib/strategy/cases/ajinomoto/profil";
import { CASE_STEP_1 } from "@/lib/strategy/cases/ajinomoto/etape-1";
import { CASE_STEP_2 } from "@/lib/strategy/cases/ajinomoto/etape-2";
import { CASE_STEP_3 } from "@/lib/strategy/cases/ajinomoto/etape-3";
import { CASE_STEP_4 } from "@/lib/strategy/cases/ajinomoto/etape-4";
import { CASE_STEP_5 } from "@/lib/strategy/cases/ajinomoto/etape-5";
import { CASE_STEP_6 } from "@/lib/strategy/cases/ajinomoto/etape-6";
import { CASE_STEP_7 } from "@/lib/strategy/cases/ajinomoto/etape-7";
import { CASE_STEP_8 } from "@/lib/strategy/cases/ajinomoto/etape-8";
import { CASE_STEP_9 } from "@/lib/strategy/cases/ajinomoto/etape-9";
import { CASE_STATEMENT } from "@/lib/strategy/cases/ajinomoto/enonce";
import { CASE_EPILOGUE } from "@/lib/strategy/cases/ajinomoto/epilogue";
import { checklistOk } from "@/lib/strategy/templates/common";
import { checklistFor, type TemplateStep } from "@/lib/strategy/templates";
import { planSchema } from "@/lib/strategy/templates/plan";
import { actionSchema } from "@/lib/strategy/templates/action";
import { choiceSchema } from "@/lib/strategy/templates/choice";
import { profileDataSchema, profileInputSchema } from "@/lib/strategy/profile";
import { directionSchema } from "@/lib/strategy/templates/direction";
import { forcesSchema } from "@/lib/strategy/templates/forces";
import { internalSchema } from "@/lib/strategy/templates/internal";
import { pestelSchema } from "@/lib/strategy/templates/pestel";
import {
  STAKEHOLDERS_MIN,
  stakeholdersSchema,
} from "@/lib/strategy/templates/stakeholders";
import {
  ISSUES_MIN,
  SWOT_KEYS,
  synthesisSchema,
} from "@/lib/strategy/templates/synthesis";

// ==================== OUTILS ====================

/** Retourne les messages d'erreur Zod sous forme lisible (vide si valide). */
function issues(result: {
  success: boolean;
  error?: { issues: unknown[] };
}): unknown[] {
  return result.success ? [] : (result.error?.issues ?? []);
}

/** Vérifie que les identifiants d'une liste sont uniques. */
function expectUniqueIds(items: { id: string }[]) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
}

// ==================== PROFIL ====================

describe("cas Ajinomoto : profil", () => {
  it("passe le schéma du profil", () => {
    expect(issues(profileDataSchema.safeParse(CASE_PROFILE))).toEqual([]);
  });

  it("passe le schéma du formulaire (nom et question)", () => {
    const input = {
      data: CASE_PROFILE,
      companyName: CASE_COMPANY_NAME,
      strategicQuestion: CASE_STRATEGIC_QUESTION,
    };
    expect(issues(profileInputSchema.safeParse(input))).toEqual([]);
  });

  it("vise les onze pays de l'annexe 2", () => {
    expect(CASE_PROFILE.countries).toHaveLength(11);
  });
});

// ==================== ÉTAPES 1 À 3 ====================

describe("cas Ajinomoto : étape 1 (PESTEL)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(pestelSchema.safeParse(CASE_STEP_1))).toEqual([]);
    expectUniqueIds(CASE_STEP_1.factors);
  });

  it("construit les scénarios sur deux facteurs pivots existants", () => {
    const pivots = CASE_STEP_1.factors
      .filter((f) => f.quadrant === "pivot")
      .map((f) => f.id);
    const axes = CASE_STEP_1.scenarios.axes.map((axis) => axis.factorId);
    expect(pivots).toHaveLength(2);
    expect([...axes].sort()).toEqual([...pivots].sort());
  });
});

describe("cas Ajinomoto : étape 2 (cinq forces)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(forcesSchema.safeParse(CASE_STEP_2))).toEqual([]);
    expectUniqueIds(CASE_STEP_2.comparison.actors);
    expectUniqueIds(CASE_STEP_2.comparison.criteria);
  });

  it("note chaque acteur sur chaque critère", () => {
    const actors = CASE_STEP_2.comparison.actors
      .map((actor) => actor.id)
      .sort();
    for (const criterion of CASE_STEP_2.comparison.criteria) {
      expect(Object.keys(criterion.scores).sort()).toEqual(actors);
    }
  });
});

describe("cas Ajinomoto : étape 3 (environnement interne)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(internalSchema.safeParse(CASE_STEP_3))).toEqual([]);
    expectUniqueIds(CASE_STEP_3.activities);
    expectUniqueIds(CASE_STEP_3.resources);
  });

  it("distingue les ressources du groupe et celles de la filiale", () => {
    const origins = CASE_STEP_3.resources.map((r) => r.category.split(" :")[0]);
    expect(new Set(origins)).toEqual(new Set(["Groupe", "AAO"]));
  });
});

// ==================== ÉTAPES 4 À 6 ====================

describe("cas Ajinomoto : étape 4 (parties prenantes)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(stakeholdersSchema.safeParse(CASE_STEP_4))).toEqual([]);
    expect(CASE_STEP_4.stakeholders.length).toBeGreaterThanOrEqual(
      STAKEHOLDERS_MIN,
    );
    expectUniqueIds(CASE_STEP_4.stakeholders);
  });

  it("place les huit acteurs de la question 6, tous notés", () => {
    const ids = CASE_STEP_4.stakeholders.map((s) => s.id);
    for (const id of [
      "siege-tokyo",
      "direction-regionale",
      "grossistes",
      "detaillantes",
      "restaurateurs",
      "consommatrices",
      "gouvernement",
      "concurrents",
    ]) {
      expect(ids).toContain(id);
    }
    for (const s of CASE_STEP_4.stakeholders) {
      expect(s.power).not.toBeNull();
      expect(s.interest).not.toBeNull();
    }
  });
});

describe("cas Ajinomoto : étape 5 (synthèse)", () => {
  const swotItems = SWOT_KEYS.flatMap((key) => CASE_STEP_5.swot[key]);
  const swotIds = new Set(swotItems.map((item) => item.id));
  const towsIds = new Set(CASE_STEP_5.tows.map((item) => item.id));

  it("passe le schéma du gabarit", () => {
    expect(issues(synthesisSchema.safeParse(CASE_STEP_5))).toEqual([]);
    expect(CASE_STEP_5.issues.length).toBeGreaterThanOrEqual(ISSUES_MIN);
    expectUniqueIds([...swotItems, ...CASE_STEP_5.tows, ...CASE_STEP_5.issues]);
  });

  it("relie la SWOT à des éléments existants des étapes 1 à 4", () => {
    const sources: Record<number, Set<string>> = {
      1: new Set(CASE_STEP_1.factors.map((f) => f.id)),
      2: new Set(Object.keys(CASE_STEP_2.forces)),
      3: new Set([
        ...CASE_STEP_3.activities.map((a) => a.id),
        ...CASE_STEP_3.resources.map((r) => r.id),
      ]),
      4: new Set(CASE_STEP_4.stakeholders.map((s) => s.id)),
    };
    for (const item of swotItems) {
      if (item.origin) {
        expect(sources[item.origin.step].has(item.origin.ref)).toBe(true);
      }
    }
  });

  it("croise des éléments existants dans la TOWS et les enjeux", () => {
    for (const piste of CASE_STEP_5.tows) {
      for (const link of piste.links) expect(swotIds.has(link)).toBe(true);
    }
    for (const issue of CASE_STEP_5.issues) {
      for (const link of issue.links) {
        expect(swotIds.has(link) || towsIds.has(link)).toBe(true);
      }
    }
  });
});

describe("cas Ajinomoto : étape 6 (cap)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(directionSchema.safeParse(CASE_STEP_6))).toEqual([]);
    expectUniqueIds(CASE_STEP_6.values);
    expectUniqueIds(CASE_STEP_6.objectives);
  });

  it("teste la vision en cours et relie les objectifs aux enjeux", () => {
    expect(CASE_STEP_6.nameTest.testedVision).toBe(CASE_STEP_6.vision.text);
    const issueIds = new Set(CASE_STEP_5.issues.map((issue) => issue.id));
    for (const objective of CASE_STEP_6.objectives) {
      expect(objective.issueLinks.length).toBeGreaterThan(0);
      for (const link of objective.issueLinks) {
        expect(issueIds.has(link)).toBe(true);
      }
    }
  });
});

// ==================== ÉTAPES 7 ET SUIVANTES ====================

describe("cas Ajinomoto : étape 7 (choix)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(choiceSchema.safeParse(CASE_STEP_7))).toEqual([]);
    expectUniqueIds(CASE_STEP_7.options);
    expectUniqueIds(CASE_STEP_7.renunciations);
  });

  it("évalue au moins quatre options sur les trois critères", () => {
    expect(CASE_STEP_7.options.length).toBeGreaterThanOrEqual(4);
    const issueIds = new Set(CASE_STEP_5.issues.map((issue) => issue.id));
    for (const option of CASE_STEP_7.options) {
      expect(option.relevance).not.toBeNull();
      expect(option.acceptability).not.toBeNull();
      expect(option.feasibility).not.toBeNull();
      expect(option.decision).not.toBeNull();
      for (const link of option.issueLinks) {
        expect(issueIds.has(link)).toBe(true);
      }
    }
  });
});

describe("cas Ajinomoto : étape 8 (action)", () => {
  it("passe le schéma du gabarit", () => {
    expect(issues(actionSchema.safeParse(CASE_STEP_8))).toEqual([]);
    expectUniqueIds([
      ...CASE_STEP_8.workstreams,
      ...CASE_STEP_8.workstreams.flatMap((w) => w.phases),
      ...CASE_STEP_8.indicators,
      ...CASE_STEP_8.risks,
    ]);
  });

  it("relie chantiers et indicateurs aux étapes 6 et 7", () => {
    const retained = new Set(
      CASE_STEP_7.options
        .filter((o) => o.decision === "retained")
        .map((o) => o.id),
    );
    const objectives = new Set(CASE_STEP_6.objectives.map((o) => o.id));
    for (const w of CASE_STEP_8.workstreams) {
      for (const link of w.optionLinks) expect(retained.has(link)).toBe(true);
      for (const link of w.objectiveLinks) {
        expect(objectives.has(link)).toBe(true);
      }
      expect(w.start <= w.end).toBe(true);
      for (const p of w.phases) {
        expect(p.start >= w.start && p.end <= w.end && p.start <= p.end).toBe(
          true,
        );
      }
    }
    for (const i of CASE_STEP_8.indicators) {
      for (const link of i.objectiveLinks) {
        expect(objectives.has(link)).toBe(true);
      }
    }
    const streams = new Set(CASE_STEP_8.workstreams.map((w) => w.id));
    for (const r of CASE_STEP_8.risks)
      expect(streams.has(r.workstream)).toBe(true);
  });

  it("couvre les quatre perspectives du tableau de bord", () => {
    const perspectives = new Set(
      CASE_STEP_8.indicators.map((i) => i.perspective),
    );
    expect(perspectives.size).toBe(4);
  });
});

describe("cas Ajinomoto : étape 9 (plan)", () => {
  it("assemble un plan valide, sans section vide", () => {
    expect(issues(planSchema.safeParse(CASE_STEP_9))).toEqual([]);
    for (const section of CASE_STEP_9.sections) {
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });

  it("ne dévoile pas l'épilogue", () => {
    const text = JSON.stringify(CASE_STEP_9);
    expect(text).not.toMatch(/Promasidor|liquidation|dissolution/i);
  });
});

// ==================== ÉNONCÉ ET ÉPILOGUE ====================

describe("cas Ajinomoto : énoncé", () => {
  it("pose les dix questions, chacune reliée à une étape", () => {
    expect(CASE_STATEMENT.questions).toHaveLength(10);
    expectUniqueIds(CASE_STATEMENT.questions);
    for (const q of CASE_STATEMENT.questions) {
      expect(q.step).toBeGreaterThanOrEqual(1);
      expect(q.step).toBeLessThanOrEqual(9);
    }
    const steps = new Set(CASE_STATEMENT.questions.map((q) => q.step));
    expect(steps).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it("donne des tableaux aux lignes complètes", () => {
    const tables = CASE_STATEMENT.annexes.flatMap((b) =>
      b.kind === "table" ? [b.table] : [],
    );
    expect(tables.length).toBeGreaterThanOrEqual(5);
    for (const table of tables) {
      for (const row of table.rows) expect(row).toHaveLength(table.headers.length);
    }
  });

  it("date la mission du début de 2016, comme le corrigé", () => {
    expect(JSON.stringify(CASE_STATEMENT.story)).toContain("début de l'année 2016");
  });

  it("ne dévoile pas l'épilogue", () => {
    const text = JSON.stringify(CASE_STATEMENT);
    expect(text).not.toMatch(/Promasidor/i);
    expect(JSON.stringify(CASE_EPILOGUE)).toMatch(/Promasidor/);
  });
});

// ==================== CAS RÉSOLU (v0.14.3) ====================

describe("cas résolu", () => {
  // L'étude résolue valide une étape quand sa liste de contrôle est remplie
  const STEPS = [
    CASE_STEP_1, CASE_STEP_2, CASE_STEP_3, CASE_STEP_4,
    CASE_STEP_5, CASE_STEP_6, CASE_STEP_7, CASE_STEP_8,
  ];

  it("remplit la liste de contrôle des étapes 1 à 8", () => {
    STEPS.forEach((payload, index) => {
      const no = (index + 1) as TemplateStep;
      const missing = checklistFor(no, payload).filter((item) => !item.ok);
      expect({ no, missing }).toEqual({ no, missing: [] });
      expect(checklistOk(checklistFor(no, payload))).toBe(true);
    });
  });
});
