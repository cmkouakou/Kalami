/**
 * Fichier    : legal.test.ts
 * Projet     : Kalami
 * Description: Tests des textes légaux (chemins par espace), du témoin de consentement
 *              (lecture, écriture, version) et de l'assemblage de l'export des données.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import { describe, expect, it } from "vitest";

import {
  buildPersonalDataExport,
  EXPORT_SECTIONS,
  exportFileName,
} from "@/lib/account/export";
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  needsConsent,
  parseConsent,
  readConsentFromCookies,
  serializeConsent,
} from "@/lib/legal/consent";
import { isLegalKind, LEGAL_KINDS, legalPath } from "@/lib/legal/kinds";

const VISITOR = "6f1c2a4e-8b7d-4c3e-9a1f-0d2e3b4c5a6f";

describe("legalPath", () => {
  it("donne les adresses de la librairie par défaut", () => {
    expect(legalPath("privacy")).toBe("/confidentialite");
    expect(legalPath("terms", "site")).toBe("/conditions");
    expect(legalPath("sales")).toBe("/conditions-de-vente");
  });

  it("préfixe les adresses de Kalami Stratégie", () => {
    expect(LEGAL_KINDS.map((kind) => legalPath(kind, "strategy"))).toEqual([
      "/strategie/confidentialite",
      "/strategie/conditions",
      "/strategie/conditions-de-vente",
    ]);
  });

  it("reconnaît les types connus seulement", () => {
    expect(isLegalKind("terms")).toBe(true);
    expect(isLegalKind("cookies")).toBe(false);
    expect(isLegalKind(undefined)).toBe(false);
  });
});

describe("témoin de consentement", () => {
  it("relit ce qu'il écrit", () => {
    const state = { choice: "refused" as const, version: CONSENT_VERSION, visitorId: VISITOR };
    expect(parseConsent(serializeConsent(state))).toEqual(state);
  });

  it("rejette les valeurs mal formées", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent(`maybe.1.${VISITOR}`)).toBeNull();
    expect(parseConsent(`accepted.0.${VISITOR}`)).toBeNull();
    expect(parseConsent(`accepted.1.5.${VISITOR}`)).toBeNull();
    expect(parseConsent("accepted.1.pas-un-uuid")).toBeNull();
  });

  it("redemande le choix sans témoin ou après un changement de version", () => {
    expect(needsConsent(null)).toBe(true);
    expect(needsConsent({ choice: "accepted", version: CONSENT_VERSION, visitorId: VISITOR }))
      .toBe(false);
    expect(
      needsConsent({ choice: "accepted", version: CONSENT_VERSION - 1, visitorId: VISITOR }),
    ).toBe(true);
  });

  it("trouve le témoin parmi les autres", () => {
    const header = `a=1; ${CONSENT_COOKIE}=accepted.1.${VISITOR}; b=2`;
    expect(readConsentFromCookies(header)?.choice).toBe("accepted");
    expect(readConsentFromCookies("a=1; b=2")).toBeNull();
  });
});

describe("export des données personnelles", () => {
  const now = new Date("2026-10-16T12:00:00Z");

  it("contient toutes les sections, vides par défaut", () => {
    const document = buildPersonalDataExport(
      { id: "u1", email: "a@exemple.ca" },
      { signets: [{ id: "b1" }] },
      now,
    );
    expect(Object.keys(document.donnees)).toEqual(EXPORT_SECTIONS.map((s) => s.key));
    expect(document.donnees.signets).toEqual([{ id: "b1" }]);
    expect(document.donnees.profil).toEqual([]);
    expect(document.compte).toEqual({ id: "u1", courriel: "a@exemple.ca" });
    expect(document.exporte_le).toBe("2026-10-16T12:00:00.000Z");
  });

  it("a des clés de section uniques", () => {
    const keys = EXPORT_SECTIONS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("nomme le fichier avec la date", () => {
    expect(exportFileName(now)).toBe("kalami-donnees-2026-10-16.json");
  });
});
