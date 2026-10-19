/**
 * Fichier    : promo-codes-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des codes promo (Sprint 5c, v0.10.3) : codes réservés à
 *              l'admin, aperçu pour l'acheteur, réduction appliquée par la base à la
 *              commande, utilisation comptée au paiement (une fois par compte), code expiré
 *              ou hors portée refusé, fonctions d'administration refusées aux utilisateurs.
 *              Ignorés si les clés manquent ou si la migration n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-19
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();

type OrderRow = { order_id: string; total_minor: number; label: string };

/** Vrai si la migration des codes promo existe sur la base (table promo_codes). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("promo_codes").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — codes promo", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  const userIds: string[] = [];
  const eventIds: string[] = [];
  const promoIds: string[] = [];
  const STRATEGY_CODE = `S${RUN}`;
  const BOOKS_CODE = `B${RUN}`;
  const EXPIRED_CODE = `E${RUN}`;

  /** Crée un utilisateur confirmé et retourne un client connecté. */
  async function signedInUser(label: string): Promise<SupabaseClient> {
    const email = `${label}-${RUN.toLowerCase()}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    const client = createClient(url!, publishableKey!, NO_SESSION);
    await client.auth.signInWithPassword({ email, password });
    return client;
  }

  /** Crée un code promo directement (clé de service). */
  async function insertPromo(values: Record<string, unknown>): Promise<void> {
    const { data, error } = await service.from("promo_codes").insert(values).select("id").single();
    if (error) throw error;
    promoIds.push(data.id);
  }

  /** Commande d'un lot de 10 en CAD, avec ou sans code. */
  function orderLot(code: string | null) {
    return buyer
      .rpc("create_strategy_order", {
        p_kind: "study_offer",
        p_currency: "CAD",
        p_code: "lot_10",
        p_pack_id: null,
        p_study_id: null,
        p_promo_code: code,
      })
      .single<OrderRow>();
  }

  /** Paie une commande comme le webhook (session rattachée puis événement confirmé). */
  async function payOrder(order: OrderRow): Promise<void> {
    const sessionId = `cs_test_${RUN}_${order.order_id.slice(0, 8)}`;
    const attached = await service.rpc("order_attach_session", {
      p_order_id: order.order_id,
      p_session_id: sessionId,
    });
    if (attached.error) throw attached.error;
    const eventId = `evt_${RUN}${order.order_id.slice(0, 8)}`;
    eventIds.push(eventId);
    const { error } = await service.rpc("stripe_process_event", {
      p_event_id: eventId,
      p_event_type: "checkout.session.completed",
      p_order_id: order.order_id,
      p_session_id: sessionId,
      p_amount_minor: order.total_minor,
      p_currency: "CAD",
      p_payment_id: `pi_test_${RUN}`,
      p_receipt_url: null,
    });
    if (error) throw error;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur-promo");
    await insertPromo({ code: STRATEGY_CODE, scope: "strategy", percent_off: 20, max_uses: 5 });
    await insertPromo({ code: BOOKS_CODE, scope: "books", percent_off: 10 });
    await insertPromo({
      code: EXPIRED_CODE,
      scope: "all",
      percent_off: 10,
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
  });

  afterAll(async () => {
    if (eventIds.length) await service.from("stripe_events").delete().in("id", eventIds);
    // Écritures du grand livre (gardées sinon après la suppression des commandes)
    const orders = await service.from("orders").select("id").in("user_id", userIds);
    const orderIds = (orders.data ?? []).map((row) => row.id);
    if (orderIds.length) await service.from("ledger_entries").delete().in("order_id", orderIds);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    if (promoIds.length) await service.from("promo_codes").delete().in("id", promoIds);
  });

  it("réserve les codes et leurs utilisations à l'administrateur", async () => {
    const codes = await buyer.from("promo_codes").select("id");
    expect(codes.data).toEqual([]);
    const uses = await buyer.from("promo_redemptions").select("id");
    expect(uses.data).toEqual([]);
  });

  it("montre la réduction d'un code valable, refuse un code hors portée ou expiré", async () => {
    const preview = await buyer
      .rpc("promo_preview", { p_code: STRATEGY_CODE, p_target: "strategy", p_book_id: null })
      .single<{ code: string; percent_off: number }>();
    expect(preview.error).toBeNull();
    expect(preview.data).toMatchObject({ code: STRATEGY_CODE, percent_off: 20 });

    const wrongScope = await buyer.rpc("promo_preview", {
      p_code: BOOKS_CODE,
      p_target: "strategy",
      p_book_id: null,
    });
    expect(wrongScope.error?.message).toBe("promo_not_applicable");

    const expired = await orderLot(EXPIRED_CODE);
    expect(expired.error?.message).toBe("promo_expired");

    const unknown = await orderLot(`X${RUN}`);
    expect(unknown.error?.message).toBe("promo_invalid");
  });

  it("applique la réduction à la commande et compte l'utilisation au paiement", async () => {
    const plain = await orderLot(null);
    expect(plain.error).toBeNull();
    const reduced = await orderLot(STRATEGY_CODE);
    expect(reduced.error).toBeNull();
    expect(reduced.data!.total_minor).toBe(Math.round((plain.data!.total_minor * 80) / 100));
    expect(reduced.data!.label).toContain(STRATEGY_CODE);

    const before = await service
      .from("promo_codes")
      .select("uses_count")
      .eq("code", STRATEGY_CODE)
      .single();
    expect(before.data!.uses_count).toBe(0);

    await payOrder(reduced.data!);
    const after = await service
      .from("promo_codes")
      .select("uses_count")
      .eq("code", STRATEGY_CODE)
      .single();
    expect(after.data!.uses_count).toBe(1);

    const again = await orderLot(STRATEGY_CODE);
    expect(again.error?.message).toBe("promo_used");
  });

  it("refuse les fonctions d'administration aux utilisateurs", async () => {
    const created = await buyer.rpc("admin_create_promo_code", {
      p_code: `A${RUN}`,
      p_scope: "all",
      p_book_id: null,
      p_percent_off: 50,
      p_amount_off_xof: null,
      p_amount_off_eur: null,
      p_amount_off_cad: null,
      p_expires_at: null,
      p_max_uses: null,
      p_note: null,
    });
    expect(created.error).not.toBeNull();
    const tax = await buyer.rpc("admin_set_stripe_tax", { p_enabled: true });
    expect(tax.error).not.toBeNull();
    const toggled = await buyer.rpc("admin_set_promo_active", {
      p_id: promoIds[0],
      p_active: false,
    });
    expect(toggled.error).not.toBeNull();
  });
});
