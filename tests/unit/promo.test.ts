/**
 * Fichier    : promo.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires des codes promo (v0.10.3) : forme du code, conversion de
 *              l'aperçu de la base, prix réduit (même calcul que promo_discount, minimum
 *              après réduction), code promo dans la demande d'achat et formulaire admin.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-19
 */

import { describe, expect, it } from "vitest";

import { parsePromoCodeForm } from "@/lib/admin/promo-validation";
import { parseCheckoutBody } from "@/lib/payments/checkout-request";
import {
  applyPromo,
  discountedAmount,
  normalizePromoCode,
  promoFromRow,
  type PromoPreview,
} from "@/lib/payments/promo";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const PERCENT_20: PromoPreview = { code: "RENTREE", percentOff: 20, amountOff: {} };
const AMOUNTS: PromoPreview = {
  code: "MOINS2",
  percentOff: null,
  amountOff: { XOF: 1000, CAD: 200 },
};

// ==================== FORME DU CODE ====================

describe("normalizePromoCode", () => {
  it("met en majuscules et retire les espaces", () => {
    expect(normalizePromoCode(" rentree-25 ")).toBe("RENTREE-25");
    expect(normalizePromoCode("lot_10")).toBe("LOT_10");
  });

  it("refuse un code trop court, trop long, mal formé ou non textuel", () => {
    expect(normalizePromoCode("AB")).toBeNull();
    expect(normalizePromoCode("A".repeat(31))).toBeNull();
    expect(normalizePromoCode("-ABC")).toBeNull();
    expect(normalizePromoCode("ÉTÉ2026")).toBeNull();
    expect(normalizePromoCode("A B C")).toBeNull();
    expect(normalizePromoCode(42)).toBeNull();
  });
});

// ==================== APERÇU ET PRIX RÉDUIT ====================

describe("promoFromRow", () => {
  it("convertit les montants décimaux en centimes", () => {
    expect(
      promoFromRow({
        code: "MOINS2",
        percent_off: null,
        amount_off_xof: 1000,
        amount_off_eur: "1.50",
        amount_off_cad: null,
      }),
    ).toEqual({ code: "MOINS2", percentOff: null, amountOff: { XOF: 1000, EUR: 150 } });
  });
});

describe("discountedAmount", () => {
  it("applique un pourcentage arrondi comme la base", () => {
    expect(discountedAmount({ currency: "CAD", amount_minor: 1299 }, PERCENT_20)).toBe(1039);
    expect(discountedAmount({ currency: "XOF", amount_minor: 7500 }, PERCENT_20)).toBe(6000);
  });

  it("retire un montant dans la devise, ou rien si la devise n'a pas de montant", () => {
    expect(discountedAmount({ currency: "XOF", amount_minor: 5000 }, AMOUNTS)).toBe(4000);
    expect(discountedAmount({ currency: "EUR", amount_minor: 999 }, AMOUNTS)).toBeNull();
  });

  it("refuse un total sous le minimum accepté", () => {
    expect(discountedAmount({ currency: "CAD", amount_minor: 249 }, AMOUNTS)).toBeNull();
    expect(discountedAmount({ currency: "CAD", amount_minor: 250 }, AMOUNTS)).toBe(50);
  });
});

describe("applyPromo", () => {
  it("calcule chaque devise, sans réduction quand aucun code", () => {
    const prices = [
      { currency: "XOF" as const, amount_minor: 5000 },
      { currency: "EUR" as const, amount_minor: 999 },
    ];
    expect(applyPromo(prices, AMOUNTS).map((p) => p.reduced)).toEqual([4000, null]);
    expect(applyPromo(prices, null).map((p) => p.reduced)).toEqual([null, null]);
  });
});

// ==================== DEMANDE D'ACHAT ====================

describe("parseCheckoutBody avec code promo", () => {
  it("normalise le code et l'ajoute à la demande", () => {
    expect(
      parseCheckoutBody({ item: "book", bookId: UUID_A, currency: "CAD", promoCode: "rentree" }),
    ).toEqual({ item: "book", bookId: UUID_A, currency: "CAD", promoCode: "RENTREE" });
  });

  it("ignore un code vide ou nul, refuse un code mal formé", () => {
    const base = { item: "study_offer", code: "lot_10", currency: "EUR" };
    expect(parseCheckoutBody({ ...base, promoCode: "" })).not.toHaveProperty("promoCode");
    expect(parseCheckoutBody({ ...base, promoCode: null })).not.toHaveProperty("promoCode");
    expect(parseCheckoutBody({ ...base, promoCode: "x" })).toBeNull();
    expect(parseCheckoutBody({ ...base, promoCode: 12 })).toBeNull();
  });
});

// ==================== FORMULAIRE ADMIN ====================

/** Formulaire rempli à partir d'un objet. */
function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe("parsePromoCodeForm", () => {
  const NOW = new Date("2026-10-19T12:00:00Z");

  it("lit un code en pourcentage avec expiration et limite", () => {
    const result = parsePromoCodeForm(
      form({
        code: "rentree",
        scope: "books",
        bookId: UUID_A,
        percentOff: "20",
        expiresOn: "2026-12-31",
        maxUses: "100",
        note: " Rentrée ",
      }),
      NOW,
    );
    expect(result).toEqual({
      ok: true,
      value: {
        p_code: "RENTREE",
        p_scope: "books",
        p_book_id: null,
        p_percent_off: 20,
        p_amount_off_xof: null,
        p_amount_off_eur: null,
        p_amount_off_cad: null,
        p_expires_at: "2026-12-31T23:59:59.000Z",
        p_max_uses: 100,
        p_note: "Rentrée",
      },
    });
  });

  it("lit des montants (virgule acceptée) pour un livre", () => {
    const result = parsePromoCodeForm(
      form({ code: "MOINS2", scope: "book", bookId: UUID_A, amountXof: "1000", amountEur: "1,5" }),
      NOW,
    );
    expect(result.ok && result.value).toMatchObject({
      p_book_id: UUID_A,
      p_amount_off_xof: 1000,
      p_amount_off_eur: 1.5,
      p_amount_off_cad: null,
    });
  });

  it("signale chaque erreur par son code", () => {
    const error = (values: Record<string, string>) => {
      const result = parsePromoCodeForm(form({ code: "ABC", scope: "all", ...values }), NOW);
      return result.ok ? null : result.error;
    };
    expect(error({ code: "a" })).toBe("invalid_code");
    expect(error({ scope: "tout" })).toBe("invalid_scope");
    expect(error({ scope: "book", percentOff: "10" })).toBe("book_required");
    expect(error({})).toBe("discount_choice");
    expect(error({ percentOff: "10", amountXof: "500" })).toBe("discount_choice");
    expect(error({ percentOff: "95" })).toBe("invalid_percent");
    expect(error({ percentOff: "12.5" })).toBe("invalid_percent");
    expect(error({ amountXof: "99.5" })).toBe("invalid_amount");
    expect(error({ amountCad: "-1" })).toBe("invalid_amount");
    expect(error({ percentOff: "10", expiresOn: "31/12/2026" })).toBe("invalid_date");
    expect(error({ percentOff: "10", expiresOn: "2026-10-18" })).toBe("date_past");
    expect(error({ percentOff: "10", maxUses: "0" })).toBe("invalid_max_uses");
    expect(error({ percentOff: "10", note: "x".repeat(201) })).toBe("invalid_note");
  });
});
