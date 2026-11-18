/**
 * =============================================================
 *  Fichier    : route.ts (api/eac/etudes)
 *  Projet     : Kalami Stratégie
 *  Description: API appelée par le serveur d'Entrepreneur au Combat (v0.26.0) : ouvre
 *               l'étude Kalami d'un dossier (ou la retrouve), pré-remplie, sans crédit,
 *               possédée par le compte « Entrepreneur au Combat ». L'équipe du dossier est
 *               ajoutée ; les personnes sans compte reçoivent l'invitation habituelle.
 *               Protégée par la clé partagée EAC_API_SECRET (en-tête Bearer).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-17
 *  Dépendances: lib/strategy/eac.ts, lib/strategy/team-email.ts, lib/supabase/admin.ts
 * =============================================================
 */

import { APP_URL } from "@/lib/config";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { sendEmail } from "@/lib/email/send";
import { constantTimeEqual } from "@/lib/security/cron";
import { eacOpenStudySchema, eacSettings, profileFromEac } from "@/lib/strategy/eac";
import { buildInvitationEmail, invitationUrl, newInvitationToken } from "@/lib/strategy/team-email";
import { createAdminClient } from "@/lib/supabase/admin";

/** Nom qui signe les invitations envoyées pour un dossier EAC. */
const INVITER_NAME = "Entrepreneur au Combat";

/** Réponse de la fonction SQL strategy_eac_open_study. */
type OpenResult = {
  study_id: string;
  created: boolean;
  added: string[];
  invited: { email: string; token: string }[];
};

/**
 * Envoie les invitations ; rend, pour chaque courriel non parti, le lien à transmettre.
 * @param invited     - Invitations créées (courriel et jeton)
 * @param companyName - Entreprise de l'étude
 */
async function deliverInvitations(
  invited: OpenResult["invited"],
  companyName: string,
): Promise<{ email: string; sent: boolean; link: string }[]> {
  return Promise.all(invited.map(async ({ email, token }) => {
    const url = invitationUrl(token);
    const result = await sendEmail(buildInvitationEmail({
      to: email, inviterName: INVITER_NAME, companyName, role: "contributor", url,
    }));
    return { email, sent: result === "sent", link: url };
  }));
}

/**
 * POST /api/eac/etudes — corps JSON décrit par eacOpenStudySchema
 * @returns 200 { studyId, created, url, added, invitations } ; 400 corps invalide ;
 *          401 clé absente ou fausse (ou liaison non configurée) ; 500 erreur de la base
 */
export async function POST(request: Request) {
  const settings = eacSettings();
  const auth = request.headers.get("authorization") ?? "";
  if (!settings || !constantTimeEqual(auth, `Bearer ${settings.secret}`)) {
    return errorResponse(401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400);
  }
  const parsed = eacOpenStudySchema.safeParse(body);
  if (!parsed.success) return errorResponse(400);
  const input = parsed.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("strategy_eac_open_study", {
    p_owner_id: settings.ownerId,
    p_external_id: input.dossierId,
    p_external_ref: input.dossierNumero,
    p_company_name: input.companyName,
    p_strategic_question: input.strategicQuestion,
    p_profile: profileFromEac(input.company),
    p_context: input.context,
    p_members: input.members.map(({ email }) => ({ email, token: newInvitationToken() })),
    p_coach_usd: settings.coachBudgetUsd,
  });
  if (error || !data) {
    console.error("[eac] ouverture d'étude refusée :", error?.message);
    return Response.json({ error: "Erreur de la base" }, { status: 500, headers: PRIVATE_HEADERS });
  }

  const result = data as OpenResult;
  const invitations = await deliverInvitations(result.invited, input.companyName);
  return Response.json({
    studyId: result.study_id,
    created: result.created,
    url: `${APP_URL}/strategie/etudes/${result.study_id}`,
    added: result.added,
    invitations,
  }, { headers: PRIVATE_HEADERS });
}
