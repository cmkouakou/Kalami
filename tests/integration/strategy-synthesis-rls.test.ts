/**
 * Fichier    : strategy-synthesis-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de S6a sur la base de développement : liste de contrôle
 *              SQL de l'étape 5 (synthèse) identique à celle du code (un élément par case
 *              de la SWOT, une piste TOWS, deux ou trois enjeux nommés). Ignorés si les clés
 *              manquent ou si la migration 20261021120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-14
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checklistOk } from "@/lib/strategy/templates/common";
import {
  newIssue,
  newSwotItem,
  newTowsItem,
  synthesisChecklist,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la liste de l'étape 5 existe (avant la migration, l'étape 5 passait toujours). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { data, error } = await service.rpc("strategy_checklist_ok", {
    p_step_no: 5,
    p_payload: {},
  });
  return !error && data === false;
}

const ready = await migrationApplied();

/**
 * Synthèse de test.
 * @param swot   - Texte du seul élément de chaque case (F, Fb, O, M)
 * @param tows   - Texte des pistes TOWS
 * @param issues - Titre des enjeux
 */
function synthesis(swot: string[], tows: string[], issues: string[]): SynthesisPayload {
  const [strength, weakness, opportunity, threat] = swot;
  const item = (id: string, text: string | undefined) =>
    text === undefined ? [] : [newSwotItem(id, text)];
  return {
    swot: {
      strengths: item("s", strength),
      weaknesses: item("w", weakness),
      opportunities: item("o", opportunity),
      threats: item("t", threat),
    },
    tows: tows.map((text, i) => ({ ...newTowsItem(`p${i}`, "so"), text })),
    issues: issues.map((title, i) => ({ ...newIssue(`e${i}`), title })),
  };
}

const SWOT = ["F", "Fb", "O", "M"];

describe.skipIf(!ready)("RLS — liste de contrôle de la synthèse (S6a)", () => {
  let service: SupabaseClient;
  let user: SupabaseClient;
  let userId = "";

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    const email = `synthese-${RUN}@test.kalami.local`;
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
    ["une case vide", synthesis(["F", "Fb", "O"], ["Piste"], ["A", "B"]), false],
    ["une case blanche", synthesis(["F", "Fb", "O", "  "], ["Piste"], ["A", "B"]), false],
    ["sans piste TOWS", synthesis(SWOT, [], ["A", "B"]), false],
    ["piste blanche", synthesis(SWOT, [" "], ["A", "B"]), false],
    ["un seul enjeu nommé", synthesis(SWOT, ["Piste"], ["A", " "]), false],
    ["deux enjeux", synthesis(SWOT, ["Piste"], ["A", "B"]), true],
    ["trois enjeux", synthesis(SWOT, ["Piste", ""], ["A", "B", "C"]), true],
  ] as const)("étape 5 : %s", async (_, payload, expected) => {
    const { data, error } = await user.rpc("strategy_checklist_ok", {
      p_step_no: 5,
      p_payload: payload,
    });
    expect(error).toBeNull();
    if ("swot" in payload) {
      expect(data).toBe(checklistOk(synthesisChecklist(payload as SynthesisPayload)));
    }
    expect(data).toBe(expected);
  });
});
