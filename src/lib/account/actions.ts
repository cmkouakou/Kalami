/**
 * =============================================================
 *  Fichier    : actions.ts
 *  Projet     : Kalami
 *  Description: Action serveur de mise à jour du profil (nom affiché, devise préférée).
 *               La RLS et les privilèges de colonnes limitent l'écriture au propre profil.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const CURRENCIES = ["XOF", "EUR", "CAD"] as const;

/** Enregistre le profil de l'utilisateur connecté. */
export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const rawName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  const rawCurrency = String(formData.get("preferred_currency") ?? "");
  const currency = CURRENCIES.find((c) => c === rawCurrency) ?? null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: rawName || null, preferred_currency: currency })
    .eq("id", user.id);
  if (error) return { error: t.auth.errors.generic };

  return { message: t.account.saved };
}
