/**
 * =============================================================
 *  Fichier    : route.ts (api/paiement/mobile-money)
 *  Projet     : Kalami
 *  Description: Achat par Mobile Money (Sprint 6, v0.11.0), FCFA seulement.
 *               GET : numéros marchands ouverts. POST : crée la commande au prix de la base
 *               (même fonction que la carte : promo et remise enseignant compris), puis la
 *               passe en Mobile Money avec le numéro choisi. L'acheteur est ensuite envoyé
 *               sur la page de sa commande (référence, numéro, déclaration). Aucun droit
 *               n'est accordé ici : seul l'administrateur valide le paiement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/payments/create-order.ts, lib/payments/mobile-money-provider.ts,
 *               lib/payments/mobile-money.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { hasWithdrawalWaiver } from "@/lib/payments/checkout-request";
import { createOrder, orderRefusal, paymentError } from "@/lib/payments/create-order";
import { parseMobileMoneyBody } from "@/lib/payments/mobile-money";
import { getMobileMoneyProvider } from "@/lib/payments/mobile-money-provider";
import { createAdminClient } from "@/lib/supabase/admin";

/** Statut HTTP des refus propres au Mobile Money. */
const START_ERROR_STATUS: Record<string, number> = {
  operator_unavailable: 409,
  invalid_currency: 400,
};

/**
 * GET /api/paiement/mobile-money
 * @returns 200 { options } ; 401 non connecté
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse(401);
  const options = await getMobileMoneyProvider().listOptions();
  return Response.json({ options }, { headers: PRIVATE_HEADERS });
}

/**
 * POST /api/paiement/mobile-money — corps { item, currency: "XOF", accountId, … }
 * @returns 200 { orderId } ; 400 demande invalide ; 401 non connecté ; 403 achat non permis ;
 *          404 article non vendu ; 409 livre déjà possédé ou opérateur fermé ;
 *          429 trop de commandes
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse(403);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);

  const raw: unknown = await request.json().catch(() => null);
  const body = parseMobileMoneyBody(raw);
  if (!body) return errorResponse(400);
  // Case de renonciation au droit de rétractation obligatoire (v0.15.7)
  if (!hasWithdrawalWaiver(raw)) return paymentError("waiver_required", 400);

  const { data, error } = await createOrder(body);
  if (error || !data) return orderRefusal(error);

  const started = await getMobileMoneyProvider().start(data.order_id, body.accountId);
  if (started.error !== null) {
    // Numéro fermé entre-temps : la commande ne restera pas en attente
    await createAdminClient().from("orders").update({ status: "failed" }).eq("id", data.order_id);
    const status = START_ERROR_STATUS[started.error];
    if (status) return paymentError(started.error, status);
    console.error("[mobile money] commande non passée :", started.error);
    return paymentError("order_failed", 500);
  }
  return Response.json({ orderId: data.order_id }, { headers: PRIVATE_HEADERS });
}
