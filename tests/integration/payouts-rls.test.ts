/**
 * Fichier    : payouts-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des versements (Sprint 10b, v0.12.1) : demande refusée
 *              sans coordonnées, sous le seuil ou en double ; demande de tout le disponible
 *              (montant retenu, entrée au journal) ; écritures directes refusées ; demandes
 *              invisibles des autres utilisateurs ; fonctions d'administration refusées ;
 *              annulation qui rend le montant disponible.
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

/** Part de l'auteur attendue : (4 000 − 100 de frais) × 70 %. */
const EXPECTED_SHARE = 2730;

type Balance = { currency: string; available_minor: number; requested_minor: number };

/** Vrai si la migration des versements existe sur la base (table payout_requests). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("payout_requests").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — versements aux auteurs", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  let author: SupabaseClient;
  let authorId = "";
  let bookId = "";
  let orderId = "";
  let payoutId = "";
  const userIds: string[] = [];

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

  /** Solde en dollars canadiens de l'auteur connecté. */
  async function cadBalance(): Promise<Balance | undefined> {
    const { data, error } = await author.rpc("author_ledger_balances");
    if (error) throw error;
    const row = (data as Balance[]).find((balance) => balance.currency === "CAD");
    return row && {
      currency: row.currency,
      available_minor: Number(row.available_minor),
      requested_minor: Number(row.requested_minor),
    };
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur-vers");
    author = await signedInUser("auteur-vers");

    const row = await service
      .from("authors")
      .insert({ slug: `zz-vers-${RUN}`, display_name: `Auteur V ${RUN}`, user_id: userIds[1] })
      .select("id")
      .single();
    if (row.error) throw row.error;
    authorId = row.data.id;
    // Part fixée à 70 % pour ne pas dépendre du réglage global
    const share = { author_id: authorId, author_share_bps: 7000 };
    await service.from("author_commissions").insert(share);

    const book = await service
      .from("books")
      .insert({ slug: `zz-vers-livre-${RUN}`, title: "Livre V", author_id: authorId })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;

    const order = await service
      .from("orders")
      .insert({ user_id: userIds[0], provider: "stripe", currency: "CAD", total_minor: 4000 })
      .select("id")
      .single();
    if (order.error) throw order.error;
    orderId = order.data.id;
    const item = await service.from("order_items").insert({
      order_id: orderId,
      kind: "book",
      book_id: bookId,
      quantity: 1,
      unit_minor: 4000,
      label: "Livre V",
    });
    if (item.error) throw item.error;
    const paid = await service
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), fee_minor: 100, tax_minor: 0 })
      .eq("id", orderId);
    if (paid.error) throw paid.error;
    // Délai de garde écoulé : la vente devient disponible
    const past = new Date(Date.now() - 86_400_000).toISOString();
    await service.from("ledger_entries").update({ available_at: past }).eq("order_id", orderId);
  });

  afterAll(async () => {
    if (authorId) {
      const ids = await service.from("payout_requests").select("id").eq("author_id", authorId);
      const targets = (ids.data ?? []).map((payout) => payout.id as string);
      if (targets.length > 0) await service.from("audit_logs").delete().in("target_id", targets);
      await service.from("payout_requests").delete().eq("author_id", authorId);
    }
    if (orderId) await service.from("ledger_entries").delete().eq("order_id", orderId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    if (bookId) await service.from("books").delete().eq("id", bookId);
    if (authorId) await service.from("authors").delete().eq("id", authorId);
  });

  it("refuse la demande sans coordonnées de versement", async () => {
    expect((await cadBalance())?.available_minor).toBe(EXPECTED_SHARE);
    const { error } = await author.rpc("author_request_payout", { p_currency: "CAD" });
    expect(error?.message).toContain("no_payout_details");
  });

  it("verse tout le disponible et retient le montant", async () => {
    const details = await service.from("author_payout_details").insert({
      author_id: authorId,
      method: "bank",
      account_holder: "Auteur V",
      bank_name: "Banque Test",
      account_number: "000123",
    });
    expect(details.error).toBeNull();

    const { data, error } = await author.rpc("author_request_payout", { p_currency: "CAD" });
    expect(error).toBeNull();
    payoutId = String(data);

    const own = await author
      .from("payout_requests")
      .select("status, amount_minor, payout_method, reference")
      .eq("id", payoutId)
      .single();
    expect(own.data).toMatchObject({
      status: "requested",
      amount_minor: EXPECTED_SHARE,
      payout_method: "bank",
    });
    expect(own.data?.reference).toMatch(/^VER-/);
    expect(await cadBalance()).toMatchObject({
      available_minor: 0,
      requested_minor: EXPECTED_SHARE,
    });

    const audit = await service.from("audit_logs").select("action").eq("target_id", payoutId);
    expect(audit.data?.map((entry) => entry.action)).toContain("payout.requested");
  });

  it("refuse une deuxième demande, une devise sous le seuil et une devise inconnue", async () => {
    const twice = await author.rpc("author_request_payout", { p_currency: "CAD" });
    expect(twice.error?.message).toContain("payout_open");
    const xof = await author.rpc("author_request_payout", { p_currency: "XOF" });
    expect(xof.error?.message).toContain("below_minimum");
    const usd = await author.rpc("author_request_payout", { p_currency: "USD" });
    expect(usd.error?.message).toContain("invalid_currency");
  });

  it("refuse les écritures directes et cache les demandes aux autres", async () => {
    await author.from("payout_requests").update({ status: "paid" }).eq("id", payoutId);
    const insert = await author.from("payout_requests").insert({
      reference: "VER-FAUX0001",
      author_id: authorId,
      author_name: "Faux",
      currency: "CAD",
      amount_minor: 1,
      payout_method: "bank",
      payout_details: {},
    });
    expect(insert.error).not.toBeNull();
    const state = await service.from("payout_requests").select("status").eq("id", payoutId);
    expect(state.data?.[0]?.status).toBe("requested");

    const foreign = await buyer.from("payout_requests").select("id");
    expect(foreign.data).toEqual([]);
  });

  it("refuse les fonctions d'administration aux utilisateurs", async () => {
    const approve = await author.rpc("admin_payout_approve", { p_id: payoutId });
    expect(approve.error).not.toBeNull();
    const reject = await buyer.rpc("admin_payout_reject", { p_id: payoutId, p_reason: "Test" });
    expect(reject.error).not.toBeNull();
    const paid = await author.rpc("admin_payout_mark_paid", {
      p_id: payoutId,
      p_payment_reference: "TX-1",
      p_proof_path: null,
    });
    expect(paid.error).not.toBeNull();
    const log = await author.rpc("admin_audit_log", {
      p_category: null,
      p_limit: 10,
      p_offset: 0,
    });
    expect(log.error).not.toBeNull();
    const categories = await buyer.rpc("admin_audit_categories");
    expect(categories.error).not.toBeNull();
  });

  it("annule la demande et rend le montant disponible", async () => {
    const foreign = await buyer.rpc("author_cancel_payout", { p_id: payoutId });
    expect(foreign.error).not.toBeNull();

    const { error } = await author.rpc("author_cancel_payout", { p_id: payoutId });
    expect(error).toBeNull();
    const state = await service.from("payout_requests").select("status").eq("id", payoutId);
    expect(state.data?.[0]?.status).toBe("cancelled");
    expect(await cadBalance()).toMatchObject({
      available_minor: EXPECTED_SHARE,
      requested_minor: 0,
    });

    const again = await author.rpc("author_cancel_payout", { p_id: payoutId });
    expect(again.error?.message).toContain("payout_not_found");
  });
});
