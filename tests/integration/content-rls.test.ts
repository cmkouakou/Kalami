/**
 * Fichier    : content-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration du contenu protégé sur la base de développement :
 *              chapitres illisibles par les clients, sommaire public sans contenu, droits
 *              de lecture non modifiables, limitation de débit. Ignorés si les clés
 *              manquent ou si la migration du Sprint 3 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-08
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration du contenu existe sur la base (table book_versions présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("book_versions").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — contenu protégé", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let reader: SupabaseClient;
  let readerId = "";
  let authorId = "";
  let bookId = "";

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);

    const email = `content-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    readerId = created.data.user.id;
    reader = createClient(url!, publishableKey!, NO_SESSION);
    await reader.auth.signInWithPassword({ email, password });

    const author = await service
      .from("authors")
      .insert({ slug: `zz-contenu-${RUN}`, display_name: `Auteur ${RUN}` })
      .select("id")
      .single();
    if (author.error) throw author.error;
    authorId = author.data.id;

    const book = await service
      .from("books")
      .insert({ slug: `zz-contenu-${RUN}`, title: "Contenu", author_id: authorId })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;

    const version = await service
      .from("book_versions")
      .insert({
        book_id: bookId,
        version_number: 1,
        source_format: "docx",
        source_path: `livres/${bookId}/test.docx`,
        chapter_count: 2,
        word_count: 4,
      })
      .select("id")
      .single();
    if (version.error) throw version.error;

    const chapters = await service.from("chapters").insert([
      { version_id: version.data.id, position: 1, title: "Un", blocks: ["<p>a b</p>"] },
      { version_id: version.data.id, position: 2, title: "Deux", blocks: ["<p>secret</p>"] },
    ]);
    if (chapters.error) throw chapters.error;

    const update = await service
      .from("books")
      .update({ current_version_id: version.data.id, status: "published" })
      .eq("id", bookId);
    if (update.error) throw update.error;
  });

  afterAll(async () => {
    await service.from("content_access_log").delete().like("subject", `test:${RUN}%`);
    await service.from("books").delete().eq("id", bookId);
    await service.from("authors").delete().eq("id", authorId);
    await service.auth.admin.deleteUser(readerId);
  });

  it("interdit la lecture des chapitres aux visiteurs et aux lecteurs", async () => {
    expect((await anon.from("chapters").select("blocks")).error).not.toBeNull();
    expect((await reader.from("chapters").select("blocks")).error).not.toBeNull();
  });

  it("publie le sommaire sans contenu, avec le chapitre 1 en extrait", async () => {
    const { data, error } = await anon.rpc("get_book_toc", { p_book_id: bookId });
    expect(error).toBeNull();
    expect(data).toEqual([
      expect.objectContaining({ chapter_position: 1, title: "Un", is_preview: true }),
      expect.objectContaining({ chapter_position: 2, title: "Deux", is_preview: false }),
    ]);
    expect(JSON.stringify(data)).not.toContain("secret");
  });

  it("interdit à un lecteur de s'accorder un droit de lecture", async () => {
    const insert = await reader
      .from("entitlements")
      .insert({ user_id: readerId, book_id: bookId, source: "admin_grant" });
    expect(insert.error).not.toBeNull();

    const grant = await reader.rpc("admin_grant_entitlement", {
      p_book_id: bookId,
      p_email: `content-${RUN}@test.kalami.local`,
    });
    expect(grant.error).not.toBeNull();
  });

  it("réserve la limitation de débit au serveur et refuse au-delà de la limite", async () => {
    const args = { p_book_id: bookId, p_position: 1, p_limit: 3, p_window_seconds: 60 };
    const denied = await reader.rpc("register_content_access", { ...args, p_subject: "x" });
    expect(denied.error).not.toBeNull();

    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const { data } = await service.rpc("register_content_access", {
        ...args,
        p_subject: `test:${RUN}`,
      });
      results.push(data);
    }
    expect(results).toEqual([true, true, true, false]);
  });
});
