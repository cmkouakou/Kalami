/**
 * Fichier    : reader-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration de la liseuse sur la base de développement : position
 *              de lecture et signets visibles et modifiables par leur seul propriétaire,
 *              inaccessibles aux visiteurs. Ignorés si les clés manquent ou si la migration
 *              du Sprint 4 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
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

/** Vrai si la migration de la liseuse existe sur la base (table bookmarks présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("bookmarks").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — position de lecture et signets", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  const readers: { id: string; client: SupabaseClient }[] = [];
  let authorId = "";
  let bookId = "";

  /** Crée un lecteur connecté. */
  async function createReader(name: string) {
    const email = `liseuse-${name}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    const client = createClient(url!, publishableKey!, NO_SESSION);
    await client.auth.signInWithPassword({ email, password });
    readers.push({ id: created.data.user.id, client });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);
    await createReader("a");
    await createReader("b");

    const author = await service
      .from("authors")
      .insert({ slug: `zz-liseuse-${RUN}`, display_name: `Auteur ${RUN}` })
      .select("id")
      .single();
    if (author.error) throw author.error;
    authorId = author.data.id;

    const book = await service
      .from("books")
      .insert({ slug: `zz-liseuse-${RUN}`, title: "Liseuse", author_id: authorId })
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

  it("enregistre et met à jour la position du lecteur, invisible pour un autre", async () => {
    const [a, b] = readers;
    const row = { user_id: a.id, book_id: bookId, chapter_position: 1, progress: 0.1 };
    expect((await a.client.from("reading_positions").upsert(row)).error).toBeNull();
    const update = await a.client
      .from("reading_positions")
      .upsert({ ...row, chapter_position: 2, progress: 0.5 }, { onConflict: "user_id,book_id" });
    expect(update.error).toBeNull();

    const own = await a.client.from("reading_positions").select("chapter_position");
    expect(own.data).toEqual([{ chapter_position: 2 }]);
    const other = await b.client.from("reading_positions").select("chapter_position");
    expect(other.data).toEqual([]);
  });

  it("interdit d'écrire la position d'un autre lecteur", async () => {
    const [a, b] = readers;
    const forged = await b.client
      .from("reading_positions")
      .insert({ user_id: a.id, book_id: bookId, chapter_position: 1 });
    expect(forged.error).not.toBeNull();
  });

  it("réserve les signets à leur propriétaire", async () => {
    const [a, b] = readers;
    const created = await a.client
      .from("bookmarks")
      .insert({ user_id: a.id, book_id: bookId, chapter_position: 1, label: "Ici" })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const id = created.data!.id;

    expect((await b.client.from("bookmarks").select("id")).data).toEqual([]);
    await b.client.from("bookmarks").delete().eq("id", id);
    expect((await a.client.from("bookmarks").select("id")).data).toEqual([{ id }]);

    const forged = await b.client
      .from("bookmarks")
      .insert({ user_id: a.id, book_id: bookId, chapter_position: 1, label: "Faux" });
    expect(forged.error).not.toBeNull();

    expect((await a.client.from("bookmarks").delete().eq("id", id)).error).toBeNull();
    expect((await a.client.from("bookmarks").select("id")).data).toEqual([]);
  });

  it("refuse un nom de signet vide ou trop long", async () => {
    const [a] = readers;
    for (const label of ["   ", "x".repeat(121)]) {
      const insert = await a.client
        .from("bookmarks")
        .insert({ user_id: a.id, book_id: bookId, chapter_position: 1, label });
      expect(insert.error).not.toBeNull();
    }
  });

  it("interdit tout accès aux visiteurs", async () => {
    expect((await anon.from("reading_positions").select("user_id")).error).not.toBeNull();
    expect((await anon.from("bookmarks").select("id")).error).not.toBeNull();
  });
});
