/**
 * Fichier    : catalog-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration du catalogue sur la base de développement : visibilité
 *              des livres selon le statut, écriture interdite aux non-administrateurs,
 *              recherche sans accents et par nom d'auteur. Ignorés si les clés manquent.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-07
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

describe.skipIf(!enabled)("RLS — catalogue", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let reader: SupabaseClient;
  let readerId = "";
  let authorId = "";
  const bookIds: string[] = [];

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    anon = createClient(url!, publishableKey!, NO_SESSION);

    const email = `catalog-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    readerId = created.data.user.id;
    reader = createClient(url!, publishableKey!, NO_SESSION);
    await reader.auth.signInWithPassword({ email, password });

    const author = await service
      .from("authors")
      .insert({ slug: `zz-auteur-${RUN}`, display_name: `Ésaïe Testeur ${RUN}` })
      .select("id")
      .single();
    if (author.error) throw author.error;
    authorId = author.data.id;

    const books = await service
      .from("books")
      .insert([
        {
          slug: `zz-publie-${RUN}`,
          title: `Économie générale ${RUN}`,
          author_id: authorId,
          status: "published",
        },
        {
          slug: `zz-brouillon-${RUN}`,
          title: `Brouillon ${RUN}`,
          author_id: authorId,
          status: "draft",
        },
      ])
      .select("id, status");
    if (books.error) throw books.error;
    bookIds.push(...books.data.map((b) => b.id));

    const published = books.data.find((b) => b.status === "published")!;
    await service.from("book_prices").insert([
      { book_id: published.id, currency: "XOF", amount_minor: 5000 },
      { book_id: published.id, currency: "EUR", amount_minor: 900 },
    ]);
  });

  afterAll(async () => {
    await service.from("books").delete().in("id", bookIds);
    await service.from("authors").delete().eq("id", authorId);
    await service.auth.admin.deleteUser(readerId);
  });

  it("montre aux visiteurs les livres publiés, jamais les brouillons", async () => {
    const { data } = await anon.from("books").select("slug").like("slug", `zz-%-${RUN}`);
    expect(data?.map((b) => b.slug)).toEqual([`zz-publie-${RUN}`]);
  });

  it("donne la date de publication automatiquement", async () => {
    const { data } = await anon
      .from("books")
      .select("published_at")
      .eq("slug", `zz-publie-${RUN}`)
      .single();
    expect(data?.published_at).not.toBeNull();
  });

  it("expose les prix d'un livre publié", async () => {
    const { data } = await anon
      .from("books")
      .select("book_prices(currency, amount_minor)")
      .eq("slug", `zz-publie-${RUN}`)
      .single();
    expect(data?.book_prices).toHaveLength(2);
  });

  it("interdit à un lecteur de créer catégorie, livre ou prix", async () => {
    const cat = await reader.from("categories").insert({ slug: `zz-${RUN}`, name: "x" });
    expect(cat.error).not.toBeNull();

    const book = await reader
      .from("books")
      .insert({ slug: `zz-pirate-${RUN}`, title: "x", author_id: authorId });
    expect(book.error).not.toBeNull();

    const price = await reader
      .from("book_prices")
      .insert({ book_id: bookIds[0], currency: "CAD", amount_minor: 1 });
    expect(price.error).not.toBeNull();
  });

  it("interdit à un lecteur de publier un brouillon", async () => {
    const { data } = await reader
      .from("books")
      .update({ status: "published" })
      .eq("id", bookIds[1])
      .select("id");
    expect(data ?? []).toEqual([]);
  });

  it("refuse l'écriture du journal d'audit à un non-administrateur", async () => {
    const { error } = await reader.rpc("write_audit", { p_action: "test" });
    expect(error).not.toBeNull();
  });

  it("refuse l'envoi d'une couverture à un non-administrateur", async () => {
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
    const { error } = await reader.storage.from("covers").upload(`zz-${RUN}.png`, blob);
    expect(error).not.toBeNull();
  });

  it("trouve un livre sans accents, par nom d'auteur et par prix maximal", async () => {
    const byTitle = await anon.rpc("search_books", { p_query: `economie ${RUN}` });
    expect(byTitle.data?.map((b: { slug: string }) => b.slug)).toContain(`zz-publie-${RUN}`);

    const byAuthor = await anon.rpc("search_books", { p_query: `esaie testeur ${RUN}` });
    expect(byAuthor.data?.map((b: { slug: string }) => b.slug)).toContain(`zz-publie-${RUN}`);

    const tooCheap = await anon.rpc("search_books", {
      p_query: RUN,
      p_currency: "XOF",
      p_max_price: 4000,
    });
    expect(tooCheap.data ?? []).toEqual([]);
  });
});
