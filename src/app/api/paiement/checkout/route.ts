/**
 * =============================================================
 *  Fichier    : route.ts (api/paiement/checkout)
 *  Projet     : Kalami
 *  Description: Achat d'un livre par carte : crée la commande au prix de la base (fonction
 *               create_book_order, au nom de l'acheteur connecté), ouvre la session Stripe
 *               Checkout et renvoie son adresse. Aucun droit n'est accordé ici : seul le
 *               webhook signé débloque le livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: lib/payments/stripe.ts, lib/payments/catalog.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { APP_URL } from "@/lib/config";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { isCurrency } from "@/lib/currency";
import { stripeProductFor } from "@/lib/payments/catalog";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

/** Statut HTTP de chaque refus de create_book_order. */
const ORDER_ERROR_STATUS: Record<string, number> = {
  invalid_currency: 400,
  not_for_sale: 404,
  already_owned: 409,
  rate_limited: 429,
};

type OrderRow = { order_id: string; total_minor: number; label: string };

/**
 * Réponse JSON d'erreur de paiement.
 * @param code - Code lu par l'interface (already_owned, rate_limited…)
 * @param status - Statut HTTP
 */
function paymentError(code: string, status: number): Response {
  return Response.json({ error: code }, { status, headers: PRIVATE_HEADERS });
}

// ==================== ROUTE ====================

/**
 * POST /api/paiement/checkout — corps { bookId, currency }
 * @returns 200 { url } ; 400 demande invalide ; 401 non connecté ; 404 livre non vendu ;
 *          409 livre déjà possédé ; 429 trop de commandes ; 502 Stripe indisponible
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse(403);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);

  const body = (await request.json().catch(() => null)) as
    | { bookId?: unknown; currency?: unknown }
    | null;
  if (!body || !isUuid(body.bookId) || !isCurrency(body.currency)) return errorResponse(400);
  const { bookId, currency } = body;

  // Commande créée au nom de l'acheteur : la base vérifie prix, possession et cadence
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_book_order", { p_book_id: bookId, p_currency: currency })
    .single<OrderRow>();
  if (error || !data) {
    const code = error?.message ?? "";
    if (code in ORDER_ERROR_STATUS) return paymentError(code, ORDER_ERROR_STATUS[code]);
    console.error("[paiement] commande refusée :", error?.code, error?.message);
    return paymentError("order_failed", 500);
  }

  const admin = createAdminClient();
  const { data: book } = await admin.from("books").select("slug").eq("id", bookId).single();
  const productId = book ? await stripeProductFor({ kind: "book", slug: book.slug }) : null;

  try {
    const session = await createCheckoutSession({
      orderId: data.order_id,
      currency,
      line: { unitMinor: data.total_minor, label: data.label, productId },
      customerEmail: user.email,
      successUrl: `${APP_URL}/compte/achats/merci?commande=${data.order_id}`,
      cancelUrl: `${APP_URL}/livres/${book?.slug ?? ""}?paiement=annule`,
    });
    const attached = await admin.rpc("order_attach_session", {
      p_order_id: data.order_id,
      p_session_id: session.id,
    });
    // Sans ce lien, le webhook ne retrouverait pas la commande : on n'envoie pas payer
    if (attached.error) throw new Error(attached.error.message);
    return Response.json({ url: session.url }, { headers: PRIVATE_HEADERS });
  } catch (cause) {
    // Session impossible : la commande ne restera pas en attente
    console.error("[paiement] session non créée :", (cause as Error).message);
    await admin.from("orders").update({ status: "failed" }).eq("id", data.order_id);
    return paymentError("stripe_unavailable", 502);
  }
}
