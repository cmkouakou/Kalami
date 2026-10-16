/**
 * Fichier    : strategy-action.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests du gabarit de l'étape 8, « Action » (S7b) : liste de contrôle (miroir de
 *              strategy_checklist_ok), alertes des chantiers, vue Gantt au mois (coupure à
 *              60 mois, barres bornées), lecture tolérante et validation stricte avant envoi.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { describe, expect, it } from "vitest";

import { parsePayload } from "@/lib/strategy/templates";
import {
  actionChecklist,
  emptyAction,
  ganttLayout,
  GANTT_MONTHS_MAX,
  isComplete,
  monthFromIndex,
  monthIndex,
  newIndicator,
  newPhase,
  newRisk,
  newWorkstream,
  PERSPECTIVES,
  readAction,
  workstreamWarnings,
  type ActionPayload,
  type Workstream,
} from "@/lib/strategy/templates/action";
import { checklistOk } from "@/lib/strategy/templates/common";

// ==================== JEUX DE DONNÉES ====================

/** Chantier complet, lié à une option retenue. */
function workstream(id: string, patch: Partial<Workstream> = {}): Workstream {
  return {
    ...newWorkstream(id),
    name: `Chantier ${id}`,
    owner: "Directrice des ventes",
    start: "2027-01",
    end: "2027-06",
    optionLinks: ["opt1"],
    ...patch,
  };
}

/** Contenu complet : un chantier et un indicateur nommé par perspective. */
function fullAction(): ActionPayload {
  return {
    workstreams: [workstream("w1")],
    indicators: PERSPECTIVES.map((perspective, index) => ({
      ...newIndicator(`i${index}`, perspective),
      name: `Indicateur ${perspective}`,
    })),
    risks: [{ ...newRisk("r1"), text: "Départ d'un technicien", workstream: "w1" }],
  };
}

const passes = (payload: ActionPayload) => checklistOk(actionChecklist(payload));

// ==================== LISTE DE CONTRÔLE ====================

describe("actionChecklist", () => {
  it("accepte un contenu complet, sans exiger de risque", () => {
    expect(passes(fullAction())).toBe(true);
    expect(passes({ ...fullAction(), risks: [] })).toBe(true);
  });

  it("refuse le contenu vide", () => {
    expect(actionChecklist(emptyAction())).toEqual([
      { key: "workstream", ok: false },
      { key: "scorecard", ok: false },
    ]);
  });

  it("exige un chantier nommé, avec responsable et dates dans l'ordre", () => {
    const base = fullAction();
    const cases: Partial<Workstream>[] = [
      { name: "  " },
      { owner: "" },
      { start: "" },
      { end: "2026-12" },
    ];
    for (const patch of cases) {
      expect(passes({ ...base, workstreams: [workstream("w1", patch)] })).toBe(false);
    }
    expect(isComplete(workstream("w1", { end: "2027-01" }))).toBe(true);
  });

  it("exige un indicateur nommé dans chacune des quatre perspectives", () => {
    const base = fullAction();
    const missing = base.indicators.filter((item) => item.perspective !== "learning");
    expect(passes({ ...base, indicators: missing })).toBe(false);
    const unnamed = base.indicators.map((item) =>
      item.perspective === "customer" ? { ...item, name: " " } : item,
    );
    expect(passes({ ...base, indicators: unnamed })).toBe(false);
  });
});

// ==================== ALERTES ====================

describe("workstreamWarnings", () => {
  it("ne signale rien pour un chantier non nommé", () => {
    expect(workstreamWarnings(newWorkstream("w1"))).toEqual([]);
  });

  it("signale les dates inversées et l'absence d'option liée", () => {
    const item = workstream("w1", { start: "2027-06", end: "2027-01", optionLinks: [] });
    expect(workstreamWarnings(item)).toEqual(["badDates", "noOption"]);
  });

  it("signale une phase hors du chantier ou aux dates inversées", () => {
    const inside = { ...newPhase("p1"), start: "2027-02", end: "2027-03" };
    expect(workstreamWarnings(workstream("w1", { phases: [inside] }))).toEqual([]);
    const outside = { ...inside, end: "2027-09" };
    expect(workstreamWarnings(workstream("w1", { phases: [outside] }))).toEqual([
      "phaseOutside",
    ]);
    const reversed = { ...inside, start: "2027-04", end: "2027-02" };
    expect(workstreamWarnings(workstream("w1", { phases: [reversed] }))).toEqual([
      "phaseOutside",
    ]);
  });
});

// ==================== VUE GANTT ====================

describe("monthIndex", () => {
  it("convertit un mois en rang et inversement", () => {
    const index = monthIndex("2027-12");
    expect(index).not.toBeNull();
    expect(monthFromIndex(index as number)).toBe("2027-12");
    expect(monthFromIndex((index as number) + 1)).toBe("2028-01");
    expect(monthIndex("")).toBeNull();
  });
});

describe("ganttLayout", () => {
  it("couvre du premier début à la dernière fin et place les barres", () => {
    const layout = ganttLayout([
      workstream("w1", { start: "2027-03", end: "2027-04" }),
      workstream("w2", { start: "2027-01", end: "2027-02" }),
      workstream("w3", { start: "", end: "" }),
    ]);
    expect(layout.months).toEqual(["2027-01", "2027-02", "2027-03", "2027-04"]);
    expect(layout.truncated).toBe(false);
    expect(layout.rows.map((row) => [row.id, row.bar])).toEqual([
      ["w1", { start: 2, span: 2 }],
      ["w2", { start: 0, span: 2 }],
    ]);
  });

  it("ne produit aucune ligne sans chantier daté", () => {
    expect(ganttLayout([newWorkstream("w1")])).toEqual({
      months: [],
      rows: [],
      truncated: false,
    });
  });

  it("coupe la période à 60 mois et borne les barres", () => {
    const layout = ganttLayout([
      workstream("w1", { start: "2027-01", end: "2034-12" }),
      workstream("w2", { start: "2033-01", end: "2033-06" }),
    ]);
    expect(layout.months).toHaveLength(GANTT_MONTHS_MAX);
    expect(layout.months.at(-1)).toBe("2031-12");
    expect(layout.truncated).toBe(true);
    expect(layout.rows.map((row) => row.id)).toEqual(["w1"]);
    expect(layout.rows[0].bar).toEqual({ start: 0, span: GANTT_MONTHS_MAX });
  });

  it("place les phases datées et écarte les autres", () => {
    const phases = [
      { ...newPhase("p1"), name: "Pilote", start: "2027-02", end: "2027-03" },
      { ...newPhase("p2"), name: "Sans dates" },
    ];
    const [row] = ganttLayout([workstream("w1", { phases })]).rows;
    expect(row.phases).toEqual([{ id: "p1", name: "Pilote", start: 1, span: 2 }]);
  });
});

// ==================== LECTURE ET VALIDATION ====================

describe("readAction", () => {
  it("écarte les éléments mal formés et garde les autres", () => {
    const result = readAction({
      workstreams: [workstream("w1"), { id: "w2", start: "2027-13" }],
      indicators: [{ ...newIndicator("i1", "financial"), perspective: "autre" }],
      risks: "rien",
      extra: true,
    });
    expect(result.workstreams.map((item) => item.id)).toEqual(["w1"]);
    expect(result.indicators).toEqual([]);
    expect(result.risks).toEqual([]);
    expect(readAction(null)).toEqual(emptyAction());
  });
});

describe("parsePayload(8)", () => {
  it("accepte un contenu complet et refuse un contenu mal formé", () => {
    expect(parsePayload(8, fullAction())).not.toBeNull();
    expect(parsePayload(8, emptyAction())).not.toBeNull();
    const badMonth = { ...fullAction(), workstreams: [workstream("w1", { end: "2027-1" })] };
    expect(parsePayload(8, badMonth)).toBeNull();
    const tooManyLinks = {
      ...fullAction(),
      workstreams: [workstream("w1", { optionLinks: ["a", "b", "c", "d"] })],
    };
    expect(parsePayload(8, tooManyLinks)).toBeNull();
    expect(parsePayload(8, { workstreams: [] })).toBeNull();
  });
});
