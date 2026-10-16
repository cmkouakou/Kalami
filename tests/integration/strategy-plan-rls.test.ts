/**
 * Fichier    : strategy-plan-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration du plan stratégique (S8a) sur la base de développement,
 *              sans appel au modèle : l'étape 9 s'enregistre une fois les étapes 1 à 8
 *              validées, ne se valide jamais, refuse un observateur ; la fonction « plan » du
 *              coach n'est admise qu'à l'étape 9 et sans pièce jointe. Ignorés si les clés
 *              manquent ou si la migration 20261025120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { emptyPlan } from "@/lib/strategy/templates/plan";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration S8a est appliquée (consigne « plan » présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { data, error } = await service
    .from("coach_prompts")
    .select("id")
    .eq("function", "plan")
    .limit(1);
  return !error && (data?.length ?? 0) > 0;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — plan stratégique (S8a)", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let observer: SupabaseClient;
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

  /** Révision actuelle de l'étape 9. */
  async function planRevision(): Promise<number> {
    const { data } = await service
      .from("study_steps")
      .select("revision")
      .eq("study_id", studyId)
      .eq("step_no", 9)
      .single<{ revision: number }>();
    return data?.revision ?? 0;
  }

  /** Enregistre le plan vide à l'étape `stepNo` pour `client`. */
  async function savePlan(client: SupabaseClient, stepNo = 9) {
    return client.rpc("strategy_save_step", {
      p_study_id: studyId,
      p_step_no: stepNo,
      p_payload: emptyPlan(),
      p_revision: await planRevision(),
    });
  }

  /** Réserve une demande du coach (refusée avant tout calcul de coût dans ces tests). */
  function reserve(fn: string, stepNo: number | null) {
    return owner.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: stepNo,
      p_function: fn,
      p_estimate: 0.0001,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("plan-proprio");
    observer = await signedInUser("plan-observateur");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Plan ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;

    const profile = await owner.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Plan ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: { sector: "Ébénisterie", countries: ["Canada"], offers: ["Meubles"] },
    });
    if (profile.error) throw profile.error;

    const member = await service
      .from("study_members")
      .insert({ study_id: studyId, user_id: userIds[1], role: "observer" });
    if (member.error) throw member.error;
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse le plan tant que les étapes 1 à 8 ne sont pas validées", async () => {
    const { error } = await savePlan(owner);
    expect(error?.message).toBe("prerequisites_missing");
    const reserved = await reserve("plan", 9);
    expect(reserved.error?.message).toBe("prerequisites_missing");
  });

  it("refuse une étape hors de 1 à 9", async () => {
    const { error } = await savePlan(owner, 10);
    expect(error?.message).toBe("invalid_step");
  });

  it("refuse la fonction plan hors de l'étape 9 et les autres fonctions à l'étape 9", async () => {
    for (const [fn, stepNo] of [["plan", 8], ["plan", null], ["review", 9]] as const) {
      const { error } = await reserve(fn, stepNo);
      expect(error?.message).toBe("invalid_request");
    }
  });

  it("enregistre le plan une fois les étapes validées, sans jamais le valider", async () => {
    const validated = await service
      .from("study_steps")
      .update({ status: "validated", validated_at: new Date().toISOString() })
      .eq("study_id", studyId)
      .lte("step_no", 8);
    expect(validated.error).toBeNull();

    const before = await planRevision();
    const saved = await savePlan(owner);
    expect(saved.error).toBeNull();
    expect(await planRevision()).toBe(before + 1);

    const validate = await owner.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: 9,
    });
    expect(validate.error?.message).toBe("plan_step");
  });

  it("refuse l'enregistrement du plan à un observateur", async () => {
    const { error } = await savePlan(observer);
    expect(error?.code).toBe("42501");
  });
});
