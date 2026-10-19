/**
 * Fichier    : ledger.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires du grand livre (Sprint 10a, v0.12.0) : conversion des frais
 *              Stripe dans la devise de la commande, saisie d'un pourcentage en points de
 *              base, affichage d'un pourcentage, disponibilité d'une écriture.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-19
 */

import { describe, expect, it } from "vitest";

import { bpsToPercent, feeInOrderCurrency, isAvailable, percentToBps } from "@/lib/revenue/ledger";

// ==================== FRAIS STRIPE ====================

describe("feeInOrderCurrency", () => {
  it("garde les frais quand la devise de règlement est celle de la commande", () => {
    expect(feeInOrderCurrency(87, "cad", null, "CAD")).toBe(87);
    expect(feeInOrderCurrency(150, "XOF", 1, "XOF")).toBe(150);
  });

  it("convertit les frais réglés en dollars canadiens vers l'euro", () => {
    // 10 € réglés 14,80 $ CA (taux 1,48) ; frais 0,74 $ CA → 0,50 €
    expect(feeInOrderCurrency(74, "cad", 1.48, "EUR")).toBe(50);
  });

  it("convertit vers le FCFA sans décimales", () => {
    // 5 000 FCFA réglés 11,50 $ CA (taux 0,0023) ; frais 0,46 $ CA → 200 FCFA
    expect(feeInOrderCurrency(46, "cad", 0.0023, "XOF")).toBe(200);
  });

  it("renvoie null si les frais ou le taux manquent", () => {
    expect(feeInOrderCurrency(null, "cad", 1.48, "EUR")).toBeNull();
    expect(feeInOrderCurrency(-5, "cad", 1.48, "EUR")).toBeNull();
    expect(feeInOrderCurrency(74, "cad", null, "EUR")).toBeNull();
    expect(feeInOrderCurrency(74, "cad", 0, "EUR")).toBeNull();
  });
});

// ==================== POURCENTAGES ====================

describe("percentToBps", () => {
  it("accepte un entier, une virgule ou le signe %", () => {
    expect(percentToBps("70")).toBe(7000);
    expect(percentToBps(" 72,5 ")).toBe(7250);
    expect(percentToBps("70 %")).toBe(7000);
    expect(percentToBps("0")).toBe(0);
    expect(percentToBps("100")).toBe(10000);
  });

  it("refuse une saisie invalide ou au-delà du maximum", () => {
    expect(percentToBps("101")).toBeNull();
    expect(percentToBps("-5")).toBeNull();
    expect(percentToBps("abc")).toBeNull();
    expect(percentToBps("")).toBeNull();
    expect(percentToBps(null)).toBeNull();
    expect(percentToBps("2,5", 20)).toBe(250);
    expect(percentToBps("25", 20)).toBeNull();
  });
});

describe("bpsToPercent", () => {
  it("affiche des points de base en pourcentage français", () => {
    expect(bpsToPercent(7000)).toBe("70");
    expect(bpsToPercent(7250)).toBe("72,5");
    expect(bpsToPercent(0)).toBe("0");
  });
});

// ==================== DISPONIBILITÉ ====================

describe("isAvailable", () => {
  const now = new Date("2026-10-19T12:00:00Z");

  it("dit disponible une écriture dont la date est passée ou atteinte", () => {
    expect(isAvailable("2026-10-19T12:00:00Z", now)).toBe(true);
    expect(isAvailable("2026-09-01T00:00:00Z", now)).toBe(true);
    expect(isAvailable("2026-11-18T12:00:00Z", now)).toBe(false);
  });
});
