/**
 * Fichier    : strategy-coach-admin-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de l'administration du coach IA (S4b) sur la base de
 *              développement : fonctions de gestion des consignes et des erreurs classiques
 *              refusées à un non-administrateur, brouillons et historique des erreurs
 *              jamais lisibles par lui. Ignorés si les clés manquent ou si la migration
 *              d'administration du coach n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
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

/** Vrai si la migration d'administration du coach est appliquée (historique des erreurs). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("coach_rule_versions").select("rule_id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — administration du coach IA", () => {
  let service: SupabaseClient;
  let member: SupabaseClient;
  let userId = "";

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    const email = `coach-admin-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    member = createClient(url!, publishableKey!, NO_SESSION);
    const signedIn = await member.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
  });

  afterAll(async () => {
    if (userId) await service.auth.admin.deleteUser(userId);
  });

  it("refuse la gestion des consignes à un non-administrateur", async () => {
    const draft = await member.rpc("admin_save_coach_prompt_draft", {
      p_function: "review",
      p_step_no: null,
      p_body: "Consigne pirate",
      p_note: "",
    });
    expect(draft.error?.code).toBe("42501");

    const { data } = await service.from("coach_prompts").select("id").limit(1).single();
    for (const fn of [
      "admin_publish_coach_prompt",
      "admin_discard_coach_prompt_draft",
      "admin_restore_coach_prompt",
    ]) {
      const { error } = await member.rpc(fn, { p_id: data!.id });
      expect(error?.code).toBe("42501");
    }
  });

  it("refuse la gestion des erreurs classiques à un non-administrateur", async () => {
    const { error } = await member.rpc("admin_save_coach_rule", {
      p_id: null,
      p_code: `pirate_${RUN}`,
      p_step_no: 1,
      p_title: "Règle pirate",
      p_explanation: "",
      p_position: 1,
      p_active: true,
    });
    expect(error?.code).toBe("42501");
    const created = await service.from("coach_rules").select("id").eq("code", `pirate_${RUN}`);
    expect(created.data).toEqual([]);
  });

  it("ne montre ni les brouillons ni l'historique des erreurs", async () => {
    const drafts = await service.from("coach_prompts").select("id").is("published_at", null);
    expect(drafts.error).toBeNull();
    const ownDrafts = await member.from("coach_prompts").select("id").is("published_at", null);
    expect(ownDrafts.data).toEqual([]);

    const history = await service.from("coach_rule_versions").select("rule_id").limit(1);
    expect(history.data?.length).toBeGreaterThan(0);
    const ownHistory = await member.from("coach_rule_versions").select("rule_id");
    expect(ownHistory.data).toEqual([]);

    // Aucune écriture directe dans l'historique
    const forged = await member
      .from("coach_rule_versions")
      .insert({ rule_id: crypto.randomUUID(), title: "Faux" });
    expect(forged.error).not.toBeNull();
  });
});
