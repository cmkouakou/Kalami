/**
 * Fichier    : mobile-money-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration du Mobile Money (Sprint 6, v0.11.0) : opérateurs et
 *              numéros réservés à l'admin, numéros ouverts listés pour l'acheteur, commande
 *              FCFA passée en Mobile Money (référence KAL-…), devise autre refusée,
 *              déclaration unique et numéro de transaction à usage unique, fonctions
 *              d'administration refusées aux utilisateurs. Ignorés si les clés manquent ou
 *              si la migration n'est pas appliquée.
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
const COUNTRIES = ["GW", "NE", "TG", "BJ", "ML", "BF", "SN", "CI"];

type OrderRow = { order_id: string; total_minor: number; label: string };

/** Vrai si la migration du Mobile Money existe sur la base (table mobile_money_accounts). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("mobile_money_accounts").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — Mobile Money", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  let accountId: string | null = null;
  let offerCode: string | null = null;
  const userIds: string[] = [];

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

  /** Commande d'une offre d'étude dans la devise voulue. */
  function orderOffer(currency: "XOF" | "EUR") {
    return buyer
      .rpc("create_strategy_order", {
        p_kind: "study_offer",
        p_currency: currency,
        p_code: offerCode,
        p_pack_id: null,
        p_study_id: null,
        p_promo_code: null,
      })
      .single<OrderRow>();
  }

  /** Commande FCFA passée en Mobile Money (numéro de test). */
  async function startOrder(): Promise<OrderRow> {
    const order = await orderOffer("XOF");
    if (order.error) throw order.error;
    const started = await buyer.rpc("mm_start_order", {
      p_order_id: order.data!.order_id,
      p_account_id: accountId,
    });
    if (started.error) throw started.error;
    return order.data!;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur-mm");

    // Offre vendue en FCFA (les prix sont saisis par l'admin)
    const offers = await service
      .from("strategy_offers")
      .select("code")
      .eq("active", true)
      .not("price_xof", "is", null)
      .limit(1);
    offerCode = offers.data?.[0]?.code ?? null;

    // Numéro de test sur un pays libre pour Wave (ne touche pas aux vrais numéros)
    const taken = await service
      .from("mobile_money_accounts")
      .select("country")
      .eq("operator", "wave");
    const used = new Set((taken.data ?? []).map((row) => row.country));
    const country = COUNTRIES.find((code) => !used.has(code));
    const wave = await service.from("mobile_money_operators").select("enabled").eq("code", "wave");
    if (country && wave.data?.[0]?.enabled) {
      const { data, error } = await service
        .from("mobile_money_accounts")
        .insert({
          operator: "wave",
          country,
          merchant_number: "+000 00 00 00 00",
          account_name: `Test ${RUN}`,
        })
        .select("id")
        .single();
      if (error) throw error;
      accountId = data.id;
    }
  });

  afterAll(async () => {
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    if (accountId) await service.from("mobile_money_accounts").delete().eq("id", accountId);
  });

  it("réserve opérateurs et numéros à l'administrateur", async () => {
    const operators = await buyer.from("mobile_money_operators").select("code");
    expect(operators.data).toEqual([]);
    const accounts = await buyer.from("mobile_money_accounts").select("id");
    expect(accounts.data).toEqual([]);
  });

  it("liste les numéros ouverts pour l'acheteur", async (context) => {
    if (!accountId) context.skip();
    const { data, error } = await buyer.rpc("mm_payment_options");
    expect(error).toBeNull();
    const ids = ((data ?? []) as { account_id: string }[]).map((row) => row.account_id);
    expect(ids).toContain(accountId);
  });

  it("passe une commande FCFA en Mobile Money, refuse une autre devise", async (context) => {
    if (!accountId || !offerCode) context.skip();
    const order = await orderOffer("XOF");
    expect(order.error).toBeNull();
    const started = await buyer
      .rpc("mm_start_order", { p_order_id: order.data!.order_id, p_account_id: accountId })
      .single<{ reference: string; total_minor: number }>();
    expect(started.error).toBeNull();
    expect(started.data!.reference).toMatch(/^KAL-[0-9A-F]{8}$/);
    expect(started.data!.total_minor).toBe(order.data!.total_minor);

    const euros = await orderOffer("EUR");
    if (!euros.error) {
      const refused = await buyer.rpc("mm_start_order", {
        p_order_id: euros.data!.order_id,
        p_account_id: accountId,
      });
      expect(refused.error?.message).toBe("invalid_currency");
    }
  });

  it("n'accepte qu'une déclaration et un usage du numéro de transaction", async (context) => {
    if (!accountId || !offerCode) context.skip();
    const first = await startOrder();
    const second = await startOrder();
    const transaction = `TX${RUN}`;

    const declared = await buyer.rpc("mm_declare_transaction", {
      p_order_id: first.order_id,
      p_transaction_id: transaction,
      p_payer_number: "+225 07 00 00 00 00",
    });
    expect(declared.error).toBeNull();

    const again = await buyer.rpc("mm_declare_transaction", {
      p_order_id: first.order_id,
      p_transaction_id: `TY${RUN}`,
      p_payer_number: "+225 07 00 00 00 00",
    });
    expect(again.error?.message).toBe("already_declared");

    const reused = await buyer.rpc("mm_declare_transaction", {
      p_order_id: second.order_id,
      p_transaction_id: transaction.toLowerCase(),
      p_payer_number: "+225 07 00 00 00 00",
    });
    expect(reused.error?.message).toBe("transaction_used");

    const badPayer = await buyer.rpc("mm_declare_transaction", {
      p_order_id: second.order_id,
      p_transaction_id: `TZ${RUN}`,
      p_payer_number: "abc",
    });
    expect(badPayer.error?.message).toBe("invalid_payer");
  });

  it("refuse les fonctions d'administration et de serveur aux utilisateurs", async () => {
    const validate = await buyer.rpc("admin_mm_validate", { p_order_id: crypto.randomUUID() });
    expect(validate.error).not.toBeNull();
    const reject = await buyer.rpc("admin_mm_reject", {
      p_order_id: crypto.randomUUID(),
      p_reason: "Montant faux",
    });
    expect(reject.error).not.toBeNull();
    const operator = await buyer.rpc("admin_mm_set_operator", {
      p_code: "mtn_momo",
      p_enabled: true,
    });
    expect(operator.error).not.toBeNull();
    const expire = await buyer.rpc("mm_expire_stale");
    expect(expire.error).not.toBeNull();
    const emails = await buyer.rpc("mm_admin_emails");
    expect(emails.error).not.toBeNull();
  });
});
