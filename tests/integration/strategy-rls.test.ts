/**
 * Fichier    : strategy-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de l'assistant stratégie sur la base de développement :
 *              crédit à usage unique, étude invisible aux non-membres, droits du contributeur
 *              et de l'observateur, synthèse verrouillée tant que 1 à 4 ne sont pas validées,
 *              cascade « à revoir », référence des étapes identique au code. Ignorés si les
 *              clés manquent ou si la migration Stratégie n'est pas encore appliquée. Avec
 *              la migration des gabarits (S2), les étapes 1 et 2 reçoivent d'abord un
 *              contenu qui remplit leur liste de contrôle.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { STEPS } from "@/lib/strategy/steps";
import { FORCES, initialForces } from "@/lib/strategy/templates/forces";
import { emptyPestel, newFactor } from "@/lib/strategy/templates/pestel";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration Stratégie existe sur la base (table studies). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("studies").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

/** Vrai si la migration des gabarits (S2) existe : il faut alors un contenu valide. */
async function templatesApplied(): Promise<boolean> {
  if (!ready) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("study_step_versions").select("id").limit(1);
  return !error;
}

const templates = await templatesApplied();

const PROFILE = {
  sector: "Ébénisterie",
  employees: 40,
  revenueRange: "",
  foundedYear: 1998,
  countries: ["Canada"],
  cities: [],
  markets: [],
  teams: [],
  offers: ["Meubles sur mesure"],
  clients: [],
  competitors: [],
};

describe.skipIf(!ready)("RLS — assistant stratégie", () => {
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
    await client.auth.signInWithPassword({ email, password });
    return client;
  }

  /** Statut d'une étape lu avec le client service. */
  async function stepStatus(stepNo: number): Promise<string> {
    const { data, error } = await service
      .from("study_steps")
      .select("status")
      .eq("study_id", studyId)
      .eq("step_no", stepNo)
      .single();
    if (error) throw error;
    return data.status;
  }

  /**
   * Enregistre un contenu qui remplit la liste de contrôle des étapes 1 et 2 (si la
   * migration des gabarits est appliquée ; sinon rien à faire).
   */
  async function fillTemplate(client: SupabaseClient, stepNo: number): Promise<void> {
    if (!templates || (stepNo !== 1 && stepNo !== 2)) return;
    let payload: object;
    if (stepNo === 1) {
      const pestel = emptyPestel();
      pestel.factors = [{ ...newFactor("f1", "economic"), factor: "Taux", nature: "both" }];
      payload = pestel;
    } else {
      const forces = initialForces(`Atelier ${RUN}`, []);
      for (const key of FORCES) forces.forces[key] = { intensity: "low", justification: "Fait." };
      payload = forces;
    }
    const current = await service
      .from("study_steps")
      .select("revision")
      .eq("study_id", studyId)
      .eq("step_no", stepNo)
      .single();
    const saved = await client.rpc("strategy_save_step", {
      p_study_id: studyId,
      p_step_no: stepNo,
      p_payload: payload,
      p_revision: current.data?.revision,
    });
    expect(saved.error).toBeNull();
  }

  /** Démarre puis valide une étape en tant que propriétaire. */
  async function startAndValidate(stepNo: number): Promise<void> {
    const start = await owner.rpc("strategy_start_step", {
      p_study_id: studyId,
      p_step_no: stepNo,
    });
    expect(start.error).toBeNull();
    await fillTemplate(owner, stepNo);
    const done = await owner.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: stepNo,
    });
    expect(done.error).toBeNull();
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("strat-proprio");
    contributor = await signedInUser("strat-contrib");
    observer = await signedInUser("strat-obs");
    outsider = await signedInUser("strat-externe");
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  // ==================== CRÉDITS ====================

  it("refuse la création sans crédit", async () => {
    const { error } = await owner.rpc("strategy_create_study", {
      p_company_name: `Atelier ${RUN}`,
      p_strategic_question: "",
    });
    expect(error?.message).toBe("no_credit");
  });

  it("interdit à un utilisateur de s'accorder un crédit", async () => {
    const { error } = await owner
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant" });
    expect(error).not.toBeNull();

    const grant = await owner.rpc("strategy_grant_credits", {
      p_email: `strat-proprio-${RUN}@test.kalami.local`,
      p_quantity: 1,
      p_note: "",
    });
    expect(grant.error).not.toBeNull();
  });

  it("consomme un crédit une seule fois", async () => {
    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    expect(credit.error).toBeNull();

    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Atelier ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    expect(created.error).toBeNull();
    studyId = created.data as string;

    const again = await owner.rpc("strategy_create_study", {
      p_company_name: `Atelier bis ${RUN}`,
      p_strategic_question: "",
    });
    expect(again.error?.message).toBe("no_credit");

    const steps = await owner.from("study_steps").select("step_no").eq("study_id", studyId);
    expect(steps.data).toHaveLength(9);

    // Membres invités directement (les invitations arrivent au S9)
    const members = await service.from("study_members").insert([
      { study_id: studyId, user_id: userIds[1], role: "contributor" },
      { study_id: studyId, user_id: userIds[2], role: "observer" },
    ]);
    expect(members.error).toBeNull();
  });

  // ==================== VISIBILITÉ ====================

  it("cache l'étude aux non-membres", async () => {
    const study = await outsider.from("studies").select("id").eq("id", studyId);
    expect(study.data).toEqual([]);
    const profile = await outsider.from("company_profiles").select("data").eq("study_id", studyId);
    expect(profile.data).toEqual([]);

    const save = await outsider.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: "Piratage",
      p_strategic_question: "",
      p_data: PROFILE,
    });
    expect(save.error?.code).toBe("42501");
  });

  it("interdit toute écriture directe dans les tables", async () => {
    const update = await owner
      .from("study_steps")
      .update({ status: "validated" })
      .eq("study_id", studyId)
      .select("step_no");
    expect(update.error !== null || update.data?.length === 0).toBe(true);
    expect(await stepStatus(1)).toBe("todo");
  });

  // ==================== RÔLES ====================

  it("laisse l'observateur lire sans rien modifier", async () => {
    const study = await observer.from("studies").select("id").eq("id", studyId);
    expect(study.data).toHaveLength(1);
    const save = await observer.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Atelier ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: PROFILE,
    });
    expect(save.error?.code).toBe("42501");
  });

  it("verrouille les étapes 1 à 4 tant que le profil est incomplet", async () => {
    const { error } = await owner.rpc("strategy_start_step", { p_study_id: studyId, p_step_no: 1 });
    expect(error?.message).toBe("prerequisites_missing");
  });

  it("laisse le contributeur remplir le profil mais pas valider", async () => {
    const save = await contributor.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Atelier ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: PROFILE,
    });
    expect(save.error).toBeNull();

    const start = await contributor.rpc("strategy_start_step", {
      p_study_id: studyId,
      p_step_no: 1,
    });
    expect(start.error).toBeNull();
    await fillTemplate(contributor, 1);
    const validate = await contributor.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: 1,
    });
    expect(validate.error?.message).toBe("not_owner");
  });

  // ==================== DÉPENDANCES ====================

  it("garde la synthèse verrouillée tant que 1 à 4 ne sont pas validées", async () => {
    const own1 = await owner.rpc("strategy_validate_step", { p_study_id: studyId, p_step_no: 1 });
    expect(own1.error).toBeNull();
    await startAndValidate(2);
    await startAndValidate(3);

    const early = await owner.rpc("strategy_start_step", { p_study_id: studyId, p_step_no: 5 });
    expect(early.error?.message).toBe("prerequisites_missing");

    await startAndValidate(4);
    await startAndValidate(5);
    expect(await stepStatus(5)).toBe("validated");
  });

  it("refuse de valider le plan à la main", async () => {
    const { error } = await owner.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: 9,
    });
    expect(error?.message).toBe("plan_step");
  });

  it("passe les étapes commencées en aval « à revoir » quand on rouvre une étape", async () => {
    const start6 = await owner.rpc("strategy_start_step", { p_study_id: studyId, p_step_no: 6 });
    expect(start6.error).toBeNull();

    const reopen = await contributor.rpc("strategy_reopen_step", {
      p_study_id: studyId,
      p_step_no: 2,
    });
    expect(reopen.error).toBeNull();
    expect(reopen.data).toBe(2);

    expect(await stepStatus(2)).toBe("in_progress");
    expect(await stepStatus(5)).toBe("needs_review");
    expect(await stepStatus(6)).toBe("needs_review");
    expect(await stepStatus(7)).toBe("todo");
    expect(await stepStatus(1)).toBe("validated");
  });

  // ==================== RÉFÉRENCE ====================

  it("a la même référence des étapes que le code", async () => {
    const { data, error } = await owner
      .from("strategy_steps")
      .select("step_no, module, phase, prerequisites, requires_profile")
      .order("step_no");
    expect(error).toBeNull();
    expect(data).toEqual(
      STEPS.map((step) => ({
        step_no: step.no,
        module: step.module,
        phase: step.phase,
        prerequisites: step.prerequisites,
        requires_profile: step.requiresProfile,
      })),
    );
  });
});
