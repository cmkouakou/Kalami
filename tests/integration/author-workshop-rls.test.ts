/**
 * Fichier    : author-workshop-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration de l'atelier de l'auteur (v0.15.0) sur la base de
 *              développement : solde verrouillé sans forfait, réservation limitée aux livres
 *              de l'auteur, crédits et réglages jamais lisibles par un auteur, écriture
 *              directe refusée, fin de demande réservée au serveur et fonctions
 *              d'administration refusées. Ignorés si les clés manquent ou si la migration
 *              de l'atelier n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-25
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration de l'atelier est appliquée. */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("workshop_settings").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — atelier de l'auteur", () => {
  let service: SupabaseClient;
  let author: SupabaseClient;
  let other: SupabaseClient;
  const userIds: string[] = [];
  let authorId = "";
  let bookId = "";
  let workshopEnabled = true;

  /** Crée un compte confirmé et renvoie un client connecté. */
  async function signUp(label: string): Promise<SupabaseClient> {
    const email = `atelier-${label}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    const client = createClient(url!, publishableKey!, NO_SESSION);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    return client;
  }

  /** Réserve une demande « fiche du livre » (sans chapitre). */
  function reserveListing(client: SupabaseClient) {
    return client.rpc("workshop_reserve", {
      p_book_id: bookId,
      p_version_id: null,
      p_chapter_id: null,
      p_tool: "listing",
      p_estimate: 0.05,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    author = await signUp("auteur");
    other = await signUp("autre");
    const row = await service
      .from("authors")
      .insert({ slug: `zz-atelier-${RUN}`, display_name: `Atelier ${RUN}`, user_id: userIds[0] })
      .select("id")
      .single();
    if (row.error) throw row.error;
    authorId = row.data.id;
    const book = await service
      .from("books")
      .insert({ slug: `zz-atelier-${RUN}`, title: "Atelier", author_id: authorId })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;
    const settings = await service.from("workshop_settings").select("enabled").single();
    workshopEnabled = Boolean(settings.data?.enabled);
  });

  afterAll(async () => {
    if (authorId) {
      await service.from("workshop_requests").delete().eq("author_id", authorId);
      await service.from("workshop_allowances").delete().eq("author_id", authorId);
      await service.from("books").delete().eq("author_id", authorId);
      await service.from("authors").delete().eq("id", authorId);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("montre un solde verrouillé sans forfait, refusé à un non-auteur", async () => {
    const { data, error } = await author.rpc("workshop_my_balance");
    expect(error).toBeNull();
    expect(data?.[0]).toMatchObject({ unlocked: false, remaining_pct: 0, approx_chapters: 0 });
    const foreign = await other.rpc("workshop_my_balance");
    expect(foreign.error?.code).toBe("42501");
  });

  it("refuse la réservation sans crédits et sur le livre d'un autre", async () => {
    const { data, error } = await reserveListing(author);
    expect(error).toBeNull();
    expect(data?.[0]?.refusal).toBe(workshopEnabled ? "workshop_locked" : "workshop_disabled");
    const foreign = await reserveListing(other);
    expect(foreign.error?.code).toBe("42501");
  });

  it("réserve une demande avec crédits ; seule la fin par le serveur est permise", async () => {
    const grant = await service
      .from("workshop_allowances")
      .insert({ author_id: authorId, amount_usd: 1, source: "admin_grant" });
    expect(grant.error).toBeNull();

    const balance = await author.rpc("workshop_my_balance");
    expect(balance.data?.[0]).toMatchObject({ unlocked: true, remaining_pct: 100 });
    if (!workshopEnabled) return;

    const { data } = await reserveListing(author);
    const requestId = data?.[0]?.request_id as string;
    expect(requestId).toBeTruthy();

    const complete = {
      p_request_id: requestId,
      p_status: "done",
      p_served_model: "claude-opus-5-5",
      p_input_tokens: 1000,
      p_output_tokens: 500,
      p_input: {},
      p_output: {},
      p_error: null,
    };
    const forged = await author.rpc("workshop_complete", complete);
    expect(forged.error).not.toBeNull();
    const done = await service.rpc("workshop_complete", complete);
    expect(done.error).toBeNull();

    const own = await author.from("workshop_requests").select("id, status").eq("id", requestId);
    expect(own.data).toEqual([{ id: requestId, status: "done" }]);
    const hidden = await other.from("workshop_requests").select("id").eq("id", requestId);
    expect(hidden.data).toEqual([]);
  });

  it("cache crédits, forfaits et réglages et refuse l'écriture directe", async () => {
    for (const table of ["workshop_allowances", "workshop_packs", "workshop_settings"]) {
      const { data } = await author.from(table).select("*");
      expect(data ?? []).toEqual([]);
    }
    const forged = await author
      .from("workshop_allowances")
      .insert({ author_id: authorId, amount_usd: 100, source: "admin_grant" });
    expect(forged.error).not.toBeNull();
    const request = await author.from("workshop_requests").insert({
      author_id: authorId,
      tool: "listing",
      model: "x",
      input_price: 0,
      output_price: 0,
      estimate_usd: 0,
    });
    expect(request.error).not.toBeNull();
  });

  it("refuse les fonctions d'administration à un non-administrateur", async () => {
    const calls: [string, Record<string, unknown>][] = [
      ["admin_update_workshop_settings", {
        p_enabled: true,
        p_model: "claude-opus-5-5",
        p_input_price: 0,
        p_output_price: 0,
        p_rate_limit: 1000,
        p_rate_window: 1,
      }],
      ["admin_save_workshop_pack", {
        p_id: null,
        p_name: "Pirate",
        p_cost: 100,
        p_price_xof: 1,
        p_price_eur: null,
        p_price_cad: null,
        p_active: true,
        p_position: 0,
      }],
      ["admin_grant_workshop_pack", {
        p_author_id: authorId,
        p_pack_id: crypto.randomUUID(),
        p_note: "",
      }],
      ["admin_workshop_usage", {}],
    ];
    for (const [fn, args] of calls) {
      const { error } = await author.rpc(fn, args);
      expect(error?.code).toBe("42501");
    }
  });
});
