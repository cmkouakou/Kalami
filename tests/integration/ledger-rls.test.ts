/**
 * Fichier    : ledger-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration du grand livre (Sprint 10a, v0.12.0) : écriture posée au
 *              paiement (brut = frais + taxes + commission + part auteur, part de 70 %),
 *              écriture inverse au remboursement, écritures lisibles par l'auteur seulement,
 *              soldes de l'auteur, fonctions d'administration refusées aux utilisateurs.
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

type Entry = {
  entry_type: "sale" | "refund";
  gross_minor: number;
  fee_minor: number;
  tax_minor: number;
  commission_minor: number;
  author_minor: number;
};

/** Vrai si la migration du grand livre existe sur la base (table ledger_entries). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("ledger_entries").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — grand livre", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  let author: SupabaseClient;
  let authorId = "";
  let bookId = "";
  let orderId = "";
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

  /** Écritures de la commande de test (lues par le service). */
  async function entries(): Promise<Entry[]> {
    const { data, error } = await service
      .from("ledger_entries")
      .select("entry_type, gross_minor, fee_minor, tax_minor, commission_minor, author_minor")
      .eq("order_id", orderId)
      .order("created_at");
    if (error) throw error;
    return data as Entry[];
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur-gl");
    author = await signedInUser("auteur-gl");

    const row = await service
      .from("authors")
      .insert({ slug: `zz-gl-${RUN}`, display_name: `Auteur GL ${RUN}`, user_id: userIds[1] })
      .select("id")
      .single();
    if (row.error) throw row.error;
    authorId = row.data.id;
    // Part fixée à 70 % pour ne pas dépendre du réglage global
    const share = { author_id: authorId, author_share_bps: 7000 };
    await service.from("author_commissions").insert(share);

    const book = await service
      .from("books")
      .insert({ slug: `zz-gl-livre-${RUN}`, title: "Livre GL", author_id: authorId })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;

    const order = await service
      .from("orders")
      .insert({ user_id: userIds[0], provider: "stripe", currency: "CAD", total_minor: 2000 })
      .select("id")
      .single();
    if (order.error) throw order.error;
    orderId = order.data.id;
    const item = await service.from("order_items").insert({
      order_id: orderId,
      kind: "book",
      book_id: bookId,
      quantity: 2,
      unit_minor: 1000,
      label: "Livre GL",
    });
    if (item.error) throw item.error;
  });

  afterAll(async () => {
    if (orderId) await service.from("ledger_entries").delete().eq("order_id", orderId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    if (bookId) await service.from("books").delete().eq("id", bookId);
    if (authorId) await service.from("authors").delete().eq("id", authorId);
  });

  it("pose une écriture équilibrée au paiement, avec la part de l'auteur", async () => {
    const paid = await service
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), fee_minor: 100, tax_minor: 0 })
      .eq("id", orderId);
    expect(paid.error).toBeNull();

    const [sale] = await entries();
    expect(sale).toMatchObject({ entry_type: "sale", gross_minor: 2000, fee_minor: 100 });
    // Net 1 900 × 70 % = 1 330 ; le reste revient à Kalami
    expect(sale.author_minor).toBe(1330);
    expect(sale.commission_minor).toBe(570);
    expect(sale.fee_minor + sale.tax_minor + sale.commission_minor + sale.author_minor).toBe(
      sale.gross_minor,
    );
  });

  it("montre les écritures et les soldes à l'auteur, pas à l'acheteur", async () => {
    const own = await author.from("ledger_entries").select("id").eq("order_id", orderId);
    expect(own.data).toHaveLength(1);
    const foreign = await buyer.from("ledger_entries").select("id");
    expect(foreign.data).toEqual([]);

    const { data, error } = await author.rpc("author_ledger_balances");
    expect(error).toBeNull();
    const cad = (data as { currency: string; earned_minor: number }[]).find(
      (row) => row.currency === "CAD",
    );
    expect(Number(cad?.earned_minor)).toBe(1330);
  });

  it("passe une écriture inverse au remboursement", async () => {
    const refunded = await service
      .from("orders")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("id", orderId);
    expect(refunded.error).toBeNull();

    const rows = await entries();
    expect(rows.map((row) => row.entry_type)).toEqual(["sale", "refund"]);
    const refund = rows[1];
    expect(refund.gross_minor).toBe(-2000);
    expect(refund.author_minor).toBe(-1330);
    // Frais non rendus : absorbés par la commission de Kalami
    expect(refund.fee_minor).toBe(0);
    expect(rows.reduce((sum, row) => sum + row.author_minor, 0)).toBe(0);
  });

  it("refuse les écritures directes et les fonctions d'administration", async () => {
    const insert = await author.from("ledger_entries").insert({
      entry_type: "sale",
      reference: "KAL-FAUX",
      item_kind: "book",
      label: "Faux",
      provider: "stripe",
      currency: "CAD",
      gross_minor: 100,
      fee_minor: 0,
      tax_minor: 0,
      commission_minor: 0,
      author_minor: 100,
      author_share_bps: 10000,
      available_at: new Date().toISOString(),
    });
    expect(insert.error).not.toBeNull();

    const totals = await buyer.rpc("admin_ledger_totals");
    expect(totals.error).not.toBeNull();
    const settings = await author.rpc("admin_set_revenue_settings", {
      p_author_share_bps: 10000,
      p_hold_days: 0,
      p_payout_min_xof: 1,
      p_payout_min_eur: 1,
      p_payout_min_cad: 1,
    });
    expect(settings.error).not.toBeNull();
    const share = await author.rpc("admin_set_author_commission", {
      p_author_id: authorId,
      p_author_share_bps: 10000,
    });
    expect(share.error).not.toBeNull();
    const fee = await buyer.rpc("admin_mm_set_fee", { p_code: "wave", p_fee_bps: 0 });
    expect(fee.error).not.toBeNull();
    const record = await buyer.rpc("ledger_record_sale", { p_order_id: orderId });
    expect(record.error).not.toBeNull();
  });
});
