/**
 * =============================================================
 *  Fichier    : route.ts (api/livres/[id]/recherche)
 *  Projet     : Kalami
 *  Description: Recherche dans le texte d'un livre pour la liseuse. Les résultats ne portent
 *               que sur les parties que le demandeur peut lire (extrait coupé, ou livre
 *               entier avec un droit de lecture). Compte dans la limite de débit du contenu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/content/chapters.ts, lib/content/responses.ts, lib/reader/search.ts
 * =============================================================
 */

import type { NextRequest } from "next/server";

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { rateLimitSubject } from "@/lib/content/access";
import { searchBookForRequest } from "@/lib/content/chapters";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { parseSearchQuery, SEARCH_MAX_HITS } from "@/lib/reader/search";

/**
 * GET /api/livres/{id}/recherche?q=…
 * @returns 200 { hits: SearchHit[], limited: boolean } ; 400 requête invalide ; 404 ; 429
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/livres/[id]/recherche">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(404);

  const query = parseSearchQuery(request.nextUrl.searchParams.get("q"));
  if (query === null) return errorResponse(400);

  const user = await getCurrentUser();
  const subject = rateLimitSubject(user?.id ?? null, request.headers);
  const result = await searchBookForRequest(id, query, user, subject);

  if (result.status !== 200) return errorResponse(result.status);
  return Response.json(
    { hits: result.hits, limited: result.hits.length >= SEARCH_MAX_HITS },
    { headers: PRIVATE_HEADERS },
  );
}
