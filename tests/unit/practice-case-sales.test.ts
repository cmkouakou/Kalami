/**
 * Fichier    : practice-case-sales.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires de la vente des cas d'entraînement (v0.14.0) : demande
 *              d'achat, prix Stripe, chemin d'abandon, lien après achat, règle de
 *              déverrouillage du corrigé et registre des cas.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-23
 */

import { describe, expect, it, vi } from "vitest";

import type { CaseAccess } from "@/lib/strategy/cases/unlock";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { cancelPathFor, parseCheckoutBody } = await import("@/lib/payments/checkout-request");
const { priceEnvName } = await import("@/lib/payments/catalog");
const { orderItemLink } = await import("@/lib/payments/queries");
const { unlockedCaseCorrections } = await import("@/lib/strategy/cases/queries");
const { getPracticeCase, listPracticeCaseCodes } = await import(
  "@/lib/strategy/cases/registry"
);
const unlock = await import("@/lib/strategy/cases/unlock");

const ACCESS: CaseAccess = {
  studyId: null,
  exampleStudyId: null,
  unlockedSteps: [],
  unlockImmediately: false,
  source: "purchase",
};

// ==================== DEMANDE D'ACHAT ====================

describe("achat d'un cas", () => {
  it("lit un code de cas bien formé et refuse le reste", () => {
    expect(parseCheckoutBody({ item: "practice_case", code: "ajinomoto", currency: "XOF" }))
      .toEqual({ item: "practice_case", code: "ajinomoto", currency: "XOF" });
    expect(parseCheckoutBody({ item: "practice_case", code: "../x", currency: "XOF" }))
      .toBeNull();
    expect(parseCheckoutBody({ item: "practice_case", currency: "XOF" })).toBeNull();
  });

  it("revient sur la page du cas si le paiement est abandonné", () => {
    expect(cancelPathFor({ item: "practice_case", code: "ajinomoto" }, null)).toBe(
      "/strategie/cas/ajinomoto?paiement=annule",
    );
  });

  it("nomme la variable du prix Stripe d'après le code", () => {
    expect(priceEnvName({ kind: "practice_case", code: "ajinomoto" })).toBe(
      "STRIPE_PRICE_CAS_AJINOMOTO",
    );
    expect(priceEnvName({ kind: "practice_case", code: "cas-2" })).toBe("STRIPE_PRICE_CAS_CAS_2");
  });

  it("ouvre la page du cas après l'achat", () => {
    const item = { label: "Cas", kind: "practice_case", study_id: null, credits: null, book: null };
    expect(orderItemLink({ ...item, practice_case: "ajinomoto" })).toEqual({
      href: "/strategie/cas/ajinomoto",
      kind: "case",
    });
    expect(orderItemLink({ ...item, practice_case: null })).toBeNull();
  });
});

// ==================== DÉVERROUILLAGE ====================

describe("déverrouillage du corrigé", () => {
  it("lit les étapes de la base sans doublon ni valeur inconnue", () => {
    expect(unlock.readUnlockedSteps([3, 1, 3, 12, "2"])).toEqual([1, 2, 3]);
    expect(unlock.readUnlockedSteps(null)).toEqual([]);
  });

  it("n'ouvre que les étapes validées, et l'épilogue avec le plan", () => {
    const open: CaseAccess = { ...ACCESS, unlockedSteps: [1, 2] };
    expect(unlock.unlockedCorrections(open)).toEqual([1, 2]);
    expect(unlock.isCorrectionUnlocked(open, 3)).toBe(false);
    expect(unlock.isEpilogueUnlocked(open)).toBe(false);
    expect(unlock.isEpilogueUnlocked({ ...open, unlockedSteps: [9] })).toBe(true);
  });

  it("ouvre tout avec l'interrupteur « tout de suite »", () => {
    const access: CaseAccess = { ...ACCESS, unlockImmediately: true };
    expect(unlock.unlockedCorrections(access)).toHaveLength(9);
    expect(unlock.isEpilogueUnlocked(access)).toBe(true);
  });

  it("n'envoie que le corrigé des étapes ouvertes", () => {
    const corrections = unlockedCaseCorrections("ajinomoto", { ...ACCESS, unlockedSteps: [2] });
    expect(Object.keys(corrections)).toEqual(["2"]);
    expect(corrections[2]).toBe(getPracticeCase("ajinomoto")?.corrections[2]);
    expect(unlockedCaseCorrections("inconnu", { ...ACCESS, unlockImmediately: true })).toEqual(
      {},
    );
  });
});

// ==================== REGISTRE ====================

describe("registre des cas", () => {
  it("connaît le cas Ajinomoto et ignore un code inconnu", () => {
    const practiceCase = getPracticeCase("ajinomoto");
    expect(practiceCase?.companyName).toContain("Ajinomoto");
    expect(Object.keys(practiceCase?.corrections ?? {})).toHaveLength(9);
    expect(getPracticeCase("constructor")).toBeNull();
  });

  it("liste ses cas avec un nom court pour l'accueil", () => {
    expect(listPracticeCaseCodes()).toContain("ajinomoto");
    expect(getPracticeCase("ajinomoto")?.shortName).toBe("Ajinomoto");
  });
});
