/**
 * =============================================================
 *  Fichier    : chapters.ts
 *  Projet     : Kalami
 *  Description: Service des chapitres protégés : lecture avec la clé secrète (les chapitres
 *               ne sont lisibles par aucun rôle client), puis vérification dans l'ordre :
 *               livre visible → limitation de débit → droit d'accès → coupure de l'extrait.
 *               Aucun contenu n'est renvoyé si l'accès est refusé. Fournit aussi l'accès
 *               du lecteur (liseuse) et la recherche limitée aux parties autorisées.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/supabase/admin.ts, lib/auth/dal.ts, access.ts, lib/reader/search.ts
 * =============================================================
 */

import "server-only";

import type { CurrentUser } from "@/lib/auth/dal";
import { searchChapters, type SearchableChapter } from "@/lib/reader/search";
import type { SearchHit } from "@/lib/reader/types";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  applyPreviewCut,
  authorizedChapters,
  chooseVersion,
  CONTENT_RATE_LIMIT,
  CONTENT_RATE_WINDOW_SECONDS,
  decideAccess,
  type PreviewRule,
} from "./access";
import type { ChapterPayload } from "./types";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Livre tel que lu pour décider de l'accès. */
type BookAccessRow = PreviewRule & {
  id: string;
  status: string;
  current_version_id: string | null;
  pending_version_id: string | null;
  chapter_count: number | null;
  author: { user_id: string | null };
};

/** Résultat transmis à la route : contenu (200) ou code d'erreur sans contenu. */
export type ChapterResult =
  | { status: 200; payload: ChapterPayload }
  | { status: 403 | 404 | 429 };

/** Résultat de la recherche : occurrences (200) ou code d'erreur. */
export type SearchResult = { status: 200; hits: SearchHit[] } | { status: 404 | 429 };

/** Accès d'un lecteur à un livre, pour la liseuse. */
export type ReaderAccessInfo = {
  full: boolean;
  /** Identifiant du droit de lecture (filigrane), null pour l'équipe ou sans droit */
  entitlementId: string | null;
};

const BOOK_ACCESS_COLUMNS =
  "id, status, preview_chapters, preview_cut_block, current_version_id, pending_version_id, " +
  "chapter_count, " +
  "author:authors!inner(user_id)";

// ==================== VÉRIFICATIONS ====================

/** Lit un livre et les colonnes nécessaires à la décision d'accès. */
async function loadBook(db: AdminClient, bookId: string): Promise<BookAccessRow | null> {
  const { data, error } = await db
    .from("books")
    .select(BOOK_ACCESS_COLUMNS)
    .eq("id", bookId)
    .maybeSingle<BookAccessRow>();
  if (error) throw new Error(`Lecture du livre impossible : ${error.message}`);
  return data;
}

/**
 * Indique si l'utilisateur lit le livre en tant qu'auteur ou administrateur (aal2).
 * @param db           - Client service
 * @param user         - Utilisateur connecté
 * @param authorUserId - Compte lié à l'auteur du livre
 */
async function isStaff(
  db: AdminClient,
  user: CurrentUser,
  authorUserId: string | null,
): Promise<boolean> {
  if (authorUserId === user.id) return true;
  if (user.aal !== "aal2") return false;

  const { data, error } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Lecture du profil impossible : ${error.message}`);
  return data?.is_admin === true;
}

/** Droit de lecture actif du lecteur sur le livre (identifiant), ou null. */
async function findEntitlement(
  db: AdminClient,
  userId: string,
  bookId: string,
): Promise<string | null> {
  const { data, error } = await db
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .is("revoked_at", null)
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`Lecture des droits impossible : ${error.message}`);
  return data?.id ?? null;
}

/** Vrai si le demandeur peut lire tout le livre (équipe ou droit de lecture). */
async function isEntitled(
  db: AdminClient,
  user: CurrentUser | null,
  bookId: string,
  staff: boolean,
): Promise<boolean> {
  if (staff) return true;
  return user ? (await findEntitlement(db, user.id, bookId)) !== null : false;
}

/**
 * Inscrit l'accès au journal et applique la limitation de débit.
 * @param position - Numéro du chapitre, ou 0 pour une recherche
 * @returns false si la limite est atteinte (réponse 429)
 */
async function registerAccess(
  db: AdminClient,
  subject: string,
  bookId: string,
  position: number,
): Promise<boolean> {
  const { data, error } = await db.rpc("register_content_access", {
    p_subject: subject,
    p_book_id: bookId,
    p_position: position,
    p_limit: CONTENT_RATE_LIMIT,
    p_window_seconds: CONTENT_RATE_WINDOW_SECONDS,
  });
  if (error) throw new Error(`Limitation de débit indisponible : ${error.message}`);
  return data === true;
}

/** Nombre de chapitres d'une version (aperçu d'une version en attente). */
async function versionChapterCount(db: AdminClient, versionId: string): Promise<number | null> {
  const { data, error } = await db
    .from("book_versions")
    .select("chapter_count")
    .eq("id", versionId)
    .maybeSingle<{ chapter_count: number }>();
  if (error) throw new Error(`Lecture de la version impossible : ${error.message}`);
  return data?.chapter_count ?? null;
}

// ==================== SERVICE ====================

/**
 * Renvoie un chapitre si le demandeur y a droit.
 * @param bookId   - Identifiant (uuid déjà validé) du livre
 * @param position - Numéro du chapitre (déjà validé)
 * @param user     - Utilisateur connecté, ou null pour un visiteur
 * @param subject  - Identifiant de limitation de débit (voir rateLimitSubject)
 * @param preview  - Aperçu de la version en attente (auteur ou administrateur)
 * @returns Chapitre (200) ou code d'erreur : 404 livre/chapitre absent, 429 trop de
 *          requêtes, 403 hors extrait sans droit de lecture
 */
export async function getChapterForRequest(
  bookId: string,
  position: number,
  user: CurrentUser | null,
  subject: string,
  preview = false,
): Promise<ChapterResult> {
  const db = createAdminClient();

  const book = await loadBook(db, bookId);
  if (!book) return { status: 404 };

  const staff = user ? await isStaff(db, user, book.author.user_id) : false;
  const versionId = chooseVersion(book, staff, preview);
  if (!versionId) return { status: 404 };

  if (!(await registerAccess(db, subject, bookId, position))) return { status: 429 };

  const entitled = preview || (await isEntitled(db, user, bookId, staff));
  const decision = decideAccess(position, book, entitled);
  if (decision === "denied") return { status: 403 };

  const { data: chapter, error: chapterError } = await db
    .from("chapters")
    .select("title, blocks")
    .eq("version_id", versionId)
    .eq("position", position)
    .maybeSingle<{ title: string; blocks: string[] }>();
  if (chapterError) throw new Error(`Lecture du chapitre impossible : ${chapterError.message}`);
  if (!chapter) return { status: 404 };

  const { blocks, truncated } = applyPreviewCut(chapter.blocks, position, decision, book);
  const chapterCount = preview ? await versionChapterCount(db, versionId) : book.chapter_count;
  return {
    status: 200,
    payload: {
      book_id: book.id,
      position,
      title: chapter.title,
      blocks,
      chapter_count: chapterCount ?? position,
      is_preview: decision === "preview",
      truncated,
    },
  };
}

// ==================== LISEUSE ====================

/**
 * Accès d'un lecteur à un livre : livre entier (droit de lecture, auteur, administrateur)
 * ou extrait seulement. Sert à l'affichage ; chaque chapitre reste vérifié par l'API.
 * @param bookId - Identifiant du livre
 * @param user   - Utilisateur connecté, ou null
 */
export async function getReaderAccess(
  bookId: string,
  user: CurrentUser | null,
): Promise<ReaderAccessInfo> {
  if (!user) return { full: false, entitlementId: null };
  const db = createAdminClient();
  const book = await loadBook(db, bookId);
  if (!book) return { full: false, entitlementId: null };

  const entitlementId = await findEntitlement(db, user.id, bookId);
  if (entitlementId) return { full: true, entitlementId };
  return { full: await isStaff(db, user, book.author.user_id), entitlementId: null };
}

/**
 * Recherche dans le texte d'un livre, limitée aux parties que le demandeur peut lire.
 * Les chapitres refusés ne sont même pas lus en base ; la coupure de l'extrait est
 * appliquée avant la recherche.
 * @param bookId  - Identifiant (uuid déjà validé) du livre
 * @param query   - Requête déjà validée (parseSearchQuery)
 * @param user    - Utilisateur connecté, ou null
 * @param subject - Identifiant de limitation de débit
 * @param preview - Aperçu de la version en attente (auteur ou administrateur)
 * @returns Occurrences (200), 404 livre absent, 429 trop de requêtes
 */
export async function searchBookForRequest(
  bookId: string,
  query: string,
  user: CurrentUser | null,
  subject: string,
  preview = false,
): Promise<SearchResult> {
  const db = createAdminClient();
  const book = await loadBook(db, bookId);
  if (!book) return { status: 404 };

  const staff = user ? await isStaff(db, user, book.author.user_id) : false;
  const versionId = chooseVersion(book, staff, preview);
  if (!versionId) return { status: 404 };

  // Une recherche compte comme un accès au contenu (position 0 = recherche)
  if (!(await registerAccess(db, subject, bookId, 0))) return { status: 429 };

  const entitled = preview || (await isEntitled(db, user, bookId, staff));

  let request = db
    .from("chapters")
    .select("position, title, blocks")
    .eq("version_id", versionId);
  if (!entitled) request = request.lte("position", book.preview_chapters);
  const { data, error } = await request.order("position");
  if (error) throw new Error(`Lecture des chapitres impossible : ${error.message}`);

  const chapters = authorizedChapters((data ?? []) as SearchableChapter[], book, entitled);
  return { status: 200, hits: searchChapters(chapters, query) };
}
