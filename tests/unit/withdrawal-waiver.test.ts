/**
 * Fichier    : withdrawal-waiver.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires de la renonciation au droit de rétractation (v0.15.7) :
 *              seule la valeur booléenne true dans le corps de la demande est acceptée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-28
 */

import { describe, expect, it } from "vitest";

import { hasWithdrawalWaiver } from "@/lib/payments/checkout-request";

describe("hasWithdrawalWaiver", () => {
  it("accepte la case cochée", () => {
    expect(hasWithdrawalWaiver({ item: "book", withdrawalWaiver: true })).toBe(true);
  });

  it("refuse l'absence de la case ou une valeur autre que true", () => {
    expect(hasWithdrawalWaiver({ item: "book" })).toBe(false);
    expect(hasWithdrawalWaiver({ withdrawalWaiver: false })).toBe(false);
    expect(hasWithdrawalWaiver({ withdrawalWaiver: "true" })).toBe(false);
    expect(hasWithdrawalWaiver({ withdrawalWaiver: 1 })).toBe(false);
  });

  it("refuse un corps absent ou mal formé", () => {
    expect(hasWithdrawalWaiver(null)).toBe(false);
    expect(hasWithdrawalWaiver("withdrawalWaiver")).toBe(false);
    expect(hasWithdrawalWaiver(undefined)).toBe(false);
  });
});
