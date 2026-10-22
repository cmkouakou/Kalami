/**
 * Fichier    : security-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration du durcissement de sécurité (Sprint 11s-1, v0.13.0) :
 *              fonctions réservées au rôle service, table des tentatives invisible, comptage
 *              et journalisation du limiteur de débit, remboursement signalé par Stripe
 *              (partiel, total, doublon, commande inconnue ou déjà remboursée).
 *              Ignorés si les clés manquent ou si la migration n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-22
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
const PAYMENT_ID = `pi_test${RUN}`;
const SUBJECT = `test:${RUN}`;

/** Vrai si la migration de sécurité existe sur la base (table rate_limit_hits). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("rate_limit_hits").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — durcissement de sécurité", () => {
  let service: SupabaseClient;
  let user: SupabaseClient;
  let userId = "";
  let orderId = "";
  const eventIds: string[] = [];

  /** Appelle stripe_process_refund avec un nouvel identifiant d'événement. */
  async function refund(
    paymentId: string,
    full: boolean,
    eventId = `evt_${crypto.randomUUID().replaceAll("-", "")}`,
  ) {
    eventIds.push(eventId);
    const { data, error } = await service.rpc("stripe_process_refund", {
      p_event_id: eventId,
      p_payment_id: paymentId,
      p_refund_id: `re_test${RUN}`,
      p_full: full,
    });
    if (error) throw error;
    return { result: data as string, eventId };
  }

  /** Statut actuel de la commande de test. */
  async function orderStatus(): Promise<string> {
    const { data } = await service.from("orders").select("status").eq("id", orderId).single();
    return data?.status as string;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    const email = `securite-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    user = createClient(url!, publishableKey!, NO_SESSION);
    await user.auth.signInWithPassword({ email, password });

    const order = await service
      .from("orders")
      .insert({ user_id: userId, provider: "stripe", currency: "CAD", total_minor: 1000 })
      .select("id")
      .single();
    if (order.error) throw order.error;
    orderId = order.data.id;
    const paid = await service
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payment_id: PAYMENT_ID,
        fee_minor: 0,
        tax_minor: 0,
      })
      .eq("id", orderId);
    if (paid.error) throw paid.error;
  });

  afterAll(async () => {
    await service.from("rate_limit_hits").delete().eq("subject", SUBJECT);
    await service.from("audit_logs").delete().in("target_id", [SUBJECT, orderId]);
    if (eventIds.length > 0) await service.from("stripe_events").delete().in("id", eventIds);
    if (orderId) {
      await service.from("ledger_entries").delete().eq("order_id", orderId);
      await service.from("orders").delete().eq("id", orderId);
    }
    if (userId) await service.auth.admin.deleteUser(userId);
  });

  it("réserve les fonctions de sécurité au rôle service", async () => {
    const anon = createClient(url!, publishableKey!, NO_SESSION);
    for (const client of [anon, user]) {
      const hit = await client.rpc("hit_rate_limit", {
        p_bucket: "login_ip",
        p_subject: SUBJECT,
        p_limit: 100,
        p_window_seconds: 60,
      });
      expect(hit.error).not.toBeNull();
      expect((await client.rpc("purge_rate_limit_hits")).error).not.toBeNull();
      const refunded = await client.rpc("stripe_process_refund", {
        p_event_id: `evt_x${RUN}`,
        p_payment_id: PAYMENT_ID,
        p_refund_id: "re_x",
        p_full: true,
      });
      expect(refunded.error).not.toBeNull();
    }
    expect(await orderStatus()).toBe("paid");
  });

  it("cache la table des tentatives aux utilisateurs", async () => {
    const { data } = await user.from("rate_limit_hits").select("id").limit(1);
    expect(data ?? []).toHaveLength(0);
    const insert = await user.from("rate_limit_hits").insert({ bucket: "x", subject: SUBJECT });
    expect(insert.error).not.toBeNull();
  });

  it("refuse au-delà de la limite et journalise une seule fois par fenêtre", async () => {
    const hit = async () => {
      const { data, error } = await service.rpc("hit_rate_limit", {
        p_bucket: "login_ip",
        p_subject: SUBJECT,
        p_limit: 2,
        p_window_seconds: 600,
      });
      if (error) throw error;
      return data as boolean;
    };
    expect([await hit(), await hit(), await hit(), await hit()]).toEqual([
      true,
      true,
      false,
      false,
    ]);
    const logs = await service
      .from("audit_logs")
      .select("id")
      .eq("action", "security.rate_limited")
      .eq("target_id", SUBJECT);
    expect(logs.data).toHaveLength(1);
  });

  it("ignore une commande inconnue", async () => {
    expect((await refund(`pi_inconnu${RUN}`, true)).result).toBe("unknown_order");
  });

  it("inscrit un remboursement partiel sans retirer les droits", async () => {
    expect((await refund(PAYMENT_ID, false)).result).toBe("partial_refund");
    expect(await orderStatus()).toBe("paid");
    const logs = await service
      .from("audit_logs")
      .select("id")
      .eq("action", "order.partial_refund")
      .eq("target_id", orderId);
    expect(logs.data).toHaveLength(1);
  });

  it("rembourse la commande une seule fois, même si l'événement est rejoué", async () => {
    const first = await refund(PAYMENT_ID, true);
    expect(first.result).toBe("processed");
    expect(await orderStatus()).toBe("refunded");
    expect((await refund(PAYMENT_ID, true, first.eventId)).result).toBe("duplicate");
    expect((await refund(PAYMENT_ID, true)).result).toBe("ignored");
  });
});
