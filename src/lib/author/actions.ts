/**
 * =============================================================
 *  Fichier    : actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur de l'espace auteur : inscription, acceptation du contrat,
 *               fiche publique, coordonnées de versement, fiche d'un livre, images,
 *               manuscrit et demande de validation. Les droits sont appliqués par la base
 *               (RLS, déclencheurs de garde, fonctions SQL) ; chaque argument est vérifié.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/validation.ts, lib/catalog/writes.ts, lib/content/manuscript.ts
 * =============================================================
 */

"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import {
  parseAuthorBook,
  parseAuthorProfile,
  parsePayout,
  parseRegistration,
} from "@/lib/author/validation";
import { isOwnImagePath } from "@/lib/catalog/images";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { removeImage, savePrices } from "@/lib/catalog/writes";
import { convertStoredManuscript } from "@/lib/content/manuscript";
import { slugify, SLUG_MAX_LENGTH } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const a = t.author;
const e = t.admin.errors;

type AuthorErrorKey = Exclude<keyof typeof a.errors, "notAuthor">;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Traduit le code levé par une fonction SQL de l'espace auteur (« already_submitted »…).
 * @param message - Message d'erreur PostgreSQL
 */
function authorErrorMessage(message: string | undefined): string {
  if (message && message in a.errors) return a.errors[message as AuthorErrorKey];
  if (message === "contract_outdated") return a.contract.outdated;
  if (message === "already_author") return a.register.alreadyAuthor;
  return e.generic;
}

/** Fiche auteur de l'utilisateur connecté, ou null. */
async function currentAuthorId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const user = await requireUser("/auteur");
  const { data } = await supabase
    .from("authors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

/** Slug unique pour un nouveau livre : titre, puis titre + suffixe aléatoire. */
function bookSlug(title: string, attempt: number): string {
  const base = slugify(title) || "livre";
  if (attempt === 0) return base;
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base.slice(0, SLUG_MAX_LENGTH - suffix.length - 1)}-${suffix}`;
}

// ==================== INSCRIPTION ET CONTRAT ====================

/** Crée la fiche auteur et enregistre l'acceptation du contrat, puis ouvre l'espace. */
export async function registerAuthor(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/auteur/inscription");
  const parsed = parseRegistration(formData);
  if (!parsed.ok) return { error: parsed.error };
  const input = parsed.value;

  const supabase = await createClient();
  const { error } = await supabase.rpc("author_register", {
    p_display_name: input.display_name,
    p_slug: input.slug,
    p_bio: input.bio ?? "",
    p_contract_id: input.contract_id,
  });
  if (error) {
    return { error: error.code === "23505" ? e.slugTaken : authorErrorMessage(error.message) };
  }
  redirect("/auteur");
}

/** Accepte la dernière version du contrat (identifiant lié par .bind). */
export async function acceptContract(contractId: string): Promise<FormState> {
  await requireUser("/auteur/contrat");
  if (!isUuid(contractId)) return { error: e.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("author_accept_contract", { p_contract_id: contractId });
  if (error) return { error: authorErrorMessage(error.message) };
  refresh();
  return { message: a.contract.accepted };
}

// ==================== PROFIL ====================

/** Modifie le nom et la biographie publics de l'auteur. */
export async function updateAuthorProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId) return { error: a.errors.notAuthor };
  const parsed = parseAuthorProfile(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await supabase.from("authors").update(parsed.value).eq("id", authorId);
  if (error) return { error: e.generic };
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.saved };
}

/** Enregistre (ou remplace) les coordonnées de versement. */
export async function savePayoutDetails(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId) return { error: a.errors.notAuthor };
  const parsed = parsePayout(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await supabase
    .from("author_payout_details")
    .upsert({ author_id: authorId, ...parsed.value, updated_at: new Date().toISOString() });
  if (error) return { error: e.generic };
  return { message: t.admin.common.saved };
}

/**
 * Associe la photo que le navigateur vient d'envoyer et supprime l'ancienne.
 * @param id   - Fiche auteur de l'utilisateur
 * @param path - Chemin « auteurs/{id}/{uuid}.{ext} » dans le seau
 */
export async function setOwnPhoto(id: string, path: string): Promise<FormState> {
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId || authorId !== id || !isOwnImagePath(path, "auteurs", id)) {
    return { error: e.generic };
  }

  const { data: previous } = await supabase
    .from("authors")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle<{ photo_path: string | null }>();
  const { error } = await supabase.from("authors").update({ photo_path: path }).eq("id", id);
  if (error) return { error: e.generic };

  if (previous?.photo_path !== path) await removeImage(supabase, previous?.photo_path ?? null);
  updateTag(CATALOG_TAG);
  return { message: t.admin.upload.done };
}

// ==================== LIVRES ====================

/** Crée un livre en brouillon et ses prix, puis ouvre sa page de gestion. */
export async function createAuthorBook(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId) return { error: a.errors.notAuthor };
  const parsed = parseAuthorBook(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { book, prices } = parsed.value;

  let bookId: string | null = null;
  for (let attempt = 0; attempt < 3 && !bookId; attempt++) {
    const { data, error } = await supabase
      .from("books")
      .insert({ ...book, slug: bookSlug(book.title, attempt), author_id: authorId })
      .select("id")
      .single<{ id: string }>();
    if (error && error.code !== "23505") return { error: e.generic };
    bookId = data?.id ?? null;
  }
  if (!bookId) return { error: e.slugTaken };

  const priceError = await savePrices(supabase, bookId, prices);
  if (priceError) {
    // Annule la création pour ne pas laisser un livre à moitié enregistré
    await supabase.from("books").delete().eq("id", bookId);
    return { error: e.generic };
  }
  redirect(`/auteur/livres/${bookId}?cree=1`);
}

/** Modifie la fiche d'un livre modifiable (brouillon ou refusé) et ses prix. */
export async function updateAuthorBook(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isUuid(id)) return { error: e.generic };
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId) return { error: a.errors.notAuthor };
  const parsed = parseAuthorBook(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { book, prices } = parsed.value;

  // La politique RLS n'autorise la mise à jour que d'un livre modifiable de l'auteur
  const { data, error } = await supabase
    .from("books")
    .update(book)
    .eq("id", id)
    .eq("author_id", authorId)
    .select("id");
  if (error) return { error: e.generic };
  if (!data?.length) return { error: a.book.locked };

  const priceError = await savePrices(supabase, id, prices);
  if (priceError) return { error: e.generic };
  refresh();
  return { message: t.admin.common.saved };
}

/**
 * Associe la couverture que le navigateur vient d'envoyer et supprime l'ancienne.
 * @param id   - Identifiant du livre (modifiable, de l'auteur)
 * @param path - Chemin « livres/{id}/{uuid}.{ext} » dans le seau
 */
export async function setOwnBookCover(id: string, path: string): Promise<FormState> {
  if (!isUuid(id) || !isOwnImagePath(path, "livres", id)) return { error: e.generic };
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId) return { error: a.errors.notAuthor };

  const { data: previous } = await supabase
    .from("books")
    .select("cover_path")
    .eq("id", id)
    .eq("author_id", authorId)
    .maybeSingle<{ cover_path: string | null }>();
  const { data, error } = await supabase
    .from("books")
    .update({ cover_path: path })
    .eq("id", id)
    .eq("author_id", authorId)
    .select("id");
  if (error || !data?.length) return { error: error ? e.generic : a.book.locked };

  if (previous?.cover_path !== path) await removeImage(supabase, previous?.cover_path ?? null);
  return { message: t.admin.upload.done };
}

/**
 * Convertit le manuscrit déposé et en fait la version en attente de validation.
 * @param bookId - Identifiant du livre de l'auteur
 * @param path   - Chemin du fichier dans le seau « manuscripts »
 */
export async function convertAuthorManuscript(bookId: string, path: string): Promise<FormState> {
  if (!isUuid(bookId)) return { error: e.generic };
  const supabase = await createClient();
  const authorId = await currentAuthorId(supabase);
  if (!authorId) return { error: a.errors.notAuthor };

  const result = await convertStoredManuscript(
    supabase, bookId, path, "author_save_book_version",
  );
  if (result.sqlError) return { error: authorErrorMessage(result.sqlError) };
  return { error: result.error, message: result.message };
}

/** Envoie le livre (ou sa nouvelle version) à la validation (identifiant lié par .bind). */
export async function submitAuthorBook(bookId: string): Promise<FormState> {
  if (!isUuid(bookId)) return { error: e.generic };
  await requireUser(`/auteur/livres/${bookId}`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("author_submit_book", { p_book_id: bookId });
  if (error) return { error: authorErrorMessage(error.message) };
  refresh();
  return { message: a.book.submitted };
}
