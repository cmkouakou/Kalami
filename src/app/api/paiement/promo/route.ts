/**
 * =============================================================
 *  Fichier    : route.ts (api/paiement/promo)
 *  Projet     : Kalami
 *  Description: Aperçu d'un code promo pour l'article affiché (v0.10.3) : la base vérifie
 *               le code (actif, non expiré, non épuisé, pas encore utilisé par ce compte,
 *               valable pour cet article) et renvoie sa réduction. Le montant final est
 *               recalculé par la base à la création de la commande. Dix essais par compte
 *               en dix minutes au plus, contre la recherche de codes à l'aveugle (Sprint 11s).
 *               Les cas d'entraînement suivent les codes « strategy » (v0.14.0).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-23
 *  Dépendances: lib/payments/promo.ts, lib/security/rate-limit.ts, lib/supabase/server.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import {
  normalizePromoCode,
  PROMO_ERRORS,
  promoFromRow,
  type PromoPreviewRow,
} from "@/lib/payments/promo";
import { allowAttempt, userSubject } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * Cible du code d'après le corps reçu : un livre, ou les offres Stratégie.
 * @param body - Corps JSON
 * @returns Cible, ou null si l'article est invalide
 */
function targetOf(
  body: Record<string, unknown>,
): { target: "book" | "strategy"; bookId: string | null } | null {
  if (body.item === "book" && isUuid(body.bookId)) {
    return { target: "book", bookId: body.bookId };
  }
  if (body.item === "study_offer" || body.item === "coach_pack" || body.item === "practice_case") {
    return { target: "strategy", bookId: null };
  }
  return null;
}

/**
 * POST /api/paiement/promo — corps { code, item, bookId? }
 * @returns 200 { promo } ; 400 code mal formé ou refusé ({ error }) ; 401 non connecté ;
 *          429 trop d'essais
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse(403);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);
  if (!(await allowAttempt("promo_user", userSubject(user.id)))) return errorResponse(429);

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const target = raw ? targetOf(raw) : null;
  if (!raw || !target) return errorResponse(400);
  const code = normalizePromoCode(raw.code);
  if (!code) {
    return Response.json({ error: "promo_invalid" }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("promo_preview", { p_code: code, p_target: target.target, p_book_id: target.bookId })
    .single<PromoPreviewRow>();
  if (error || !data) {
    const known = PROMO_ERRORS.find((name) => name === error?.message) ?? "promo_invalid";
    return Response.json({ error: known }, { status: 400, headers: PRIVATE_HEADERS });
  }
  return Response.json({ promo: promoFromRow(data) }, { headers: PRIVATE_HEADERS });
}
