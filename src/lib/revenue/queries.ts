/**
 * =============================================================
 *  Fichier    : queries.ts (revenue)
 *  Projet     : Kalami
 *  Description: Lectures du grand livre (Sprint 10a, v0.12.0) : réglages des revenus,
 *               soldes et dernières écritures de l'auteur connecté, totaux et écritures de
 *               la plateforme, exceptions de commission par auteur (administrateur).
 *               La RLS limite l'auteur à ses propres écritures.
 *               v1.1 : soldes avec demandes ouvertes et déjà versé (10b).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, lib/revenue/ledger.ts
 * =============================================================
 */

import "server-only";

import type { Currency } from "@/lib/catalog/types";
import type { AuthorBalance, LedgerEntry, PlatformTotals } from "@/lib/revenue/ledger";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Réglages des revenus (ligne unique). */
export type RevenueSettings = {
  authorShareBps: number;
  holdDays: number;
  payoutMin: Record<Currency, number>;
};

/** Auteur avec son éventuelle exception de commission. */
export type AuthorCommissionRow = {
  authorId: string;
  displayName: string;
  /** Part propre, ou null : part globale */
  shareBps: number | null;
};

// ==================== CONSTANTES ====================

const ENTRY_COLUMNS =
  "id, entry_type, reference, item_kind, label, book_id, author_id, provider, currency, " +
  "gross_minor, fee_minor, tax_minor, commission_minor, author_minor, author_share_bps, " +
  "available_at, created_at";

/** Nombre d'écritures affichées dans les listes. */
const LIST_LIMIT = 100;

// ==================== RÉGLAGES ====================

/** Commission globale, délai de disponibilité et seuils de versement. */
export async function getRevenueSettings(): Promise<RevenueSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revenue_settings")
    .select("author_share_bps, hold_days, payout_min_xof, payout_min_eur, payout_min_cad")
    .single();
  if (error) throw new Error(`Lecture des réglages des revenus impossible : ${error.message}`);
  return {
    authorShareBps: data.author_share_bps,
    holdDays: data.hold_days,
    payoutMin: { XOF: data.payout_min_xof, EUR: data.payout_min_eur, CAD: data.payout_min_cad },
  };
}

// ==================== AUTEUR ====================

/**
 * Part appliquée à un auteur (exception propre, sinon part globale).
 * @param authorId - Fiche auteur
 * @param globalBps - Part globale
 */
export async function getAuthorShareBps(authorId: string, globalBps: number): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("author_commissions")
    .select("author_share_bps")
    .eq("author_id", authorId)
    .maybeSingle();
  return data?.author_share_bps ?? globalBps;
}

/** Revenus de l'auteur connecté par devise. */
export async function getAuthorBalances(): Promise<AuthorBalance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("author_ledger_balances");
  if (error) throw new Error(`Lecture des revenus impossible : ${error.message}`);
  return ((data ?? []) as Record<string, number | string>[]).map((row) => ({
    currency: row.currency as Currency,
    sales: Number(row.sales),
    gross: Number(row.gross_minor),
    earned: Number(row.earned_minor),
    available: Number(row.available_minor),
    pending: Number(row.pending_minor),
    requested: Number(row.requested_minor ?? 0),
    paid: Number(row.paid_minor ?? 0),
  }));
}

/**
 * Dernières écritures d'un auteur.
 * @param authorId - Fiche auteur (la RLS refuse celles d'un autre)
 */
export async function listAuthorEntries(authorId: string): Promise<LedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(ENTRY_COLUMNS)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw new Error(`Lecture des écritures impossible : ${error.message}`);
  return (data ?? []) as unknown as LedgerEntry[];
}

// ==================== ADMINISTRATION ====================

/** Totaux de la plateforme par devise. */
export async function getPlatformTotals(): Promise<PlatformTotals[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_ledger_totals");
  if (error) throw new Error(`Lecture des totaux impossible : ${error.message}`);
  return ((data ?? []) as Record<string, number | string>[]).map((row) => ({
    currency: row.currency as Currency,
    sales: Number(row.sales),
    gross: Number(row.gross_minor),
    fees: Number(row.fee_minor),
    taxes: Number(row.tax_minor),
    commission: Number(row.commission_minor),
    authors: Number(row.author_minor),
  }));
}

/** Dernières écritures de toute la plateforme. */
export async function listPlatformEntries(): Promise<LedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(ENTRY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw new Error(`Lecture des écritures impossible : ${error.message}`);
  return (data ?? []) as unknown as LedgerEntry[];
}

/** Auteurs avec leur exception de commission éventuelle, triés par nom. */
export async function listAuthorCommissions(): Promise<AuthorCommissionRow[]> {
  const supabase = await createClient();
  const [authors, commissions] = await Promise.all([
    supabase.from("authors").select("id, display_name").order("display_name"),
    supabase.from("author_commissions").select("author_id, author_share_bps"),
  ]);
  if (authors.error) throw new Error(`Lecture des auteurs impossible : ${authors.error.message}`);
  const shares = new Map(
    (commissions.data ?? []).map((row) => [row.author_id, row.author_share_bps as number]),
  );
  return (authors.data ?? []).map((row) => ({
    authorId: row.id,
    displayName: row.display_name,
    shareBps: shares.get(row.id) ?? null,
  }));
}
