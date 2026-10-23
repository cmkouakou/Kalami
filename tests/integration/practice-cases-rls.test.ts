/**
 * Fichier    : practice-cases-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des cas d'entraînement (S10b, v0.14.0) : cas fermé non
 *              vendu, achat au prix de la base livré en accès, second achat refusé, étude
 *              préremplie ouverte sans crédit (une seule), corrigé déverrouillé à la
 *              validation de chaque étape (plan avec les étapes 1 à 8), remboursement qui
 *              retire l'accès mais garde l'étude, fonctions d'administration refusées aux
 *              utilisateurs. Un cas de test est créé puis supprimé (le cas réel n'est pas
 *              touché). Ignorés si les clés manquent ou si la migration n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-23
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
const CASE_CODE = `test-${RUN}`;
const PROFILE = { scope: "company", sector: "Assaisonnements" };

type OrderRow = { order_id: string; total_minor: number; label: string };

/** Vrai si la migration des cas existe sur la base (table practice_cases). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("practice_cases").select("code").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — cas d'entraînement", () => {
  let service: SupabaseClient;
  let buyer: SupabaseClient;
  let other: SupabaseClient;
  const userIds: string[] = [];
  const eventIds: string[] = [];
  let order: OrderRow;
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

  /** Étapes déverrouillées pour l'acheteur. */
  async function unlocked(): Promise<number[]> {
    const { data, error } = await buyer.rpc("practice_case_my_access", { p_code: CASE_CODE });
    if (error) throw error;
    return ((data ?? [])[0]?.unlocked_steps ?? []) as number[];
  }

  /** Valide une étape de l'étude comme le ferait la démarche (écriture du service). */
  async function validate(step: number) {
    const { error } = await service
      .from("study_steps")
      .update({ status: "validated", validated_at: new Date().toISOString() })
      .eq("study_id", studyId)
      .eq("step_no", step);
    if (error) throw error;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    buyer = await signedInUser("acheteur-cas");
    other = await signedInUser("curieux-cas");
    const inserted = await service
      .from("practice_cases")
      .insert({ code: CASE_CODE, title: `Cas test ${RUN}`, price_cad: 19.99, position: 999 });
    if (inserted.error) throw inserted.error;
  });

  afterAll(async () => {
    if (eventIds.length) await service.from("stripe_events").delete().in("id", eventIds);
    await service.from("studies").delete().eq("practice_case", CASE_CODE);
    const orders = await service.from("orders").select("id").in("user_id", userIds);
    const orderIds = (orders.data ?? []).map((row) => row.id);
    if (orderIds.length) await service.from("ledger_entries").delete().in("order_id", orderIds);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    await service.from("practice_cases").delete().eq("code", CASE_CODE);
  });

  it("ne vend pas un cas fermé et cache la table aux utilisateurs", async () => {
    const closed = await buyer.rpc("create_strategy_order", {
      p_kind: "practice_case",
      p_currency: "CAD",
      p_code: CASE_CODE,
      p_pack_id: null,
      p_study_id: null,
    });
    expect(closed.error?.message).toBe("not_for_sale");
    expect((await buyer.from("practice_cases").select("code")).data).toEqual([]);

    await service.from("practice_cases").update({ active: true }).eq("code", CASE_CODE);
    const anon = createClient(url!, publishableKey!, NO_SESSION);
    const list = await anon.rpc("practice_case_list");
    expect((list.data as { code: string }[]).map((row) => row.code)).toContain(CASE_CODE);
  });

  it("vend le cas au prix de la base et livre l'accès", async () => {
    const { data, error } = await buyer
      .rpc("create_strategy_order", {
        p_kind: "practice_case",
        p_currency: "CAD",
        p_code: CASE_CODE,
        p_pack_id: null,
        p_study_id: null,
      })
      .single<OrderRow>();
    expect(error).toBeNull();
    order = data!;
    expect(order.total_minor).toBe(1999);

    const sessionId = `cs_test_${RUN}_cas`;
    await service.rpc("order_attach_session", {
      p_order_id: order.order_id,
      p_session_id: sessionId,
    });
    const eventId = `evt_${RUN}cas`;
    eventIds.push(eventId);
    const paid = await service.rpc("stripe_process_event", {
      p_event_id: eventId,
      p_event_type: "checkout.session.completed",
      p_order_id: order.order_id,
      p_session_id: sessionId,
      p_amount_minor: order.total_minor,
      p_currency: "CAD",
      p_payment_id: `pi_test_${RUN}_cas`,
      p_receipt_url: null,
    });
    expect(paid.error).toBeNull();

    const access = await buyer.rpc("practice_case_my_access", { p_code: CASE_CODE });
    expect(access.data).toHaveLength(1);
    const none = await other.rpc("practice_case_my_access", { p_code: CASE_CODE });
    expect(none.data).toEqual([]);

    const again = await buyer.rpc("create_strategy_order", {
      p_kind: "practice_case",
      p_currency: "CAD",
      p_code: CASE_CODE,
      p_pack_id: null,
      p_study_id: null,
    });
    expect(again.error?.message).toBe("already_owned");
  });

  it("ouvre une seule étude préremplie, sans crédit, et la refuse sans accès", async () => {
    const args = {
      p_code: CASE_CODE,
      p_company_name: `Cas ${RUN}`,
      p_strategic_question: "Que faire en 2016 ?",
      p_profile: PROFILE,
    };
    const first = await buyer.rpc("practice_case_start", args);
    expect(first.error).toBeNull();
    studyId = first.data as string;
    const second = await buyer.rpc("practice_case_start", args);
    expect(second.data).toBe(studyId);

    const profile = await buyer
      .from("company_profiles")
      .select("data")
      .eq("study_id", studyId)
      .single();
    expect(profile.data?.data).toEqual(PROFILE);

    const refused = await other.rpc("practice_case_start", args);
    expect(refused.error?.message).toBe("no_access");
  });

  it("déverrouille le corrigé étape par étape, puis le plan", async () => {
    expect(await unlocked()).toEqual([]);
    await validate(3);
    expect(await unlocked()).toEqual([3]);
    for (const step of [1, 2, 4, 5, 6, 7]) await validate(step);
    expect(await unlocked()).not.toContain(9);
    await validate(8);
    expect(await unlocked()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("retire l'accès au remboursement mais garde l'étude", async () => {
    const eventId = `evt_${RUN}remb`;
    eventIds.push(eventId);
    const refunded = await service.rpc("stripe_process_refund", {
      p_event_id: eventId,
      p_payment_id: `pi_test_${RUN}_cas`,
      p_refund_id: `re_test${RUN}`,
      p_full: true,
    });
    expect(refunded.error).toBeNull();
    expect(refunded.data).toBe("processed");

    const access = await buyer.rpc("practice_case_my_access", { p_code: CASE_CODE });
    expect(access.data).toEqual([]);
    const study = await service.from("studies").select("id").eq("id", studyId).single();
    expect(study.data?.id).toBe(studyId);
  });

  it("refuse les fonctions d'administration aux utilisateurs", async () => {
    const list = await buyer.rpc("admin_practice_cases");
    expect(list.error?.code).toBe("42501");
    const save = await buyer.rpc("admin_save_practice_case", {
      p_code: CASE_CODE,
      p_title: "Piraté",
      p_price_xof: 1,
      p_price_eur: null,
      p_price_cad: null,
      p_active: true,
      p_unlock_immediately: true,
    });
    expect(save.error?.code).toBe("42501");
    const grant = await buyer.rpc("admin_set_practice_case_access", {
      p_email: `acheteur-cas-${RUN}@test.kalami.local`,
      p_code: CASE_CODE,
      p_enabled: true,
    });
    expect(grant.error?.code).toBe("42501");
  });
});
