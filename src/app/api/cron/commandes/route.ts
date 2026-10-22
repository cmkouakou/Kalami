/**
 * =============================================================
 *  Fichier    : route.ts (api/cron/commandes)
 *  Projet     : Kalami
 *  Description: Tâche planifiée Vercel (quotidienne, vercel.json, Sprint 6) : marque
 *               « expirées » les commandes Mobile Money non déclarées dans les 24 h. Les pages
 *               montrent déjà l'échéance avant ce passage. Purge aussi les tentatives de la
 *               limitation de débit de plus d'un jour (Sprint 11s). Protégée par CRON_SECRET.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/supabase/admin.ts, lib/security/cron.ts, migrations
 *               20261108120000_mobile_money.sql, 20261111120000_security.sql
 * =============================================================
 */

import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { isCronAuthorized } from "@/lib/security/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/commandes — en-tête « Authorization: Bearer {CRON_SECRET} »
 * @returns 200 { expired, purged } ; 401 sans secret valide ; 500 échec de la base
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers)) return errorResponse(401);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("mm_expire_stale");
  if (error) {
    console.error("[cron commandes] expiration impossible :", error.message);
    return Response.json({ error: "expire_failed" }, { status: 500, headers: PRIVATE_HEADERS });
  }
  // Un échec de la purge n'annule pas l'expiration : il est seulement journalisé
  const purge = await admin.rpc("purge_rate_limit_hits");
  if (purge.error) console.error("[cron commandes] purge impossible :", purge.error.message);
  return Response.json(
    { expired: Number(data ?? 0), purged: Number(purge.data ?? 0) },
    { headers: PRIVATE_HEADERS },
  );
}
