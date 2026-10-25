/**
 * =============================================================
 *  Fichier    : queries.ts (payments)
 *  Projet     : Kalami
 *  Description: Lecture des commandes de l'acheteur connecté (RLS : chacun ne voit que les
 *               siennes) pour la page « Mes achats » et la page de retour du paiement ;
 *               lien vers ce que l'achat débloque (livre, Kalami Stratégie, coach, cas
 *               d'entraînement depuis la v0.14.0, atelier de l'auteur depuis la v0.15.0) ;
 *               champs Mobile Money (v0.11.0).
 *  Auteur     : Claude Marcel
 *  Version    : 1.4
 *  Date       : 2026-10-25
 *  Dépendances: lib/supabase/server.ts, migration 20261104120000_orders.sql
 * =============================================================
 */

import "server-only";

import type { Currency } from "@/lib/catalog/types";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type OrderStatus = "pending" | "paid" | "expired" | "failed" | "refunded";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  currency: Currency;
  total_minor: number;
  receipt_url: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  items: OrderItemSummary[];
  /** « stripe » ou « mobile_money » */
  provider: string;
  // Mobile Money (v0.11.0) : instructions figées et déclaration de l'acheteur
  mm_operator: string | null;
  mm_merchant_number: string | null;
  mm_reference: string | null;
  mm_expires_at: string | null;
  mm_transaction_id: string | null;
  mm_declared_at: string | null;
  mm_rejection_reason: string | null;
};

export type OrderItemSummary = {
  label: string;
  kind: string;
  study_id: string | null;
  credits: number | null;
  /** Code du cas d'entraînement (article « practice_case »). */
  practice_case: string | null;
  book: { slug: string; grants_study_credit: boolean } | null;
};

const ORDER_COLUMNS =
  "id, status, currency, total_minor, receipt_url, paid_at, refunded_at, created_at, " +
  "provider, mm_operator, mm_merchant_number, mm_reference, mm_expires_at, " +
  "mm_transaction_id, mm_declared_at, mm_rejection_reason, " +
  "items:order_items(label, kind, study_id, credits, practice_case, " +
  "book:books(slug, grants_study_credit))";

// ==================== REQUÊTES ====================

/**
 * Commandes de l'acheteur connecté, des plus récentes aux plus anciennes.
 * Les sessions abandonnées (expirées ou en échec) ne sont pas affichées, sauf un paiement
 * Mobile Money refusé : l'acheteur doit en voir le motif.
 */
export async function getMyOrders(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .or("status.in.(paid,pending,refunded),and(provider.eq.mobile_money,status.eq.failed)")
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

// ==================== LIENS ====================

/** Destination ouverte par un article payé. */
export type OrderItemLink = {
  href: string;
  kind: "read" | "strategy" | "coach" | "case" | "workshop";
};

/**
 * Lien vers ce que débloque un article payé.
 * @param item - Article de la commande
 * @returns Lien, ou null (livre retiré du catalogue, étude supprimée)
 */
export function orderItemLink(item: OrderItemSummary): OrderItemLink | null {
  if (item.kind === "book") {
    return item.book ? { href: `/livres/${item.book.slug}/lire`, kind: "read" } : null;
  }
  if (item.kind === "study" || item.kind === "study_lot") {
    return { href: "/strategie", kind: "strategy" };
  }
  if (item.kind === "coach_pack" && item.study_id) {
    return { href: `/strategie/etudes/${item.study_id}/coach`, kind: "coach" };
  }
  if (item.kind === "practice_case" && item.practice_case) {
    return { href: `/strategie/cas/${item.practice_case}`, kind: "case" };
  }
  if (item.kind === "workshop_pack") return { href: "/auteur/atelier", kind: "workshop" };
  return null;
}
