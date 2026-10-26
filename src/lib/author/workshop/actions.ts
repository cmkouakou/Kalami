/**
 * =============================================================
 *  Fichier    : actions.ts (atelier)
 *  Projet     : Kalami
 *  Description: Actions serveur de l'atelier de l'auteur (v0.15.1) : lancer le relecteur
 *               ou le conseiller de style sur un chapitre, accepter ou refuser des
 *               suggestions, puis créer une nouvelle version du livre avec les corrections
 *               acceptées (elle suit la validation habituelle).
 *               Fiche du livre (v0.15.2) : rédaction par Claude et reprise d'une
 *               proposition dans la fiche du livre ou la biographie de l'auteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-25
 *  Dépendances: workshop/run.ts, workshop/queries.ts, workshop/suggestions.ts,
 *               workshop/listing.ts, lib/catalog/queries.ts,
 *               lib/content/typography.ts, lib/supabase/server.ts, lib/supabase/admin.ts
 * =============================================================
 */

"use server";

import { refresh, updateTag } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireAuthor } from "@/lib/author/queries";
import {
  keywordsText,
  LISTING_FIELDS,
  readListing,
  type ListingField,
} from "@/lib/author/workshop/listing";
import { runChapterTool, runListingTool, type WorkshopTool } from "@/lib/author/workshop/run";
import { getManuscript, listLatestChapterRequests } from "@/lib/author/workshop/queries";
import {
  applySuggestions,
  CHAPTER_TOOLS,
  readChapterReview,
  type ChapterTool,
  type SuggestionDecision,
  type WorkshopSuggestion,
} from "@/lib/author/workshop/suggestions";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { polishChapters } from "@/lib/content/typography";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const w = t.workshop;

/** Plus grand nombre de décisions notées en une fois. */
const MAX_DECISIONS = 150;

// ==================== OUTILS ====================

/**
 * Lance un outil de l'atelier : relecteur ou conseiller de style sur un chapitre, ou
 * rédaction de la fiche du livre (sans chapitre).
 * @param bookId    - Livre de l'auteur
 * @param chapterId - Chapitre de la version lue (null pour la fiche)
 * @param tool      - proofread, style ou listing
 */
export async function runWorkshopTool(
  bookId: string,
  chapterId: string | null,
  tool: WorkshopTool,
): Promise<{ ok: boolean; error?: string }> {
  const chapterTool = CHAPTER_TOOLS.includes(tool as ChapterTool);
  const valid = chapterTool
    ? chapterId !== null && isUuid(chapterId)
    : tool === "listing" && chapterId === null;
  if (!isUuid(bookId) || !valid) return { ok: false, error: w.tools.errors.failed };
  const { author } = await requireAuthor(
    `/auteur/livres/${bookId}/atelier/${chapterId ?? "fiche"}`,
  );
  const result = chapterTool && chapterId
    ? await runChapterTool(bookId, chapterId, tool as ChapterTool, author.id)
    : await runListingTool(bookId, author);
  if (!result.ok) return { ok: false, error: w.tools.errors[result.error] };
  refresh();
  return { ok: true };
}

// ==================== DÉCISIONS ====================

/**
 * Note les décisions de l'auteur sur les suggestions d'une demande. La lecture passe par
 * la session (RLS, demande de l'auteur) ; l'écriture, interdite aux auteurs en direct,
 * passe ensuite par le client service.
 * @param requestId - Demande terminée
 * @param decisions - Décision par indice de suggestion
 */
export async function decideWorkshopSuggestions(
  requestId: string,
  decisions: Record<number, SuggestionDecision>,
): Promise<{ ok: boolean; error?: string }> {
  const entries = Object.entries(decisions);
  const valid = entries.length > 0 && entries.length <= MAX_DECISIONS
    && entries.every(([index, decision]) => {
      const n = Number(index);
      return Number.isInteger(n) && n >= 0 && (decision === "accepted" || decision === "rejected");
    });
  if (!isUuid(requestId) || !valid) return { ok: false, error: w.tools.errors.failed };
  const { author } = await requireAuthor("/auteur/atelier");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("workshop_requests")
    .select("output, decisions")
    .eq("id", requestId)
    .eq("author_id", author.id)
    .eq("status", "done")
    .maybeSingle<{ output: unknown; decisions: Record<string, SuggestionDecision> | null }>();
  if (!row) return { ok: false, error: w.tools.errors.not_found };
  const count = readChapterReview(row.output).suggestions.length;
  if (entries.some(([index]) => Number(index) >= count)) {
    return { ok: false, error: w.tools.errors.failed };
  }

  const { error } = await createAdminClient()
    .from("workshop_requests")
    .update({ decisions: { ...(row.decisions ?? {}), ...Object.fromEntries(entries) } })
    .eq("id", requestId)
    .eq("author_id", author.id);
  if (error) return { ok: false, error: w.tools.errors.failed };
  return { ok: true };
}

// ==================== FICHE DU LIVRE ====================

/**
 * Reprend une proposition de la dernière fiche : résumé, mots-clés ou titre dans la fiche
 * du livre (RLS : brouillon ou refusé seulement), biographie dans le profil de l'auteur.
 * La proposition est ensuite notée « accepted » dans la demande (client service).
 * @param requestId  - Demande de fiche terminée
 * @param field      - Champ repris
 * @param titleIndex - Indice du titre proposé (champ « title » seulement)
 *
 * Exemple :
 *   await applyListingField(requestId, "title", 2);
 */
export async function applyListingField(
  requestId: string,
  field: ListingField,
  titleIndex = 0,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const l = w.listing;
  if (!isUuid(requestId) || !LISTING_FIELDS.includes(field)) return { ok: false, error: l.failed };
  const { author } = await requireAuthor("/auteur/atelier");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("workshop_requests")
    .select("book_id, output, decisions")
    .eq("id", requestId)
    .eq("author_id", author.id)
    .eq("tool", "listing")
    .eq("status", "done")
    .maybeSingle<{ book_id: string; output: unknown; decisions: Record<string, string> | null }>();
  const listing = row ? readListing(row.output) : null;
  if (!row || !listing) return { ok: false, error: w.tools.errors.not_found };

  const title = field === "title" ? listing.titles[titleIndex] : undefined;
  const values = {
    summary: listing.summary ? { summary: listing.summary } : null,
    keywords: listing.keywords.length ? { keywords: keywordsText(listing.keywords) } : null,
    title: title ? { title: title.title, subtitle: title.subtitle } : null,
    bio: null,
  }[field];

  if (field === "bio") {
    if (!listing.bio) return { ok: false, error: l.failed };
    const { error } = await supabase
      .from("authors")
      .update({ bio: listing.bio })
      .eq("id", author.id);
    if (error) return { ok: false, error: l.failed };
    updateTag(CATALOG_TAG);
  } else {
    if (!values) return { ok: false, error: l.failed };
    // La politique RLS n'autorise la mise à jour que d'un livre modifiable de l'auteur
    const { data, error } = await supabase
      .from("books")
      .update(values)
      .eq("id", row.book_id)
      .eq("author_id", author.id)
      .select("id");
    if (error) return { ok: false, error: l.failed };
    if (!data?.length) return { ok: false, error: t.author.book.locked };
  }

  const key = field === "title" ? `title:${titleIndex}` : field;
  await createAdminClient()
    .from("workshop_requests")
    .update({ decisions: { ...(row.decisions ?? {}), [key]: "accepted" } })
    .eq("id", requestId)
    .eq("author_id", author.id);
  refresh();
  return { ok: true, message: field === "bio" ? l.savedBio : l.saved };
}

// ==================== NOUVELLE VERSION ====================

/**
 * Suggestions acceptées d'un chapitre : relecture d'abord, puis style, dans l'ordre.
 * @param requests  - Dernières demandes par « chapitre:outil »
 * @param chapterId - Chapitre concerné
 */
function acceptedFor(
  requests: Awaited<ReturnType<typeof listLatestChapterRequests>>,
  chapterId: string,
): WorkshopSuggestion[] {
  return CHAPTER_TOOLS.flatMap((tool) => {
    const request = requests.get(`${chapterId}:${tool}`);
    if (!request) return [];
    return request.review.suggestions.filter(
      (_, index) => request.decisions[String(index)] === "accepted",
    );
  });
}

/**
 * Crée une nouvelle version du livre avec les corrections acceptées (identifiant lié par
 * .bind). La version remplace une version en attente et passe par la validation.
 * @param bookId - Livre de l'auteur
 */
export async function createCorrectedVersion(bookId: string): Promise<FormState> {
  if (!isUuid(bookId)) return { error: w.version.failed };
  const { author } = await requireAuthor(`/auteur/livres/${bookId}/atelier`);
  const manuscript = await getManuscript(bookId, author.id);
  if (!manuscript?.versionId) return { error: w.version.failed };

  const { data: base } = await createAdminClient()
    .from("book_versions")
    .select("source_format, source_path")
    .eq("id", manuscript.versionId)
    .maybeSingle<{ source_format: string; source_path: string }>();
  if (!base) return { error: w.version.failed };

  const requests = await listLatestChapterRequests(manuscript.versionId);
  let applied = 0;
  let manual = 0;
  const corrected = manuscript.chapters.map((chapter) => {
    const result = applySuggestions(chapter.blocks, acceptedFor(requests, chapter.id));
    applied += result.applied;
    manual += result.skipped;
    return { title: chapter.title, blocks: result.blocks, word_count: chapter.wordCount };
  });
  if (applied === 0) return { error: w.version.nothing };

  let chapters;
  try {
    chapters = polishChapters(corrected, manuscript.book.language);
  } catch {
    return { error: w.version.failed };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("author_save_book_version", {
    p_book_id: bookId,
    p_source_format: base.source_format,
    p_source_path: base.source_path,
    p_chapters: chapters,
  });
  if (error) {
    return {
      error: error.message === "submission_open"
        ? t.author.errors.submission_open
        : w.version.failed,
    };
  }
  refresh();
  return {
    message: interpolate(manual > 0 ? w.version.createdManual : w.version.created, {
      applied: String(applied),
      manual: String(manual),
    }),
  };
}
