/**
 * Fichier    : strategy-guides-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de S3 sur la base de développement : guide des étapes
 *              modifiable par l'administrateur seulement (RPC, plus d'écriture directe),
 *              réglages invisibles aux utilisateurs, aucun lien de lecture sans droit
 *              d'accès au livre, et listes de contrôle SQL des étapes 3 et 4 identiques à
 *              celles du code (règles v0.4.1 : modèle, 4 activités, 3 ressources ; 5 parties
 *              prenantes placées dont une à pouvoir fort). Ignorés si les clés manquent ou
 *              si la migration correspondante n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  emptyInternal,
  internalChecklist,
  newResource,
  PORTER_ACTIVITIES,
  withModel,
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

/** Vrai si les textes v0.4.1 sont chargés (étape 1 rattachée au chapitre 7). */
async function contentApplied(): Promise<boolean> {
  if (!ready) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { data } = await service
    .from("strategy_steps")
    .select("chapter_position")
    .eq("step_no", 1)
    .single();
  return data?.chapter_position === 7;
}

const ready = await migrationApplied();
const content = await contentApplied();

const LABELS = Object.fromEntries(PORTER_ACTIVITIES.map(({ key }) => [key, key]));

/**
 * Analyse interne de test.
 * @param evaluated - Nombre d'activités évaluées (sur les 9 de Porter)
 * @param complete  - Nombre de ressources avec les quatre réponses
 * @param partial   - Nombre de ressources avec une seule réponse
 */
function internal(evaluated: number, complete: number, partial = 0): InternalPayload {
  const payload = withModel(emptyInternal(), "porter", LABELS);
  payload.activities = payload.activities.map((a, i) =>
    i < evaluated ? { ...a, evaluation: "improve" } : a,
  );
  payload.resources = Array.from({ length: complete + partial }, (_, i) => {
    const resource = { ...newResource(`r${i}`), name: `Ressource ${i}` };
    resource.tests.value = { answer: "partial", justification: "" };
    if (i < complete) {
      resource.tests.rarity = { answer: "no", justification: "" };
      resource.tests.imitability = { answer: "yes", justification: "" };
      resource.tests.organization = { answer: "yes", justification: "" };
    }
    return resource;
  });
  return payload;
}

/**
 * Parties prenantes de test (pouvoir, intérêt et case à la main de chacune).
 * @param levels - [pouvoir, intérêt, case choisie à la main ?] par partie prenante
 */
function stakeholders(
  levels: [number | null, number | null, ("manage" | "satisfy" | "inform" | "monitor")?][],
): StakeholdersPayload {
  return {
    stakeholders: levels.map(([power, interest, override], i) => ({
      ...newStakeholder(`p${i}`),
      name: `Partie ${i}`,
      power,
      interest,
      quadrantOverride: override ?? null,
    })),
  };
}

const LOW = [1, 1] as [number, number];

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

  /** Compare le résultat SQL à celui du code et à l'attendu. */
  async function expectChecklist(stepNo: number, payload: object, expected: boolean) {
    const { data, error } = await user.rpc("strategy_checklist_ok", {
      p_step_no: stepNo,
      p_payload: payload,
    });
    expect(error).toBeNull();
    const code =
      stepNo === 3
        ? checklistOk(internalChecklist(payload as InternalPayload))
        : checklistOk(stakeholdersChecklist(payload as StakeholdersPayload));
    expect(data).toBe(code);
    expect(data).toBe(expected);
  }

  it.skipIf(!content).each([
    ["3 activités évaluées", internal(3, 3), false],
    ["2 ressources complètes", internal(4, 2), false],
    ["une ressource incomplète", internal(9, 3, 1), false],
    ["sans modèle", { ...internal(4, 3), model: null }, false],
    ["4 activités et 3 ressources", internal(4, 3), true],
  ] as const)("étape 3 : %s", async (_, payload, expected) => {
    await expectChecklist(3, payload, expected);
  });

  it.skipIf(!content).each([
    ["4 parties prenantes", stakeholders([[4, 4], LOW, LOW, LOW]), false],
    ["une non placée", stakeholders([[4, 4], LOW, LOW, LOW, [null, 3]]), false],
    ["aucun pouvoir fort", stakeholders([[2, 5], LOW, LOW, LOW, LOW]), false],
    ["pouvoir fort à la main", stakeholders([[2, 5, "satisfy"], LOW, LOW, LOW, LOW]), true],
    ["placée à la main", stakeholders([[4, 2], LOW, LOW, LOW, [null, null, "inform"]]), true],
  ] as const)("étape 4 : %s", async (_, payload, expected) => {
    await expectChecklist(4, payload, expected);
  });
});
