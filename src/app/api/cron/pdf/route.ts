/**
 * =============================================================
 *  Fichier    : route.ts (api/cron/pdf)
 *  Projet     : Kalami
 *  Description: Tâche planifiée Vercel (quotidienne, vercel.json) : supprime les PDF
 *               filigranés expirés, pour qu'aucun fichier ne soit conservé au-delà de 24 h
 *               (à un jour près). Protégée par le secret CRON_SECRET envoyé par Vercel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/pdf/exports.ts, lib/security/cron.ts
 * =============================================================
 */

import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { purgeExpiredExports } from "@/lib/pdf/exports";
import { isCronAuthorized } from "@/lib/security/cron";

/**
 * GET /api/cron/pdf — en-tête « Authorization: Bearer {CRON_SECRET} »
 * @returns 200 { removed } ; 401 sans secret valide
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers)) return errorResponse(401);
  const removed = await purgeExpiredExports();
  return Response.json({ removed }, { headers: PRIVATE_HEADERS });
}
