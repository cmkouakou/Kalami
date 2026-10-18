/**
 * =============================================================
 *  Fichier    : route.ts (api/stripe/webhook)
 *  Projet     : Kalami
 *  Description: Destination « kalami-paiements » des événements Stripe. Vérifie la signature
 *               sur le corps brut, ignore les sessions des autres applications du compte
 *               (metadata.app ≠ kalami), puis confie le traitement à stripe_process_event
 *               (une seule fois par événement, montant et devise contrôlés).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: lib/payments/stripe.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import {
  receiptUrlOf,
  STRIPE_APP_TAG,
  type StripeEvent,
  verifyStripeSignature,
} from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// ==================== CONSTANTES ====================

/** Événements écoutés par la destination Kalami. */
const HANDLED_TYPES = new Set(["checkout.session.completed", "checkout.session.expired"]);

/**
 * Accusé de réception (Stripe ne renvoie pas un événement acquitté en 2xx).
 * @param result - Issue du traitement, pour le journal de Stripe
 */
function ack(result: string): Response {
  return Response.json({ received: true, result });
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

  // Compte partagé : seules les sessions marquées « kalami » nous concernent
  const session = event.data?.object;
  if (session?.metadata?.app !== STRIPE_APP_TAG) return ack("other_app");
  const orderId = session.metadata.order_id;
  if (!isUuid(orderId)) return ack("no_order");

  const completed = event.type === "checkout.session.completed";
  // Carte seulement : une session terminée est payée ; sinon on attend un autre événement
  if (completed && session.payment_status !== "paid") return ack("not_paid");

  const paymentId = completed ? session.payment_intent : null;
  const receiptUrl = paymentId ? await receiptUrlOf(paymentId) : null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("stripe_process_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_order_id: orderId,
    p_session_id: session.id,
    p_amount_minor: session.amount_total ?? 0,
    p_currency: session.currency ?? "",
    p_payment_id: paymentId,
    p_receipt_url: receiptUrl,
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
