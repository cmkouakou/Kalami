/**
 * =============================================================
 *  Fichier    : actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur du compte : mise à jour du profil (nom affiché, devise
 *               préférée), demande et annulation de la suppression du compte (délai de
 *               30 jours). La RLS et les privilèges de colonnes limitent l'écriture.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-06
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { isCurrency } from "@/lib/currency";
import { writeCurrencyCookie } from "@/lib/currency-server";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();

/** Enregistre le profil de l'utilisateur connecté. */
export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const rawName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  const rawCurrency = String(formData.get("preferred_currency") ?? "");
  const currency = isCurrency(rawCurrency) ? rawCurrency : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: rawName || null, preferred_currency: currency })
    .eq("id", user.id);
  if (error) return { error: t.auth.errors.generic };

  // Le choix du profil devient la devise d'affichage (Automatique : cookie retiré)
  await writeCurrencyCookie(currency);

  return { message: t.account.saved };
}

/**
 * Demande la suppression du compte (exécutée 30 jours plus tard par le cron).
 * La saisie du mot « SUPPRIMER » confirme l'intention.
 */
export async function requestAccountDeletion(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const d = t.account.deletion;
  if (String(formData.get("confirmation") ?? "").trim() !== d.confirmWord) {
    return { error: d.confirmMismatch };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: t.auth.errors.generic };

  refresh();
  return { message: d.requested };
}

/** Annule la demande de suppression en cours. */
export async function cancelAccountDeletion(): Promise<FormState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_account_deletion");
  if (error) return { error: t.auth.errors.generic };

  refresh();
  return { message: t.account.deletion.cancelled };
}
