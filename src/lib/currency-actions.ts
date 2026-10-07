/**
 * =============================================================
 *  Fichier    : currency-actions.ts
 *  Projet     : Kalami
 *  Description: Action serveur du sélecteur de devise : mémorise le choix dans un cookie
 *               et, pour un utilisateur connecté, dans son profil.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, currency-server.ts
 * =============================================================
 */

"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

import { isCurrency } from "./currency";
import { writeCurrencyCookie } from "./currency-server";

/**
 * Change la devise d'affichage. La page courante est ensuite rendue à nouveau par Next.
 * @param formData - Champ « currency » (XOF, EUR ou CAD)
 */
export async function setCurrency(formData: FormData): Promise<void> {
  const currency = formData.get("currency");
  if (!isCurrency(currency)) return;

  await writeCurrencyCookie(currency);

  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  // Échec sans gravité : le cookie suffit à l'affichage
  await supabase.from("profiles").update({ preferred_currency: currency }).eq("id", user.id);
}
