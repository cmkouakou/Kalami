/**
 * =============================================================
 *  Fichier    : strategy-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions d'administration de l'assistant stratégie : octroi de crédits
 *               d'étude à un compte (en attendant l'ouverture des paiements). La fonction
 *               SQL vérifie le rôle administrateur (aal2) et écrit le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const a = t.strategy.admin;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTE_MAX = 500;

/** Accorde un ou plusieurs crédits d'étude au compte désigné par son courriel. */
export async function grantStudyCredits(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const note = String(formData.get("note") ?? "").trim().slice(0, NOTE_MAX);

  if (!EMAIL_PATTERN.test(email)) return { error: a.userNotFound };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return { error: a.invalidQuantity };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_grant_credits", {
    p_email: email,
    p_quantity: quantity,
    p_note: note,
  });
  if (error) {
    if (error.message === "user_not_found") return { error: a.userNotFound };
    if (error.message === "invalid_quantity") return { error: a.invalidQuantity };
    return { error: t.strategy.errors.generic };
  }
  refresh();
  return { message: interpolate(a.granted, { quantity: String(quantity), email }) };
}
