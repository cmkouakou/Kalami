/**
 * =============================================================
 *  Fichier    : route.ts (api/strategie/etudes/[id]/plan/[format])
 *  Projet     : Kalami Stratégie
 *  Description: Export du plan stratégique d'une étude en PDF ou en DOCX (S8b), pour tout
 *               membre de l'étude (observateurs compris). Le fichier est produit à la
 *               demande et renvoyé en pièce jointe, sans être stocké. Route plutôt qu'action
 *               serveur pour fixer une durée d'exécution adaptée à Chromium.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/strategy/plan-export-files.ts, lib/content/responses.ts,
 *               lib/security/rate-limit.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { allowAttempt, userSubject } from "@/lib/security/rate-limit";
import { EXPORT_FORMATS, type ExportFormat } from "@/lib/strategy/plan-export";
import { renderPlanFile } from "@/lib/strategy/plan-export-files";

/** Durée maximale : lancement de Chromium et impression du plan. */
export const maxDuration = 60;

/** Vrai si le segment d'URL désigne un format d'export connu. */
function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

/**
 * POST /api/strategie/etudes/{id}/plan/{pdf|docx}
 * @returns 200 fichier en pièce jointe ; 401 non connecté ; 403 autre site ; 404 étude
 *          inaccessible, format inconnu ou plan jamais généré ; 429 trop d'exports
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/strategie/etudes/[id]/plan/[format]">,
) {
  if (!isSameOrigin(request)) return errorResponse(403);
  const { id, format } = await ctx.params;
  if (!isUuid(id) || !isExportFormat(format)) return errorResponse(404);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);
  // Chromium est coûteux : débit limité par compte (v0.13.0)
  if (!(await allowAttempt("plan_export_user", userSubject(user.id)))) return errorResponse(429);

  const file = await renderPlanFile(id, format);
  if (!file) return errorResponse(404);

  return new Response(Buffer.from(file.bytes), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Content-Length": String(file.bytes.byteLength),
    },
  });
}
