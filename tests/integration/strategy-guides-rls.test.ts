/**
 * Fichier    : strategy-guides-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de S3 sur la base de développement : guide des étapes
 *              modifiable par l'administrateur seulement (RPC, plus d'écriture directe),
 *              réglages invisibles aux utilisateurs, aucun lien de lecture sans droit
 *              d'accès au livre, et listes de contrôle SQL des étapes 3 et 4 identiques à
 *              celles du code. Ignorés si les clés manquent ou si la migration des guides
 *              n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  initialInternal,
  internalChecklist,
  newResource,
  PORTER_ACTIVITIES,
  type InternalPayload,
} from "@/lib/strategy/templates/internal";
import { checklistOk } from "@/lib/strategy/templates/common";
import {
  newStakeholder,
  stakeholdersChecklist,
  type StakeholdersPayload,
} from "@/lib/strategy/templates/stakeholders";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration des guides existe sur la base (table strategy_settings). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("strategy_settings").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

const LABELS = Object.fromEntries(PORTER_ACTIVITIES.map(({ key }) => [key, key]));

/** Analyse interne : activités évaluées ou non, ressource complète ou non. */
function internal(evaluated: boolean, resourceDone: boolean): InternalPayload {
  const payload = initialInternal(LABELS);
  if (evaluated) {
    payload.activities = payload.activities.map((a) => ({ ...a, evaluation: "improve" }));
  }
  const resource = { ...newResource("r1"), name: "Marque" };
  resource.tests.value = { answer: "partial", justification: "" };
  if (resourceDone) {
    resource.tests.rarity = { answer: "no", justification: "" };
    resource.tests.imitability = { answer: "yes", justification: "" };
    resource.tests.organization = { answer: "yes", justification: "" };
  }
  payload.resources = [resource];
  return payload;
}

/** Parties prenantes : une fiche nommée, avec ou sans approche. */
function stakeholders(approach: string): StakeholdersPayload {
  return {
    stakeholders: [{ ...newStakeholder("p1"), name: "Syndicat", power: 3, interest: 5, approach }],
  };
}

describe.skipIf(!ready)("RLS — guide des étapes et gabarits S3", () => {
  let service: SupabaseClient;
  let user: SupabaseClient;
  let userId = "";

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    const email = `guide-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    user = createClient(url!, publishableKey!, NO_SESSION);
    await user.auth.signInWithPassword({ email, password });
  });

  afterAll(async () => {
    if (userId) await service.auth.admin.deleteUser(userId);
  });

  // ==================== GUIDE (ADMINISTRATION) ====================

  it("refuse la modification du guide à un utilisateur", async () => {
    const { error } = await user.rpc("admin_update_strategy_step", {
      p_step_no: 1,
      p_explanation: "Piratage",
      p_example: "",
      p_lock_reason: "",
      p_chapter_position: null,
    });
    expect(error?.code).toBe("42501");
  });

  it("refuse le choix du livre guide à un utilisateur", async () => {
    const { error } = await user.rpc("admin_set_strategy_guide_book", { p_book_id: null });
    expect(error?.code).toBe("42501");
  });

  it("n'autorise plus l'écriture directe dans la référence des étapes", async () => {
    await user.from("strategy_steps").update({ explanation: "Piratage" }).eq("step_no", 1);
    const { data } = await service
      .from("strategy_steps")
      .select("explanation")
      .eq("step_no", 1)
      .single();
    expect(data?.explanation).not.toBe("Piratage");
  });

  it("cache les réglages du guide aux utilisateurs", async () => {
    const { data } = await user.from("strategy_settings").select("guide_book_id");
    expect(data ?? []).toEqual([]);
  });

  it("ne donne aucun lien de lecture sans droit d'accès au livre", async () => {
    const { data, error } = await user.rpc("strategy_step_reading", { p_step_no: 1 });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  // ==================== LISTES DE CONTRÔLE (MIROIR DU CODE) ====================

  it.each([
    [false, false],
    [true, false],
    [true, true],
  ])("étape 3 : activités évaluées %s, ressource complète %s", async (evaluated, done) => {
    const payload = internal(evaluated, done);
    const { data, error } = await user.rpc("strategy_checklist_ok", {
      p_step_no: 3,
      p_payload: payload,
    });
    expect(error).toBeNull();
    expect(data).toBe(checklistOk(internalChecklist(payload)));
    expect(data).toBe(evaluated && done);
  });

  it.each([["", false], ["Rencontre mensuelle", true]])(
    "étape 4 : approche « %s »",
    async (approach, expected) => {
      const payload = stakeholders(approach);
      const { data, error } = await user.rpc("strategy_checklist_ok", {
        p_step_no: 4,
        p_payload: payload,
      });
      expect(error).toBeNull();
      expect(data).toBe(checklistOk(stakeholdersChecklist(payload)));
      expect(data).toBe(expected);
    },
  );
});
