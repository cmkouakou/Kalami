/**
 * Fichier    : payments-strategy.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires des paiements Kalami Stratégie (v0.10.2) : lecture du corps
 *              de la demande d'achat, correspondances vers le catalogue Stripe, chemin
 *              d'abandon, prix avec remise enseignant, liens de « Mes achats », filtre de
 *              statut de l'admin et remboursement Stripe (clé d'idempotence).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-19
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { cancelPathFor, coachPackSaleItem, parseCheckoutBody, studyOfferSaleItem } =
  await import("@/lib/payments/checkout-request");
const { pricesOf } = await import("@/lib/payments/offers");
const { orderItemLink } = await import("@/lib/payments/queries");
const { parseOrderStatus } = await import("@/lib/admin/order-queries");
const { createRefund } = await import("@/lib/payments/stripe");

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

// ==================== CORPS DE LA DEMANDE ====================

describe("parseCheckoutBody", () => {
  it("lit un livre, avec ou sans champ item (compatibilité v0.10.0)", () => {
    expect(parseCheckoutBody({ bookId: UUID_A, currency: "EUR" })).toEqual({
      item: "book",
      bookId: UUID_A,
      currency: "EUR",
    });
    expect(parseCheckoutBody({ item: "book", bookId: UUID_A, currency: "XOF" })?.item).toBe(
      "book",
    );
  });

  it("lit une offre d'étude connue et refuse un code inconnu", () => {
    expect(parseCheckoutBody({ item: "study_offer", code: "lot_30", currency: "CAD" })).toEqual({
      item: "study_offer",
      code: "lot_30",
      currency: "CAD",
    });
    expect(parseCheckoutBody({ item: "study_offer", code: "lot_99", currency: "CAD" })).toBeNull();
  });

  it("exige le forfait et l'étude pour un forfait du coach", () => {
    const body = { item: "coach_pack", packId: UUID_A, studyId: UUID_B, currency: "EUR" };
    expect(parseCheckoutBody(body)).toEqual(body);
    expect(parseCheckoutBody({ ...body, studyId: "pas-un-uuid" })).toBeNull();
  });

  it("refuse une devise inconnue, un type inconnu ou un corps vide", () => {
    expect(parseCheckoutBody({ bookId: UUID_A, currency: "USD" })).toBeNull();
    expect(parseCheckoutBody({ item: "cadeau", currency: "EUR" })).toBeNull();
    expect(parseCheckoutBody(null)).toBeNull();
    expect(parseCheckoutBody("texte")).toBeNull();
  });
});

// ==================== CORRESPONDANCES ====================

describe("correspondances Stripe", () => {
  it("associe chaque offre d'étude à son article", () => {
    expect(studyOfferSaleItem("study")).toEqual({ kind: "study" });
    expect(studyOfferSaleItem("lot_10")).toEqual({ kind: "study_lot", size: 10 });
    expect(studyOfferSaleItem("lot_30")).toEqual({ kind: "study_lot", size: 30 });
  });

  it("reconnaît le niveau d'un forfait par le premier mot de son nom", () => {
    expect(coachPackSaleItem("Essentiel")).toEqual({ kind: "coach_pack", level: "essentiel" });
    expect(coachPackSaleItem("  Approfondi (10 relectures)")).toEqual({
      kind: "coach_pack",
      level: "approfondi",
    });
    expect(coachPackSaleItem("Spécial")).toBeNull();
  });

  it("renvoie l'acheteur qui abandonne sur la bonne page", () => {
    expect(cancelPathFor({ item: "book", bookId: UUID_A }, "mon-livre")).toBe(
      "/livres/mon-livre?paiement=annule",
    );
    expect(cancelPathFor({ item: "study_offer", code: "study" }, null)).toBe(
      "/strategie?paiement=annule",
    );
    expect(cancelPathFor({ item: "coach_pack", packId: UUID_A, studyId: UUID_B }, null)).toBe(
      `/strategie/etudes/${UUID_B}/coach?paiement=annule`,
    );
  });
});

// ==================== PRIX ====================

describe("pricesOf", () => {
  it("convertit en unité mineure sans remise", () => {
    expect(pricesOf({ priceXof: 9900, priceEur: 19.99, priceCad: 29.99 })).toEqual([
      { currency: "XOF", amount_minor: 9900 },
      { currency: "EUR", amount_minor: 1999 },
      { currency: "CAD", amount_minor: 2999 },
    ]);
  });

  it("applique la remise enseignant comme la base (arrondi)", () => {
    expect(pricesOf({ priceXof: 3500, priceEur: 6.99, priceCad: 9.99 }, 20)).toEqual([
      { currency: "XOF", amount_minor: 2800 },
      { currency: "EUR", amount_minor: 559 },
      { currency: "CAD", amount_minor: 799 },
    ]);
  });

  it("ne propose pas une devise sans prix", () => {
    expect(pricesOf({ priceXof: null, priceEur: 6.99, priceCad: null })).toEqual([
      { currency: "EUR", amount_minor: 699 },
    ]);
  });
});

// ==================== MES ACHATS ====================

describe("orderItemLink", () => {
  const base = { label: "x", study_id: null, credits: null, practice_case: null, book: null };

  it("ouvre le livre acheté", () => {
    const book = { slug: "guide", grants_study_credit: true };
    expect(orderItemLink({ ...base, kind: "book", book })).toEqual({
      href: "/livres/guide/lire",
      kind: "read",
    });
    expect(orderItemLink({ ...base, kind: "book" })).toBeNull();
  });

  it("ouvre Kalami Stratégie pour des crédits et le coach pour un forfait", () => {
    expect(orderItemLink({ ...base, kind: "study_lot", credits: 10 })?.href).toBe("/strategie");
    expect(orderItemLink({ ...base, kind: "coach_pack", study_id: UUID_B })).toEqual({
      href: `/strategie/etudes/${UUID_B}/coach`,
      kind: "coach",
    });
    expect(orderItemLink({ ...base, kind: "coach_pack" })).toBeNull();
  });
});

// ==================== ADMINISTRATION ====================

describe("parseOrderStatus", () => {
  it("accepte un statut connu et ignore le reste", () => {
    expect(parseOrderStatus("refunded")).toBe("refunded");
    expect(parseOrderStatus("tout")).toBeNull();
    expect(parseOrderStatus(undefined)).toBeNull();
    expect(parseOrderStatus(["paid"])).toBeNull();
  });
});

describe("createRefund", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rembourse le paiement avec une clé d'idempotence liée à la commande", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "re_123", status: "succeeded" }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await createRefund("pi_123", UUID_A)).toEqual({ id: "re_123", status: "succeeded" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/refunds$/);
    expect(init.headers["Idempotency-Key"]).toBe(`kalami-refund-${UUID_A}`);
    const params = new URLSearchParams(init.body);
    expect(params.get("payment_intent")).toBe("pi_123");
    expect(params.get("metadata[app]")).toBe("kalami");
    expect(params.get("metadata[order_id]")).toBe(UUID_A);
  });

  it("lève une erreur si Stripe refuse", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ error: { message: "already refunded" } }, { status: 400 }),
      ),
    );
    await expect(createRefund("pi_123", UUID_A)).rejects.toThrow(/already refunded/);
  });
});
