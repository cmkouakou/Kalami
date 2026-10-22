/**
 * Fichier    : security-audit-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des correctifs de l'audit des droits (Sprint 11s-2) sur la
 *              base de développement : registre des consentements réservé au serveur,
 *              comptage des pièces jointes limité aux membres, fonctions d'avancement d'une
 *              étude fermées aux comptes. Ignorés si les clés manquent ou si la migration
 *              20261112120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-22
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);
const BUCKET = "study-attachments";
const PDF = "application/pdf";
const CONTENT = new TextEncoder().encode("%PDF-1.4\n% test Kalami\n");

/** Vrai si record_consent a sa signature v0.13.1 (compte passé en paramètre). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.rpc("record_consent", {
    p_visitor_id: crypto.randomUUID(),
    p_choice: "invalide",
    p_consent_version: 1,
    p_user_id: null,
  });
  return error?.message.includes("invalid_consent") ?? false;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — correctifs de l'audit des droits", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let owner: SupabaseClient;
  let outsider: SupabaseClient;
  const userIds: string[] = [];
  const paths: string[] = [];
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

  /** Paramètres d'un choix du bandeau, pour un visiteur neuf. */
  function consent(userId: string | null) {
    return {
      p_visitor_id: crypto.randomUUID(),
      p_choice: "accepted",
      p_consent_version: 1,
      p_user_id: userId,
    };
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);
    owner = await signedInUser("audit-proprio");
    outsider = await signedInUser("audit-externe");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Audit ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;

    const path = `etudes/${studyId}/${crypto.randomUUID()}.pdf`;
    paths.push(path);
    const uploaded = await owner.storage.from(BUCKET).upload(path, CONTENT, { contentType: PDF });
    if (uploaded.error) throw uploaded.error;
  });

  afterAll(async () => {
    if (paths.length > 0) await service.storage.from(BUCKET).remove(paths);
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("registre des consentements fermé à la clé publique", async () => {
    expect((await anon.rpc("record_consent", consent(null))).error).not.toBeNull();
    expect((await owner.rpc("record_consent", consent(userIds[0]))).error).not.toBeNull();
    // Un compte ne peut pas inscrire un choix au nom d'un autre
    expect((await outsider.rpc("record_consent", consent(userIds[0]))).error).not.toBeNull();
  });

  it("nombre de pièces jointes : réel pour un membre, 0 pour un non-membre", async () => {
    const own = await owner.rpc("strategy_attachment_objects", { p_study_id: studyId });
    expect(own.error).toBeNull();
    expect(own.data).toBe(1);

    const foreign = await outsider.rpc("strategy_attachment_objects", { p_study_id: studyId });
    expect(foreign.error).toBeNull();
    expect(foreign.data).toBe(0);
  });

  it("avancement d'une étude illisible directement, même par son propriétaire", async () => {
    for (const client of [owner, outsider]) {
      const profile = await client.rpc("strategy_profile_complete", { p_study_id: studyId });
      expect(profile.error).not.toBeNull();
      const missing = await client.rpc("strategy_missing_prerequisites", {
        p_study_id: studyId,
        p_step_no: 2,
      });
      expect(missing.error).not.toBeNull();
    }
  });

  it("le démarrage d'étape, qui s'en sert, fonctionne toujours", async () => {
    // Étape 1 sans prérequis : la vérification interne passe par la fonction retirée
    const { error } = await owner.rpc("strategy_start_step", { p_study_id: studyId, p_step_no: 1 });
    expect(error?.message ?? "").not.toMatch(/permission denied/i);
  });
});
