/**
 * =============================================================
 *  Fichier    : chapters.ts
 *  Projet     : Kalami
 *  Description: Service des chapitres protégés : lecture avec la clé secrète (les chapitres
 *               ne sont lisibles par aucun rôle client), puis vérification dans l'ordre :
 *               livre visible → limitation de débit → droit d'accès → coupure de l'extrait.
 *               Aucun contenu n'est renvoyé si l'accès est refusé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: lib/supabase/admin.ts, lib/auth/dal.ts, access.ts
 * =============================================================
 */

import "server-only";

import type { CurrentUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  applyPreviewCut,
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
  chapter_count: number | null;
  author: { user_id: string | null };
};

/** Résultat transmis à la route : contenu (200) ou code d'erreur sans contenu. */
export type ChapterResult =
  | { status: 200; payload: ChapterPayload }
  | { status: 403 | 404 | 429 };

// ==================== VÉRIFICATIONS ====================

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

/** Indique si le lecteur a un droit de lecture actif sur le livre. */
async function hasEntitlement(db: AdminClient, userId: string, bookId: string): Promise<boolean> {
  const { count, error } = await db
    .from("entitlements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .is("revoked_at", null);
  if (error) throw new Error(`Lecture des droits impossible : ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * Inscrit l'accès au journal et applique la limitation de débit.
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

// ==================== SERVICE ====================

/**
 * Renvoie un chapitre si le demandeur y a droit.
 * @param bookId   - Identifiant (uuid déjà validé) du livre
 * @param position - Numéro du chapitre (déjà validé)
 * @param user     - Utilisateur connecté, ou null pour un visiteur
 * @param subject  - Identifiant de limitation de débit (voir rateLimitSubject)
 * @returns Chapitre (200) ou code d'erreur : 404 livre/chapitre absent, 429 trop de
 *          requêtes, 403 hors extrait sans droit de lecture
 */
export async function getChapterForRequest(
  bookId: string,
  position: number,
  user: CurrentUser | null,
  subject: string,
): Promise<ChapterResult> {
  const db = createAdminClient();

  const { data: book, error } = await db
    .from("books")
    .select(
      "id, status, preview_chapters, preview_cut_block, current_version_id, chapter_count, " +
        "author:authors!inner(user_id)",
    )
    .eq("id", bookId)
    .maybeSingle<BookAccessRow>();
  if (error) throw new Error(`Lecture du livre impossible : ${error.message}`);
  if (!book?.current_version_id) return { status: 404 };

  const staff = user ? await isStaff(db, user, book.author.user_id) : false;
  if (book.status !== "published" && !staff) return { status: 404 };

  if (!(await registerAccess(db, subject, bookId, position))) return { status: 429 };

  const entitled = staff || (user ? await hasEntitlement(db, user.id, bookId) : false);
  const decision = decideAccess(position, book, entitled);
  if (decision === "denied") return { status: 403 };

  const { data: chapter, error: chapterError } = await db
    .from("chapters")
    .select("title, blocks")
    .eq("version_id", book.current_version_id)
    .eq("position", position)
    .maybeSingle<{ title: string; blocks: string[] }>();
  if (chapterError) throw new Error(`Lecture du chapitre impossible : ${chapterError.message}`);
  if (!chapter) return { status: 404 };

  const { blocks, truncated } = applyPreviewCut(chapter.blocks, position, decision, book);
  return {
    status: 200,
    payload: {
      book_id: book.id,
      position,
      title: chapter.title,
      blocks,
      chapter_count: book.chapter_count ?? position,
      is_preview: decision === "preview",
      truncated,
    },
  };
}
