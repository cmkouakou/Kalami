/**
 * =============================================================
 *  Fichier    : route.ts (api/cron/pdf)
 *  Projet     : Kalami
 *  Description: Tâche planifiée Vercel (quotidienne, vercel.json) : supprime les PDF
 *               filigranés expirés, pour qu'aucun fichier ne soit conservé au-delà de 24 h
 *               (à un jour près). Protégée par le secret CRON_SECRET envoyé par Vercel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/pdf/exports.ts
 * =============================================================
 */

import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { purgeExpiredExports } from "@/lib/pdf/exports";

/**
 * GET /api/cron/pdf — en-tête « Authorization: Bearer {CRON_SECRET} »
 * @returns 200 { removed } ; 401 sans secret valide
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return errorResponse(401);
  }
  const removed = await purgeExpiredExports();
  return Response.json({ removed }, { headers: PRIVATE_HEADERS });
}
