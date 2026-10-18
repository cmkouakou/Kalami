/**
 * =============================================================
 *  Fichier    : queries.ts (payments)
 *  Projet     : Kalami
 *  Description: Lecture des commandes de l'acheteur connecté (RLS : chacun ne voit que les
 *               siennes) pour la page « Mes achats » et la page de retour du paiement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: lib/supabase/server.ts, migration 20261104120000_orders.sql
 * =============================================================
 */

import "server-only";

import type { Currency } from "@/lib/catalog/types";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type OrderStatus = "pending" | "paid" | "expired" | "failed";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  currency: Currency;
  total_minor: number;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
  items: OrderItemSummary[];
};

export type OrderItemSummary = {
  label: string;
  kind: string;
  book: { slug: string; grants_study_credit: boolean } | null;
};

const ORDER_COLUMNS =
  "id, status, currency, total_minor, receipt_url, paid_at, created_at, " +
  "items:order_items(label, kind, book:books(slug, grants_study_credit))";

// ==================== REQUÊTES ====================

/**
 * Commandes de l'acheteur connecté, des plus récentes aux plus anciennes.
 * Les sessions abandonnées (expirées ou en échec) ne sont pas affichées.
 */
export async function getMyOrders(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .in("status", ["paid", "pending"])
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<OrderSummary[]>();
  if (error) {
    console.error("[achats] lecture impossible :", error.code, error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Une commande de l'acheteur connecté (null si elle n'existe pas ou appartient à un autre).
 * @param orderId - Identifiant de la commande
 */
export async function getMyOrder(orderId: string): Promise<OrderSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .maybeSingle<OrderSummary>();
  return data ?? null;
}
