/**
 * Fichier    : strategy-coach-research-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de la recherche Web du coach IA (S5a) sur la base de
 *              développement, sans appel au modèle : recherche refusée hors des étapes 1
 *              et 2, coût des recherches ajouté par coach_complete, sources Web lisibles
 *              par les membres seulement et jamais écrites directement. Ignorés si les clés
 *              manquent, si le coach est désactivé ou si la migration S5a n'est pas appliquée.
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

/** Vrai si la migration S5a est appliquée et le coach activé. */
async function ready(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { data, error } = await service
    .from("strategy_settings")
    .select("coach_enabled, coach_search_price")
    .maybeSingle<{ coach_enabled: boolean }>();
  return !error && Boolean(data?.coach_enabled);
}

const isReady = await ready();

describe.skipIf(!isReady)("RLS — recherche Web du coach IA", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
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

  /** Réserve une recherche à l'étape donnée. */
  function reserve(stepNo: number) {
    return owner.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: stepNo,
      p_function: "research",
      p_estimate: 0.0001,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("recherche-proprio");
    outsider = await signedInUser("recherche-externe");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Recherche ${RUN}`,
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
      p_company_name: `Recherche ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: {
        sector: "Ébénisterie",
        countries: ["Canada"],
        offers: ["Meubles sur mesure"],
        competitors: ["Rival"],
      },
    });
    if (profile.error) throw profile.error;
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse la recherche hors des étapes 1 et 2", async () => {
    for (const stepNo of [3, 4]) {
      const { error } = await reserve(stepNo);
      expect(error?.message).toBe("invalid_request");
    }
  });

  it("ajoute le coût des recherches et conserve les sources pour les membres", async () => {
    const { data, error } = await reserve(1);
    expect(error).toBeNull();
    const row = (data as { request_id: string; search_max_uses: number }[])[0];
    expect(row.request_id).toBeTruthy();
    expect(row.search_max_uses).toBeGreaterThanOrEqual(1);

    const done = await service.rpc("coach_complete", {
      p_request_id: row.request_id,
      p_status: "done",
      p_prompt_id: null,
      p_served_model: "modele-test",
      p_input_tokens: 1000,
      p_output_tokens: 500,
      p_web_searches: 2,
      p_input: { revision: 1, payload: {} },
      p_output: { summary: "Ok", facts: [] },
      p_sources: [{
        factIndex: 0,
        fact: "Hausse des prix du bois",
        url: "https://www.example.org/rapport",
        title: "Rapport annuel",
        site: "example.org",
        pageAge: "2026-03-01",
      }],
      p_error: null,
    });
    expect(done.error).toBeNull();

    const prices = await service
      .from("coach_requests")
      .select("input_price, output_price, search_price, web_searches")
      .eq("id", row.request_id)
      .single<{ input_price: number; output_price: number; search_price: number;
        web_searches: number }>();
    const p = prices.data!;
    expect(p.web_searches).toBe(2);
    const expected = (1000 * Number(p.input_price) + 500 * Number(p.output_price)) / 1e6
      + 2 * Number(p.search_price);
    expect(Number(done.data)).toBeCloseTo(expected, 6);

    const asOwner = await owner.from("web_sources").select("url").eq("study_id", studyId);
    expect(asOwner.data).toEqual([{ url: "https://www.example.org/rapport" }]);
    const asOutsider = await outsider.from("web_sources").select("url").eq("study_id", studyId);
    expect(asOutsider.data).toEqual([]);
  });

  it("refuse toute écriture directe dans les sources", async () => {
    const { data } = await service
      .from("coach_requests")
      .select("id")
      .eq("study_id", studyId)
      .limit(1)
      .single<{ id: string }>();
    const forged = await owner.from("web_sources").insert({
      study_id: studyId,
      request_id: data!.id,
      step_no: 1,
      fact_index: 0,
      fact: "Faux",
      url: "https://faux.example",
    });
    expect(forged.error).not.toBeNull();
  });
});
