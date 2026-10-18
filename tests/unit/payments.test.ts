/**
 * Fichier    : payments.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires du paiement par carte (v0.10.0) : signature des webhooks
 *              Stripe, encodage des paramètres, correspondance articles → prix Stripe,
 *              contenu de la session Checkout, tri des événements par le webhook (autre
 *              application du compte, signature invalide, appel unique à la base).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-18
 */

import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));

const { createCheckoutSession, encodeStripeParams, verifyStripeSignature } = await import(
  "@/lib/payments/stripe"
);
const { priceEnvName, stripeProductFor } = await import("@/lib/payments/catalog");
const { POST: webhook } = await import("@/app/api/stripe/webhook/route");

const SECRET = "whsec_test_secret";
const NOW = 1_800_000_000;

/** En-tête Stripe-Signature valide pour un corps donné. */
function sign(body: string, timestamp = NOW, secret = SECRET): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

// ==================== SIGNATURE ====================

describe("verifyStripeSignature", () => {
  const body = '{"id":"evt_1"}';

  it("accepte une signature valide et récente", () => {
    expect(verifyStripeSignature(body, sign(body), SECRET, NOW + 10)).toBe(true);
  });

  it("refuse un autre secret, un corps modifié ou un en-tête absent", () => {
    expect(verifyStripeSignature(body, sign(body, NOW, "whsec_autre"), SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(`${body} `, sign(body), SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(body, null, SECRET, NOW)).toBe(false);
    expect(verifyStripeSignature(body, sign(body), "", NOW)).toBe(false);
  });

  it("refuse un horodatage de plus de 5 minutes (rejeu)", () => {
    expect(verifyStripeSignature(body, sign(body), SECRET, NOW + 301)).toBe(false);
  });

  it("accepte si l'une des signatures v1 correspond (rotation du secret)", () => {
    const header = `t=${NOW},v1=${"0".repeat(64)},${sign(body).split(",")[1]}`;
    expect(verifyStripeSignature(body, header, SECRET, NOW)).toBe(true);
  });
});

// ==================== ENCODAGE ET CATALOGUE ====================

describe("encodeStripeParams", () => {
  it("aplatit objets et tableaux et ignore les valeurs nulles", () => {
    const pairs = encodeStripeParams({
      mode: "payment",
      customer_email: null,
      metadata: { app: "kalami" },
      line_items: [{ quantity: 1, price_data: { unit_amount: 1299 } }],
      payment_method_types: ["card"],
    });
    expect(pairs).toEqual([
      ["mode", "payment"],
      ["metadata[app]", "kalami"],
      ["line_items[0][quantity]", "1"],
      ["line_items[0][price_data][unit_amount]", "1299"],
      ["payment_method_types[0]", "card"],
    ]);
  });
});

describe("catalogue des prix Stripe", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("associe chaque article à sa variable", () => {
    expect(priceEnvName({ kind: "book", slug: "la-strategie-d-entreprise" })).toBe(
      "STRIPE_PRICE_LIVRE_STRATEGIE",
    );
    expect(priceEnvName({ kind: "book", slug: "autre-livre" })).toBeNull();
    expect(priceEnvName({ kind: "study" })).toBe("STRIPE_PRICE_ETUDE");
    expect(priceEnvName({ kind: "study_lot", size: 30 })).toBe("STRIPE_PRICE_LOT_30");
    expect(priceEnvName({ kind: "coach_pack", level: "intensif" })).toBe(
      "STRIPE_PRICE_COACH_INTENSIF",
    );
  });

  it("retrouve le produit d'un prix (espaces tolérés) une seule fois", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_PRICE_LOT_10", " price_lot10 ");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "price_lot10", product: "prod_lot10" }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await stripeProductFor({ kind: "study_lot", size: 10 })).toBe("prod_lot10");
    expect(await stripeProductFor({ kind: "study_lot", size: 10 })).toBe("prod_lot10");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/prices/price_lot10");
  });

  it("renvoie null si la variable est absente ou invalide", async () => {
    vi.stubEnv("STRIPE_PRICE_ETUDE", "pas-un-prix");
    expect(await stripeProductFor({ kind: "study" })).toBeNull();
  });
});

// ==================== SESSION CHECKOUT ====================

describe("createCheckoutSession", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envoie le montant de la base, la devise et la marque Kalami", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "cs_1", url: "https://checkout.stripe.com/x" }));
    vi.stubGlobal("fetch", fetchMock);

    const session = await createCheckoutSession({
      orderId: "11111111-1111-4111-8111-111111111111",
      currency: "XOF",
      line: { unitMinor: 5000, label: "Livre", productId: "prod_livre" },
      customerEmail: "a@exemple.com",
      successUrl: "https://kalami.test/merci",
      cancelUrl: "https://kalami.test/livre",
    });

    expect(session.id).toBe("cs_1");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Stripe-Version"]).toBe("2026-02-25.clover");
    const body = new URLSearchParams(init.body as string);
    expect(body.get("metadata[app]")).toBe("kalami");
    expect(body.get("payment_intent_data[metadata][app]")).toBe("kalami");
    expect(body.get("line_items[0][price_data][currency]")).toBe("xof");
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("5000");
    expect(body.get("line_items[0][price_data][product]")).toBe("prod_livre");
    expect(body.has("line_items[0][price_data][product_data][name]")).toBe(false);
  });

  it("lève une erreur lisible si Stripe refuse, sans montrer la clé", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_secret_a_cacher");
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ error: { message: "Invalid currency" } }, { status: 400 }),
      ),
    );
    await expect(
      createCheckoutSession({
        orderId: "o",
        currency: "CAD",
        line: { unitMinor: 1299, label: "Livre", productId: null },
        customerEmail: null,
        successUrl: "https://kalami.test/a",
        cancelUrl: "https://kalami.test/b",
      }),
    ).rejects.toThrow("Invalid currency");
    expect(JSON.stringify(logged.mock.calls)).not.toContain("sk_test_secret_a_cacher");
    logged.mockRestore();
  });
});

// ==================== WEBHOOK ====================

describe("POST /api/stripe/webhook", () => {
  const orderId = "22222222-2222-4222-8222-222222222222";

  /** Requête signée contenant un événement Checkout. */
  function eventRequest(metadata: Record<string, string>, type = "checkout.session.expired") {
    const body = JSON.stringify({
      id: "evt_123",
      type,
      data: {
        object: {
          id: "cs_123",
          amount_total: 1299,
          currency: "cad",
          payment_status: "unpaid",
          payment_intent: null,
          client_reference_id: orderId,
          metadata,
        },
      },
    });
    const now = Math.floor(Date.now() / 1000);
    return new Request("https://kalami.test/api/stripe/webhook", {
      method: "POST",
      body,
      headers: { "stripe-signature": sign(body, now) },
    });
  }

  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
    rpc.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("refuse une signature invalide (400)", async () => {
    const request = new Request("https://kalami.test/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=${"a".repeat(64)}` },
    });
    expect((await webhook(request)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("acquitte sans traiter les sessions d'une autre application du compte", async () => {
    const response = await webhook(eventRequest({ app: "brvm-analyser" }));
    expect(response.status).toBe(200);
    expect((await response.json()).result).toBe("other_app");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("confie une session Kalami à stripe_process_event", async () => {
    rpc.mockResolvedValue({ data: "processed", error: null });
    const response = await webhook(eventRequest({ app: "kalami", order_id: orderId }));
    expect((await response.json()).result).toBe("processed");
    expect(rpc).toHaveBeenCalledWith(
      "stripe_process_event",
      expect.objectContaining({
        p_event_id: "evt_123",
        p_order_id: orderId,
        p_session_id: "cs_123",
        p_amount_minor: 1299,
        p_currency: "cad",
      }),
    );
  });

  it("n'accorde rien pour une session terminée mais non payée", async () => {
    const metadata = { app: "kalami", order_id: orderId };
    const request = eventRequest(metadata, "checkout.session.completed");
    expect((await (await webhook(request)).json()).result).toBe("not_paid");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("répond 500 si la base échoue (Stripe réessaiera)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "panne" } });
    const response = await webhook(eventRequest({ app: "kalami", order_id: orderId }));
    expect(response.status).toBe(500);
  });
});
