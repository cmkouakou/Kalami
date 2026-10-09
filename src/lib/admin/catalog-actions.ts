/**
 * =============================================================
 *  Fichier    : catalog-actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur d'administration du catalogue (catégories, auteurs, livres,
 *               prix, images). Chaque action : requireAdmin → validation → écriture (RLS
 *               administrateur) → journal d'audit → invalidation du cache « catalogue ».
 *               Toute fonction exportée ici est une action publique : arguments vérifiés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/validation.ts, lib/admin/audit.ts, supabase
 * =============================================================
 */

"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import { audit } from "@/lib/admin/audit";
import {
  isUuid,
  parseAuthor,
  parseBook,
  parseCategory,
} from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { isOwnImagePath } from "@/lib/catalog/images";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { removeImage, savePrices } from "@/lib/catalog/writes";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const e = t.admin.errors;

type DbError = { code?: string; message: string } | null;

// ==================== FONCTIONS UTILITAIRES ====================

/** Traduit une erreur PostgreSQL en message pour le formulaire. */
function dbErrorMessage(error: DbError): string {
  if (error?.code === "23505") return e.slugTaken;
  return e.generic;
}

// ==================== CATÉGORIES ====================

/** Crée une catégorie. */
export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCategory(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(parsed.value)
    .select("id")
    .single();
  if (error) return { error: dbErrorMessage(error) };

  await audit(supabase, "category.create", "category", data.id, { slug: parsed.value.slug });
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.saved };
}

/** Modifie une catégorie (identifiant lié par .bind côté formulaire). */
export async function updateCategory(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };
  const parsed = parseCategory(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(parsed.value).eq("id", id);
  if (error) return { error: dbErrorMessage(error) };

  await audit(supabase, "category.update", "category", id, { slug: parsed.value.slug });
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.saved };
}

/** Supprime une catégorie ; ses livres deviennent « sans catégorie ». */
export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: dbErrorMessage(error) };

  await audit(supabase, "category.delete", "category", id, {});
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.deleted };
}

// ==================== AUTEURS ====================

/** Crée un auteur puis ouvre sa fiche (ajout de la photo). */
export async function createAuthor(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAuthor(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("authors")
    .insert(parsed.value)
    .select("id")
    .single();
  if (error) return { error: dbErrorMessage(error) };

  await audit(supabase, "author.create", "author", data.id, { slug: parsed.value.slug });
  updateTag(CATALOG_TAG);
  redirect(`/admin/auteurs/${data.id}`);
}

/** Modifie un auteur. */
export async function updateAuthor(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };
  const parsed = parseAuthor(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("authors").update(parsed.value).eq("id", id);
  if (error) return { error: dbErrorMessage(error) };

  await audit(supabase, "author.update", "author", id, { slug: parsed.value.slug });
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.saved };
}

/** Supprime un auteur sans livre (la base refuse sinon : clé étrangère « restrict »). */
export async function deleteAuthor(id: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("authors")
    .delete()
    .eq("id", id)
    .select("photo_path")
    .maybeSingle();
  if (error) return { error: error.code === "23503" ? e.authorHasBooks : e.generic };

  await removeImage(supabase, data?.photo_path ?? null);
  await audit(supabase, "author.delete", "author", id, {});
  updateTag(CATALOG_TAG);
  redirect("/admin/auteurs");
}

/**
 * Associe à l'auteur la photo que le navigateur vient d'envoyer, et supprime l'ancienne.
 * @param id   - Identifiant de l'auteur
 * @param path - Chemin « auteurs/{id}/{uuid}.{ext} » dans le seau
 */
export async function setAuthorPhoto(id: string, path: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id) || !isOwnImagePath(path, "auteurs", id)) return { error: e.generic };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("authors")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("authors").update({ photo_path: path }).eq("id", id);
  if (error) return { error: e.generic };

  if (previous?.photo_path !== path) await removeImage(supabase, previous?.photo_path ?? null);
  await audit(supabase, "author.photo", "author", id, { path });
  updateTag(CATALOG_TAG);
  return { message: t.admin.upload.done };
}

// ==================== LIVRES ====================

/** Crée un livre et ses prix, puis ouvre sa fiche (ajout de la couverture). */
export async function createBook(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseBook(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { book, prices } = parsed.value;

  const supabase = await createClient();
  const { data, error } = await supabase.from("books").insert(book).select("id").single();
  if (error) return { error: dbErrorMessage(error) };

  const priceError = await savePrices(supabase, data.id, prices);
  if (priceError) {
    // Annule la création pour ne pas laisser un livre à moitié enregistré
    await supabase.from("books").delete().eq("id", data.id);
    return { error: e.generic };
  }

  await audit(supabase, "book.create", "book", data.id, { slug: book.slug, status: book.status });
  updateTag(CATALOG_TAG);
  redirect(`/admin/livres/${data.id}`);
}

/** Modifie un livre et ses prix. */
export async function updateBook(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };
  const parsed = parseBook(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { book, prices } = parsed.value;

  const supabase = await createClient();
  const { error } = await supabase.from("books").update(book).eq("id", id);
  if (error) return { error: dbErrorMessage(error) };

  const priceError = await savePrices(supabase, id, prices);
  if (priceError) return { error: e.generic };

  await audit(supabase, "book.update", "book", id, { slug: book.slug, status: book.status });
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.saved };
}

/**
 * Associe au livre la couverture que le navigateur vient d'envoyer, et supprime l'ancienne.
 * @param id   - Identifiant du livre
 * @param path - Chemin « livres/{id}/{uuid}.{ext} » dans le seau
 */
export async function setBookCover(id: string, path: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id) || !isOwnImagePath(path, "livres", id)) return { error: e.generic };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("books")
    .select("cover_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("books").update({ cover_path: path }).eq("id", id);
  if (error) return { error: e.generic };

  if (previous?.cover_path !== path) await removeImage(supabase, previous?.cover_path ?? null);
  await audit(supabase, "book.cover", "book", id, { path });
  updateTag(CATALOG_TAG);
  return { message: t.admin.upload.done };
}
