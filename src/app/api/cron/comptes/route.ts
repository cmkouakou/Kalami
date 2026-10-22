/**
 * =============================================================
 *  Fichier    : route.ts (api/cron/comptes)
 *  Projet     : Kalami
 *  Description: Tâche planifiée Vercel (quotidienne, vercel.json) : supprime les comptes
 *               dont la demande de suppression a dépassé le délai de 30 jours. Protégée par
 *               le secret CRON_SECRET envoyé par Vercel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/account/purge.ts, lib/security/cron.ts
 * =============================================================
 */

import { purgeDueAccounts } from "@/lib/account/purge";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { isCronAuthorized } from "@/lib/security/cron";

/**
 * GET /api/cron/comptes — en-tête « Authorization: Bearer {CRON_SECRET} »
 * @returns 200 { deleted, failed } ; 401 sans secret valide
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers)) return errorResponse(401);
  const result = await purgeDueAccounts();
  return Response.json(result, { headers: PRIVATE_HEADERS });
}
