/**
 * =============================================================
 *  Fichier    : case-actions.ts
 *  Projet     : Kalami
 *  Description: Actions de l'administration des cas d'entraînement (v0.14.0) : titre, prix,
 *               mise en vente et interrupteur « tout de suite » d'un cas ; accès accordé ou
 *               retiré à un compte par son courriel (essais, offres). Les fonctions SQL
 *               vérifient le rôle administrateur (aal2) et écrivent le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/admin/order-actions.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getStrategyDictionary } from "@/i18n/strategy";

const t = getDictionary();
const tStrategy = getStrategyDictionary();
const o = t.admin.orders;

/** Plafond d'un prix saisi (comme les offres d'étude). */
const PRICE_MAX = 10_000_000;

/** Forme d'un code de cas (table practice_cases). */
const CASE_CODE = /^[a-z0-9-]{2,40}$/;

// ==================== FONCTIONS UTILITAIRES ====================

/** Message d'erreur connu, ou message générique. */
function caseError(code: string): string {
  const errors: Record<string, string> = o.errors;
  return errors[code] ?? tStrategy.errors.generic;
}

/** Lit un prix facultatif (virgule acceptée) : null si vide, NaN si invalide. */
function readPrice(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  return raw === "" ? null : Number(raw);
}

// ==================== CAS ====================

/**
 * Modifie le titre, les prix, la mise en vente et l'ouverture immédiate du corrigé.
 *
 * Erreurs possibles :
 *   - case_not_found, invalid_name, invalid_price
 */
export async function savePracticeCase(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const prices = ["priceXof", "priceEur", "priceCad"].map((name) => readPrice(formData, name));
  const [priceXof, priceEur, priceCad] = prices;

  if (!CASE_CODE.test(code)) return { error: caseError("case_not_found") };
  if (title.length < 1 || title.length > 80) return { error: caseError("invalid_name") };
  const pricesOk = prices.every(
    (value) => value === null || (Number.isFinite(value) && value > 0 && value <= PRICE_MAX),
  );
  if (!pricesOk || (priceXof !== null && !Number.isInteger(priceXof))) {
    return { error: caseError("invalid_price") };
  }

  const toCents = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_practice_case", {
    p_code: code,
    p_title: title,
    p_price_xof: priceXof,
    p_price_eur: toCents(priceEur),
    p_price_cad: toCents(priceCad),
    p_active: formData.get("active") === "on",
    p_unlock_immediately: formData.get("unlockImmediately") === "on",
  });
  if (error) return { error: caseError(error.message) };
  refresh();
  return { message: o.caseSaved };
}

/**
 * Accorde ou retire l'accès d'un compte à un cas (bouton « intent » : grant ou revoke).
 * Le retrait garde l'étude du compte ; un nouvel accès la retrouve.
 *
 * Erreurs possibles :
 *   - user_not_found, case_not_found
 */
export async function setPracticeCaseAccess(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const enabled = formData.get("intent") !== "revoke";
  if (!CASE_CODE.test(code)) return { error: caseError("case_not_found") };
  if (!email.includes("@") || email.length > 254) return { error: caseError("user_not_found") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_practice_case_access", {
    p_email: email,
    p_code: code,
    p_enabled: enabled,
  });
  if (error) return { error: caseError(error.message) };
  refresh();
  return { message: enabled ? o.caseGranted : o.caseRevoked };
}
