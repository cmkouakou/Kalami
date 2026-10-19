/**
 * =============================================================
 *  Fichier    : stripe.ts
 *  Projet     : Kalami
 *  Description: Appels à l'API REST de Stripe (sans dépendance) : création d'une session
 *               Checkout, lecture du produit d'un prix et du reçu d'un paiement, vérification
 *               de la signature des webhooks (HMAC SHA-256), remboursement d'un paiement,
 *               Stripe Tax facultatif (prix taxes comprises, v0.10.3), frais réels d'un
 *               paiement pour le grand livre (v0.12.0).
 *               Le compte Stripe est partagé avec d'autres applications : chaque session
 *               porte metadata.app = « kalami ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-19
 *  Dépendances: Stripe (https://docs.stripe.com/api), version 2026-02-25.clover
 * =============================================================
 */

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { Currency } from "@/lib/catalog/types";
import { feeInOrderCurrency } from "@/lib/revenue/ledger";

// ==================== CONSTANTES ====================

const STRIPE_API = "https://api.stripe.com/v1";

/** Même version que la destination « kalami-paiements » du tableau de bord Stripe. */
export const STRIPE_API_VERSION = "2026-02-25.clover";

/** Marque des sessions Kalami (les autres applications du compte sont ignorées). */
export const STRIPE_APP_TAG = "kalami";

/** Écart accepté entre l'horodatage signé et l'heure du serveur (secondes). */
const SIGNATURE_TOLERANCE_S = 300;

/** Durée de validité d'une session Checkout (Stripe exige au moins 30 min). */
const SESSION_TTL_S = 60 * 60;

const TIMEOUT_MS = 15_000;

// ==================== TYPES ====================

export type CheckoutLine = {
  /** Montant en unité mineure (centimes, FCFA entiers pour le XOF). */
  unitMinor: number;
  label: string;
  /** Produit Stripe (prod_…) si connu ; sinon un produit est décrit à la volée. */
  productId: string | null;
};

export type CheckoutRequest = {
  orderId: string;
  currency: Currency;
  /** Stripe Tax : taxe calculée par Stripe, comprise dans le prix affiché (montant inchangé). */
  automaticTax: boolean;
  line: CheckoutLine;
  customerEmail: string | null;
  successUrl: string;
  cancelUrl: string;
};

/** Sous-ensemble utile d'une session Checkout reçue par webhook. */
export type CheckoutSessionEvent = {
  id: string;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  payment_intent: string | null;
  client_reference_id: string | null;
  total_details?: { amount_tax?: number | null } | null;
  metadata: Record<string, string> | null;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: CheckoutSessionEvent };
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Lit la clé secrète Stripe ; lève une erreur si elle manque. */
function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante (voir .env.example).");
  return key;
}

/**
 * Encode des paramètres imbriqués au format attendu par Stripe (a[b][c]=valeur).
 * @param params - Objet de paramètres (valeurs nulles ignorées)
 * @param prefix - Préfixe courant (récursion)
 * @returns Paires clé-valeur à placer dans un corps x-www-form-urlencoded
 */
export function encodeStripeParams(
  params: Record<string, unknown>,
  prefix = "",
): [string, string][] {
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          pairs.push(...encodeStripeParams(item as Record<string, unknown>, `${name}[${index}]`));
        } else {
          pairs.push([`${name}[${index}]`, String(item)]);
        }
      });
    } else if (typeof value === "object") {
      pairs.push(...encodeStripeParams(value as Record<string, unknown>, name));
    } else {
      pairs.push([name, String(value)]);
    }
  }
  return pairs;
}

/**
 * Appelle l'API Stripe et renvoie le JSON ; lève une erreur lisible si Stripe refuse.
 * @param method - GET ou POST
 * @param path - Chemin après /v1, ex. « checkout/sessions »
 * @param params - Paramètres du corps (POST) ou de la requête (GET)
 * @param idempotencyKey - Clé d'idempotence (POST) : une demande répétée ne compte qu'une fois
 */
async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  params: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<T> {
  const query = new URLSearchParams(encodeStripeParams(params)).toString();
  const base = `${STRIPE_API}/${path}`;
  const url = method === "GET" && query ? `${base}?${query}` : base;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: method === "POST" ? query : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string; type?: string } })
    | null;
  if (!response.ok || !body) {
    const reason = body?.error?.message ?? `HTTP ${response.status}`;
    console.error(`[stripe] ${method} ${path} refusé :`, reason);
    throw new Error(`Stripe a refusé la demande (${reason}).`);
  }
  return body;
}

// ==================== APPELS API ====================

/**
 * Produit Stripe (prod_…) rattaché à un prix (price_…) créé dans le tableau de bord.
 * @param priceId - Identifiant du prix
 * @returns Identifiant du produit, ou null si le prix est introuvable
 */
export async function productOfPrice(priceId: string): Promise<string | null> {
  try {
    const price = await stripeRequest<{ product: string }>("GET", `prices/${priceId}`);
    return typeof price.product === "string" ? price.product : null;
  } catch {
    return null;
  }
}

/**
 * Crée une session Checkout (carte seulement) pour une commande Kalami.
 * Le montant vient de la base : Stripe n'est jamais la source du prix.
 * @param request - Commande, devise, article, adresses de retour
 * @returns Identifiant (cs_…) et adresse de la page de paiement Stripe
 */
export async function createCheckoutSession(
  request: CheckoutRequest,
): Promise<{ id: string; url: string }> {
  const { line } = request;
  const metadata = { app: STRIPE_APP_TAG, order_id: request.orderId };
  return stripeRequest<{ id: string; url: string }>("POST", "checkout/sessions", {
    mode: "payment",
    locale: "fr",
    payment_method_types: ["card"],
    client_reference_id: request.orderId,
    customer_email: request.customerEmail,
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
    metadata,
    payment_intent_data: { metadata, statement_descriptor_suffix: "KALAMI" },
    // Taxe comprise : le total payé reste celui de la commande (contrôle du webhook)
    automatic_tax: request.automaticTax ? { enabled: true } : null,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: request.currency.toLowerCase(),
          unit_amount: line.unitMinor,
          tax_behavior: request.automaticTax ? "inclusive" : null,
          ...(line.productId
            ? { product: line.productId }
            : { product_data: { name: line.label } }),
        },
      },
    ],
  });
}

/**
 * Rembourse en entier le paiement d'une commande Kalami.
 * La clé d'idempotence liée à la commande empêche un double remboursement (double clic).
 * @param paymentIntentId - Identifiant pi_… du paiement
 * @param orderId - Commande Kalami remboursée
 * @returns Identifiant (re_…) et statut du remboursement
 */
export async function createRefund(
  paymentIntentId: string,
  orderId: string,
): Promise<{ id: string; status: string }> {
  return stripeRequest<{ id: string; status: string }>(
    "POST",
    "refunds",
    {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: { app: STRIPE_APP_TAG, order_id: orderId },
    },
    `kalami-refund-${orderId}`,
  );
}

/** Reçu et frais d'un paiement (null : indisponible, le paiement reste valable). */
export type PaymentDetails = { receiptUrl: string | null; feeMinor: number | null };

type BalanceTransaction = { fee?: number; currency?: string; exchange_rate?: number | null };

/**
 * Adresse du reçu Stripe et frais d'un paiement, dans la devise de la commande.
 * @param paymentIntentId - Identifiant pi_…
 * @param currency - Devise de la commande
 * @returns Reçu et frais, chacun null s'il est indisponible
 */
export async function paymentDetailsOf(
  paymentIntentId: string,
  currency: Currency,
): Promise<PaymentDetails> {
  try {
    const intent = await stripeRequest<{
      latest_charge: {
        receipt_url?: string;
        balance_transaction?: BalanceTransaction | string | null;
      } | null;
    }>("GET", `payment_intents/${paymentIntentId}`, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = intent.latest_charge;
    const balance = typeof charge?.balance_transaction === "object"
      ? charge.balance_transaction
      : null;
    return {
      receiptUrl: charge?.receipt_url ?? null,
      feeMinor: feeInOrderCurrency(
        balance?.fee,
        balance?.currency,
        balance?.exchange_rate,
        currency,
      ),
    };
  } catch {
    return { receiptUrl: null, feeMinor: null };
  }
}

// ==================== WEBHOOK ====================

/**
 * Vérifie l'en-tête Stripe-Signature (t=…, v1=…) sur le corps brut reçu.
 * @param rawBody - Corps de la requête, tel quel
 * @param header - Valeur de l'en-tête Stripe-Signature
 * @param secret - Clé de signature de la destination (whsec_…)
 * @param nowS - Heure courante en secondes (paramètre pour les tests)
 * @returns true si une signature v1 correspond et que l'horodatage est récent
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowS = Math.floor(Date.now() / 1000),
): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value ?? "");
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowS - timestamp) > SIGNATURE_TOLERANCE_S) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  return signatures.some((signature) => {
    const given = Buffer.from(signature, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
