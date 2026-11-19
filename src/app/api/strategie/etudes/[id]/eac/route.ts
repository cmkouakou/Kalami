/**
 * =============================================================
 *  Fichier    : route.ts (api/strategie/etudes/[id]/eac)
 *  Projet     : Kalami Stratégie
 *  Description: Envoi du plan stratégique d'une étude liée à Entrepreneur au Combat
 *               (v0.26.1) : le plan est produit en PDF et en DOCX avec la session du membre
 *               (propriétaire ou contributeur), puis transmis au dossier EAC, où le mentor
 *               le publie à l'entrepreneur. Route plutôt qu'action serveur pour laisser à
 *               Chromium le temps de produire le PDF.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: lib/strategy/eac*.ts, lib/strategy/plan-export-files.ts,
 *               lib/strategy/queries.ts, lib/strategy/team*.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, isSameOrigin, PRIVATE_HEADERS } from "@/lib/content/responses";
import { allowAttempt, userSubject } from "@/lib/security/rate-limit";
import { eacReturnSettings } from "@/lib/strategy/eac";
import { getEacLink } from "@/lib/strategy/eac-queries";
import { sendPlanToEac } from "@/lib/strategy/eac-return";
import { renderPlanFile } from "@/lib/strategy/plan-export-files";
import { getStudy } from "@/lib/strategy/queries";
import { memberLabel } from "@/lib/strategy/team";
import { getStudyMembers } from "@/lib/strategy/team-queries";
import { createAdminClient } from "@/lib/supabase/admin";

/** Durée maximale : deux rendus du plan (Chromium) et l'envoi à EAC. */
export const maxDuration = 60;

/** Réponse d'échec avec un message destiné à l'équipe. */
function failure(status: 409 | 502 | 503, message: string): Response {
  return Response.json({ error: "eac_failed", message }, { status, headers: PRIVATE_HEADERS });
}

/**
 * POST /api/strategie/etudes/{id}/eac
 * @returns 200 { version, sentAt } ; 401 non connecté ; 403 autre site ou simple observateur ;
 *          404 étude inaccessible ou non liée à EAC ; 409 plan jamais généré ; 429 trop
 *          d'envois ; 502 refus ou panne d'EAC ; 503 liaison non configurée
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/strategie/etudes/[id]/eac">,
) {
  if (!isSameOrigin(request)) return errorResponse(403);
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(404);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);
  const study = await getStudy(id, user.id);
  if (!study) return errorResponse(404);
  if (study.role !== "owner" && study.role !== "contributor") return errorResponse(403);
  const link = await getEacLink(study.id);
  if (!link) return errorResponse(404);
  const settings = eacReturnSettings();
  if (!settings) {
    return failure(503, "La liaison avec Entrepreneur au Combat n'est pas configurée.");
  }
  // Chromium est coûteux : même débit que l'export du plan
  if (!(await allowAttempt("plan_export_user", userSubject(user.id)))) return errorResponse(429);

  const [pdf, docx, members] = await Promise.all([
    renderPlanFile(study.id, "pdf"),
    renderPlanFile(study.id, "docx"),
    getStudyMembers(study.id),
  ]);
  if (!pdf) return failure(409, "Le plan stratégique n'a pas encore été généré.");
  const self = members.find((member) => member.user_id === user.id);

  const result = await sendPlanToEac(settings, {
    dossierId: link.dossierId,
    studyId: study.id,
    title: `Plan stratégique — ${study.company_name}`,
    sentBy: self ? memberLabel(self) : "",
    pdf,
    docx,
  });
  if (!result.ok) return failure(502, result.message);

  // La table n'est modifiable que par le serveur (lecture seule pour les membres)
  const sentAt = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("study_external_links")
    .update({ sent_back_at: sentAt })
    .eq("study_id", study.id);
  if (error) console.error("[eac] date d'envoi non enregistrée :", error.message);

  return Response.json({ version: result.version, sentAt }, { headers: PRIVATE_HEADERS });
}
