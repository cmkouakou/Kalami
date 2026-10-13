/**
 * Fichier    : strategy-coach-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration du coach IA (S4a) sur la base de développement, sans appel
 *              au modèle : rôles autorisés à réserver, prérequis, débit par utilisateur,
 *              plafond par étude et supplément, fin de demande réservée au rôle service
 *              (coût calculé), décisions, lecture des demandes et des consignes.
 *              Ignorés si les clés manquent ou si la migration du coach n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-13
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

/** Réglages du coach, ou null si la migration du coach n'est pas appliquée. */
async function coachSettings(): Promise<Settings | null> {
  if (!enabled) return null;
  const service = createClient(url!, secretKey!, NO_SESSION);
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

  /** Termine une demande réservée avec le client donné. */
  function complete(client: SupabaseClient, requestId: string, inputTokens: number) {
    return client.rpc("coach_complete", {
      p_request_id: requestId,
      p_status: "done",
      p_prompt_id: null,
      p_served_model: "modele-test",
      p_input_tokens: inputTokens,
      p_output_tokens: 1000,
      p_input: { revision: 1, payload: {} },
      p_output: { summary: "Ok", suggestions: [] },
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

  it("refuse au-delà du plafond, puis accepte après un supplément", async () => {
    const usage = await owner.rpc("coach_study_usage", { p_study_id: studyId });
    const { spent, budget } = (usage.data as { spent: number; budget: number }[])[0];
    const over = Number(budget) - Number(spent) + 0.01;

    const refused = await reserve(owner, over);
    expect(refused.error).toBeNull();
    expect((refused.data as { refusal: string }[])[0].refusal).toBe("budget_exhausted");

    // Un membre ne peut pas s'accorder de supplément ; seul l'administrateur (aal2) le peut
    const self = await owner.rpc("admin_grant_coach_allowance", {
      p_study_id: studyId,
      p_amount: 5,
      p_note: "",
    });
    expect(self.error?.code).toBe("42501");

    const grant = await service
      .from("coach_allowances")
      .insert({ study_id: studyId, amount_usd: 1, source: "admin_grant", note: `test ${RUN}` });
    expect(grant.error).toBeNull();
    const accepted = await reserve(owner, over);
    expect((accepted.data as { request_id: string | null }[])[0].request_id).toBeTruthy();
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
