/**
 * =============================================================
 *  Fichier    : mobile-money-tabs.test.ts
 *  Projet     : Kalami
 *  Description: Tests des onglets « Paiements Mobile Money » (v0.25.0) et du titre de
 *               l'onglet du navigateur avec le nombre à valider.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: vitest, lib/admin/mobile-money-tabs.ts, components/admin/payment-watcher.tsx
 * =============================================================
 */

import { describe, expect, it } from "vitest";

import { titleWithCount } from "@/components/admin/payment-watcher";
import { groupByMmTab, mmTabOf, parseMmTab } from "@/lib/admin/mobile-money-tabs";

const mm = (status: string, declared: string | null = null, provider = "mobile_money") => ({
  provider,
  status,
  mm_declared_at: declared,
});

describe("parseMmTab", () => {
  it("accepte les onglets connus et retombe sur « à valider »", () => {
    expect(parseMmTab("paid")).toBe("paid");
    expect(parseMmTab("undeclared")).toBe("undeclared");
    expect(parseMmTab("n'importe")).toBe("to_review");
    expect(parseMmTab(undefined)).toBe("to_review");
  });
});

describe("mmTabOf", () => {
  it("classe une commande Mobile Money selon son statut et sa déclaration", () => {
    expect(mmTabOf(mm("pending", "2026-11-16T10:00:00Z"))).toBe("to_review");
    expect(mmTabOf(mm("pending"))).toBe("undeclared");
    expect(mmTabOf(mm("paid", "2026-11-16T10:00:00Z"))).toBe("paid");
    expect(mmTabOf(mm("failed", "2026-11-16T10:00:00Z"))).toBe("failed");
  });

  it("ignore Stripe et les commandes expirées ou remboursées", () => {
    expect(mmTabOf(mm("paid", null, "stripe"))).toBeNull();
    expect(mmTabOf(mm("expired"))).toBeNull();
    expect(mmTabOf(mm("refunded"))).toBeNull();
  });
});

describe("groupByMmTab", () => {
  it("répartit en gardant l'ordre reçu", () => {
    const a = mm("pending", "2026-11-16T10:00:00Z");
    const b = mm("pending", "2026-11-15T10:00:00Z");
    const c = mm("paid", "2026-11-14T10:00:00Z");
    const groups = groupByMmTab([a, mm("paid", null, "stripe"), b, c]);
    expect(groups.to_review).toEqual([a, b]);
    expect(groups.paid).toEqual([c]);
    expect(groups.failed).toEqual([]);
    expect(groups.undeclared).toEqual([]);
  });
});

describe("titleWithCount", () => {
  it("ajoute, remplace ou retire le nombre en préfixe", () => {
    expect(titleWithCount("Commandes · Admin", 2)).toBe("(2) Commandes · Admin");
    expect(titleWithCount("(2) Commandes · Admin", 3)).toBe("(3) Commandes · Admin");
    expect(titleWithCount("(3) Commandes · Admin", 0)).toBe("Commandes · Admin");
  });
});
