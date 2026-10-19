/**
 * =============================================================
 *  Fichier    : order-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures de l'administration des ventes (v0.10.2) : commandes de toute la
 *               boutique avec l'adresse de l'acheteur, filtrées par statut, et offres d'étude
 *               de Kalami Stratégie (prix). Les fonctions SQL et la RLS exigent le rôle
 *               administrateur (aal2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, lib/payments/queries.ts,
 *               migration 20261105120000_strategy_orders.sql
 * =============================================================
 */

import "server-only";

import type { Currency } from "@/lib/catalog/types";
import type { OrderStatus } from "@/lib/payments/queries";
import type { StudyOfferCode } from "@/lib/payments/checkout-request";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Statuts proposés dans le filtre, dans l'ordre d'affichage. */
export const ORDER_STATUSES: OrderStatus[] = ["paid", "pending", "refunded", "expired", "failed"];

/** Commande vue par l'administrateur. */
export type AdminOrderRow = {
  id: string;
  buyer_email: string | null;
  status: OrderStatus;
  currency: Currency;
  total_minor: number;
  labels: string | null;
  provider_payment_id: string | null;
  receipt_url: string | null;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
};

/** Offre d'étude ou de lot, avec ses prix saisis. */
export type AdminStudyOffer = {
  code: StudyOfferCode;
  name: string;
  credits: number;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
  active: boolean;
};

// ==================== REQUÊTES ====================

/**
 * Valide un statut de filtre lu dans l'adresse.
 * @param raw - Valeur brute (?statut=…)
 * @returns Statut connu, ou null pour « toutes »
 */
export function parseOrderStatus(raw: unknown): OrderStatus | null {
  return ORDER_STATUSES.find((status) => status === raw) ?? null;
}

/**
 * Commandes les plus récentes (200), filtrées par statut.
 * @param status - Statut voulu, ou null pour toutes
 */
export async function listOrdersForAdmin(status: OrderStatus | null): Promise<AdminOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_orders", { p_status: status });
  if (error) throw new Error(`Lecture des commandes impossible : ${error.message}`);
  return ((data ?? []) as AdminOrderRow[]).map((row) => ({
    ...row,
    total_minor: Number(row.total_minor),
  }));
}

/** Offres d'étude et de lots, dans l'ordre d'affichage (lecture réservée à l'admin). */
export async function listStudyOffersForAdmin(): Promise<AdminStudyOffer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("strategy_offers")
    .select("code, name, credits, price_xof, price_eur, price_cad, active")
    .order("position");
  if (error) throw new Error(`Lecture des offres impossible : ${error.message}`);
  return (data ?? []).map((row) => ({
    code: row.code as StudyOfferCode,
    name: row.name,
    credits: Number(row.credits),
    priceXof: row.price_xof === null ? null : Number(row.price_xof),
    priceEur: row.price_eur === null ? null : Number(row.price_eur),
    priceCad: row.price_cad === null ? null : Number(row.price_cad),
    active: row.active,
  }));
}
