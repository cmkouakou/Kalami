/**
 * Fichier    : legal-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des textes légaux et de la confidentialité sur la base de
 *              développement : textes publics et non modifiables, registre des
 *              consentements (visiteur anonyme, membre, débit), demande de suppression
 *              (idempotente, privée, annulable, impact). Ignorés si les clés manquent ou si
 *              la migration du Sprint 11a n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration des textes légaux existe sur la base. */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("legal_documents").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — textes légaux et confidentialité", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let member: SupabaseClient;
  let other: SupabaseClient;
  const userIds: string[] = [];
  const visitorIds: string[] = [];

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

  /** Nouvel identifiant de visiteur, nettoyé à la fin. */
  function visitor(): string {
    const id = crypto.randomUUID();
    visitorIds.push(id);
    return id;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);
    member = await signedInUser("legal-membre");
    other = await signedInUser("legal-autre");
  });

  afterAll(async () => {
    if (visitorIds.length) {
      await service.from("consent_records").delete().in("visitor_id", visitorIds);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("textes lisibles par un visiteur, non modifiables", async () => {
    const { data, error } = await anon.from("legal_documents").select("kind, version");
    expect(error).toBeNull();
    expect(new Set(data?.map((row) => row.kind))).toEqual(new Set(["privacy", "terms", "sales"]));

    const insert = await member
      .from("legal_documents")
      .insert({ kind: "terms", version: 999, title: "x", body: "x" });
    expect(insert.error).not.toBeNull();
  });

  it("publication refusée à un non-administrateur", async () => {
    const { error } = await member.rpc("admin_publish_legal_document", {
      p_kind: "terms",
      p_title: "Pirate",
      p_body: "Texte",
    });
    expect(error).not.toBeNull();
  });

  it("choix d'un visiteur anonyme enregistré, mais illisible", async () => {
    const id = visitor();
    const { error } = await anon.rpc("record_consent", {
      p_visitor_id: id,
      p_choice: "refused",
      p_consent_version: 1,
    });
    expect(error).toBeNull();

    const read = await anon.from("consent_records").select("id").eq("visitor_id", id);
    expect(read.data ?? []).toHaveLength(0);
    const stored = await service.from("consent_records").select("user_id, privacy_version")
      .eq("visitor_id", id).single();
    expect(stored.data?.user_id).toBeNull();
    expect(stored.data?.privacy_version).toBeGreaterThan(0);
  });

  it("choix d'un membre rattaché à son compte, lisible par lui seul", async () => {
    const id = visitor();
    const { error } = await member.rpc("record_consent", {
      p_visitor_id: id,
      p_choice: "accepted",
      p_consent_version: 1,
    });
    expect(error).toBeNull();

    const own = await member.from("consent_records").select("user_id").eq("visitor_id", id);
    expect(own.data?.[0]?.user_id).toBe(userIds[0]);
    const foreign = await other.from("consent_records").select("id").eq("visitor_id", id);
    expect(foreign.data ?? []).toHaveLength(0);
  });

  it("choix invalide refusé, débit limité à 20 par heure", async () => {
    const invalid = await anon.rpc("record_consent", {
      p_visitor_id: visitor(),
      p_choice: "peut-etre",
      p_consent_version: 1,
    });
    expect(invalid.error).not.toBeNull();

    const id = visitor();
    for (let i = 0; i < 20; i += 1) {
      const { error } = await anon.rpc("record_consent", {
        p_visitor_id: id,
        p_choice: "accepted",
        p_consent_version: 1,
      });
      expect(error).toBeNull();
    }
    const limited = await anon.rpc("record_consent", {
      p_visitor_id: id,
      p_choice: "accepted",
      p_consent_version: 1,
    });
    expect(limited.error?.message).toContain("rate_limited");
  });

  it("registre non modifiable directement", async () => {
    const { error } = await member.from("consent_records").insert({
      visitor_id: visitor(),
      choice: "accepted",
      consent_version: 1,
    });
    expect(error).not.toBeNull();
  });

  it("impact de la suppression : compteurs à zéro pour un nouveau compte", async () => {
    const { data, error } = await member.rpc("account_deletion_impact");
    expect(error).toBeNull();
    expect(data).toMatchObject({ owned_studies: 0, shared_studies: 0, classes: 0 });

    const denied = await anon.rpc("account_deletion_impact");
    expect(denied.error).not.toBeNull();
  });

  it("demande de suppression : idempotente, privée, annulable", async () => {
    const first = await member.rpc("request_account_deletion");
    expect(first.error).toBeNull();
    const scheduled = new Date(first.data as string).getTime();
    const inDays = (scheduled - Date.now()) / 86_400_000;
    expect(inDays).toBeGreaterThan(29.9);
    expect(inDays).toBeLessThan(30.1);

    const second = await member.rpc("request_account_deletion");
    expect(new Date(second.data as string).getTime()).toBe(scheduled);

    const own = await member.from("account_deletion_requests").select("user_id");
    expect(own.data).toHaveLength(1);
    const foreign = await other.from("account_deletion_requests").select("user_id");
    expect(foreign.data ?? []).toHaveLength(0);

    const forged = await member
      .from("account_deletion_requests")
      .update({ scheduled_for: new Date().toISOString() })
      .eq("user_id", userIds[0])
      .select("user_id");
    expect(forged.data ?? []).toHaveLength(0);

    const cancelled = await member.rpc("cancel_account_deletion");
    expect(cancelled.error).toBeNull();
    const after = await member.from("account_deletion_requests").select("user_id");
    expect(after.data ?? []).toHaveLength(0);
  });
});
