/**
 * =============================================================
 *  Fichier    : route.ts (api/stripe/webhook)
 *  Projet     : Kalami
 *  Description: Destination « kalami-paiements » des événements Stripe. Vérifie la signature
 *               sur le corps brut, ignore les sessions des autres applications du compte
 *               (metadata.app ≠ kalami), puis confie le traitement à stripe_process_event
 *               (une seule fois par événement, montant et devise contrôlés). Transmet aussi
 *               les frais Stripe et la taxe pour le grand livre (v0.12.0).
 *               charge.refunded (v0.13.0) : un remboursement intégral fait dans le tableau
 *               de bord Stripe retire les droits comme le bouton « Rembourser » de l'admin
 *               (stripe_process_refund). Le paiement est retrouvé par son PaymentIntent.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-22
 *  Dépendances: lib/payments/stripe.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { isCurrency } from "@/lib/currency";
import {
  existingFullRefund,
  paymentDetailsOf,
  refundNoticeOf,
  STRIPE_APP_TAG,
  type StripeEvent,
  verifyStripeSignature,
} from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// ==================== CONSTANTES ====================

/** Événements écoutés par la destination Kalami. */
const HANDLED_TYPES = new Set([
  "checkout.session.completed",
  "checkout.session.expired",
  "charge.refunded",
]);

/**
 * Accusé de réception (Stripe ne renvoie pas un événement acquitté en 2xx).
 * @param result - Issue du traitement, pour le journal de Stripe
 */
function ack(result: string): Response {
  return Response.json({ received: true, result });
}

/**
 * Traite charge.refunded. Les paiements des autres applications du compte ne correspondent
 * à aucune commande Kalami et sont acquittés « unknown_order ».
 * @param event - Événement vérifié
 */
async function handleRefund(event: StripeEvent): Promise<Response> {
  const notice = refundNoticeOf(event.data?.object);
  if (!notice) return ack("no_refund");

  // Identifiant re_… du remboursement intégral (null : partiel ou Stripe injoignable)
  const refundId = notice.full ? await existingFullRefund(notice.paymentId) : null;
  const { data, error } = await createAdminClient().rpc("stripe_process_refund", {
    p_event_id: event.id,
    p_payment_id: notice.paymentId,
    p_refund_id: refundId,
    p_full: notice.full,
  });
  if (error) {
    console.error("[stripe] remboursement non traité :", event.id, error.code, error.message);
    return Response.json({ error: "database" }, { status: 500 });
  }
  if (data === "partial_refund") {
    console.error("[stripe] remboursement partiel à traiter à la main :", event.id);
  }
  return ack(String(data));
}

// ==================== ROUTE ====================

/**
 * POST /api/stripe/webhook
 * @returns 200 (traité, doublon ou ignoré) ; 400 signature invalide ; 500 erreur de la base
 *          (Stripe réessaiera)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"), secret)) {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }
  if (!HANDLED_TYPES.has(event.type)) return ack("ignored_type");
  if (event.type === "charge.refunded") return handleRefund(event);

  // Compte partagé : seules les sessions marquées « kalami » nous concernent
  const session = event.data?.object;
  if (session?.metadata?.app !== STRIPE_APP_TAG) return ack("other_app");
  const orderId = session.metadata.order_id;
  if (!isUuid(orderId)) return ack("no_order");

  const completed = event.type === "checkout.session.completed";
  // Carte seulement : une session terminée est payée ; sinon on attend un autre événement
  if (completed && session.payment_status !== "paid") return ack("not_paid");

  const paymentId = completed ? session.payment_intent : null;
  const currency = (session.currency ?? "").toUpperCase();
  const details =
    paymentId && isCurrency(currency) ? await paymentDetailsOf(paymentId, currency) : null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("stripe_process_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_order_id: orderId,
    p_session_id: session.id,
    p_amount_minor: session.amount_total ?? 0,
    p_currency: session.currency ?? "",
    p_payment_id: paymentId,
    p_receipt_url: details?.receiptUrl ?? null,
    p_fee_minor: details?.feeMinor ?? null,
    p_tax_minor: completed ? (session.total_details?.amount_tax ?? 0) : null,
  });
  if (error) {
    console.error("[stripe] événement non traité :", event.id, error.code, error.message);
    return Response.json({ error: "database" }, { status: 500 });
  }
  if (data === "amount_mismatch" || data === "unknown_order") {
    console.error("[stripe] événement refusé :", event.id, data);
  }
  return ack(String(data));
}
