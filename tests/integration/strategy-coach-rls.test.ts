/**
 * Fichier    : strategy-coach-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration du coach IA (S4a) sur la base de développement, sans appel
 *              au modèle : rôles autorisés à réserver, prérequis, verrouillage sans forfait
 *              (v0.11.1), débit par utilisateur, forfait épuisé et recharge, fin de demande
 *              réservée au rôle service (coût calculé), décisions, lecture des demandes sans
 *              prix ni coût, forfaits proposés sans coût et consignes.
 *              Ignorés si les clés manquent ou si la migration du coach n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.2
 * Date       : 2026-10-16
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Estimation minime : n'entame pas le plafond pendant les tests de débit. */
const TINY = 0.0001;

type Settings = { coach_enabled: boolean; coach_rate_limit: number; coach_study_budget: number };

/** Réglages du coach, ou null si la migration des forfaits (v0.11.1) n'est pas appliquée. */
async function coachSettings(): Promise<Settings | null> {
  if (!enabled) return null;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const packs = await service.from("coach_packs").select("id").limit(1);
  if (packs.error) return null;
  const { data, error } = await service
    .from("strategy_settings")
    .select("coach_enabled, coach_rate_limit, coach_study_budget")
    .maybeSingle<Settings>();
  return error || !data ? null : data;
}

const settings = await coachSettings();
// Les refus de débit et de plafond supposent le coach activé sur la base de développement
const ready = settings !== null && settings.coach_enabled;

describe.skipIf(!ready)("RLS — coach IA de l'assistant stratégie", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let contributor: SupabaseClient;
  let observer: SupabaseClient;
  let outsider: SupabaseClient;
  const userIds: string[] = [];
  let studyId = "";

  /** Crée un utilisateur confirmé et retourne un client connecté. */
  async function signedInUser(label: string): Promise<SupabaseClient> {
    const email = `${label}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    const client = createClient(url!, publishableKey!, NO_SESSION);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    return client;
  }

  /** Réserve une relecture de l'étape donnée. */
  function reserve(client: SupabaseClient, estimate: number, stepNo = 1) {
    return client.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: stepNo,
      p_function: "review",
      p_estimate: estimate,
    });
  }

  /** Accorde un crédit à l'étude (rôle service, comme un forfait acheté ou offert). */
  async function grantAllowance(amount: number) {
    const { error } = await service.from("coach_allowances").insert({
      study_id: studyId,
      amount_usd: amount,
      source: "admin_grant",
      note: `test ${RUN}`,
    });
    if (error) throw error;
  }

  /** Refus retourné par une réservation (null si acceptée). */
  function refusal(data: unknown): string | null {
    return (data as { refusal: string | null }[])[0].refusal;
  }

  /** Termine une demande réservée avec le client donné. */
  function complete(client: SupabaseClient, requestId: string, inputTokens: number) {
    return client.rpc("coach_complete", {
      p_request_id: requestId,
      p_status: "done",
      p_prompt_id: null,
      p_served_model: "modele-test",
      p_input_tokens: inputTokens,
      p_output_tokens: 1000,
      p_web_searches: 0,
      p_input: { revision: 1, payload: {} },
      p_output: { summary: "Ok", suggestions: [] },
      p_sources: null,
      p_error: null,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("coach-proprio");
    contributor = await signedInUser("coach-contrib");
    observer = await signedInUser("coach-obs");
    outsider = await signedInUser("coach-externe");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Coach ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;

    const profile = await owner.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Coach ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      // Profil complet : secteur, pays et offre ouvrent l'étape 1
      p_data: {
        sector: "Ébénisterie",
        countries: ["Canada"],
        offers: ["Meubles sur mesure"],
        competitors: ["Rival"],
      },
    });
    if (profile.error) throw profile.error;

    const members = await service.from("study_members").insert([
      { study_id: studyId, user_id: userIds[1], role: "contributor" },
      { study_id: studyId, user_id: userIds[2], role: "observer" },
    ]);
    if (members.error) throw members.error;
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse la réservation à l'observateur et au non-membre", async () => {
    for (const client of [observer, outsider]) {
      const { error } = await reserve(client, TINY);
      expect(error?.code).toBe("42501");
    }
  });

  it("refuse une étape dont les prérequis manquent", async () => {
    const { error } = await reserve(owner, TINY, 5);
    expect(error?.message).toBe("prerequisites_missing");
  });

  it("refuse une estimation invalide", async () => {
    const { error } = await reserve(owner, -1);
    expect(error?.message).toBe("invalid_estimate");
  });

  it("verrouille le coach sans forfait, puis l'ouvre après un crédit", async () => {
    const locked = await reserve(owner, TINY);
    expect(locked.error).toBeNull();
    expect(refusal(locked.data)).toBe("coach_locked");

    const before = await owner.rpc("coach_study_usage", { p_study_id: studyId });
    const gauge = (before.data as { unlocked: boolean; used_pct: number }[])[0];
    expect(gauge.unlocked).toBe(false);
    expect(Number(gauge.used_pct)).toBe(0);

    // Ni les crédits ni les forfaits ne sont lisibles par un membre (montants en dollars)
    await grantAllowance(1);
    expect((await owner.from("coach_allowances").select("id")).data).toEqual([]);
    expect((await owner.from("coach_packs").select("id")).data).toEqual([]);

    const after = await owner.rpc("coach_study_usage", { p_study_id: studyId });
    const open = (after.data as { unlocked: boolean; remaining_reviews: number }[])[0];
    expect(open.unlocked).toBe(true);
    expect(open.remaining_reviews).toBeGreaterThan(0);
  });

  it("propose les forfaits actifs sans leur coût", async () => {
    const { data, error } = await owner.rpc("coach_pack_offers");
    expect(error).toBeNull();
    const offers = data as Record<string, unknown>[];
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) {
      expect(offer).not.toHaveProperty("cost_usd");
      expect(Number(offer.approx_reviews)).toBeGreaterThan(0);
    }
  });

  it("réserve, puis seul le rôle service termine et calcule le coût", async () => {
    const { data, error } = await reserve(owner, TINY);
    expect(error).toBeNull();
    const row = (data as { request_id: string; model: string; input_price: number }[])[0];
    expect(row.request_id).toBeTruthy();
    expect(row.model).toBeTruthy();

    const denied = await complete(owner, row.request_id, 1000);
    expect(denied.error).not.toBeNull();

    const prices = await service
      .from("coach_requests")
      .select("input_price, output_price")
      .eq("id", row.request_id)
      .single<{ input_price: number; output_price: number }>();
    const done = await complete(service, row.request_id, 2000);
    expect(done.error).toBeNull();
    const expected = (2000 * Number(prices.data!.input_price)
      + 1000 * Number(prices.data!.output_price)) / 1e6;
    expect(Number(done.data)).toBeCloseTo(expected, 6);

    // Une demande terminée ne peut pas l'être deux fois
    const again = await complete(service, row.request_id, 1);
    expect(again.error?.message).toBe("request_not_pending");

    // Décisions : membres éditeurs seulement, indice et valeur contrôlés
    const decide = (client: SupabaseClient, decision: string, index = 0) =>
      client.rpc("coach_decide", {
        p_request_id: row.request_id,
        p_index: index,
        p_decision: decision,
      });
    expect((await decide(observer, "accepted")).error?.code).toBe("42501");
    expect((await decide(owner, "approved")).error?.message).toBe("invalid_decision");
    expect((await decide(contributor, "rejected")).error).toBeNull();
    const stored = await owner
      .from("coach_requests")
      .select("decisions")
      .eq("id", row.request_id)
      .single<{ decisions: Record<string, { decision: string }> }>();
    expect(stored.data?.decisions["0"].decision).toBe("rejected");
  });

  it("montre les demandes aux membres seulement, jamais les consignes", async () => {
    const asObserver = await observer.from("coach_requests").select("id").eq("study_id", studyId);
    expect(asObserver.data?.length).toBeGreaterThan(0);
    const asOutsider = await outsider.from("coach_requests").select("id").eq("study_id", studyId);
    expect(asOutsider.data).toEqual([]);
    // Prix, jetons et coûts réservés au rôle service
    const costs = await owner.from("coach_requests").select("cost_usd").eq("study_id", studyId);
    expect(costs.error).not.toBeNull();

    const prompts = await owner.from("coach_prompts").select("id");
    expect(prompts.data).toEqual([]);
    const rules = await outsider.from("coach_rules").select("code");
    expect(rules.data?.length).toBeGreaterThan(0);

    // Aucune écriture directe : le coût enregistré reste intact
    await owner.from("coach_requests").update({ cost_usd: 0 }).eq("study_id", studyId);
    const after = await service
      .from("coach_requests")
      .select("cost_usd")
      .eq("study_id", studyId)
      .eq("status", "done");
    expect(after.data?.length).toBeGreaterThan(0);
    expect(after.data?.every((row) => Number(row.cost_usd) > 0)).toBe(true);
  });

  it("refuse au-delà du forfait, puis accepte après une recharge", async () => {
    // Forfait de 1 $ presque intact : une estimation de 2 $ le dépasse
    const refused = await reserve(owner, 2);
    expect(refused.error).toBeNull();
    expect(refusal(refused.data)).toBe("budget_exhausted");

    // Un membre ne peut ni s'accorder de crédit ni de forfait ; seul l'administrateur (aal2)
    const self = await owner.rpc("admin_grant_coach_allowance", {
      p_study_id: studyId,
      p_amount: 5,
      p_note: "",
    });
    expect(self.error?.code).toBe("42501");
    const offers = await owner.rpc("coach_pack_offers");
    const pack = await owner.rpc("admin_grant_coach_pack", {
      p_study_id: studyId,
      p_pack_id: (offers.data as { id: string }[])[0].id,
      p_note: "",
    });
    expect(pack.error?.code).toBe("42501");

    await grantAllowance(5);
    const accepted = await reserve(owner, 2);
    expect(refusal(accepted.data)).toBeNull();

    // La réservation en cours compte dans la jauge (≈ 2 $ sur 6 $)
    const usage = await owner.rpc("coach_study_usage", { p_study_id: studyId });
    const pct = Number((usage.data as { used_pct: number }[])[0].used_pct);
    expect(pct).toBeGreaterThan(30);
    expect(pct).toBeLessThan(40);
  });

  it("limite le débit par utilisateur", async () => {
    const limit = settings!.coach_rate_limit;
    for (let i = 0; i < limit; i += 1) {
      const { data } = await reserve(contributor, TINY);
      expect((data as { request_id: string | null }[])[0].request_id).toBeTruthy();
    }
    const { data } = await reserve(contributor, TINY);
    expect((data as { refusal: string }[])[0].refusal).toBe("rate_limited");
  });
});
