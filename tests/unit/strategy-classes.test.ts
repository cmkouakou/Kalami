/**
 * Fichier    : strategy-classes.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests du mode enseignant (S10a) sans base : formulaires de classe et de
 *              réglages (Zod), groupes de la distribution, progression, retard indicatif,
 *              coach coupé par étape, date du jour, traduction des erreurs et phrase du
 *              journal pour une étude distribuée, lien et courriel d'inscription.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildClassInvitationEmail, classJoinUrl, newInvitationToken }
  from "@/lib/strategy/class-email";
import {
  classCoachSchema,
  classError,
  classInfoSchema,
  coachDisabledFor,
  distributionSchema,
  firstIssue,
  individualGroups,
  isLate,
  parseGroups,
  progressOf,
  teamGroups,
  todayIso,
} from "@/lib/strategy/classes";
import type { StepStatus } from "@/lib/strategy/steps";
import { describeActivity } from "@/lib/strategy/team";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const cl = s.classes;

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

const ALL_DONE: StepStatus[] = Array(9).fill("validated");
const HALF: StepStatus[] = [
  "validated", "validated", "validated", "in_progress", "todo", "todo", "todo", "todo", "todo",
];

describe("classInfoSchema", () => {
  it("accepte une classe complète et retire les espaces", () => {
    const parsed = classInfoSchema.parse({
      name: "  Stratégie — groupe 02 ",
      institution: "HEC Montréal",
      term: "Automne 2026",
      dueDate: "2026-12-15",
    });
    expect(parsed).toEqual({
      name: "Stratégie — groupe 02",
      institution: "HEC Montréal",
      term: "Automne 2026",
      dueDate: "2026-12-15",
    });
  });

  it("rend une date vide nulle", () => {
    const parsed = classInfoSchema.parse({ name: "G1", institution: "", term: "", dueDate: "" });
    expect(parsed.dueDate).toBeNull();
  });

  it("refuse un nom vide, un texte trop long et une date invalide", () => {
    const base = { name: "G1", institution: "", term: "", dueDate: "" };
    const empty = classInfoSchema.safeParse({ ...base, name: "  " });
    expect(empty.success).toBe(false);
    expect(firstIssue(empty.error!.issues)).toBe(cl.errors.invalid_name);

    const long = classInfoSchema.safeParse({ ...base, term: "x".repeat(61) });
    expect(firstIssue(long.error!.issues)).toBe(cl.errors.text_too_long);

    for (const dueDate of ["15/12/2026", "2026-13-45", "demain"]) {
      const bad = classInfoSchema.safeParse({ ...base, dueDate });
      expect(firstIssue(bad.error!.issues)).toBe(cl.errors.invalid_date);
    }
  });
});

describe("classCoachSchema", () => {
  it("trie et dédoublonne les étapes coupées", () => {
    const parsed = classCoachSchema.parse({
      coachDisabledSteps: ["5", "2", "5"],
      studyBudget: "",
    });
    expect(parsed).toEqual({ coachDisabledSteps: [2, 5], studyBudget: null });
  });

  it("lit un plafond avec virgule ou point", () => {
    expect(classCoachSchema.parse({ coachDisabledSteps: [], studyBudget: "1,50" }).studyBudget)
      .toBe(1.5);
    expect(classCoachSchema.parse({ coachDisabledSteps: [], studyBudget: "0" }).studyBudget)
      .toBe(0);
  });

  it("refuse l'étape 9, un plafond négatif, trop précis ou au-delà de 50 $", () => {
    expect(classCoachSchema.safeParse({ coachDisabledSteps: [9], studyBudget: "" }).success)
      .toBe(false);
    for (const studyBudget of ["-1", "1.234", "50.01", "abc"]) {
      const bad = classCoachSchema.safeParse({ coachDisabledSteps: [], studyBudget });
      expect(bad.success).toBe(false);
      expect(firstIssue(bad.error!.issues)).toBe(cl.errors.invalid_budget);
    }
  });
});

describe("distributionSchema", () => {
  it("exige l'entreprise et borne la question", () => {
    expect(distributionSchema.safeParse({ companyName: " ", question: "" }).success).toBe(false);
    expect(distributionSchema.safeParse({ companyName: "Ajinomoto", question: "x".repeat(1001) })
      .success).toBe(false);
    expect(distributionSchema.parse({ companyName: " Ajinomoto ", question: "" }))
      .toEqual({ companyName: "Ajinomoto", question: "" });
  });
});

describe("parseGroups", () => {
  it("accepte des études individuelles et des équipes", () => {
    expect(parseGroups(individualGroups([A, B]))).toEqual([[A], [B]]);
    expect(parseGroups([[A, B], [C]])).toEqual([[A, B], [C]]);
  });

  it("refuse un étudiant dans deux groupes, un groupe vide ou trop grand", () => {
    expect(parseGroups([[A], [A, B]])).toBeNull();
    expect(parseGroups([[]])).toBeNull();
    expect(parseGroups([])).toBeNull();
    const seven = Array.from({ length: 7 }, (_, i) =>
      `0000000${i}-0000-4000-8000-000000000000`);
    expect(parseGroups([seven])).toBeNull();
  });

  it("forme les équipes dans l'ordre des numéros, sans les étudiants écartés", () => {
    expect(teamGroups([A, B, C], { [A]: 2, [B]: 1, [C]: 2 })).toEqual([[B], [A, C]]);
    expect(teamGroups([A, B, C], { [A]: 0, [B]: 1 })).toEqual([[B]]);
    expect(teamGroups([A, B], {})).toEqual([]);
  });

  it("refuse ce qui n'est pas une liste d'identifiants", () => {
    expect(parseGroups("[[1]]")).toBeNull();
    expect(parseGroups([["pas-un-uuid"]])).toBeNull();
    expect(parseGroups(null)).toBeNull();
  });
});

describe("progression et retard", () => {
  it("compte les étapes validées", () => {
    expect(progressOf(HALF)).toEqual({ validated: 3, total: 9, percent: 33 });
    expect(progressOf(ALL_DONE).percent).toBe(100);
  });

  it("signale en retard une étude non terminée après la date limite seulement", () => {
    expect(isLate(HALF, "2026-12-15", "2026-12-16")).toBe(true);
    expect(isLate(HALF, "2026-12-15", "2026-12-15")).toBe(false);
    expect(isLate(ALL_DONE, "2026-12-15", "2027-01-10")).toBe(false);
    expect(isLate(HALF, null, "2030-01-01")).toBe(false);
  });

  it("donne la date du jour à Montréal", () => {
    // 3 h UTC le 1er novembre : encore le 31 octobre à Montréal
    expect(todayIso(new Date("2026-11-01T03:00:00Z"))).toBe("2026-10-31");
  });
});

describe("coach coupé par l'enseignant", () => {
  it("ne vise que les étapes choisies et rien hors classe", () => {
    const studyClass = { coach_disabled_steps: [2, 6] };
    expect(coachDisabledFor(studyClass, 2)).toBe(true);
    expect(coachDisabledFor(studyClass, 3)).toBe(false);
    expect(coachDisabledFor(null, 2)).toBe(false);
  });
});

describe("classError", () => {
  it("traduit les erreurs de classe, d'équipe et générales", () => {
    expect(classError({ message: "class_full" })).toBe(cl.errors.class_full);
    expect(classError({ message: "email_mismatch" })).toBe(s.team.errors.email_mismatch);
    expect(classError({ message: "class_teacher" })).toBe(s.team.errors.class_teacher);
    expect(classError({ code: "42501", message: "accès refusé" })).toBe(s.errors.forbidden);
    expect(classError({})).toBe(s.errors.generic);
  });

  it("a un texte pour chaque refus des fonctions SQL de classe", () => {
    for (const key of [
      "not_teacher", "too_many_classes", "class_archived", "invalid_groups",
      "not_enough_credits", "link_not_found", "is_teacher", "invalid_steps",
    ]) {
      expect(classError({ message: key })).not.toBe(s.errors.generic);
    }
  });
});

describe("journal", () => {
  it("raconte la distribution d'une étude par la classe", () => {
    const text = describeActivity({
      id: 1,
      action: "class_assigned",
      step_no: null,
      actor_name: "Mme Diallo",
      target_name: null,
      details: { class: "Groupe 02" },
      created_at: "2026-10-16T12:00:00Z",
    });
    expect(text).toBe("Mme Diallo a distribué cette étude à la classe « Groupe 02 ».");
  });
});

describe("courriel d'inscription", () => {
  it("produit un jeton long et un lien vers la page de classe", () => {
    const token = newInvitationToken();
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(classJoinUrl(token)).toMatch(new RegExp(`/strategie/classe/${token}$`));
  });

  it("échappe le texte saisi et garde l'objet sur une ligne", () => {
    const message = buildClassInvitationEmail({
      to: "eleve@example.com",
      teacherName: "Prof <b>X</b>",
      className: "G1\r\nBcc: pirate@example.com",
      url: "https://kalami.test/strategie/classe/abc",
    });
    expect(message.to).toBe("eleve@example.com");
    expect(message.subject).not.toMatch(/[\r\n]/);
    expect(message.html).toContain("Prof &lt;b&gt;X&lt;/b&gt;");
    expect(message.html).not.toContain("<b>X</b>");
    expect(message.text).toContain("https://kalami.test/strategie/classe/abc");
    expect(message.text).toContain("eleve@example.com");
  });
});
