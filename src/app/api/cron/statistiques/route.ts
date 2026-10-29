/**
 * =============================================================
 *  Fichier    : route.ts (api/cron/statistiques)
 *  Projet     : Kalami
 *  Description: Tâche planifiée Vercel (quotidienne, vercel.json) : réduit les statistiques
 *               de lecture et de visite de plus de 12 mois en totaux mensuels anonymes, puis
 *               efface le détail. Protégée par le secret CRON_SECRET envoyé par Vercel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/supabase/admin.ts, lib/security/cron.ts
 * =============================================================
 */

import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { isCronAuthorized } from "@/lib/security/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/statistiques — en-tête « Authorization: Bearer {CRON_SECRET} »
 * @returns 200 { purged } ; 401 sans secret valide
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers)) return errorResponse(401);
  const { data, error } = await createAdminClient().rpc("purge_analytics");
  if (error) throw new Error(`Purge des statistiques impossible : ${error.message}`);
  return Response.json({ purged: data ?? 0 }, { headers: PRIVATE_HEADERS });
}
