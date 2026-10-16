/**
 * Fichier    : strategy-action-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de S7b sur la base de développement : liste de contrôle
 *              SQL de l'étape 8 (action) identique à celle du code. Ignorés si les clés
 *              manquent ou si la migration 20261024120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  actionChecklist,
  newIndicator,
  newWorkstream,
  PERSPECTIVES,
  type ActionPayload,
  type Indicator,
  type Workstream,
} from "@/lib/strategy/templates/action";
import { checklistOk } from "@/lib/strategy/templates/common";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la liste de l'étape 8 existe (avant la migration, l'étape 8 passait toujours). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { data, error } = await service.rpc("strategy_checklist_ok", {
    p_step_no: 8,
    p_payload: {},
  });
  return !error && data === false;
}

const ready = await migrationApplied();

// ==================== JEUX DE DONNÉES ====================

/** Chantier complet, modifié par `patch`. */
function workstream(patch: Partial<Workstream> = {}): Workstream {
  return {
    ...newWorkstream("w1"),
    name: "Offre PME",
    owner: "Directrice des ventes",
    start: "2027-01",
    end: "2027-06",
    ...patch,
  };
}

/** Un indicateur nommé par perspective. */
function indicators(): Indicator[] {
  return PERSPECTIVES.map((perspective, index) => ({
    ...newIndicator(`i${index}`, perspective),
    name: `Indicateur ${perspective}`,
  }));
}

/** Action complète, modifiée par `patch`. */
function action(patch: Partial<ActionPayload> = {}): ActionPayload {
  return { workstreams: [workstream()], indicators: indicators(), risks: [], ...patch };
}

describe.skipIf(!ready)("RLS — liste de contrôle de l'action (S7b)", () => {
  let service: SupabaseClient;
  let user: SupabaseClient;
  let userId = "";

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    const email = `action-${RUN}@test.kalami.local`;
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

  it.each([
    ["contenu vide", {}, false],
    ["action complète", action(), true],
    ["fin le mois du début", action({ workstreams: [workstream({ end: "2027-01" })] }), true],
    ["chantier sans nom", action({ workstreams: [workstream({ name: " " })] }), false],
    ["chantier sans responsable", action({ workstreams: [workstream({ owner: "" })] }), false],
    ["chantier sans début", action({ workstreams: [workstream({ start: "" })] }), false],
    ["fin avant le début", action({ workstreams: [workstream({ end: "2026-12" })] }), false],
    [
      "un chantier incomplet et un complet",
      action({ workstreams: [workstream({ id: "w0", owner: "" }), workstream()] }),
      true,
    ],
    [
      "perspective apprentissage absente",
      action({ indicators: indicators().filter((item) => item.perspective !== "learning") }),
      false,
    ],
    [
      "indicateur client sans nom",
      action({
        indicators: indicators().map((item) =>
          item.perspective === "customer" ? { ...item, name: "  " } : item,
        ),
      }),
      false,
    ],
  ] as const)("étape 8 : %s", async (_, payload, expected) => {
    const { data, error } = await user.rpc("strategy_checklist_ok", {
      p_step_no: 8,
      p_payload: payload,
    });
    expect(error).toBeNull();
    if ("workstreams" in payload) {
      expect(data).toBe(checklistOk(actionChecklist(payload as ActionPayload)));
    }
    expect(data).toBe(expected);
  });
});
