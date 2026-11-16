/**
 * =============================================================
 *  Fichier    : route.ts (api/visite)
 *  Projet     : Kalami
 *  Description: Statistiques de visite (v0.16.1) : ajoute une page vue au compteur anonyme
 *               du jour (page, pays, site d'origine). v0.24.0 : si le visiteur est
 *               connecté, la page est aussi notée dans son activité de membre (courriel
 *               visible par l'administrateur seulement). Jamais d'adresse IP ni de témoin
 *               ajouté. Robots, administrateurs et pages d'administration ignorés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-16
 *  Dépendances: lib/analytics/visit.ts, lib/supabase/admin.ts, lib/content/responses.ts,
 *               lib/auth/dal.ts
 * =============================================================
 */

import type { NextRequest } from "next/server";

import { countryCode, isBot, normalizeVisitPath, referrerHost } from "@/lib/analytics/visit";
import { getCurrentUser } from "@/lib/auth/dal";
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
  const country = countryCode(request.headers.get("x-vercel-ip-country"));
  const referrer = entry ? referrerHost(body.referrer, request.headers.get("host")) : "";
  const admin = createAdminClient();
  const [user, visit] = await Promise.all([
    getCurrentUser(),
    admin.rpc("record_site_visit", {
      p_path: path,
      p_country: country,
      p_referrer: referrer,
      p_entry: entry,
    }),
  ]);
  if (visit.error) {
    throw new Error(`Enregistrement de la visite impossible : ${visit.error.message}`);
  }

  // Membre connecté : même page notée dans son activité (administrateurs ignorés en base)
  if (user) {
    const { error } = await admin.rpc("record_member_visit", {
      p_user_id: user.id,
      p_path: path,
      p_country: country,
      p_referrer: referrer,
    });
    if (error) throw new Error(`Enregistrement de l'activité impossible : ${error.message}`);
  }
  return done;
}
