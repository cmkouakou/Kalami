/**
 * =============================================================
 *  Fichier    : route.ts (api/visite)
 *  Projet     : Kalami
 *  Description: Statistiques de visite anonymes (v0.16.1) : ajoute une page vue au compteur
 *               du jour (page, pays, site d'origine). Aucune adresse IP, aucun témoin,
 *               aucun lien avec un compte. Robots et pages d'administration ignorés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/analytics/visit.ts, lib/supabase/admin.ts, lib/content/responses.ts
 * =============================================================
 */

import type { NextRequest } from "next/server";

import { countryCode, isBot, normalizeVisitPath, referrerHost } from "@/lib/analytics/visit";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { createAdminClient } from "@/lib/supabase/admin";

/** Taille maximale du corps (chemin + site d'origine). */
const MAX_BODY_BYTES = 2048;

/**
 * POST /api/visite — corps { path, referrer, entry }
 * @returns 204 (même si la page n'est pas comptée) ; 400 corps invalide ; 403 autre origine
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return errorResponse(403);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return errorResponse(400);
  let body: { path?: unknown; referrer?: unknown; entry?: unknown };
  try {
    body = JSON.parse(text) ?? {};
  } catch {
    return errorResponse(400);
  }

  const path = normalizeVisitPath(body.path);
  const done = new Response(null, { status: 204, headers: PRIVATE_HEADERS });
  if (!path || isBot(request.headers.get("user-agent"))) return done;

  const entry = body.entry === true;
  const { error } = await createAdminClient().rpc("record_site_visit", {
    p_path: path,
    p_country: countryCode(request.headers.get("x-vercel-ip-country")),
    p_referrer: entry ? referrerHost(body.referrer, request.headers.get("host")) : "",
    p_entry: entry,
  });
  if (error) throw new Error(`Enregistrement de la visite impossible : ${error.message}`);
  return done;
}
