/**
 * Fichier    : payouts.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires des versements et du tableau de bord (Sprint 10b, v0.12.1) :
 *              statuts, format et chemin du reçu, raison de blocage d'une demande, début du
 *              mois, totaux par devise des écritures.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-19
 */

import { describe, expect, it } from "vitest";

import { type AuthorBalance, type LedgerAmounts, summarizeEntries } from "@/lib/revenue/ledger";
import {
  isPayoutStatus,
  monthStart,
  payoutBlocker,
  proofExtension,
  proofPath,
} from "@/lib/revenue/payouts";

/** Solde de test en dollars canadiens. */
function balance(overrides: Partial<AuthorBalance>): AuthorBalance {
  return {
    currency: "CAD",
    sales: 3,
    gross: 6000,
    earned: 4000,
    available: 2000,
    pending: 0,
    requested: 0,
    paid: 0,
    ...overrides,
  };
}

/** Écriture de test réduite aux montants. */
function entry(overrides: Partial<LedgerAmounts>): LedgerAmounts {
  return {
    entry_type: "sale",
    currency: "CAD",
    gross_minor: 1000,
    fee_minor: 50,
    tax_minor: 0,
    commission_minor: 285,
    author_minor: 665,
    ...overrides,
  };
}

// ==================== STATUTS ET REÇUS ====================

describe("isPayoutStatus", () => {
  it("reconnaît les statuts connus et refuse le reste", () => {
    expect(isPayoutStatus("paid")).toBe(true);
    expect(isPayoutStatus("requested")).toBe(true);
    expect(isPayoutStatus("ouvertes")).toBe(false);
    expect(isPayoutStatus(undefined)).toBe(false);
    expect(isPayoutStatus(["paid"])).toBe(false);
  });
});

describe("proofExtension", () => {
  it("accepte les PDF et images, sans tenir compte de la casse", () => {
    expect(proofExtension("recu.PDF")).toBe("pdf");
    expect(proofExtension("capture.virement.jpeg")).toBe("jpeg");
    expect(proofExtension("photo.webp")).toBe("webp");
  });

  it("refuse les autres formats et les noms sans extension", () => {
    expect(proofExtension("recu.docx")).toBeNull();
    expect(proofExtension("script.exe")).toBeNull();
    expect(proofExtension("recu")).toBeNull();
  });
});

describe("proofPath", () => {
  it("range le reçu dans le dossier de la demande", () => {
    expect(proofPath("abc", "pdf", "f1")).toBe("versements/abc/f1.pdf");
  });
});

// ==================== BLOCAGES ====================

describe("payoutBlocker", () => {
  it("autorise la demande au-dessus du seuil avec des coordonnées", () => {
    expect(payoutBlocker(balance({}), 1500, true)).toBeNull();
    expect(payoutBlocker(balance({ available: 1500 }), 1500, true)).toBeNull();
  });

  it("signale une demande déjà ouverte en premier", () => {
    expect(payoutBlocker(balance({ requested: 900, available: 0 }), 1500, false)).toBe("open");
  });

  it("signale un disponible sous le seuil avant les coordonnées manquantes", () => {
    expect(payoutBlocker(balance({ available: 1499 }), 1500, false)).toBe("below_minimum");
  });

  it("demande les coordonnées quand le seuil est atteint", () => {
    expect(payoutBlocker(balance({}), 1500, false)).toBe("no_details");
  });
});

// ==================== TABLEAU DE BORD ====================

describe("monthStart", () => {
  it("renvoie le premier jour du mois à minuit UTC", () => {
    expect(monthStart(new Date("2026-10-19T15:30:00Z"))).toBe("2026-10-01T00:00:00.000Z");
    expect(monthStart(new Date("2027-01-01T00:00:00Z"))).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("summarizeEntries", () => {
  it("additionne par devise dans l'ordre XOF, EUR, CAD", () => {
    const totals = summarizeEntries([
      entry({}),
      entry({ currency: "XOF", gross_minor: 5000, fee_minor: 0, commission_minor: 1500 }),
      entry({}),
    ]);
    expect(totals.map((row) => row.currency)).toEqual(["XOF", "CAD"]);
    expect(totals[1]).toMatchObject({ sales: 2, gross: 2000, commission: 570, authors: 1330 });
  });

  it("retire une vente remboursée", () => {
    const refund = entry({
      entry_type: "refund",
      gross_minor: -1000,
      fee_minor: 0,
      commission_minor: -335,
      author_minor: -665,
    });
    const [cad] = summarizeEntries([entry({}), refund]);
    expect(cad).toMatchObject({ sales: 0, gross: 0, authors: 0, commission: -50 });
  });

  it("renvoie une liste vide sans écriture", () => {
    expect(summarizeEntries([])).toEqual([]);
  });
});
