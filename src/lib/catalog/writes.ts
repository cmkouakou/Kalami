/**
 * =============================================================
 *  Fichier    : writes.ts
 *  Projet     : Kalami
 *  Description: Écritures communes aux espaces administrateur et auteur : prix d'un livre
 *               par devise, suppression d'une image remplacée. Serveur uniquement (les
 *               droits sont vérifiés par l'appelant et par les politiques RLS).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/catalog/images.ts, lib/admin/validation.ts, supabase
 * =============================================================
 */

import "server-only";

import type { Supabase } from "@/lib/admin/audit";
import type { PriceInput } from "@/lib/admin/validation";
import { COVERS_BUCKET } from "@/lib/catalog/images";
import { CURRENCIES } from "@/lib/catalog/types";

/** Erreur PostgreSQL éventuelle d'une écriture. */
export type DbError = { code?: string; message: string } | null;

/** Enregistre les prix : met à jour les devises saisies, supprime les autres. */
export async function savePrices(
  supabase: Supabase,
  bookId: string,
  prices: PriceInput,
): Promise<DbError> {
  const rows = CURRENCIES.filter((c) => prices[c] !== null).map((currency) => ({
    book_id: bookId,
    currency,
    amount_minor: prices[currency] as number,
  }));
  const absent = CURRENCIES.filter((c) => prices[c] === null);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("book_prices")
      .upsert(rows, { onConflict: "book_id,currency" });
    if (error) return error;
  }
  if (absent.length > 0) {
    const { error } = await supabase
      .from("book_prices")
      .delete()
      .eq("book_id", bookId)
      .in("currency", absent);
    if (error) return error;
  }
  return null;
}

/** Supprime une image du seau (échec sans conséquence : le fichier reste orphelin). */
export async function removeImage(supabase: Supabase, path: string | null): Promise<void> {
  if (path) await supabase.storage.from(COVERS_BUCKET).remove([path]);
}
