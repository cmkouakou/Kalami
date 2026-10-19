/**
 * =============================================================
 *  Fichier    : route.ts (api/paiement/checkout)
 *  Projet     : Kalami
 *  Description: Achat par carte d'un livre, d'une étude ou d'un lot d'études Stratégie, ou
 *               d'un forfait du coach : crée la commande au prix de la base (fonctions
 *               create_book_order et create_strategy_order, au nom de l'acheteur connecté),
 *               ouvre la session Stripe Checkout et renvoie son adresse. Aucun droit n'est
 *               accordé ici : seul le webhook signé livre l'achat.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/payments/stripe.ts, lib/payments/catalog.ts,
 *               lib/payments/checkout-request.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { getCurrentUser } from "@/lib/auth/dal";
import { APP_URL } from "@/lib/config";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { type SaleItemKey, stripeProductFor } from "@/lib/payments/catalog";
import {
  cancelPathFor,
  type CheckoutBody,
  coachPackSaleItem,
  parseCheckoutBody,
  studyOfferSaleItem,
} from "@/lib/payments/checkout-request";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

/** Statut HTTP de chaque refus de la base. */
const ORDER_ERROR_STATUS: Record<string, number> = {
  invalid_currency: 400,
  not_for_sale: 404,
  not_allowed: 403,
  already_owned: 409,
  rate_limited: 429,
};

type OrderRow = { order_id: string; total_minor: number; label: string };

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Réponse JSON d'erreur de paiement.
 * @param code - Code lu par l'interface (already_owned, rate_limited…)
 * @param status - Statut HTTP
 */
function paymentError(code: string, status: number): Response {
  return Response.json({ error: code }, { status, headers: PRIVATE_HEADERS });
}

// ==================== COMMANDE ====================

/**
 * Crée la commande au nom de l'acheteur : la base vérifie prix, droits et cadence.
 * @param body - Demande validée
 */
async function createOrder(body: CheckoutBody) {
  const supabase = await createClient();
  if (body.item === "book") {
    return supabase
      .rpc("create_book_order", { p_book_id: body.bookId, p_currency: body.currency })
      .single<OrderRow>();
  }
  return supabase
    .rpc("create_strategy_order", {
      p_kind: body.item,
      p_currency: body.currency,
      p_code: body.item === "study_offer" ? body.code : null,
      p_pack_id: body.item === "coach_pack" ? body.packId : null,
      p_study_id: body.item === "coach_pack" ? body.studyId : null,
    })
    .single<OrderRow>();
}

/**
 * Article Stripe et slug du livre (pour le retour) d'une demande.
 * @param admin - Client administrateur
 * @param body - Demande validée
 */
async function describeItem(
  admin: Admin,
  body: CheckoutBody,
): Promise<{ saleItem: SaleItemKey | null; bookSlug: string | null }> {
  if (body.item === "book") {
    const { data } = await admin.from("books").select("slug").eq("id", body.bookId).single();
    const slug: string | null = data?.slug ?? null;
    return { saleItem: slug ? { kind: "book", slug } : null, bookSlug: slug };
  }
  if (body.item === "study_offer") {
    return { saleItem: studyOfferSaleItem(body.code), bookSlug: null };
  }
  const { data } = await admin.from("coach_packs").select("name").eq("id", body.packId).single();
  return { saleItem: data ? coachPackSaleItem(data.name) : null, bookSlug: null };
}

// ==================== ROUTE ====================

/**
 * POST /api/paiement/checkout — corps { item, currency, bookId | code | packId + studyId }
 * @returns 200 { url } ; 400 demande invalide ; 401 non connecté ; 403 achat non permis ;
 *          404 article non vendu ; 409 livre déjà possédé ; 429 trop de commandes ;
 *          502 Stripe indisponible
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse(403);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);

  const body = parseCheckoutBody(await request.json().catch(() => null));
  if (!body) return errorResponse(400);

  const { data, error } = await createOrder(body);
  if (error || !data) {
    const code = error?.message ?? "";
    if (code in ORDER_ERROR_STATUS) return paymentError(code, ORDER_ERROR_STATUS[code]);
    console.error("[paiement] commande refusée :", error?.code, error?.message);
    return paymentError("order_failed", 500);
  }

  const admin = createAdminClient();
  const { saleItem, bookSlug } = await describeItem(admin, body);
  const productId = saleItem ? await stripeProductFor(saleItem) : null;

  try {
    const session = await createCheckoutSession({
      orderId: data.order_id,
      currency: body.currency,
      line: { unitMinor: data.total_minor, label: data.label, productId },
      customerEmail: user.email,
      successUrl: `${APP_URL}/compte/achats/merci?commande=${data.order_id}`,
      cancelUrl: `${APP_URL}${cancelPathFor(body, bookSlug)}`,
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
