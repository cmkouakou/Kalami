/**
 * =============================================================
 *  Fichier    : mobile-money-provider.ts
 *  Projet     : Kalami
 *  Description: Interface commune des fournisseurs Mobile Money et fournisseur « manuel »
 *               de la v1 (numéros marchands saisis par l'admin, validation à la main).
 *               Un agrégateur (CinetPay…) pourra prendre le relais en implémentant la même
 *               interface, sans toucher aux routes ni aux pages.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, lib/payments/mobile-money.ts
 * =============================================================
 */

import "server-only";

import type { MobileMoneyCountry, MobileMoneyOperator } from "@/lib/payments/mobile-money";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Numéro marchand proposé à l'acheteur. */
export type MobileMoneyOption = {
  accountId: string;
  operator: MobileMoneyOperator;
  operatorName: string;
  country: MobileMoneyCountry;
  merchantNumber: string;
  accountName: string | null;
};

/** Instructions de paiement d'une commande passée en Mobile Money. */
export type MobileMoneyStart = {
  reference: string;
  merchantNumber: string;
  operatorName: string;
  totalMinor: number;
  expiresAt: string;
};

/** Résultat d'une opération : données, ou code d'erreur de la base. */
export type ProviderResult<T> = { data: T; error: null } | { data: null; error: string };

/** Ce que tout fournisseur Mobile Money doit savoir faire. */
export interface MobileMoneyProvider {
  /** Moyens de paiement ouverts à l'acheteur connecté. */
  listOptions(): Promise<MobileMoneyOption[]>;
  /** Passe en Mobile Money une commande FCFA tout juste créée. */
  start(orderId: string, accountId: string): Promise<ProviderResult<MobileMoneyStart>>;
  /** Enregistre la transaction déclarée par l'acheteur. */
  declare(orderId: string, transactionId: string, payerNumber: string):
    Promise<ProviderResult<true>>;
}

// ==================== FOURNISSEUR MANUEL ====================

type OptionRow = {
  account_id: string;
  operator: MobileMoneyOperator;
  operator_name: string;
  country: MobileMoneyCountry;
  merchant_number: string;
  account_name: string | null;
};

type StartRow = {
  reference: string;
  merchant_number: string;
  operator_name: string;
  total_minor: number;
  expires_at: string;
};

/** Fournisseur v1 : tout passe par les fonctions de la base, au nom de l'acheteur. */
const manualProvider: MobileMoneyProvider = {
  async listOptions() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("mm_payment_options");
    if (error) {
      console.error("[mobile money] numéros illisibles :", error.code, error.message);
      return [];
    }
    return ((data ?? []) as OptionRow[]).map((row) => ({
      accountId: row.account_id,
      operator: row.operator,
      operatorName: row.operator_name,
      country: row.country,
      merchantNumber: row.merchant_number,
      accountName: row.account_name,
    }));
  },

  async start(orderId, accountId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("mm_start_order", { p_order_id: orderId, p_account_id: accountId })
      .single<StartRow>();
    if (error || !data) return { data: null, error: error?.message ?? "order_failed" };
    return {
      data: {
        reference: data.reference,
        merchantNumber: data.merchant_number,
        operatorName: data.operator_name,
        totalMinor: Number(data.total_minor),
        expiresAt: data.expires_at,
      },
      error: null,
    };
  },

  async declare(orderId, transactionId, payerNumber) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("mm_declare_transaction", {
      p_order_id: orderId,
      p_transaction_id: transactionId,
      p_payer_number: payerNumber,
    });
    return error ? { data: null, error: error.message } : { data: true, error: null };
  },
};

/** Fournisseur Mobile Money en service (manuel en v1). */
export function getMobileMoneyProvider(): MobileMoneyProvider {
  return manualProvider;
}
