/**
 * Fichier    : strategy-attachments-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration des pièces jointes du profil (S5b) sur la base de
 *              développement, sans appel au modèle : dépôt dans le dossier de l'étude
 *              (membres éditeurs seulement), enregistrement (chemin vérifié, fichier présent,
 *              taille relevée par le stockage), lecture réservée aux membres, réservation
 *              « extract » (sans étape, pièce de l'étude) et résumé enregistré par
 *              coach_complete, suppression. Ignorés si les clés manquent, si le coach est
 *              désactivé ou si la migration S5b n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-14
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

/** Vrai si la migration S5b est appliquée et le coach activé. */
async function ready(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const [settings, table] = await Promise.all([
    service.from("strategy_settings").select("coach_enabled").maybeSingle<{
      coach_enabled: boolean;
    }>(),
    service.from("study_attachments").select("id").limit(1),
  ]);
  return !settings.error && !table.error && Boolean(settings.data?.coach_enabled);
}

const isReady = await ready();

describe.skipIf(!isReady)("RLS — pièces jointes du profil", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let outsider: SupabaseClient;
  const userIds: string[] = [];
  const paths: string[] = [];
  let studyId = "";
  let attachmentId = "";

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

  /** Chemin neuf dans le dossier de l'étude. */
  function newPath(): string {
    const path = `etudes/${studyId}/${crypto.randomUUID()}.pdf`;
    paths.push(path);
    return path;
  }

  /** Dépose le PDF de test avec le client donné. */
  function upload(client: SupabaseClient, path: string) {
    return client.storage.from(BUCKET).upload(path, CONTENT, { contentType: PDF });
  }

  /** Enregistre une pièce déposée. */
  function register(client: SupabaseClient, path: string) {
    return client.rpc("strategy_add_attachment", {
      p_study_id: studyId,
      p_storage_path: path,
      p_file_name: "Rapport annuel.pdf",
      p_mime_type: PDF,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("pieces-proprio");
    outsider = await signedInUser("pieces-externe");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Pièces ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;
  });

  afterAll(async () => {
    if (paths.length > 0) await service.storage.from(BUCKET).remove(paths);
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse le dépôt d'un non-membre dans le dossier de l'étude", async () => {
    const { error } = await upload(outsider, newPath());
    expect(error).not.toBeNull();
  });

  it("enregistre une pièce déposée par le propriétaire, avec sa taille réelle", async () => {
    const path = newPath();
    expect((await upload(owner, path)).error).toBeNull();

    const outsiderTry = await register(outsider, path);
    expect(outsiderTry.error?.code).toBe("42501");

    const { data, error } = await register(owner, path);
    expect(error).toBeNull();
    attachmentId = data as string;

    const row = await owner
      .from("study_attachments")
      .select("file_name, size_bytes, summary")
      .eq("id", attachmentId)
      .single<{ file_name: string; size_bytes: number; summary: string | null }>();
    expect(row.data).toEqual({
      file_name: "Rapport annuel.pdf",
      size_bytes: CONTENT.byteLength,
      summary: null,
    });
  });

  it("refuse un chemin hors du dossier ou un fichier absent", async () => {
    const outside = await register(owner, `etudes/${crypto.randomUUID()}/x.pdf`);
    expect(outside.error?.message).toBe("invalid_path");
    const missing = await register(owner, newPath());
    expect(missing.error?.message).toBe("object_missing");
  });

  it("réserve la lecture aux membres et interdit l'écriture directe", async () => {
    const asOutsider = await outsider
      .from("study_attachments")
      .select("id")
      .eq("study_id", studyId);
    expect(asOutsider.data).toEqual([]);

    const files = await outsider.storage.from(BUCKET).list(`etudes/${studyId}`);
    expect(files.data ?? []).toEqual([]);

    const forged = await owner.from("study_attachments").insert({
      study_id: studyId,
      storage_path: `etudes/${studyId}/faux.pdf`,
      file_name: "faux.pdf",
      mime_type: PDF,
      size_bytes: 10,
    });
    expect(forged.error).not.toBeNull();
  });

  it("réserve une analyse sans étape et enregistre le résumé avec la pièce", async () => {
    const withStep = await owner.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: 1,
      p_function: "extract",
      p_estimate: 0.0001,
      p_attachment_id: attachmentId,
    });
    expect(withStep.error?.message).toBe("invalid_request");

    const reviewWithAttachment = await owner.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: 1,
      p_function: "review",
      p_estimate: 0.0001,
      p_attachment_id: attachmentId,
    });
    expect(reviewWithAttachment.error?.message).toBe("invalid_request");

    const { data, error } = await owner.rpc("coach_reserve", {
      p_study_id: studyId,
      p_step_no: null,
      p_function: "extract",
      p_estimate: 0.0001,
      p_attachment_id: attachmentId,
    });
    expect(error).toBeNull();
    const reservation = (data as { request_id: string | null; refusal: string | null }[])[0];
    expect(reservation.refusal).toBeNull();

    const done = await service.rpc("coach_complete", {
      p_request_id: reservation.request_id,
      p_status: "done",
      p_prompt_id: null,
      p_served_model: "modele-test",
      p_input_tokens: 1000,
      p_output_tokens: 200,
      p_web_searches: 0,
      p_input: { attachmentId, fileName: "Rapport annuel.pdf" },
      p_output: { summary: "Rapport de l'exercice.", proposals: [] },
      p_sources: null,
      p_error: null,
    });
    expect(done.error).toBeNull();

    const row = await owner
      .from("study_attachments")
      .select("summary, analysis_request_id, analyzed_at")
      .eq("id", attachmentId)
      .single<{ summary: string; analysis_request_id: string; analyzed_at: string | null }>();
    expect(row.data?.summary).toBe("Rapport de l'exercice.");
    expect(row.data?.analysis_request_id).toBe(reservation.request_id);
    expect(row.data?.analyzed_at).not.toBeNull();
  });

  it("supprime une pièce et renvoie son chemin (membres éditeurs seulement)", async () => {
    const outsiderTry = await outsider.rpc("strategy_delete_attachment", {
      p_attachment_id: attachmentId,
    });
    expect(outsiderTry.error?.code).toBe("42501");

    const { data, error } = await owner.rpc("strategy_delete_attachment", {
      p_attachment_id: attachmentId,
    });
    expect(error).toBeNull();
    expect(paths).toContain(data);
    const removed = await owner.storage.from(BUCKET).remove([data as string]);
    expect(removed.error).toBeNull();
  });
});
