/**
 * =============================================================
 *  Fichier    : mobile-money-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures de l'administration du Mobile Money (Sprint 6, v0.11.0) :
 *               opérateurs (actifs ou éteints) et numéros marchands par opérateur et par
 *               pays. La RLS réserve ces lectures à l'administrateur (aal2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, migration 20261108120000_mobile_money.sql
 * =============================================================
 */

import "server-only";

import type { MobileMoneyCountry, MobileMoneyOperator } from "@/lib/payments/mobile-money";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Opérateur Mobile Money. */
export type AdminMobileMoneyOperator = {
  code: MobileMoneyOperator;
  name: string;
  enabled: boolean;
};

/** Numéro marchand d'un opérateur dans un pays. */
export type AdminMobileMoneyAccount = {
  id: string;
  operator: MobileMoneyOperator;
  country: MobileMoneyCountry;
  merchantNumber: string;
  accountName: string;
  active: boolean;
};

// ==================== REQUÊTES ====================

/** Opérateurs, dans l'ordre d'affichage. */
export async function listMobileMoneyOperators(): Promise<AdminMobileMoneyOperator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mobile_money_operators")
    .select("code, name, enabled")
    .order("sort_order");
  if (error) throw new Error(`Lecture des opérateurs impossible : ${error.message}`);
  return (data ?? []).map((row) => ({
    code: row.code as MobileMoneyOperator,
    name: row.name,
    enabled: row.enabled,
  }));
}

/** Numéros marchands, triés par opérateur puis par pays. */
export async function listMobileMoneyAccounts(): Promise<AdminMobileMoneyAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mobile_money_accounts")
    .select("id, operator, country, merchant_number, account_name, active")
    .order("operator")
    .order("country");
  if (error) throw new Error(`Lecture des numéros marchands impossible : ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    operator: row.operator as MobileMoneyOperator,
    country: row.country as MobileMoneyCountry,
    merchantNumber: row.merchant_number,
    accountName: row.account_name,
    active: row.active,
  }));
}
