/**
 * =============================================================
 *  Fichier    : promo-actions.ts
 *  Projet     : Kalami
 *  Description: Actions de l'administration des codes promo (v0.10.3) : création d'un code,
 *               activation ou désactivation, et interrupteur Stripe Tax (prix taxes
 *               comprises). Les fonctions SQL vérifient le rôle administrateur (aal2) et
 *               écrivent le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/admin/promo-validation.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { parsePromoCodeForm } from "@/lib/admin/promo-validation";
import { isUuid } from "@/lib/admin/validation";
import { createClient } from "@/lib/supabase/server";
import { getStrategyDictionary } from "@/i18n/strategy";

const t = getDictionary();
const tStrategy = getStrategyDictionary();
const p = t.admin.promos;

/** Message d'erreur connu, ou message générique. */
function promoError(code: string): string {
  const errors: Record<string, string> = p.errors;
  return errors[code] ?? tStrategy.errors.generic;
}

// ==================== CODES PROMO ====================

/** Crée un code promo à partir du formulaire « Nouveau code ». */
export async function createPromoCode(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePromoCodeForm(formData);
  if (!parsed.ok) return { error: promoError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_promo_code", parsed.value);
  if (error) return { error: promoError(error.message) };
  refresh();
  return { message: interpolate(p.created, { code: parsed.value.p_code }) };
}

/**
 * Active ou désactive un code (un code désactivé est refusé au paiement).
 * @param id - Identifiant du code
 * @param active - Nouvel état
 */
export async function setPromoCodeActive(id: string, active: boolean): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id) || typeof active !== "boolean") return { error: promoError("promo_not_found") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_promo_active", {
    p_id: id,
    p_active: active,
  });
  if (error) return { error: promoError(error.message) };
  refresh();
  return { message: active ? p.activated : p.deactivated };
}

// ==================== STRIPE TAX ====================

/**
 * Allume ou éteint Stripe Tax pour les prochaines sessions de paiement.
 * @param enabled - Nouvel état
 */
export async function setStripeTax(enabled: boolean): Promise<FormState> {
  await requireAdmin();
  if (typeof enabled !== "boolean") return { error: tStrategy.errors.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_stripe_tax", { p_enabled: enabled });
  if (error) return { error: tStrategy.errors.generic };
  refresh();
  return { message: enabled ? p.taxEnabled : p.taxDisabled };
}
