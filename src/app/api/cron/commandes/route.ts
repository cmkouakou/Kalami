/**
 * =============================================================
 *  Fichier    : route.ts (api/cron/commandes)
 *  Projet     : Kalami
 *  Description: Tâche planifiée Vercel (quotidienne, vercel.json, Sprint 6) : marque
 *               « expirées » les commandes Mobile Money non déclarées dans les 24 h. Les pages
 *               montrent déjà l'échéance avant ce passage. Protégée par CRON_SECRET.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/admin.ts, migration 20261108120000_mobile_money.sql
 * =============================================================
 */

import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/commandes — en-tête « Authorization: Bearer {CRON_SECRET} »
 * @returns 200 { expired } ; 401 sans secret valide ; 500 échec de la base
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return errorResponse(401);
  }
  const { data, error } = await createAdminClient().rpc("mm_expire_stale");
  if (error) {
    console.error("[cron commandes] expiration impossible :", error.message);
    return Response.json({ error: "expire_failed" }, { status: 500, headers: PRIVATE_HEADERS });
  }
  return Response.json({ expired: Number(data ?? 0) }, { headers: PRIVATE_HEADERS });
}
