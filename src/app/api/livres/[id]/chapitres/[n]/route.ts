/**
 * =============================================================
 *  Fichier    : route.ts (api/livres/[id]/chapitres/[n])
 *  Projet     : Kalami
 *  Description: API de contenu : renvoie un chapitre en JSON (blocs HTML nettoyés) si le
 *               demandeur y a droit. 403 hors extrait sans droit de lecture, 404 livre ou
 *               chapitre absent, 429 au-delà de la limite de débit. Jamais mise en cache.
 *               Conçue pour la liseuse (Sprint 4) et la lecture hors ligne (v2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/content/chapters.ts, lib/content/access.ts, lib/content/responses.ts,
 *               lib/auth/dal.ts
 * =============================================================
 */

import type { NextRequest } from "next/server";

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  parseChapterPosition,
  PREVIEW_VERSION_PARAM,
  rateLimitSubject,
} from "@/lib/content/access";
import { getChapterForRequest } from "@/lib/content/chapters";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";

/**
 * GET /api/livres/{id}/chapitres/{n}
 * @returns 200 { book_id, position, title, blocks, chapter_count, is_preview, truncated }
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/livres/[id]/chapitres/[n]">,
) {
  const { id, n } = await ctx.params;
  const position = parseChapterPosition(n);
  if (!isUuid(id) || position === null) return errorResponse(404);

  const preview = request.nextUrl.searchParams.get("version") === PREVIEW_VERSION_PARAM;
  const user = await getCurrentUser();
  const subject = rateLimitSubject(user?.id ?? null, request.headers);
  const result = await getChapterForRequest(id, position, user, subject, preview);

  if (result.status !== 200) return errorResponse(result.status);
  return Response.json(result.payload, { headers: PRIVATE_HEADERS });
}
