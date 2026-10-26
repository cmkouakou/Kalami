/**
 * =============================================================
 *  Fichier    : queries.ts (atelier)
 *  Projet     : Kalami
 *  Description: Lectures de l'atelier de l'auteur (v0.15.0) : solde de Crédits Atelier
 *               (en pourcentage et en chapitres, jamais en dollars), forfaits en vente,
 *               manuscrit d'un livre de l'auteur (version en attente, sinon publiée),
 *               dernières relectures par chapitre (v0.15.1), dernière fiche proposée
 *               (v0.15.2).
 *               Lectures de l'administrateur : réglages, forfaits et consommation.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-25
 *  Dépendances: lib/supabase/server.ts, lib/supabase/admin.ts, lib/author/queries.ts
 * =============================================================
 */

import "server-only";

import { getAuthorBook, type AuthorBook } from "@/lib/author/queries";
import type { ManuscriptChapter } from "@/lib/author/manuscript-stats";
import { readListing, type Listing } from "@/lib/author/workshop/listing";
import {
  CHAPTER_TOOLS,
  readChapterReview,
  type ChapterReview,
  type ChapterTool,
  type SuggestionDecision,
} from "@/lib/author/workshop/suggestions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Solde de l'auteur connecté. */
export type WorkshopBalance = {
  enabled: boolean;
  /** Au moins un forfait acheté ou offert */
  unlocked: boolean;
  remainingPct: number;
  /** Chapitres encore relus, à peu près */
  approxChapters: number;
};

export type WorkshopOffer = {
  id: string;
  name: string;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
  approxChapters: number;
};

export type WorkshopChapter = ManuscriptChapter & { id: string; wordCount: number };

/** Manuscrit d'un livre de l'auteur. */
export type Manuscript = {
  book: AuthorBook;
  versionId: string | null;
  /** Version lue : en attente de validation, sinon publiée */
  source: "pending" | "current" | null;
  chapters: WorkshopChapter[];
};

export type WorkshopSettings = {
  enabled: boolean;
  model: string;
  inputPrice: number;
  outputPrice: number;
  rateLimit: number;
  rateWindow: number;
};

export type WorkshopPackAdmin = {
  id: string;
  name: string;
  costUsd: number;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
  active: boolean;
  position: number;
};

export type WorkshopUsageRow = {
  author_id: string;
  display_name: string;
  email: string | null;
  requests: number;
  spent: number;
  budget: number;
  last_at: string | null;
};

/** Lève une erreur explicite si la lecture a échoué. */
function check<T>(
  result: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

/** Montant facultatif (numeric renvoyé en texte ou en nombre). */
function optionalNumber(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

// ==================== AUTEUR ====================

/** Solde de Crédits Atelier de l'auteur connecté. */
export async function getWorkshopBalance(): Promise<WorkshopBalance> {
  const supabase = await createClient();
  const rows = check(await supabase.rpc("workshop_my_balance"), "solde de l'atelier") as {
    enabled: boolean;
    unlocked: boolean;
    remaining_pct: number;
    approx_chapters: number;
  }[];
  const row = rows[0];
  return {
    enabled: Boolean(row?.enabled),
    unlocked: Boolean(row?.unlocked),
    remainingPct: row?.remaining_pct ?? 0,
    approxChapters: row?.approx_chapters ?? 0,
  };
}

/** Forfaits de Crédits Atelier en vente. */
export async function listWorkshopOffers(): Promise<WorkshopOffer[]> {
  const supabase = await createClient();
  const rows = check(await supabase.rpc("workshop_pack_offers"), "forfaits de l'atelier") as {
    id: string;
    name: string;
    price_xof: number | null;
    price_eur: number | string | null;
    price_cad: number | string | null;
    approx_chapters: number;
  }[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    priceXof: row.price_xof,
    priceEur: optionalNumber(row.price_eur),
    priceCad: optionalNumber(row.price_cad),
    approxChapters: row.approx_chapters,
  }));
}

/**
 * Manuscrit d'un livre de l'auteur. Les chapitres n'ont aucun accès RLS : la propriété
 * est vérifiée par getAuthorBook (session) avant la lecture par le client service.
 * @param bookId   - Identifiant (uuid déjà validé)
 * @param authorId - Fiche auteur : un livre d'un autre auteur renvoie null
 */
export async function getManuscript(bookId: string, authorId: string): Promise<Manuscript | null> {
  const book = await getAuthorBook(bookId, authorId);
  if (!book) return null;
  const version = book.pending ?? book.current;
  const source = book.pending ? "pending" : book.current ? "current" : null;
  if (!version) return { book, versionId: null, source, chapters: [] };

  const rows = check(
    await createAdminClient()
      .from("chapters")
      .select("id, position, title, blocks, word_count")
      .eq("version_id", version.id)
      .order("position"),
    "chapitres",
  ) as { id: string; position: number; title: string; blocks: string[]; word_count: number }[];
  return {
    book,
    versionId: version.id,
    source,
    chapters: rows.map((row) => ({
      id: row.id,
      position: row.position,
      title: row.title,
      blocks: row.blocks ?? [],
      wordCount: row.word_count,
    })),
  };
}

// ==================== ADMINISTRATION ====================

/** Réglages de l'atelier (RLS : administrateur seulement). */
export async function getWorkshopSettings(): Promise<WorkshopSettings> {
  const supabase = await createClient();
  const row = check(
    await supabase
      .from("workshop_settings")
      .select("enabled, model, input_price, output_price, rate_limit, rate_window")
      .maybeSingle<{
        enabled: boolean;
        model: string;
        input_price: number;
        output_price: number;
        rate_limit: number;
        rate_window: number;
      }>(),
    "réglages de l'atelier",
  );
  if (!row) throw new Error("Lecture impossible (réglages de l'atelier) : ligne absente");
  return {
    enabled: row.enabled,
    model: row.model,
    inputPrice: Number(row.input_price),
    outputPrice: Number(row.output_price),
    rateLimit: row.rate_limit,
    rateWindow: row.rate_window,
  };
}

/** Tous les forfaits de l'atelier, actifs ou non (RLS : administrateur seulement). */
export async function listWorkshopPacksForAdmin(): Promise<WorkshopPackAdmin[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("workshop_packs")
      .select("id, name, cost_usd, price_xof, price_eur, price_cad, active, position")
      .order("position")
      .order("cost_usd")
      .returns<{
        id: string;
        name: string;
        cost_usd: number;
        price_xof: number | null;
        price_eur: number | null;
        price_cad: number | null;
        active: boolean;
        position: number;
      }[]>(),
    "forfaits de l'atelier",
  ) ?? [];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    costUsd: Number(row.cost_usd),
    priceXof: row.price_xof,
    priceEur: optionalNumber(row.price_eur),
    priceCad: optionalNumber(row.price_cad),
    active: row.active,
    position: row.position,
  }));
}

/** Consommation de l'atelier par auteur (dollars : administrateur seulement). */
export async function listWorkshopUsage(): Promise<WorkshopUsageRow[]> {
  const supabase = await createClient();
  const rows = check(await supabase.rpc("admin_workshop_usage"), "consommation de l'atelier") as
    WorkshopUsageRow[];
  return rows.map((row) => ({ ...row, spent: Number(row.spent), budget: Number(row.budget) }));
}

// ==================== RELECTURES ====================

/** Demande terminée du relecteur ou du conseiller de style. */
export type ChapterRequest = {
  id: string;
  chapterId: string;
  tool: ChapterTool;
  review: ChapterReview;
  decisions: Record<string, SuggestionDecision>;
  createdAt: string;
};

/** Décisions enregistrées, en écartant les valeurs inconnues. */
function readDecisions(value: unknown): Record<string, SuggestionDecision> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, decision]) => decision === "accepted" || decision === "rejected",
    ),
  ) as Record<string, SuggestionDecision>;
}

/**
 * Dernière demande terminée de chaque outil, par chapitre, pour une version (RLS : les
 * demandes de l'auteur seulement).
 * @param versionId - Version lue dans l'atelier
 * @returns Clé « chapitre:outil » vers la demande la plus récente
 */
export async function listLatestChapterRequests(
  versionId: string,
): Promise<Map<string, ChapterRequest>> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("workshop_requests")
      .select("id, chapter_id, tool, output, decisions, created_at")
      .eq("version_id", versionId)
      .eq("status", "done")
      .in("tool", CHAPTER_TOOLS)
      .not("chapter_id", "is", null)
      .order("created_at", { ascending: false })
      .returns<{
        id: string;
        chapter_id: string;
        tool: ChapterTool;
        output: unknown;
        decisions: unknown;
        created_at: string;
      }[]>(),
    "relectures",
  ) ?? [];
  const latest = new Map<string, ChapterRequest>();
  for (const row of rows) {
    const key = `${row.chapter_id}:${row.tool}`;
    if (latest.has(key)) continue;
    latest.set(key, {
      id: row.id,
      chapterId: row.chapter_id,
      tool: row.tool,
      review: readChapterReview(row.output),
      decisions: readDecisions(row.decisions),
      createdAt: row.created_at,
    });
  }
  return latest;
}

// ==================== FICHE DU LIVRE ====================

/** Dernière fiche proposée pour un livre. */
export type ListingRequest = {
  id: string;
  listing: Listing;
  /** Clés « summary », « keywords », « bio » ou « title:i » des propositions utilisées */
  decisions: Record<string, SuggestionDecision>;
  createdAt: string;
};

/**
 * Dernière fiche terminée d'un livre, toutes versions confondues (RLS : les demandes de
 * l'auteur seulement).
 * @param bookId - Livre de l'auteur
 * @returns La demande, ou null si aucune fiche lisible
 */
export async function getLatestListingRequest(bookId: string): Promise<ListingRequest | null> {
  const supabase = await createClient();
  const row = check(
    await supabase
      .from("workshop_requests")
      .select("id, output, decisions, created_at")
      .eq("book_id", bookId)
      .eq("tool", "listing")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; output: unknown; decisions: unknown; created_at: string }>(),
    "fiche proposée",
  );
  const listing = row ? readListing(row.output) : null;
  if (!row || !listing) return null;
  return {
    id: row.id,
    listing,
    decisions: readDecisions(row.decisions),
    createdAt: row.created_at,
  };
}
