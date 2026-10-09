/**
 * Fichier    : author-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration de l'espace auteur sur la base de développement :
 *              création en brouillon, champs réservés à l'administration, livre verrouillé
 *              une fois soumis, coordonnées de versement privées, soumissions écrites par
 *              fonctions seulement. Ignorés si les clés manquent ou si la migration du
 *              Sprint 9 n'est pas encore appliquée. Le contrat publié n'est jamais modifié.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-09
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration de l'espace auteur existe sur la base (table book_submissions). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("book_submissions").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — espace auteur", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let author: SupabaseClient;
  let other: SupabaseClient;
  const userIds: string[] = [];
  let authorId = "";
  let otherAuthorId = "";
  let bookId = "";

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

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);
    author = await signedInUser("auteur");
    other = await signedInUser("autre");

    const row = await service
      .from("authors")
      .insert({ slug: `zz-auteur-${RUN}`, display_name: `Auteur ${RUN}`, user_id: userIds[0] })
      .select("id")
      .single();
    if (row.error) throw row.error;
    authorId = row.data.id;

    const second = await service
      .from("authors")
      .insert({ slug: `zz-autre-${RUN}`, display_name: `Autre ${RUN}` })
      .select("id")
      .single();
    if (second.error) throw second.error;
    otherAuthorId = second.data.id;
  });

  afterAll(async () => {
    await service.from("books").delete().in("author_id", [authorId, otherAuthorId]);
    await service.from("authors").delete().in("id", [authorId, otherAuthorId]);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse l'inscription aux visiteurs et une seconde fiche à un auteur", async () => {
    const args = { p_display_name: "X", p_slug: `zz-x-${RUN}`, p_bio: "", p_contract_id: null };
    expect((await anon.rpc("author_register", args)).error).not.toBeNull();
    const again = await author.rpc("author_register", args);
    expect(again.error?.message).toBe("already_author");
  });

  it("crée un livre en brouillon, jamais directement publié", async () => {
    const published = await author
      .from("books")
      .insert({ slug: `zz-pub-${RUN}`, title: "Publié", author_id: authorId, status: "published" })
      .select("id");
    expect(published.error).not.toBeNull();

    const foreign = await author
      .from("books")
      .insert({ slug: `zz-autrui-${RUN}`, title: "Autrui", author_id: otherAuthorId })
      .select("id");
    expect(foreign.error).not.toBeNull();

    const draft = await author
      .from("books")
      .insert({ slug: `zz-livre-${RUN}`, title: "Brouillon", author_id: authorId })
      .select("id")
      .single();
    expect(draft.error).toBeNull();
    bookId = draft.data!.id;
  });

  it("modifie la fiche mais pas les champs réservés", async () => {
    const title = await author.from("books").update({ title: "Nouveau" }).eq("id", bookId);
    expect(title.error).toBeNull();
    const status = await author.from("books").update({ status: "published" }).eq("id", bookId);
    expect(status.error).not.toBeNull();
    const featured = await author.from("books").update({ is_featured: true }).eq("id", bookId);
    expect(featured.error).not.toBeNull();
  });

  it("cache le brouillon aux autres utilisateurs", async () => {
    const { data } = await other.from("books").select("id").eq("id", bookId);
    expect(data).toEqual([]);
    const update = await other.from("books").update({ title: "Pirate" }).eq("id", bookId)
      .select("id");
    expect(update.data ?? []).toEqual([]);
  });

  it("exige l'acceptation du contrat pour soumettre", async () => {
    const { error } = await author.rpc("author_submit_book", { p_book_id: bookId });
    expect(error?.message).toBe("contract_required");
    const direct = await author.from("book_submissions").insert({ book_id: bookId });
    expect(direct.error).not.toBeNull();
  });

  it("verrouille la fiche d'un livre soumis", async () => {
    await service.from("books").update({ status: "submitted" }).eq("id", bookId);
    const { data } = await author.from("books").update({ title: "Trop tard" }).eq("id", bookId)
      .select("id");
    expect(data ?? []).toEqual([]);
  });

  it("garde les coordonnées de versement privées", async () => {
    const payout = {
      method: "mobile_money",
      account_holder: "Auteur",
      mobile_operator: "wave",
      mobile_number: "0700000000",
    };
    const own = await author
      .from("author_payout_details")
      .upsert({ author_id: authorId, ...payout });
    expect(own.error).toBeNull();

    const foreign = await author
      .from("author_payout_details")
      .upsert({ author_id: otherAuthorId, ...payout });
    expect(foreign.error).not.toBeNull();

    const { data } = await other.from("author_payout_details").select("author_id");
    expect(data).toEqual([]);
  });
});
