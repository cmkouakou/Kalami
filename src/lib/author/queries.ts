/**
 * =============================================================
 *  Fichier    : queries.ts
 *  Projet     : Kalami
 *  Description: Lectures de l'espace auteur (fiche, contrat, livres, statistiques, versions,
 *               soumissions, coordonnées de versement) et de la validation côté
 *               administration. Client de session : les politiques RLS filtrent les lignes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, lib/admin/content-queries.ts, supabase
 * =============================================================
 */

import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { BookVersionSummary } from "@/lib/admin/content-queries";
import type { PayoutInput } from "@/lib/author/validation";
import { requireAdmin, requireUser, type CurrentUser } from "@/lib/auth/dal";
import type { BookLanguage, BookStatus, Price } from "@/lib/catalog/types";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type AuthorProfile = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  photo_path: string | null;
};

export type Contract = {
  id: string;
  version: number;
  title: string;
  body: string;
  published_at: string;
};

/** Situation de l'utilisateur connecté vis-à-vis de l'espace auteur. */
export type AuthorContext = {
  user: CurrentUser;
  author: AuthorProfile | null;
  contract: Contract | null;
  /** Date d'acceptation de la dernière version du contrat, ou null */
  acceptedAt: string | null;
};

export type SubmissionStatus = "submitted" | "approved" | "rejected";

export type Submission = {
  id: string;
  status: SubmissionStatus;
  reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  /** Vrai si le livre était déjà publié (nouvelle version) */
  is_update: boolean;
};

/** Ligne du tableau de bord auteur. */
export type AuthorBookRow = {
  id: string;
  slug: string;
  title: string;
  status: BookStatus;
  cover_path: string | null;
  has_pending_version: boolean;
  readers: number;
  highlights: number;
};

/** Livre de l'auteur, pour sa page de gestion. */
export type AuthorBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  edition: string | null;
  summary: string | null;
  keywords: string | null;
  language: BookLanguage;
  category_id: string | null;
  page_count: number | null;
  publication_year: number | null;
  pdf_enabled: boolean;
  status: BookStatus;
  rejection_reason: string | null;
  cover_path: string | null;
  book_prices: Price[];
  current: BookVersionSummary | null;
  pending: BookVersionSummary | null;
  submissions: Submission[];
};

export type TopPassage = {
  chapter_position: number;
  start_block: number;
  readers: number;
  quote: string;
};

/** Demande de validation ouverte, pour l'administration. */
export type OpenSubmission = {
  id: string;
  submitted_at: string;
  is_update: boolean;
  book: { id: string; title: string; author: { display_name: string } };
};

const VERSION_COLUMNS = "id, version_number, source_format, chapter_count, word_count, created_at";

/** Lève une erreur explicite si la lecture a échoué. */
function check<T>(
  result: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

// ==================== CONTEXTE AUTEUR ====================

/** Dernière version publiée du contrat auteur, ou null. */
export async function getLatestContract(): Promise<Contract | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("author_contracts")
    .select("id, version, title, body, published_at")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<Contract>();
  return check(result, "contrat");
}

/**
 * Fiche auteur de l'utilisateur, contrat en vigueur et acceptation (une lecture par requête).
 * @param nextPath - Page de retour après connexion
 */
export const getAuthorContext = cache(async (nextPath: string): Promise<AuthorContext> => {
  const user = await requireUser(nextPath);
  const supabase = await createClient();

  const [author, contract] = await Promise.all([
    supabase
      .from("authors")
      .select("id, slug, display_name, bio, photo_path")
      .eq("user_id", user.id)
      .maybeSingle<AuthorProfile>(),
    getLatestContract(),
  ]);
  const profile = check(author, "fiche auteur");

  let acceptedAt: string | null = null;
  if (profile && contract) {
    const acceptance = await supabase
      .from("author_contract_acceptances")
      .select("accepted_at")
      .eq("author_id", profile.id)
      .eq("contract_id", contract.id)
      .maybeSingle<{ accepted_at: string }>();
    acceptedAt = check(acceptance, "acceptation")?.accepted_at ?? null;
  }
  return { user, author: profile, contract, acceptedAt };
});

/**
 * Exige une fiche auteur ; sinon renvoie vers l'inscription.
 * @param nextPath - Page de retour après connexion
 */
export async function requireAuthor(
  nextPath: string,
): Promise<AuthorContext & { author: AuthorProfile }> {
  const context = await getAuthorContext(nextPath);
  if (!context.author) redirect("/auteur/inscription");
  return { ...context, author: context.author };
}

// ==================== LIVRES DE L'AUTEUR ====================

/**
 * Livres de l'auteur avec lecteurs actifs et nombre de surlignages.
 * @param authorId - Fiche auteur de l'utilisateur
 */
export async function listAuthorBooks(authorId: string): Promise<AuthorBookRow[]> {
  const supabase = await createClient();
  const [books, stats] = await Promise.all([
    supabase
      .from("books")
      .select("id, slug, title, status, cover_path, pending_version_id")
      .eq("author_id", authorId)
      .order("updated_at", { ascending: false }),
    supabase.rpc("author_book_stats"),
  ]);
  const rows = check(books, "livres") as {
    id: string;
    slug: string;
    title: string;
    status: BookStatus;
    cover_path: string | null;
    pending_version_id: string | null;
  }[];
  const byBook = new Map(
    (check(stats, "statistiques") as { book_id: string; readers: number; highlights: number }[])
      .map((s) => [s.book_id, s]),
  );

  return rows.map(({ pending_version_id, ...book }) => ({
    ...book,
    has_pending_version: pending_version_id !== null,
    readers: Number(byBook.get(book.id)?.readers ?? 0),
    highlights: Number(byBook.get(book.id)?.highlights ?? 0),
  }));
}

/** Lit une version (résumé), ou null. */
async function loadVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string | null,
): Promise<BookVersionSummary | null> {
  if (!id) return null;
  const result = await supabase
    .from("book_versions")
    .select(VERSION_COLUMNS)
    .eq("id", id)
    .maybeSingle<BookVersionSummary>();
  return check(result, "version");
}

/**
 * Livre de l'auteur avec ses versions et l'historique de ses demandes de validation.
 * @param bookId   - Identifiant (uuid déjà validé)
 * @param authorId - Fiche auteur : un livre d'un autre auteur renvoie null
 */
export async function getAuthorBook(bookId: string, authorId: string): Promise<AuthorBook | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("books")
    .select(
      "id, slug, title, subtitle, edition, summary, keywords, language, category_id, " +
        "page_count, publication_year, pdf_enabled, status, rejection_reason, cover_path, " +
        "current_version_id, pending_version_id, book_prices(currency, amount_minor)",
    )
    .eq("id", bookId)
    .eq("author_id", authorId)
    .maybeSingle();
  const row = check(result, "livre") as unknown as
    | (Omit<AuthorBook, "current" | "pending" | "submissions"> & {
        current_version_id: string | null;
        pending_version_id: string | null;
      })
    | null;
  if (!row) return null;

  const { current_version_id, pending_version_id, ...book } = row;
  const [current, pending, submissions] = await Promise.all([
    loadVersion(supabase, current_version_id),
    loadVersion(supabase, pending_version_id),
    listSubmissions(bookId),
  ]);
  return { ...book, current, pending, submissions };
}

/**
 * Historique des demandes de validation d'un livre, la plus récente en premier.
 * Une demande est une « nouvelle version » si une version validée l'a précédée.
 */
export async function listSubmissions(bookId: string): Promise<Submission[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("book_submissions")
    .select("id, status, reason, submitted_at, reviewed_at")
    .eq("book_id", bookId)
    .order("submitted_at", { ascending: true });
  const rows = check(result, "demandes") as Omit<Submission, "is_update">[];

  let approvedBefore = false;
  const withKind = rows.map((row) => {
    const submission = { ...row, is_update: approvedBefore };
    if (row.status === "approved") approvedBefore = true;
    return submission;
  });
  return withKind.reverse();
}

/**
 * Passages les plus surlignés d'un livre (3 lecteurs distincts minimum).
 * @param bookId - Identifiant du livre (auteur ou administrateur, vérifié en base)
 */
export async function getTopPassages(bookId: string): Promise<TopPassage[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("author_top_passages", { p_book_id: bookId, p_limit: 5 });
  return (check(result, "passages") as TopPassage[]).map((p) => ({
    ...p,
    readers: Number(p.readers),
  }));
}

/** Options du formulaire de livre : catégories. */
export async function listCategoryOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const result = await supabase.from("categories").select("id, name").order("position");
  return check(result, "catégories") ?? [];
}

/** Coordonnées de versement de l'auteur, ou null. */
export async function getPayoutDetails(authorId: string): Promise<PayoutInput | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("author_payout_details")
    .select(
      "method, account_holder, bank_name, account_number, swift, mobile_operator, mobile_number",
    )
    .eq("author_id", authorId)
    .maybeSingle<PayoutInput>();
  return check(result, "versements");
}

// ==================== ADMINISTRATION ====================

/** Demandes de validation ouvertes, les plus anciennes en premier. */
export async function listOpenSubmissions(): Promise<OpenSubmission[]> {
  await requireAdmin();
  const supabase = await createClient();
  const result = await supabase
    .from("book_submissions")
    .select(
      "id, submitted_at, book:books!inner(id, title, status, " +
        "author:authors!inner(display_name))",
    )
    .eq("status", "submitted")
    .order("submitted_at");
  const rows = check(result, "soumissions") as unknown as (Omit<OpenSubmission, "is_update"> & {
    book: { status: BookStatus };
  })[];
  return rows.map((row) => ({ ...row, is_update: row.book.status === "published" }));
}

/** Demande ouverte d'un livre et sa version soumise, pour le panneau de décision. */
export async function getOpenSubmission(
  bookId: string,
): Promise<{ id: string; submitted_at: string; version: BookVersionSummary | null } | null> {
  await requireAdmin();
  const supabase = await createClient();
  const result = await supabase
    .from("book_submissions")
    .select("id, submitted_at, version_id")
    .eq("book_id", bookId)
    .eq("status", "submitted")
    .maybeSingle<{ id: string; submitted_at: string; version_id: string | null }>();
  const row = check(result, "soumission");
  if (!row) return null;
  return {
    id: row.id,
    submitted_at: row.submitted_at,
    version: await loadVersion(supabase, row.version_id),
  };
}

/** Nombre d'acceptations par version du contrat (page d'administration). */
export async function countContractAcceptances(contractId: string): Promise<number> {
  await requireAdmin();
  const supabase = await createClient();
  const result = await supabase
    .from("author_contract_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("contract_id", contractId);
  if (result.error) throw new Error(`Comptage impossible : ${result.error.message}`);
  return result.count ?? 0;
}
