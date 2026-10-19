/**
 * =============================================================
 *  Fichier    : promo-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures de l'administration des codes promo (v0.10.3) : liste des codes
 *               avec le titre du livre visé et le nombre d'utilisations, état de
 *               l'interrupteur Stripe Tax. La RLS réserve la lecture des codes à
 *               l'administrateur (aal2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, migration 20261106120000_promo_codes.sql
 * =============================================================
 */

import "server-only";

import type { PromoScope } from "@/lib/admin/promo-validation";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Code promo vu par l'administrateur (montants EUR et CAD en unités, pas en centimes). */
export type AdminPromoCode = {
  id: string;
  code: string;
  scope: PromoScope;
  bookTitle: string | null;
  percentOff: number | null;
  amountOffXof: number | null;
  amountOffEur: number | null;
  amountOffCad: number | null;
  expiresAt: string | null;
  /** Date d'expiration passée (calculée à la lecture). */
  expired: boolean;
  maxUses: number | null;
  usesCount: number;
  active: boolean;
  note: string | null;
  createdAt: string;
};

type PromoRow = {
  id: string;
  code: string;
  scope: PromoScope;
  percent_off: number | null;
  amount_off_xof: number | null;
  amount_off_eur: number | string | null;
  amount_off_cad: number | string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  note: string | null;
  created_at: string;
  book: { title: string } | null;
};

// ==================== REQUÊTES ====================

/** Codes promo, les plus récents d'abord. */
export async function listPromoCodesForAdmin(): Promise<AdminPromoCode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select(
      "id, code, scope, percent_off, amount_off_xof, amount_off_eur, amount_off_cad, " +
        "expires_at, max_uses, uses_count, active, note, created_at, book:books(title)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Lecture des codes promo impossible : ${error.message}`);
  const decimal = (value: number | string | null) => (value === null ? null : Number(value));
  const now = Date.now();
  return ((data ?? []) as unknown as PromoRow[]).map((row) => ({
    id: row.id,
    code: row.code,
    scope: row.scope,
    bookTitle: row.book?.title ?? null,
    percentOff: row.percent_off,
    amountOffXof: row.amount_off_xof,
    amountOffEur: decimal(row.amount_off_eur),
    amountOffCad: decimal(row.amount_off_cad),
    expiresAt: row.expires_at,
    expired: row.expires_at !== null && new Date(row.expires_at).getTime() < now,
    maxUses: row.max_uses,
    usesCount: Number(row.uses_count),
    active: row.active,
    note: row.note,
    createdAt: row.created_at,
  }));
}

/** État de l'interrupteur Stripe Tax (éteint si le réglage est absent). */
export async function isStripeTaxEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("stripe_tax_enabled")
    .maybeSingle();
  return data?.stripe_tax_enabled === true;
}
