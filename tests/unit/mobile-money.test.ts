/**
 * Fichier    : mobile-money.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires du Mobile Money (Sprint 6, v0.11.0) : numéros de téléphone et
 *              de transaction, demande d'achat (FCFA seulement), étape d'une commande vue par
 *              l'acheteur, courriels d'alerte et de décision (texte échappé).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-19
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isMobileMoneyCountry,
  isMobileMoneyOperator,
  mobileMoneyStage,
  type MobileMoneyOrderFields,
  normalizePhone,
  normalizeTransactionId,
  parseMobileMoneyBody,
} from "@/lib/payments/mobile-money";
import { buildDecisionEmail, buildDeclarationAlert } from "@/lib/payments/mobile-money-email";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-10-19T12:00:00Z");

/** Commande Mobile Money en attente, non déclarée, échéance dans 2 h. */
function order(overrides: Partial<MobileMoneyOrderFields> = {}): MobileMoneyOrderFields {
  return {
    status: "pending",
    provider: "mobile_money",
    mm_expires_at: "2026-10-19T14:00:00Z",
    mm_declared_at: null,
    ...overrides,
  };
}

// ==================== SAISIES ====================

describe("normalizePhone", () => {
  it("garde l'indicatif et réduit les espaces", () => {
    expect(normalizePhone(" +225  07 00 00 00 00 ")).toBe("+225 07 00 00 00 00");
    expect(normalizePhone("0700000000")).toBe("0700000000");
  });

  it("refuse un numéro trop court, des lettres ou une valeur non textuelle", () => {
    expect(normalizePhone("1234567")).toBeNull();
    expect(normalizePhone("07 AB 00 00")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

describe("normalizeTransactionId", () => {
  it("accepte lettres, chiffres, point et tiret", () => {
    expect(normalizeTransactionId(" MP231019.1234-AB ")).toBe("MP231019.1234-AB");
  });

  it("refuse un numéro trop court, trop long ou avec espaces", () => {
    expect(normalizeTransactionId("AB1")).toBeNull();
    expect(normalizeTransactionId("A".repeat(41))).toBeNull();
    expect(normalizeTransactionId("AB 1234")).toBeNull();
  });
});

describe("opérateurs et pays", () => {
  it("reconnaît les codes connus seulement", () => {
    expect(isMobileMoneyOperator("wave")).toBe(true);
    expect(isMobileMoneyOperator("paypal")).toBe(false);
    expect(isMobileMoneyCountry("CI")).toBe(true);
    expect(isMobileMoneyCountry("FR")).toBe(false);
  });
});

// ==================== DEMANDE D'ACHAT ====================

describe("parseMobileMoneyBody", () => {
  it("accepte un achat en FCFA avec un numéro marchand", () => {
    const body = parseMobileMoneyBody({
      item: "study_offer",
      code: "lot_10",
      currency: "XOF",
      accountId: UUID_A,
      promoCode: "rentree",
    });
    expect(body).toMatchObject({ item: "study_offer", currency: "XOF", accountId: UUID_A });
    expect(body?.promoCode).toBe("RENTREE");
  });

  it("refuse une autre devise ou un numéro marchand invalide", () => {
    const base = { item: "book", bookId: UUID_A };
    expect(parseMobileMoneyBody({ ...base, currency: "EUR", accountId: UUID_A })).toBeNull();
    expect(parseMobileMoneyBody({ ...base, currency: "XOF", accountId: "abc" })).toBeNull();
    expect(parseMobileMoneyBody({ ...base, currency: "XOF" })).toBeNull();
    expect(parseMobileMoneyBody(null)).toBeNull();
  });
});

// ==================== ÉTAPE D'UNE COMMANDE ====================

describe("mobileMoneyStage", () => {
  it("ignore une commande par carte", () => {
    expect(mobileMoneyStage(order({ provider: "stripe" }), NOW)).toBeNull();
  });

  it("suit la commande de la déclaration à la décision", () => {
    expect(mobileMoneyStage(order(), NOW)).toBe("to_pay");
    const declared = order({ mm_declared_at: "2026-10-19T11:00:00Z" });
    expect(mobileMoneyStage(declared, NOW)).toBe("to_review");
    expect(mobileMoneyStage({ ...declared, status: "paid" }, NOW)).toBe("paid");
    expect(mobileMoneyStage({ ...declared, status: "refunded" }, NOW)).toBe("paid");
    expect(mobileMoneyStage({ ...declared, status: "failed" }, NOW)).toBe("rejected");
  });

  it("traite comme échue une commande non déclarée après le délai", () => {
    expect(mobileMoneyStage(order({ mm_expires_at: "2026-10-19T11:59:00Z" }), NOW)).toBe(
      "expired",
    );
    expect(mobileMoneyStage(order({ status: "expired" }), NOW)).toBe("expired");
    // Déclarée à temps : reste à vérifier même après l'échéance
    const late = order({
      mm_expires_at: "2026-10-19T11:59:00Z",
      mm_declared_at: "2026-10-19T11:00:00Z",
    });
    expect(mobileMoneyStage(late, NOW)).toBe("to_review");
  });
});

// ==================== COURRIELS ====================

describe("courriels Mobile Money", () => {
  it("alerte l'administrateur avec de quoi rapprocher le relevé", () => {
    const mail = buildDeclarationAlert({
      to: "admin@kalami.test",
      buyerEmail: "lecteur@kalami.test",
      operatorName: "Wave",
      totalMinor: 5000,
      labels: "Lot de 10 <études>",
      reference: "KAL-ABCDEF12",
      transactionId: "TX12345",
      payerNumber: "+225 07 00 00 00 00",
    });
    expect(mail.to).toBe("admin@kalami.test");
    expect(mail.subject).toContain("KAL-ABCDEF12");
    expect(mail.text).toContain("TX12345");
    expect(mail.html).toContain("&lt;études&gt;");
    expect(mail.html).not.toContain("<études>");
    expect(mail.html).toContain("/admin/commandes?statut=to_review");
  });

  it("confirme la validation ou explique le refus avec le motif", () => {
    const input = {
      to: "lecteur@kalami.test",
      totalMinor: 5000,
      labels: "Livre",
      reference: "KAL-1",
    };
    const validated = buildDecisionEmail(input);
    expect(validated.subject).toContain("KAL-1");
    expect(validated.text).not.toContain("Motif");

    const rejected = buildDecisionEmail({ ...input, rejectionReason: "Montant <incomplet>" });
    expect(rejected.text).toContain("Montant <incomplet>");
    expect(rejected.html).toContain("Montant &lt;incomplet&gt;");
    expect(rejected.subject).not.toBe(validated.subject);
  });
});
