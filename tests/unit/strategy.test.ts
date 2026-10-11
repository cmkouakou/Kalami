/**
 * Fichier    : strategy.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests des règles pures de l'assistant stratégie : graphe des étapes,
 *              prérequis, cascade « à revoir », rôles, lecture et validation du profil.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { describe, expect, it } from "vitest";

import {
  EMPTY_PROFILE,
  isProfileComplete,
  lines,
  missingProfileFields,
  parseProfileForm,
  readProfileData,
} from "@/lib/strategy/profile";
import {
  canEdit,
  canValidate,
  downstreamSteps,
  isStepNo,
  missingPrerequisites,
  PROFILE_PREREQUISITE,
  STEPS,
  statusesAfterReopen,
  validatedCount,
  type StepNo,
  type StepStatus,
} from "@/lib/strategy/steps";

/** Statuts des 9 étapes, tous « à faire » sauf ceux précisés. */
function statuses(
  overrides: Partial<Record<StepNo, StepStatus>> = {},
): Record<StepNo, StepStatus> {
  const all = {} as Record<StepNo, StepStatus>;
  for (const step of STEPS) all[step.no] = overrides[step.no] ?? "todo";
  return all;
}

const FOUR_VALIDATED = { 1: "validated", 2: "validated", 3: "validated", 4: "validated" } as const;

// ==================== GRAPHE DES ÉTAPES ====================

describe("graphe des étapes", () => {
  it("contient 9 étapes numérotées dans l'ordre", () => {
    expect(STEPS.map((step) => step.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("reconnaît les numéros valides", () => {
    expect(isStepNo(1)).toBe(true);
    expect(isStepNo(9)).toBe(true);
    expect(isStepNo(0)).toBe(false);
    expect(isStepNo(10)).toBe(false);
    expect(isStepNo(2.5)).toBe(false);
    expect(isStepNo("3")).toBe(false);
  });

  it("n'a que des prérequis antérieurs (pas de cycle)", () => {
    for (const step of STEPS) {
      for (const pre of step.prerequisites) expect(pre).toBeLessThan(step.no);
    }
  });
});

// ==================== PRÉREQUIS ====================

describe("prérequis", () => {
  it("les étapes 1 à 4 exigent seulement le profil", () => {
    expect(missingPrerequisites(1, statuses(), false)).toEqual([PROFILE_PREREQUISITE]);
    expect(missingPrerequisites(4, statuses(), true)).toEqual([]);
  });

  it("la synthèse reste verrouillée tant que 1 à 4 ne sont pas toutes validées", () => {
    const three = statuses({ 1: "validated", 2: "validated", 3: "validated", 4: "in_progress" });
    expect(missingPrerequisites(5, three, true)).toEqual([4]);
    expect(missingPrerequisites(5, statuses(FOUR_VALIDATED), true)).toEqual([]);
  });

  it("une étape « à revoir » ne compte pas comme validée", () => {
    const review = statuses({ ...FOUR_VALIDATED, 5: "needs_review" });
    expect(missingPrerequisites(6, review, true)).toEqual([5]);
  });

  it("compte les étapes validées", () => {
    expect(validatedCount(statuses(FOUR_VALIDATED))).toBe(4);
    expect(validatedCount(statuses())).toBe(0);
  });
});

// ==================== CASCADE ====================

describe("cascade « à revoir »", () => {
  it("liste toutes les étapes en aval, dans l'ordre", () => {
    expect(downstreamSteps(1)).toEqual([5, 6, 7, 8, 9]);
    expect(downstreamSteps(7)).toEqual([8, 9]);
    expect(downstreamSteps(9)).toEqual([]);
  });

  it("rouvrir une étape validée marque les étapes commencées en aval", () => {
    const before = statuses({ ...FOUR_VALIDATED, 5: "validated", 6: "in_progress" });
    const after = statusesAfterReopen(2, before);
    expect(after[2]).toBe("in_progress");
    expect(after[5]).toBe("needs_review");
    expect(after[6]).toBe("needs_review");
    expect(after[7]).toBe("todo");
    expect(after[1]).toBe("validated");
  });

  it("ne change rien si l'étape n'est pas validée", () => {
    const before = statuses({ 1: "in_progress", 5: "validated" });
    expect(statusesAfterReopen(1, before)).toEqual(before);
  });
});

// ==================== RÔLES ====================

describe("rôles", () => {
  it("seul le propriétaire valide ; l'observateur ne modifie rien", () => {
    expect(canValidate("owner")).toBe(true);
    expect(canValidate("contributor")).toBe(false);
    expect(canEdit("contributor")).toBe(true);
    expect(canEdit("observer")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });
});

// ==================== PROFIL ====================

/** Construit un FormData à partir de paires (les clés répétées sont permises). */
function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("profil de l'entreprise", () => {
  it("découpe les listes ligne par ligne, sans vides ni doublons", () => {
    expect(lines(" Canada \r\n\nFrance\nCanada\n")).toEqual(["Canada", "France"]);
  });

  it("lit un formulaire complet", () => {
    const result = parseProfileForm(
      form([
        ["companyName", " Atelier Nord "],
        ["strategicQuestion", "Faut-il croître ?"],
        ["sector", "Ébénisterie"],
        ["employees", "1 200"],
        ["foundedYear", "1998"],
        ["countries", "Canada\nFrance"],
        ["offers", "Meubles sur mesure"],
        ["team_role", "Production"],
        ["team_headcount", "40"],
        ["team_role", ""],
        ["team_headcount", ""],
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.companyName).toBe("Atelier Nord");
    expect(result.value.data.employees).toBe(1200);
    expect(result.value.data.countries).toEqual(["Canada", "France"]);
    expect(result.value.data.teams).toEqual([{ role: "Production", headcount: 40 }]);
  });

  it("signale les champs invalides par leur nom", () => {
    const result = parseProfileForm(
      form([
        ["companyName", ""],
        ["employees", "beaucoup"],
        ["foundedYear", "3000"],
      ]),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fields).toEqual(
      expect.arrayContaining(["companyName", "employees", "foundedYear"]),
    );
  });

  it("calcule les champs indispensables manquants", () => {
    expect(missingProfileFields("", EMPTY_PROFILE)).toEqual([
      "strategicQuestion",
      "sector",
      "countries",
      "offers",
    ]);
    const data = { ...EMPTY_PROFILE, sector: "Bois", countries: ["Canada"], offers: ["Meubles"] };
    expect(isProfileComplete("Faut-il croître ?", data)).toBe(true);
    expect(isProfileComplete("   ", data)).toBe(false);
  });

  it("relit un profil enregistré en ignorant les valeurs invalides", () => {
    const data = readProfileData({ sector: "Bois", employees: "dix", countries: ["Canada", 3] });
    expect(data.sector).toBe("Bois");
    expect(data.employees).toBeNull();
    expect(data.countries).toEqual([]);
    expect(readProfileData(null)).toEqual(EMPTY_PROFILE);
  });
});
