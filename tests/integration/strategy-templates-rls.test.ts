/**
 * Fichier    : strategy-templates-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration des gabarits (S2) sur la base de développement :
 *              sauvegarde avec révision, conflit, observateur et non-membre refusés,
 *              liste de contrôle avant validation, étape validée en lecture seule,
 *              versions et restauration. Ignorés si les clés manquent ou si la migration
 *              des gabarits n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { emptyPestel, newFactor, type PestelPayload } from "@/lib/strategy/templates/pestel";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration des gabarits existe sur la base (table study_step_versions). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("study_step_versions").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

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
  competitors: ["Rival"],
};

/** Contenu PESTEL avec les facteurs donnés (nom, nature). */
function pestel(...factors: [string, "opportunity" | "threat" | "both"][]): PestelPayload {
  const payload = emptyPestel();
  payload.factors = factors.map(([name, nature], i) => ({
    ...newFactor(`f${i}`, "economic"),
    factor: name,
    nature,
  }));
  return payload;
}

describe.skipIf(!ready)("RLS — gabarits de l'assistant stratégie", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let contributor: SupabaseClient;
  let observer: SupabaseClient;
  let outsider: SupabaseClient;
  const userIds: string[] = [];
  let studyId = "";
  let revision = 0;

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

  /** Enregistre le gabarit de l'étape 1 avec le client et la révision donnés. */
  function save(client: SupabaseClient, payload: unknown, rev: number) {
    return client.rpc("strategy_save_step", {
      p_study_id: studyId,
      p_step_no: 1,
      p_payload: payload,
      p_revision: rev,
    });
  }

  /** Versions de l'étape 1, de la plus récente à la plus ancienne. */
  async function versions(client: SupabaseClient) {
    const { data, error } = await client
      .from("study_step_versions")
      .select("id, revision, reason, payload")
      .eq("study_id", studyId)
      .eq("step_no", 1)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("gab-proprio");
    contributor = await signedInUser("gab-contrib");
    observer = await signedInUser("gab-obs");
    outsider = await signedInUser("gab-externe");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Atelier ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;

    const profile = await owner.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Atelier ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: PROFILE,
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

  // ==================== SAUVEGARDE ====================

  it("enregistre le contenu, avance la révision et commence l'étape", async () => {
    const first = await save(contributor, pestel(["Taux", "opportunity"]), 0);
    expect(first.error).toBeNull();
    expect(first.data).toBe(1);
    revision = 1;

    const step = await service
      .from("study_steps")
      .select("status, revision, payload")
      .eq("study_id", studyId)
      .eq("step_no", 1)
      .single();
    expect(step.data?.status).toBe("in_progress");
    expect(step.data?.revision).toBe(1);
    expect(step.data?.payload.factors[0].factor).toBe("Taux");
  });

  it("refuse une révision périmée (autre onglet, autre membre)", async () => {
    const stale = await save(owner, pestel(["Autre", "threat"]), 0);
    expect(stale.error?.message).toBe("revision_conflict");
  });

  it("refuse un contenu qui n'est pas un objet", async () => {
    const bad = await save(owner, ["liste"], revision);
    expect(bad.error?.message).toBe("invalid_payload");
  });

  it("refuse l'observateur et les non-membres", async () => {
    const asObserver = await save(observer, pestel(), revision);
    expect(asObserver.error?.code).toBe("42501");
    const asOutsider = await save(outsider, pestel(), revision);
    expect(asOutsider.error?.code).toBe("42501");
  });

  it("refuse d'écrire les versions directement", async () => {
    const insert = await owner.from("study_step_versions").insert({
      study_id: studyId,
      step_no: 1,
      payload: {},
      revision: 99,
      reason: "auto",
    });
    expect(insert.error).not.toBeNull();
  });

  // ==================== VERSIONS ====================

  it("garde une version automatique par tranche de 15 minutes", async () => {
    const second = await save(owner, pestel(["Taux", "opportunity"], ["Loi", "threat"]), revision);
    expect(second.error).toBeNull();
    revision = second.data as number;

    const list = await versions(observer);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ revision: 1, reason: "auto" });
  });

  it("cache les versions aux non-membres", async () => {
    expect(await versions(outsider)).toEqual([]);
  });

  it("restaure une version en gardant l'état courant", async () => {
    const [first] = await versions(owner);
    const restored = await contributor.rpc("strategy_restore_version", {
      p_study_id: studyId,
      p_step_no: 1,
      p_version_id: first.id,
      p_revision: revision,
    });
    expect(restored.error).toBeNull();
    revision = restored.data as number;

    const list = await versions(owner);
    expect(list.map((version) => version.reason).slice(0, 2).sort()).toEqual(["auto", "restore"]);
    const snapshot = list.find((version) => version.reason === "auto" && version.revision === 2);
    expect(snapshot?.payload.factors).toHaveLength(2);

    const step = await service
      .from("study_steps")
      .select("payload")
      .eq("study_id", studyId)
      .eq("step_no", 1)
      .single();
    expect(step.data?.payload.factors).toHaveLength(1);
  });

  it("refuse la restauration à l'observateur", async () => {
    const [latest] = await versions(owner);
    const { error } = await observer.rpc("strategy_restore_version", {
      p_study_id: studyId,
      p_step_no: 1,
      p_version_id: latest.id,
      p_revision: revision,
    });
    expect(error?.code).toBe("42501");
  });

  // ==================== VALIDATION ====================

  it("refuse la validation tant que la liste de contrôle est incomplète", async () => {
    const { error } = await owner.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: 1,
    });
    expect(error?.message).toBe("checklist_incomplete");
  });

  it("valide quand un facteur « les deux » remplit la liste, puis fige l'étape", async () => {
    const saved = await save(owner, pestel(["Taux", "both"]), revision);
    expect(saved.error).toBeNull();
    revision = saved.data as number;

    const validated = await owner.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: 1,
    });
    expect(validated.error).toBeNull();
    const [latest] = await versions(owner);
    expect(latest.reason).toBe("validation");

    const frozen = await save(contributor, pestel(), revision);
    expect(frozen.error?.message).toBe("step_validated");
  });

  it("refuse l'étape 2 tant que ses cinq forces ne sont pas justifiées", async () => {
    await owner.rpc("strategy_start_step", { p_study_id: studyId, p_step_no: 2 });
    const { error } = await owner.rpc("strategy_validate_step", {
      p_study_id: studyId,
      p_step_no: 2,
    });
    expect(error?.message).toBe("checklist_incomplete");
  });
});
