/**
 * Fichier    : strategy-direction-choice-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de S7a sur la base de développement : listes de contrôle
 *              SQL des étapes 6 (cap) et 7 (choix) identiques à celles du code. Ignorés si
 *              les clés manquent ou si la migration 20261023120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  choiceChecklist,
  newOption,
  newRenunciation,
  type ChoicePayload,
  type StrategicOption,
} from "@/lib/strategy/templates/choice";
import { checklistOk } from "@/lib/strategy/templates/common";
import {
  directionChecklist,
  newObjective,
  newValue,
  type DirectionPayload,
} from "@/lib/strategy/templates/direction";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la liste de l'étape 6 existe (avant la migration, l'étape 6 passait toujours). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { data, error } = await service.rpc("strategy_checklist_ok", {
    p_step_no: 6,
    p_payload: {},
  });
  return !error && data === false;
}

const ready = await migrationApplied();

// ==================== JEUX DE DONNÉES ====================

const VISION = "Infosystem sera le partenaire numérique des PME de Lasalle.";
const ALL_SMART = {
  specific: true,
  measurable: true,
  achievable: true,
  realistic: true,
  timeBound: true,
};

/** Cap complet, modifié par `patch`. */
function direction(patch: Partial<DirectionPayload> = {}): DirectionPayload {
  return {
    vision: { id: "vision", text: VISION },
    nameTest: { competitor: "Alpha", answer: "no", testedVision: VISION },
    mission: { id: "mission", text: "Simplifier le numérique des PME." },
    values: [
      { ...newValue("v1"), name: "Proximité", gesture: "Visite mensuelle" },
      { ...newValue("v2"), name: "Clarté", gesture: "Devis en une page" },
    ],
    objectives: [{ ...newObjective("o1"), text: "Doubler les contrats", smart: ALL_SMART }],
    ...patch,
  };
}

/** Option rédigée et notée, écartée par défaut. */
function option(id: string, patch: Partial<StrategicOption> = {}): StrategicOption {
  return {
    ...newOption(id, "penetration"),
    text: `Option ${id}`,
    relevance: "yes",
    acceptability: "partial",
    feasibility: "no",
    decision: "rejected",
    ...patch,
  };
}

/** Choix complet, modifié par `patch`. */
function choice(patch: Partial<ChoicePayload> = {}): ChoicePayload {
  return {
    generic: { id: "generic", position: "focusCost", justification: "" },
    options: [option("a", { decision: "retained" }), option("b")],
    statement: { id: "statement", text: "Nous visons les PME par les coûts." },
    renunciations: [{ ...newRenunciation("r1"), text: "Pas de grands comptes" }],
    ...patch,
  };
}

describe.skipIf(!ready)("RLS — listes de contrôle du cap et du choix (S7a)", () => {
  let service: SupabaseClient;
  let user: SupabaseClient;
  let userId = "";

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    const email = `cap-choix-${RUN}@test.kalami.local`;
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
    ["cap complet", direction(), true],
    ["vision blanche", direction({ vision: { id: "vision", text: " " } }), false],
    [
      "vision changée depuis le test",
      direction({ vision: { id: "vision", text: `${VISION} Bientôt.` } }),
      false,
    ],
    [
      "test du nom échoué",
      direction({ nameTest: { competitor: "Alpha", answer: "yes", testedVision: VISION } }),
      false,
    ],
    ["mission vide", direction({ mission: { id: "mission", text: "" } }), false],
    [
      "une valeur sans geste",
      direction({
        values: [
          { ...newValue("v1"), name: "Proximité", gesture: "Visite" },
          { ...newValue("v2"), name: "Clarté", gesture: " " },
        ],
      }),
      false,
    ],
    [
      "objectif sans échéance cochée",
      direction({
        objectives: [
          { ...newObjective("o1"), text: "Doubler", smart: { ...ALL_SMART, timeBound: false } },
        ],
      }),
      false,
    ],
  ] as const)("étape 6 : %s", async (_, payload, expected) => {
    const { data, error } = await user.rpc("strategy_checklist_ok", {
      p_step_no: 6,
      p_payload: payload,
    });
    expect(error).toBeNull();
    if ("vision" in payload) {
      expect(data).toBe(checklistOk(directionChecklist(payload as DirectionPayload)));
    }
    expect(data).toBe(expected);
  });

  it.each([
    ["contenu vide", {}, false],
    ["choix complet, option retenue malgré un « non »", choice(), true],
    [
      "sans position",
      choice({ generic: { id: "generic", position: null, justification: "" } }),
      false,
    ],
    [
      "une seule option évaluée",
      choice({
        options: [option("a", { decision: "retained" }), option("b", { feasibility: null })],
      }),
      false,
    ],
    ["aucune option retenue", choice({ options: [option("a"), option("b")] }), false],
    ["énoncé blanc", choice({ statement: { id: "statement", text: "  " } }), false],
    ["renoncement vide", choice({ renunciations: [newRenunciation("r1")] }), false],
  ] as const)("étape 7 : %s", async (_, payload, expected) => {
    const { data, error } = await user.rpc("strategy_checklist_ok", {
      p_step_no: 7,
      p_payload: payload,
    });
    expect(error).toBeNull();
    if ("generic" in payload) {
      expect(data).toBe(checklistOk(choiceChecklist(payload as ChoicePayload)));
    }
    expect(data).toBe(expected);
  });
});
