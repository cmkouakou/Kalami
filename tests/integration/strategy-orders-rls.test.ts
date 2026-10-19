/**
 * Fichier    : strategy-orders-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des paiements Kalami Stratégie (Sprint 5b, v0.10.2) :
 *              offres lisibles par tous mais table réservée à l'admin, lot de 10 au prix de
 *              la base livré en 10 crédits achetés, forfait du coach réservé au propriétaire
 *              (ou à l'enseignant), fonctions d'administration refusées aux utilisateurs.
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
const RUN = crypto.randomUUID().replaceAll("-", "").slice(0, 10);

type OrderRow = { order_id: string; total_minor: number; label: string };

/** Vrai si la migration des paiements Stratégie existe sur la base (table strategy_offers). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("strategy_offers").select("code").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — paiements Kalami Stratégie", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  let owner: SupabaseClient;
  let contributor: SupabaseClient;
  const userIds: string[] = [];
  const eventIds: string[] = [];
  let packId = "";
  let studyId = "";

  /** Crée un utilisateur confirmé et retourne un client connecté. */
  async function signedInUser(label: string): Promise<SupabaseClient> {
    const email = `${label}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    const client = createClient(url!, publishableKey!, NO_SESSION);
    await client.auth.signInWithPassword({ email, password });
    return client;
  }

  /** Paie une commande comme le webhook (session rattachée puis événement confirmé). */
  async function payOrder(order: OrderRow, currency: string): Promise<string> {
    const sessionId = `cs_test_${RUN}_${order.order_id.slice(0, 8)}`;
    const attached = await service.rpc("order_attach_session", {
      p_order_id: order.order_id,
      p_session_id: sessionId,
    });
    if (attached.error) throw attached.error;
    const eventId = `evt_${RUN}_${order.order_id.slice(0, 8)}`;
    eventIds.push(eventId);
    const { data, error } = await service.rpc("stripe_process_event", {
      p_event_id: eventId,
      p_event_type: "checkout.session.completed",
      p_order_id: order.order_id,
      p_session_id: sessionId,
      p_amount_minor: order.total_minor,
      p_currency: currency,
      p_payment_id: `pi_test_${RUN}`,
      p_receipt_url: null,
    });
    if (error) throw error;
    return data as string;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur-lot");
    owner = await signedInUser("proprietaire");
    contributor = await signedInUser("contributeur");

    const pack = await service
      .from("coach_packs")
      .insert({
        name: `Essentiel test ${RUN}`,
        cost_usd: 1,
        price_cad: 9.99,
        teacher_discount_pct: 20,
        position: 999,
      })
      .select("id")
      .single();
    if (pack.error) throw pack.error;
    packId = pack.data.id;

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[1], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Achat ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;
    const member = await service
      .from("study_members")
      .insert({ study_id: studyId, user_id: userIds[2], role: "contributor" });
    if (member.error) throw member.error;
  });

  afterAll(async () => {
    if (eventIds.length) await service.from("stripe_events").delete().in("id", eventIds);
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    if (packId) await service.from("coach_packs").delete().eq("id", packId);
  });

  it("montre les offres à tous mais réserve la table à l'administrateur", async () => {
    const anon = createClient(url!, publishableKey!, NO_SESSION);
    const { data, error } = await anon.rpc("strategy_offer_list");
    expect(error).toBeNull();
    const codes = (data as { code: string }[]).map((row) => row.code);
    expect(codes).toEqual(expect.arrayContaining(["study", "lot_10", "lot_30"]));

    const direct = await buyer.from("strategy_offers").select("code");
    expect(direct.data).toEqual([]);
  });

  it("vend un lot de 10 au prix de la base et livre 10 crédits achetés", async () => {
    const offer = await service
      .from("strategy_offers")
      .select("price_cad, credits")
      .eq("code", "lot_10")
      .single();
    const { data, error } = await buyer
      .rpc("create_strategy_order", {
        p_kind: "study_offer",
        p_currency: "CAD",
        p_code: "lot_10",
        p_pack_id: null,
        p_study_id: null,
      })
      .single<OrderRow>();
    expect(error).toBeNull();
    expect(data!.total_minor).toBe(Math.round(Number(offer.data!.price_cad) * 100));

    expect(await payOrder(data!, "cad")).toBe("processed");
    const credits = await service
      .from("study_credits")
      .select("source, order_id")
      .eq("user_id", userIds[0]);
    expect(credits.data).toHaveLength(offer.data!.credits);
    expect(credits.data?.every((row) => row.source === "purchase")).toBe(true);
    expect(credits.data?.every((row) => row.order_id === data!.order_id)).toBe(true);

    const items = await buyer.from("order_items").select("kind, credits");
    expect(items.data).toEqual([{ kind: "study_lot", credits: 10 }]);
  });

  it("réserve le forfait du coach au propriétaire, sans remise enseignant", async () => {
    const args = {
      p_kind: "coach_pack",
      p_currency: "CAD",
      p_code: null,
      p_pack_id: packId,
      p_study_id: studyId,
    };
    const refused = await contributor.rpc("create_strategy_order", args);
    expect(refused.error?.message).toBe("not_allowed");
    const outsider = await buyer.rpc("create_strategy_order", args);
    expect(outsider.error?.message).toBe("not_allowed");

    const { data, error } = await owner.rpc("create_strategy_order", args).single<OrderRow>();
    expect(error).toBeNull();
    expect(data!.total_minor).toBe(999);
    expect(data!.label).not.toContain("remise");

    const noStudy = await owner.rpc("create_strategy_order", { ...args, p_study_id: null });
    expect(noStudy.error?.message).toBe("not_for_sale");
  });

  it("refuse une offre inconnue ou une devise inconnue", async () => {
    const unknown = await buyer.rpc("create_strategy_order", {
      p_kind: "study_offer",
      p_currency: "CAD",
      p_code: "lot_99",
      p_pack_id: null,
      p_study_id: null,
    });
    expect(unknown.error?.message).toBe("not_for_sale");
    const currency = await buyer.rpc("create_strategy_order", {
      p_kind: "study_offer",
      p_currency: "USD",
      p_code: "study",
      p_pack_id: null,
      p_study_id: null,
    });
    expect(currency.error?.message).toBe("invalid_currency");
  });

  it("refuse les fonctions d'administration aux utilisateurs", async () => {
    const orders = await buyer.rpc("admin_orders", { p_status: null });
    expect(orders.error).not.toBeNull();
    const refund = await buyer.rpc("admin_refund_order", {
      p_order_id: crypto.randomUUID(),
      p_refund_id: "re_test",
    });
    expect(refund.error).not.toBeNull();
    const offer = await buyer.rpc("admin_save_strategy_offer", {
      p_code: "study",
      p_name: "Gratuit",
      p_price_xof: 1,
      p_price_eur: 0.01,
      p_price_cad: 0.01,
      p_active: true,
    });
    expect(offer.error).not.toBeNull();
  });
});
