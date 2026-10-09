/**
 * Fichier    : annotations-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration des annotations sur la base de développement : surlignages
 *              et notes visibles et modifiables par leur seul propriétaire, inaccessibles aux
 *              visiteurs ; contraintes (couleur, longueur du passage, fin après le début).
 *              Ignorés si les clés manquent ou si la migration du Sprint 7 n'est pas appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-10
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration des annotations existe sur la base (table highlights présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("highlights").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — surlignages et notes", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  const readers: { id: string; client: SupabaseClient }[] = [];
  let authorId = "";
  let bookId = "";

  /** Crée un lecteur connecté. */
  async function createReader(name: string) {
    const email = `annotations-${name}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    const client = createClient(url!, publishableKey!, NO_SESSION);
    await client.auth.signInWithPassword({ email, password });
    readers.push({ id: created.data.user.id, client });
  }

  /** Surlignage valide du lecteur donné (champs modifiables par « extra »). */
  function row(userId: string, extra: Record<string, unknown> = {}) {
    return {
      user_id: userId,
      book_id: bookId,
      chapter_position: 1,
      start_block: 0,
      start_offset: 4,
      end_block: 1,
      end_offset: 10,
      quote: "Un passage",
      ...extra,
    };
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);
    await createReader("a");
    await createReader("b");

    const author = await service
      .from("authors")
      .insert({ slug: `zz-annotations-${RUN}`, display_name: `Auteur ${RUN}` })
      .select("id")
      .single();
    if (author.error) throw author.error;
    authorId = author.data.id;

    const book = await service
      .from("books")
      .insert({ slug: `zz-annotations-${RUN}`, title: "Annotations", author_id: authorId })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;
  });

  afterAll(async () => {
    await service.from("books").delete().eq("id", bookId);
    await service.from("authors").delete().eq("id", authorId);
    for (const reader of readers) await service.auth.admin.deleteUser(reader.id);
  });

  it("réserve les surlignages à leur propriétaire", async () => {
    const [a, b] = readers;
    const created = await a.client
      .from("highlights")
      .insert(row(a.id, { color: "vert" }))
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const id = created.data!.id;

    expect((await b.client.from("highlights").select("id")).data).toEqual([]);
    await b.client.from("highlights").update({ note: "Pirate" }).eq("id", id);
    await b.client.from("highlights").delete().eq("id", id);
    const own = await a.client.from("highlights").select("id, note");
    expect(own.data).toEqual([{ id, note: null }]);

    const forged = await b.client.from("highlights").insert(row(a.id));
    expect(forged.error).not.toBeNull();
  });

  it("permet au propriétaire d'annoter, changer la couleur et supprimer", async () => {
    const [a] = readers;
    const created = await a.client.from("highlights").insert(row(a.id)).select("id").single();
    const id = created.data!.id;

    const update = await a.client
      .from("highlights")
      .update({ note: "À relire", color: "rose" })
      .eq("id", id)
      .select("note, color")
      .single();
    expect(update.data).toEqual({ note: "À relire", color: "rose" });

    expect((await a.client.from("highlights").delete().eq("id", id)).error).toBeNull();
    expect((await a.client.from("highlights").select("id").eq("id", id)).data).toEqual([]);
  });

  it("refuse une couleur inconnue, un passage invalide ou une fin avant le début", async () => {
    const [a] = readers;
    const invalid = [
      { color: "violet" },
      { quote: "" },
      { quote: "x".repeat(1001) },
      { note: "x".repeat(2001) },
      { end_block: 0, end_offset: 4 },
      { end_block: 0, end_offset: 2 },
    ];
    for (const extra of invalid) {
      const insert = await a.client.from("highlights").insert(row(a.id, extra));
      expect(insert.error).not.toBeNull();
    }
  });

  it("interdit tout accès aux visiteurs", async () => {
    expect((await anon.from("highlights").select("id")).error).not.toBeNull();
  });
});
