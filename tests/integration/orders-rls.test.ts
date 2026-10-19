/**
 * Fichier    : orders-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des commandes (Sprint 5a) : commande créée au prix de la
 *              base par l'acheteur, aucune écriture ni fonction serveur depuis le navigateur,
 *              montant contrôlé, livraison unique (livre, PDF, étude offerte une fois),
 *              événements Stripe traités une seule fois, commandes visibles par leur seul
 *              acheteur. Ignorés si les clés manquent ou si la migration n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-18
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
const PRICE = 1299;

/** Vrai si la migration des commandes existe sur la base (table orders). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("orders").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — commandes et paiement par carte", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  let other: SupabaseClient;
  const userIds: string[] = [];
  const eventIds: string[] = [];
  let authorId = "";
  let bookId = "";
  let orderId = "";
  const sessionId = `cs_test_${RUN}`;

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

  /** Traite un événement Checkout comme le webhook (clé serveur). */
  async function processEvent(suffix: string, type: string, amount = PRICE, currency = "cad") {
    const eventId = `evt_${RUN}${suffix}`;
    eventIds.push(eventId);
    const { data, error } = await service.rpc("stripe_process_event", {
      p_event_id: eventId,
      p_event_type: type,
      p_order_id: orderId,
      p_session_id: sessionId,
      p_amount_minor: amount,
      p_currency: currency,
      p_payment_id: `pi_test_${RUN}`,
      p_receipt_url: null,
    });
    if (error) throw error;
    return data as string;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur");
    other = await signedInUser("autre-acheteur");

    const author = await service
      .from("authors")
      .insert({ slug: `zz-achat-${RUN}`, display_name: `Auteur achat ${RUN}` })
      .select("id")
      .single();
    if (author.error) throw author.error;
    authorId = author.data.id;

    const book = await service
      .from("books")
      .insert({
        slug: `zz-achat-${RUN}`,
        title: "Livre acheté",
        author_id: authorId,
        status: "published",
        pdf_enabled: true,
        grants_study_credit: true,
      })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;

    const price = await service
      .from("book_prices")
      .insert({ book_id: bookId, currency: "CAD", amount_minor: PRICE });
    if (price.error) throw price.error;
  });

  afterAll(async () => {
    if (eventIds.length) await service.from("stripe_events").delete().in("id", eventIds);
    // Écritures du grand livre (gardées sinon après la suppression des commandes)
    const orders = await service.from("orders").select("id").in("user_id", userIds);
    const orderIds = (orders.data ?? []).map((row) => row.id);
    if (orderIds.length) await service.from("ledger_entries").delete().in("order_id", orderIds);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    await service.from("books").delete().eq("author_id", authorId);
    await service.from("authors").delete().eq("id", authorId);
  });

  it("crée la commande au prix de la base et refuse une devise sans prix", async () => {
    const missing = await buyer.rpc("create_book_order", { p_book_id: bookId, p_currency: "EUR" });
    expect(missing.error?.message).toBe("not_for_sale");

    const { data, error } = await buyer
      .rpc("create_book_order", { p_book_id: bookId, p_currency: "CAD" })
      .single<{ order_id: string; total_minor: number }>();
    expect(error).toBeNull();
    expect(data?.total_minor).toBe(PRICE);
    orderId = data!.order_id;

    const attached = await service.rpc("order_attach_session", {
      p_order_id: orderId,
      p_session_id: sessionId,
    });
    expect(attached.error).toBeNull();
  });

  it("refuse les écritures directes et les fonctions serveur au navigateur", async () => {
    const insert = await buyer
      .from("orders")
      .insert({ user_id: userIds[0], provider: "stripe", currency: "CAD", total_minor: 1 });
    expect(insert.error).not.toBeNull();

    // Sous RLS, une mise à jour interdite ne touche simplement aucune ligne
    await buyer.from("orders").update({ status: "paid" }).eq("id", orderId);
    const still = await service.from("orders").select("status").eq("id", orderId).single();
    expect(still.data?.status).toBe("pending");

    for (const fn of ["fulfil_order", "order_attach_session", "stripe_process_event"]) {
      const call = await buyer.rpc(fn, { p_order_id: orderId });
      expect(call.error, fn).not.toBeNull();
    }
  });

  it("ne montre la commande qu'à son acheteur", async () => {
    const own = await buyer.from("orders").select("id, order_items(label)").eq("id", orderId);
    expect(own.data?.[0]?.order_items).toEqual([{ label: "Livre acheté" }]);
    const foreign = await other.from("orders").select("id").eq("id", orderId);
    expect(foreign.data).toEqual([]);
    const events = await buyer.from("stripe_events").select("id");
    expect(events.data).toEqual([]);
  });

  it("refuse un montant ou une devise différents de la commande", async () => {
    expect(await processEvent("a", "checkout.session.completed", 1)).toBe("amount_mismatch");
    expect(await processEvent("b", "checkout.session.completed", PRICE, "eur")).toBe(
      "amount_mismatch",
    );
    const order = await service.from("orders").select("status").eq("id", orderId).single();
    expect(order.data?.status).toBe("pending");
  });

  it("livre le livre, le PDF et l'étude offerte au paiement confirmé", async () => {
    expect(await processEvent("c", "checkout.session.completed")).toBe("processed");

    const order = await service.from("orders").select("status, paid_at").eq("id", orderId).single();
    expect(order.data?.status).toBe("paid");
    expect(order.data?.paid_at).not.toBeNull();

    const entitlements = await buyer.from("entitlements").select("source").eq("book_id", bookId);
    expect(entitlements.data).toEqual([{ source: "purchase" }]);
    const pdf = await buyer.from("pdf_purchases").select("source").eq("book_id", bookId);
    expect(pdf.data).toEqual([{ source: "purchase" }]);
    const credits = await service
      .from("study_credits")
      .select("source")
      .eq("user_id", userIds[0]);
    expect(credits.data).toEqual([{ source: "book_bonus" }]);
  });

  it("ne traite un événement qu'une fois et ne livre jamais deux fois", async () => {
    expect(await processEvent("c", "checkout.session.completed")).toBe("duplicate");
    expect(await processEvent("d", "checkout.session.completed")).toBe("ignored");
    expect(await processEvent("e", "checkout.session.expired")).toBe("processed");

    const order = await service.from("orders").select("status").eq("id", orderId).single();
    expect(order.data?.status).toBe("paid");
    const credits = await service.from("study_credits").select("id").eq("user_id", userIds[0]);
    expect(credits.data).toHaveLength(1);
    const entitlements = await service
      .from("entitlements")
      .select("id")
      .eq("user_id", userIds[0])
      .eq("book_id", bookId);
    expect(entitlements.data).toHaveLength(1);
  });

  it("refuse une nouvelle commande d'un livre déjà possédé", async () => {
    const again = await buyer.rpc("create_book_order", { p_book_id: bookId, p_currency: "CAD" });
    expect(again.error?.message).toBe("already_owned");
  });
});
