/**
 * Fichier    : currency.test.ts
 * Projet     : Kalami
 * Description: Tests des devises : pays → devise, saisie → unité mineure, formatage.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-07
 */

import { describe, expect, it } from "vitest";

import {
  currencyForCountry,
  formatPrice,
  fromMinorUnits,
  isCurrency,
  pickPrice,
  toMinorUnits,
} from "@/lib/currency";

/** Remplace les espaces insécables d'Intl par des espaces simples. */
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("currencyForCountry", () => {
  it("donne le XOF aux pays de l'UEMOA", () => {
    for (const code of ["BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG"]) {
      expect(currencyForCountry(code)).toBe("XOF");
    }
    expect(currencyForCountry("ci")).toBe("XOF");
  });

  it("donne le CAD au Canada et l'EUR ailleurs ou si le pays est inconnu", () => {
    expect(currencyForCountry("CA")).toBe("CAD");
    expect(currencyForCountry("FR")).toBe("EUR");
    expect(currencyForCountry("CM")).toBe("EUR");
    expect(currencyForCountry(null)).toBe("EUR");
  });
});

describe("isCurrency", () => {
  it("n'accepte que XOF, EUR et CAD", () => {
    expect(isCurrency("XOF")).toBe(true);
    expect(isCurrency("USD")).toBe(false);
    expect(isCurrency("eur")).toBe(false);
    expect(isCurrency(undefined)).toBe(false);
  });
});

describe("toMinorUnits / fromMinorUnits", () => {
  it("convertit les montants avec virgule, point ou espaces", () => {
    expect(toMinorUnits("12,50", "EUR")).toBe(1250);
    expect(toMinorUnits("12.5", "CAD")).toBe(1250);
    expect(toMinorUnits("5 000", "XOF")).toBe(5000);
    expect(toMinorUnits("0,10", "EUR")).toBe(10);
  });

  it("refuse les saisies invalides, nulles ou trop précises", () => {
    expect(toMinorUnits("", "EUR")).toBeNull();
    expect(toMinorUnits("abc", "EUR")).toBeNull();
    expect(toMinorUnits("-5", "EUR")).toBeNull();
    expect(toMinorUnits("0", "EUR")).toBeNull();
    expect(toMinorUnits("12,505", "EUR")).toBeNull();
    expect(toMinorUnits("5000,5", "XOF")).toBeNull();
  });

  it("revient au montant décimal", () => {
    expect(fromMinorUnits(1250, "EUR")).toBe(12.5);
    expect(fromMinorUnits(5000, "XOF")).toBe(5000);
  });
});

describe("formatPrice", () => {
  it("formate sans décimales en XOF et avec deux décimales en EUR et CAD", () => {
    expect(plain(formatPrice(5000, "XOF"))).toMatch(/^5 000 F\s?CFA$/);
    expect(plain(formatPrice(1250, "EUR"))).toBe("12,50 €");
    expect(plain(formatPrice(1999, "CAD"))).toMatch(/^19,99 \$/);
  });
});

describe("pickPrice", () => {
  const prices = [
    { currency: "XOF" as const, amount_minor: 5000 },
    { currency: "EUR" as const, amount_minor: 900 },
  ];

  it("retourne le prix dans la devise demandée, sinon null", () => {
    expect(pickPrice(prices, "EUR")?.amount_minor).toBe(900);
    expect(pickPrice(prices, "CAD")).toBeNull();
  });
});
