/**
 * Fichier    : strategy-plan.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests du plan stratégique (étape 9, S8a) : schéma et lecture tolérante,
 *              édition des sections, assemblage depuis les étapes (sans IA), catalogue des
 *              éléments citables, annexe de traçabilité et nettoyage de la section rédigée par
 *              le coach (sources inconnues rejetées, paragraphes sans source écartés).
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { describe, expect, it } from "vitest";

import { sanitizePlan } from "@/lib/strategy/coach/plan-output";
import {
  assemblePlan,
  assembleSection,
  formatMonth,
  type PlanInputs,
} from "@/lib/strategy/plan-assemble";
import { catalogIndex, knownSources, sourceCatalog, traceRows } from "@/lib/strategy/plan-trace";
import { EMPTY_PROFILE } from "@/lib/strategy/profile";
import { isEditableStep, parseStepPayload } from "@/lib/strategy/templates";
import {
  emptyAction,
  newIndicator,
  newRisk,
  newWorkstream,
} from "@/lib/strategy/templates/action";
import { emptyChoice, newOption, newRenunciation } from "@/lib/strategy/templates/choice";
import { emptyDirection, newObjective, newValue } from "@/lib/strategy/templates/direction";
import {
  BLOCK_TEXT_MAX,
  BLOCKS_MAX,
  editSection,
  emptyPlan,
  isGenerated,
  PLAN_SECTIONS,
  planSchema,
  readPlan,
  replaceSection,
} from "@/lib/strategy/templates/plan";
import { emptySynthesis, newIssue, newSwotItem } from "@/lib/strategy/templates/synthesis";
import { getStrategyDictionary } from "@/i18n/strategy";

const t = getStrategyDictionary().plan;
const NOW = new Date("2026-10-15T12:00:00.000Z");

// ==================== JEUX DE DONNÉES ====================

/** Matière vide : profil sans réponse et étapes 5 à 8 jamais enregistrées. */
function emptyInputs(): PlanInputs {
  return {
    companyName: "Atelier Nord",
    question: "",
    profile: EMPTY_PROFILE,
    synthesis: emptySynthesis(),
    direction: emptyDirection(),
    choice: emptyChoice(),
    action: emptyAction(),
  };
}

/** Matière complète : un élément de chaque sorte, reliés entre eux. */
function fullInputs(): PlanInputs {
  const base = emptyInputs();
  return {
    ...base,
    question: "Comment doubler la clientèle PME d'ici 2029 ?",
    synthesis: {
      swot: {
        ...base.synthesis.swot,
        strengths: [newSwotItem("s1", "Savoir-faire reconnu", { step: 3, ref: "x1" })],
        threats: [newSwotItem("t1", "Concurrence en ligne")],
      },
      tows: [],
      issues: [
        { ...newIssue("i1"), title: "Visibilité", explanation: "Trop peu connue", links: ["s1"] },
        newIssue("i2"),
      ],
    },
    direction: {
      ...base.direction,
      vision: { id: "vision", text: "Être la référence régionale" },
      values: [{ ...newValue("v1"), name: "Rigueur", gesture: "relire chaque devis" }],
      objectives: [{
        ...newObjective("o1"),
        text: "Gagner 40 clients PME",
        indicator: "Clients PME actifs",
        target: "40",
        deadline: "2029-12",
      }],
    },
    choice: {
      ...base.choice,
      generic: {
        id: "generic",
        position: "differentiation",
        justification: "Service haut de gamme.",
      },
      options: [
        { ...newOption("op1"), text: "Offre PME clés en main", decision: "retained" },
        { ...newOption("op2"), text: "Export", decision: "rejected" },
      ],
      renunciations: [{ ...newRenunciation("r1"), text: "Pas de vente en grande surface" }],
    },
    action: {
      workstreams: [
        {
          ...newWorkstream("w1"),
          name: "Offre PME",
          owner: "Directrice des ventes",
          start: "2027-01",
          end: "2027-06",
          optionLinks: ["op1"],
          objectiveLinks: ["o1"],
        },
        { ...newWorkstream("w2"), name: "Site web", start: "2027-02", end: "2027-03" },
      ],
      indicators: [
        { ...newIndicator("k1", "customer"), name: "Clients PME", frequency: "quarterly" },
      ],
      risks: [{ ...newRisk("rk1"), text: "Départ d'un technicien", signal: "démission" }],
    },
  };
}

// ==================== SCHÉMA ET LECTURE ====================

describe("planSchema et readPlan", () => {
  it("accepte le plan vide et le plan assemblé", () => {
    expect(planSchema.safeParse(emptyPlan()).success).toBe(true);
    expect(planSchema.safeParse(assemblePlan(fullInputs(), NOW)).success).toBe(true);
  });

  it("refuse des sections manquantes, désordonnées ou une source hors des étapes citables", () => {
    const plan = emptyPlan();
    expect(planSchema.safeParse({ ...plan, sections: plan.sections.slice(1) }).success)
      .toBe(false);
    expect(planSchema.safeParse({ ...plan, sections: [...plan.sections].reverse() }).success)
      .toBe(false);
    const bad = replaceSection(plan, {
      key: "risks",
      origin: "edited",
      blocks: [{ id: "b1", text: "x", sources: [{ step: 3 as 5, id: "a" }] }],
    });
    expect(planSchema.safeParse(bad).success).toBe(false);
  });

  it("relit un contenu abîmé : ordre rétabli, éléments invalides écartés", () => {
    const plan = readPlan({
      generatedAt: "pas une date",
      sections: [
        {
          key: "risks",
          origin: "inconnue",
          blocks: [
            { id: "ok", text: "x".repeat(BLOCK_TEXT_MAX + 10), sources: [{ step: 9, id: "a" }] },
            { id: "pas valide !", text: "y", sources: [] },
            { id: "b2", text: 42 },
          ],
        },
      ],
    });
    expect(plan.generatedAt).toBe("");
    expect(plan.sections.map((section) => section.key)).toEqual([...PLAN_SECTIONS]);
    const risks = plan.sections[6];
    expect(risks.origin).toBe("edited");
    expect(risks.blocks).toHaveLength(1);
    expect(risks.blocks[0].text).toHaveLength(BLOCK_TEXT_MAX);
    expect(risks.blocks[0].sources).toEqual([]);
    expect(isGenerated(plan)).toBe(false);
  });

  it("parseStepPayload valide strictement l'étape 9", () => {
    expect(isEditableStep(9)).toBe(true);
    expect(isEditableStep(10)).toBe(false);
    expect(parseStepPayload(9, emptyPlan())).not.toBeNull();
    expect(parseStepPayload(9, { generatedAt: "", sections: [] })).toBeNull();
  });
});

// ==================== ÉDITION ====================

describe("editSection et replaceSection", () => {
  it("modifie une seule section, marquée « modifiée » et bornée", () => {
    const plan = assemblePlan(fullInputs(), NOW);
    const blocks = Array.from({ length: BLOCKS_MAX + 3 }, (_, index) => ({
      id: `b${index}`,
      text: "texte",
      sources: [],
    }));
    const edited = editSection(plan, "risks", blocks);
    expect(edited.sections[6]).toMatchObject({ key: "risks", origin: "edited" });
    expect(edited.sections[6].blocks).toHaveLength(BLOCKS_MAX);
    expect(edited.sections[0]).toBe(plan.sections[0]);
    expect(plan.sections[6].origin).toBe("assembled");
  });
});

// ==================== ASSEMBLAGE ====================

describe("assemblePlan", () => {
  it("produit huit sections assemblées, datées, aux sources dédoublonnées", () => {
    const plan = assemblePlan(fullInputs(), NOW);
    expect(plan.generatedAt).toBe(NOW.toISOString());
    expect(plan.sections.every((section) => section.origin === "assembled")).toBe(true);
    for (const section of plan.sections) {
      for (const block of section.blocks) {
        const keys = block.sources.map((source) => `${source.step}:${source.id}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it("cite le profil, la SWOT et les liens des chantiers", () => {
    const inputs = fullInputs();
    const situation = assembleSection("situation", inputs);
    expect(situation.blocks[0].sources).toEqual([{ step: 0, id: "scope" }]);
    expect(situation.blocks[1].text).toContain(inputs.question);
    const workstreams = assembleSection("workstreams", inputs);
    expect(workstreams.blocks[0].text).toContain("Directrice des ventes");
    expect(workstreams.blocks[0].text).toContain(formatMonth("2027-01"));
    expect(workstreams.blocks[0].sources).toEqual([
      { step: 8, id: "w1" },
      { step: 7, id: "op1" },
      { step: 6, id: "o1" },
    ]);
  });

  it("ne garde que les options retenues et les enjeux nommés", () => {
    const strategy = assembleSection("strategy", fullInputs());
    const text = strategy.blocks.map((block) => block.text).join("\n");
    expect(text).toContain("Offre PME clés en main");
    expect(text).not.toContain("Export");
    const issues = assembleSection("issues", fullInputs());
    expect(issues.blocks).toHaveLength(1);
    expect(issues.blocks[0].sources).toEqual([{ step: 5, id: "i1" }, { step: 5, id: "s1" }]);
  });

  it("classe les jalons par date de fin", () => {
    const monitoring = assembleSection("monitoring", fullInputs());
    const milestones = monitoring.blocks.at(-1);
    expect(milestones?.sources).toEqual([{ step: 8, id: "w2" }, { step: 8, id: "w1" }]);
  });

  it("n'invente rien quand les étapes sont vides", () => {
    const plan = assemblePlan(emptyInputs(), NOW);
    const text = (key: string) => plan.sections.find((section) => section.key === key)?.blocks
      .map((block) => block.text);
    expect(text("issues")).toEqual([t.assembled.noIssues]);
    expect(text("workstreams")).toEqual([t.assembled.noWorkstreams]);
    expect(text("risks")).toEqual([t.assembled.noRisks]);
    expect(text("monitoring")).toEqual([t.assembled.noMonitoring]);
    expect(text("direction")).toEqual([]);
    expect(text("situation")).toHaveLength(1);
  });

  it("écrit les mois en toutes lettres et laisse un mois mal formé tel quel", () => {
    expect(formatMonth("2027-03")).toMatch(/mars 2027/);
    expect(formatMonth("bientôt")).toBe("bientôt");
  });
});

// ==================== TRAÇABILITÉ ====================

describe("sourceCatalog et traceRows", () => {
  it("catalogue tout ce que l'assemblage cite", () => {
    const inputs = fullInputs();
    const index = catalogIndex(sourceCatalog(inputs));
    const plan = assemblePlan(inputs, NOW);
    for (const row of traceRows(plan, sourceCatalog(inputs))) {
      expect(row.sources.every((source) => source.found)).toBe(true);
    }
    expect(index.has("5:i2")).toBe(false);
    expect(index.get("5:s1")?.label).toContain("É3");
  });

  it("signale une source supprimée depuis et ignore les paragraphes sans source", () => {
    const inputs = fullInputs();
    const plan = assemblePlan(inputs, NOW);
    const catalog = sourceCatalog({ ...inputs, action: { ...inputs.action, risks: [] } });
    const rows = traceRows(plan, catalog);
    const risk = rows.find((row) => row.section === "risks");
    expect(risk?.sources).toEqual([
      expect.objectContaining({ step: 8, id: "rk1", found: false }),
    ]);
    const empty = traceRows(assemblePlan(emptyInputs(), NOW), sourceCatalog(emptyInputs()));
    expect(empty.map((row) => row.section)).toEqual(["situation"]);
  });

  it("knownSources rejette l'inconnu et les doublons", () => {
    const index = catalogIndex(sourceCatalog(fullInputs()));
    expect(knownSources(
      [{ step: 6, id: "vision" }, { step: 6, id: "vision" }, { step: 6, id: "inventee" }],
      index,
    )).toEqual([{ step: 6, id: "vision" }]);
  });
});

// ==================== SORTIE DU COACH ====================

describe("sanitizePlan", () => {
  const index = catalogIndex(sourceCatalog(fullInputs()));

  it("garde les paragraphes sourcés et rejette les sources inventées", () => {
    const proposal = sanitizePlan(
      {
        summary: "  Section reformulée.  ",
        blocks: [
          {
            text: " Nous visons la référence régionale. ",
            sources: [
              { step: 6, id: " vision " },
              { step: 6, id: "vision" },
              { step: 5, id: "zz" },
            ],
          },
          { text: "Affirmation sans appui.", sources: [{ step: 4, id: "s1" }] },
          { text: "Sans aucune source.", sources: [] },
          { text: "   ", sources: [{ step: 6, id: "vision" }] },
        ],
      },
      "direction",
      index,
    );
    expect(proposal.summary).toBe("Section reformulée.");
    expect(proposal.dropped).toBe(2);
    expect(proposal.section).toEqual({
      key: "direction",
      origin: "coach",
      blocks: [{
        id: "coach-direction-1",
        text: "Nous visons la référence régionale.",
        sources: [{ step: 6, id: "vision" }],
      }],
    });
    expect(planSchema.safeParse(replaceSection(emptyPlan(), proposal.section)).success)
      .toBe(true);
  });

  it("borne le nombre de paragraphes et leur longueur", () => {
    const proposal = sanitizePlan(
      {
        summary: "",
        blocks: Array.from({ length: BLOCKS_MAX + 2 }, () => ({
          text: "z".repeat(BLOCK_TEXT_MAX + 5),
          sources: [{ step: 8, id: "w1" }],
        })),
      },
      "workstreams",
      index,
    );
    expect(proposal.section.blocks).toHaveLength(BLOCKS_MAX);
    expect(proposal.section.blocks[0].text).toHaveLength(BLOCK_TEXT_MAX);
    expect(proposal.dropped).toBe(2);
  });
});
