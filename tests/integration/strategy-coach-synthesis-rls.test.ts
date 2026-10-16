/**
 * Fichier    : strategy-coach-synthesis-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration du préremplissage de la synthèse (S6b) sur la base de
 *              développement, sans appel au modèle : synthesize refusé hors de l'étape 5,
 *              décisions groupées (coach_decide_many) notées par un membre, refusées à un
 *              non-membre et refusées si un indice ou une décision est invalide. Ignorés si
 *              les clés manquent, si le coach est désactivé ou si la migration S6b n'est
 *              pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.1
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

/** Vrai si la migration S6b est appliquée (consigne synthesize présente) et le coach activé. */
async function ready(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const settings = await service
    .from("strategy_settings")
    .select("coach_enabled")
    .maybeSingle<{ coach_enabled: boolean }>();
  const prompt = await service
    .from("coach_prompts")
    .select("id")
    .eq("function", "synthesize")
    .limit(1);
  return !settings.error && Boolean(settings.data?.coach_enabled)
    && !prompt.error && (prompt.data?.length ?? 0) > 0;
}

const isReady = await ready();

describe.skipIf(!isReady)("RLS — préremplissage de la synthèse", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let outsider: SupabaseClient;
  const userIds: string[] = [];
  let studyId = "";
  let requestId = "";

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

  /** Réserve une demande du coach. */
  function reserve(fn: string, stepNo: number) {
    return owner.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: stepNo,
      p_function: fn,
      p_estimate: 0.0001,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("synthese-proprio");
    outsider = await signedInUser("synthese-externe");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Synthèse ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;
    // Forfait du coach (v0.11.1) : sans crédit, la réservation est refusée « coach_locked »
    const allowance = await service.from("coach_allowances").insert({
      study_id: studyId,
      amount_usd: 5,
      source: "admin_grant",
      note: `test ${RUN}`,
    });
    if (allowance.error) throw allowance.error;

    const profile = await owner.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Synthèse ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: { sector: "Ébénisterie", countries: ["Canada"], offers: ["Meubles"] },
    });
    if (profile.error) throw profile.error;

    // Demande terminée (relecture de l'étape 1) servant aux décisions groupées
    const reserved = await reserve("review", 1);
    if (reserved.error) throw reserved.error;
    requestId = (reserved.data as { request_id: string }[])[0].request_id;
    const done = await service.rpc("coach_complete", {
      p_request_id: requestId,
      p_status: "done",
      p_prompt_id: null,
      p_served_model: "modele-test",
      p_input_tokens: 100,
      p_output_tokens: 50,
      p_web_searches: 0,
      p_input: { revision: 1, payload: {} },
      p_output: { summary: "Ok", suggestions: [] },
      p_sources: [],
      p_error: null,
    });
    if (done.error) throw done.error;
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse le préremplissage hors de l'étape 5", async () => {
    for (const stepNo of [1, 4]) {
      const { error } = await reserve("synthesize", stepNo);
      expect(error?.message).toBe("invalid_request");
    }
  });

  it("note plusieurs décisions d'un coup pour un membre", async () => {
    const { error } = await owner.rpc("coach_decide_many", {
      p_request_id: requestId,
      p_decisions: { 0: "accepted", 3: "rejected" },
    });
    expect(error).toBeNull();

    const { data } = await service
      .from("coach_requests")
      .select("decisions")
      .eq("id", requestId)
      .single<{ decisions: Record<string, { decision: string }> }>();
    expect(data?.decisions["0"].decision).toBe("accepted");
    expect(data?.decisions["3"].decision).toBe("rejected");
  });

  it("refuse les décisions d'un non-membre", async () => {
    const { error } = await outsider.rpc("coach_decide_many", {
      p_request_id: requestId,
      p_decisions: { 1: "accepted" },
    });
    expect(error?.code).toBe("42501");
  });

  it("refuse un indice ou une décision invalide, et un objet vide", async () => {
    for (const decisions of [{ 50: "accepted" }, { a: "accepted" }, { 1: "kept" }, {}]) {
      const { error } = await owner.rpc("coach_decide_many", {
        p_request_id: requestId,
        p_decisions: decisions,
      });
      expect(error?.message).toBe("invalid_decision");
    }
  });
});
