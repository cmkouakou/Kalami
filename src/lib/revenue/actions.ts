/**
 * =============================================================
 *  Fichier    : actions.ts (revenue)
 *  Projet     : Kalami
 *  Description: Actions de l'administration des revenus (Sprint 10a, v0.12.0) : part globale
 *               de l'auteur, délai de disponibilité et seuils de versement, exception de
 *               commission par auteur, frais d'un opérateur Mobile Money. Les fonctions SQL
 *               vérifient le rôle administrateur (aal2) et écrivent le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/revenue/ledger.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { toMinorUnits } from "@/lib/currency";
import { isMobileMoneyOperator } from "@/lib/payments/mobile-money";
import { percentToBps } from "@/lib/revenue/ledger";
import { createClient } from "@/lib/supabase/server";
import { getStrategyDictionary } from "@/i18n/strategy";

const ar = getDictionary().admin.revenue;

/** Frais Mobile Money maximal accepté, en pourcentage. */
const MAX_FEE_PERCENT = 20;

/** Message d'erreur connu, ou message générique. */
function revenueError(code: string): string {
  const errors: Record<string, string> = ar.errors;
  return errors[code] ?? getStrategyDictionary().errors.generic;
}

/**
 * Enregistre la part globale de l'auteur, le délai et les seuils de versement.
 *
 * Erreurs possibles :
 *   - invalid_settings : part, délai ou seuil invalide
 */
export async function saveRevenueSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const shareBps = percentToBps(formData.get("authorShare"));
  const holdDays = Number(formData.get("holdDays"));
  const minXof = toMinorUnits(String(formData.get("minXof") ?? ""), "XOF");
  const minEur = toMinorUnits(String(formData.get("minEur") ?? ""), "EUR");
  const minCad = toMinorUnits(String(formData.get("minCad") ?? ""), "CAD");
  const valid =
    shareBps !== null &&
    Number.isInteger(holdDays) &&
    holdDays >= 0 &&
    holdDays <= 365 &&
    minXof !== null &&
    minEur !== null &&
    minCad !== null;
  if (!valid) return { error: revenueError("invalid_settings") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_revenue_settings", {
    p_author_share_bps: shareBps,
    p_hold_days: holdDays,
    p_payout_min_xof: minXof,
    p_payout_min_eur: minEur,
    p_payout_min_cad: minCad,
  });
  if (error) return { error: revenueError(error.message) };
  refresh();
  return { message: ar.settingsSaved };
}

/**
 * Fixe la part propre d'un auteur ; un champ vide le ramène à la part globale.
 *
 * Erreurs possibles :
 *   - invalid_share : pourcentage invalide
 *   - author_not_found : fiche auteur inconnue
 */
export async function saveAuthorCommission(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const authorId = String(formData.get("authorId") ?? "");
  const raw = String(formData.get("authorShare") ?? "").trim();
  const shareBps = raw === "" ? null : percentToBps(raw);
  if (raw !== "" && shareBps === null) return { error: revenueError("invalid_share") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_author_commission", {
    p_author_id: authorId,
    p_author_share_bps: shareBps,
  });
  if (error) return { error: revenueError(error.message) };
  refresh();
  return { message: shareBps === null ? ar.commissionCleared : ar.commissionSaved };
}

/**
 * Enregistre les frais d'un opérateur Mobile Money (pourcentage du montant payé).
 *
 * Erreurs possibles :
 *   - invalid_fee : pourcentage invalide ou supérieur à 20 %
 *   - operator_not_found : opérateur inconnu
 */
export async function saveMobileMoneyFee(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const code = formData.get("operator");
  if (!isMobileMoneyOperator(code)) return { error: revenueError("operator_not_found") };
  const feeBps = percentToBps(formData.get("fee"), MAX_FEE_PERCENT);
  if (feeBps === null) return { error: revenueError("invalid_fee") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mm_set_fee", { p_code: code, p_fee_bps: feeBps });
  if (error) return { error: revenueError(error.message) };
  refresh();
  return { message: ar.feeSaved };
}
