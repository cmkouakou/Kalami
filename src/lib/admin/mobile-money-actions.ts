/**
 * =============================================================
 *  Fichier    : mobile-money-actions.ts (admin)
 *  Projet     : Kalami
 *  Description: Actions de l'administration du Mobile Money (Sprint 6, v0.11.0) : activer
 *               ou éteindre un opérateur, enregistrer le numéro marchand d'un opérateur dans
 *               un pays. Les fonctions SQL vérifient le rôle administrateur (aal2) et
 *               écrivent le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/payments/mobile-money.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import {
  isMobileMoneyCountry,
  isMobileMoneyOperator,
  normalizePhone,
} from "@/lib/payments/mobile-money";
import { createClient } from "@/lib/supabase/server";
import { getStrategyDictionary } from "@/i18n/strategy";

const am = getDictionary().admin.mobileMoney;

/** Message d'erreur connu, ou message générique. */
function mobileMoneyError(code: string): string {
  const errors: Record<string, string> = am.errors;
  return errors[code] ?? getStrategyDictionary().errors.generic;
}

/**
 * Active ou éteint un opérateur (éteint : ses numéros ne sont plus proposés).
 * @param code - Code de l'opérateur
 * @param enabled - Nouvel état
 */
export async function setMobileMoneyOperator(code: string, enabled: boolean): Promise<FormState> {
  await requireAdmin();
  if (!isMobileMoneyOperator(code) || typeof enabled !== "boolean") {
    return { error: mobileMoneyError("operator_not_found") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mm_set_operator", {
    p_code: code,
    p_enabled: enabled,
  });
  if (error) return { error: mobileMoneyError(error.message) };
  refresh();
  return { message: am.operatorSaved };
}

/**
 * Enregistre le numéro marchand d'un opérateur dans un pays (remplace l'existant).
 *
 * Erreurs possibles :
 *   - invalid_account : opérateur, pays, numéro ou nom invalide
 */
export async function saveMobileMoneyAccount(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const operator = formData.get("operator");
  const country = formData.get("country");
  const merchantNumber = normalizePhone(formData.get("merchantNumber"));
  const accountName = String(formData.get("accountName") ?? "").trim();
  const valid =
    isMobileMoneyOperator(operator) &&
    isMobileMoneyCountry(country) &&
    merchantNumber !== null &&
    accountName.length >= 2 &&
    accountName.length <= 80;
  if (!valid) return { error: mobileMoneyError("invalid_account") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mm_save_account", {
    p_operator: operator,
    p_country: country,
    p_merchant_number: merchantNumber,
    p_account_name: accountName,
    p_active: formData.get("active") === "on",
  });
  if (error) return { error: mobileMoneyError(error.message) };
  refresh();
  return { message: am.saved };
}
