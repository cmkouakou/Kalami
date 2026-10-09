/**
 * =============================================================
 *  Fichier    : route.ts (api/livres/[id]/pdf)
 *  Projet     : Kalami
 *  Description: Préparation du PDF filigrané du lecteur connecté : renvoie le fichier
 *               encore valable, ou en génère un nouveau (Chromium, jusqu'à une minute).
 *               Route plutôt qu'action serveur pour fixer une durée d'exécution adaptée.
 *               Aucun téléchargement n'est consommé ici.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/pdf/exports.ts, lib/content/responses.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { PDF_ERROR_STATUS, preparePdfExport } from "@/lib/pdf/exports";

/** Durée maximale : lancement de Chromium et impression d'un livre entier. */
export const maxDuration = 60;

/**
 * POST /api/livres/{id}/pdf
 * @returns 200 { id, expiresAt, remaining } ; 401 non connecté ; 403 sans option ou
 *          téléchargements épuisés ; 404 livre indisponible
 */
export async function POST(request: Request, ctx: RouteContext<"/api/livres/[id]/pdf">) {
  if (!isSameOrigin(request)) return errorResponse(403);
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(404);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);

  const result = await preparePdfExport(user, id);
  if (!result.ok) {
    return Response.json(
      { error: result.code },
      { status: PDF_ERROR_STATUS[result.code], headers: PRIVATE_HEADERS },
    );
  }
  return Response.json(
    { id: result.export.id, expiresAt: result.export.expires_at, remaining: result.remaining },
    { headers: PRIVATE_HEADERS },
  );
}
