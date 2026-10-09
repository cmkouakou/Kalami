/**
 * Fichier    : pdf-rls.test.ts
 * Projet     : Kalami
 * Description: Tests d'intégration du PDF filigrané sur la base de développement : droits PDF
 *              visibles par leur seul titulaire, écritures réservées aux fonctions,
 *              consommation des téléchargements par le serveur uniquement (3 essais, fichier
 *              expiré refusé). Ignorés si les clés manquent ou si la migration du Sprint 8
 *              n'est pas encore appliquée.
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
const HOUR = 3600 * 1000;

/** Vrai si la migration du PDF existe sur la base (table pdf_purchases). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("pdf_purchases").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

describe.skipIf(!ready)("RLS — PDF filigrané", () => {
  let service: SupabaseClient;
  let reader: SupabaseClient;
  let other: SupabaseClient;
  const userIds: string[] = [];
  let authorId = "";
  let bookId = "";
  let purchaseId = "";

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

  /** Enregistre un fichier factice (aucun objet dans le seau : la fonction ne le lit pas). */
  async function insertExport(expiresInMs: number): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await service.from("pdf_exports").insert({
      id,
      purchase_id: purchaseId,
      user_id: userIds[0],
      book_id: bookId,
      storage_path: `${userIds[0]}/${id}.pdf`,
      expires_at: new Date(Date.now() + expiresInMs).toISOString(),
    });
    if (error) throw error;
    return id;
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    reader = await signedInUser("lecteur-pdf");
    other = await signedInUser("autre-pdf");

    const author = await service
      .from("authors")
      .insert({ slug: `zz-pdf-${RUN}`, display_name: `Auteur PDF ${RUN}` })
      .select("id")
      .single();
    if (author.error) throw author.error;
    authorId = author.data.id;

    const book = await service
      .from("books")
      .insert({ slug: `zz-pdf-${RUN}`, title: "Livre PDF", author_id: authorId, pdf_enabled: true })
      .select("id")
      .single();
    if (book.error) throw book.error;
    bookId = book.data.id;

    const purchase = await service
      .from("pdf_purchases")
      .insert({
        user_id: userIds[0],
        book_id: bookId,
        reference: `KAL-${RUN.toUpperCase()}`,
        source: "admin_grant",
      })
      .select("id")
      .single();
    if (purchase.error) throw purchase.error;
    purchaseId = purchase.data.id;
  });

  afterAll(async () => {
    await service.from("books").delete().eq("author_id", authorId);
    await service.from("authors").delete().eq("id", authorId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("montre le droit PDF à son seul titulaire", async () => {
    const own = await reader.from("pdf_purchases").select("id, downloads_remaining");
    expect(own.data?.map((row) => row.id)).toEqual([purchaseId]);
    expect(own.data?.[0].downloads_remaining).toBe(3);
    const foreign = await other.from("pdf_purchases").select("id").eq("id", purchaseId);
    expect(foreign.data).toEqual([]);
  });

  it("refuse toute écriture directe aux clients", async () => {
    const insert = await reader.from("pdf_purchases").insert({
      user_id: userIds[0],
      book_id: bookId,
      reference: "KAL-FFFFFFFF",
      source: "purchase",
    });
    expect(insert.error).not.toBeNull();
    const update = await reader
      .from("pdf_purchases")
      .update({ downloads_remaining: 100 })
      .eq("id", purchaseId);
    expect(update.error).not.toBeNull();
  });

  it("réserve les fonctions d'administration et de téléchargement", async () => {
    const grant = await reader.rpc("admin_grant_pdf", {
      p_book_id: bookId,
      p_email: `autre-pdf-${RUN}@test.kalami.local`,
    });
    expect(grant.error).not.toBeNull();
    const exportId = await insertExport(HOUR);
    const consume = await reader.rpc("consume_pdf_download", {
      p_export_id: exportId,
      p_user_id: userIds[0],
    });
    expect(consume.error).not.toBeNull();
  });

  it("consomme 3 téléchargements puis refuse, et refuse un fichier expiré", async () => {
    const exportId = await insertExport(HOUR);
    const args = { p_export_id: exportId, p_user_id: userIds[0] };
    for (let i = 0; i < 3; i++) {
      const ok = await service.rpc("consume_pdf_download", args);
      expect(ok.error).toBeNull();
      expect(ok.data).toBe(`${userIds[0]}/${exportId}.pdf`);
    }
    expect((await service.rpc("consume_pdf_download", args)).error?.message).toBe("exhausted");

    const foreign = { p_export_id: exportId, p_user_id: userIds[1] };
    expect((await service.rpc("consume_pdf_download", foreign)).error?.message).toBe("not_found");

    const expiredId = await insertExport(-HOUR);
    const expired = await service.rpc("consume_pdf_download", {
      p_export_id: expiredId,
      p_user_id: userIds[0],
    });
    expect(expired.error?.message).toBe("expired");
  });
});
