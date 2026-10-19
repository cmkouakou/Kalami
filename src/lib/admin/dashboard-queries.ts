/**
 * =============================================================
 *  Fichier    : dashboard-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures du tableau de bord de l'administration (Sprint 10b, v0.12.1) :
 *               travail en attente (versements ouverts, paiements Mobile Money déclarés à
 *               valider) et ventes du mois en cours par devise, lues dans le grand livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, lib/revenue/ledger.ts, lib/revenue/payouts.ts
 * =============================================================
 */

import "server-only";

import { type LedgerAmounts, type PlatformTotals, summarizeEntries } from "@/lib/revenue/ledger";
import { monthStart, OPEN_STATUSES } from "@/lib/revenue/payouts";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

const AMOUNT_COLUMNS =
  "entry_type, currency, gross_minor, fee_minor, tax_minor, commission_minor, author_minor";

// ==================== TYPES ====================

/** Travail en attente de l'administrateur. */
export type DashboardTodo = { payoutsOpen: number; mobileMoneyToReview: number };

// ==================== LECTURES ====================

/** Versements ouverts et paiements Mobile Money déclarés par l'acheteur, à valider. */
export async function getDashboardTodo(): Promise<DashboardTodo> {
  const supabase = await createClient();
  const [payouts, mobileMoney] = await Promise.all([
    supabase
      .from("payout_requests")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_STATUSES]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("provider", "mobile_money")
      .eq("status", "pending")
      .not("mm_declared_at", "is", null),
  ]);
  return { payoutsOpen: payouts.count ?? 0, mobileMoneyToReview: mobileMoney.count ?? 0 };
}

/**
 * Ventes du mois en cours (UTC), par devise.
 * @param now - Instant de référence
 */
export async function getMonthTotals(now: Date = new Date()): Promise<PlatformTotals[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(AMOUNT_COLUMNS)
    .gte("created_at", monthStart(now));
  if (error) throw new Error(`Lecture des ventes du mois impossible : ${error.message}`);
  return summarizeEntries((data ?? []) as LedgerAmounts[]);
}
