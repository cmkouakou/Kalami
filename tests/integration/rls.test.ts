/**
 * Fichier    : rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration de la sécurité au niveau des lignes (RLS) sur la base de
 *              développement : isolement des profils, interdiction de devenir administrateur,
 *              journal d'audit inaccessible sans MFA. Ignorés si les clés manquent.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-06
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const PASSWORD = `Test-${crypto.randomUUID()}`;
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

type TestUser = { id: string; client: SupabaseClient };

describe.skipIf(!enabled)("RLS — profils et audit", () => {
  let admin: SupabaseClient;
  const users: TestUser[] = [];

  /** Crée un utilisateur confirmé et retourne un client connecté avec son compte. */
  async function createTestUser(label: string): Promise<TestUser> {
    const email = `rls-${label}-${crypto.randomUUID()}@test.kalami.local`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: label },
    });
    if (error) throw error;

    const client = createClient(url!, publishableKey!, NO_SESSION);
    const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (signIn.error) throw signIn.error;
    return { id: data.user.id, client };
  }

  beforeAll(async () => {
    admin = createClient(url!, secretKey!, NO_SESSION);
    users.push(await createTestUser("alice"), await createTestUser("bob"));
  });

  afterAll(async () => {
    await Promise.all(users.map((u) => admin.auth.admin.deleteUser(u.id)));
  });

  it("crée automatiquement le profil à l'inscription", async () => {
    const [alice] = users;
    const { data } = await alice.client.from("profiles").select("display_name").single();
    expect(data?.display_name).toBe("alice");
  });

  it("ne laisse voir que son propre profil", async () => {
    const [alice, bob] = users;
    const { data } = await alice.client.from("profiles").select("id");
    expect(data?.map((p) => p.id)).toEqual([alice.id]);

    const other = await alice.client.from("profiles").select("id").eq("id", bob.id);
    expect(other.data).toEqual([]);
  });

  it("permet de modifier son nom mais pas celui d'un autre", async () => {
    const [alice, bob] = users;
    const own = await alice.client
      .from("profiles")
      .update({ display_name: "Alice K." })
      .eq("id", alice.id)
      .select("display_name");
    expect(own.error).toBeNull();
    expect(own.data?.[0]?.display_name).toBe("Alice K.");

    const foreign = await alice.client
      .from("profiles")
      .update({ display_name: "piraté" })
      .eq("id", bob.id)
      .select("id");
    expect(foreign.data ?? []).toEqual([]);
  });

  it("interdit de se déclarer administrateur", async () => {
    const [alice] = users;
    const { error } = await alice.client
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", alice.id);
    expect(error).not.toBeNull();

    const check = await admin.from("profiles").select("is_admin").eq("id", alice.id).single();
    expect(check.data?.is_admin).toBe(false);
  });

  it("refuse is_admin() à un administrateur sans MFA (aal1)", async () => {
    const [, bob] = users;
    await admin.from("profiles").update({ is_admin: true }).eq("id", bob.id);

    const { data } = await bob.client.rpc("is_admin");
    expect(data).toBe(false);

    const logs = await bob.client.from("audit_logs").select("id");
    expect(logs.data ?? []).toEqual([]);
  });

  it("interdit l'écriture du journal d'audit côté client", async () => {
    const [alice] = users;
    const { error } = await alice.client.from("audit_logs").insert({ action: "test" });
    expect(error).not.toBeNull();
  });
});
