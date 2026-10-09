/**
 * =============================================================
 *  Fichier    : route.ts (api/pdf/[id])
 *  Projet     : Kalami
 *  Description: Téléchargement d'un PDF filigrané : vérifie le propriétaire, l'expiration
 *               et le nombre de téléchargements restants, consomme un téléchargement, puis
 *               renvoie un lien Supabase signé valable 60 s (le fichier ne transite pas par
 *               Vercel, limité à 4,5 Mo par réponse). POST + contrôle d'origine : un lien
 *               piégé sur un autre site ne peut pas consommer de téléchargement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/pdf/exports.ts, lib/content/responses.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { consumePdfDownload, PDF_ERROR_STATUS } from "@/lib/pdf/exports";

/**
 * POST /api/pdf/{id}
 * @returns 200 { url } ; 401 non connecté ; 403 épuisé ou retiré ; 404 ; 410 expiré
 */
export async function POST(request: Request, ctx: RouteContext<"/api/pdf/[id]">) {
  if (!isSameOrigin(request)) return errorResponse(403);
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(404);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);

  const result = await consumePdfDownload(user.id, id);
  if (!result.ok) {
    return Response.json(
      { error: result.code },
      { status: PDF_ERROR_STATUS[result.code], headers: PRIVATE_HEADERS },
    );
  }
  return Response.json({ url: result.url }, { headers: PRIVATE_HEADERS });
}
