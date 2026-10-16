/**
 * =============================================================
 *  Fichier    : team-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur du travail en équipe (S9a) : inviter (courriel par Resend,
 *               sinon lien à transmettre), renvoyer ou annuler une invitation, répondre à
 *               une invitation, changer le rôle d'un membre, le retirer ou quitter l'étude,
 *               attribuer une étape et enregistrer son nom affiché. Les droits sont
 *               appliqués par les fonctions SQL ; ici, chaque argument est vérifié et
 *               chaque erreur traduite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/email/send.ts, lib/strategy/team.ts, lib/strategy/team-email.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { type CurrentUser, requireUser } from "@/lib/auth/dal";
import { sendEmail } from "@/lib/email/send";
import { isStepNo } from "@/lib/strategy/steps";
import {
  DISPLAY_NAME_MAX,
  type InviteRole,
  isInviteRole,
  normalizeEmail,
  teamError,
} from "@/lib/strategy/team";
import { buildInvitationEmail, invitationUrl, newInvitationToken } from "@/lib/strategy/team-email";
import { getMyDisplayName } from "@/lib/strategy/team-queries";
import { createClient } from "@/lib/supabase/server";

const s = getDictionary().strategy;
const tm = s.team;

/** Résultat d'une invitation : message, et lien à transmettre si le courriel n'est pas parti. */
export type InviteState = { error?: string; message?: string; link?: string } | undefined;

// ==================== FONCTIONS UTILITAIRES ====================

/** Texte d'un champ du formulaire (chaîne vide si absent). */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Chemin de la page Équipe, pour revenir après connexion. */
function teamPath(studyId: string): string {
  return `/strategie/etudes/${studyId}/equipe`;
}

/**
 * Envoie le courriel d'invitation ; à défaut, rend le lien à transmettre soi-même.
 * @param user    - Propriétaire connecté (son nom signe l'invitation)
 * @param studyId - Étude concernée
 * @param email   - Courriel invité
 * @param role    - Rôle proposé
 * @param token   - Jeton du lien
 * @param sentMessage - Message affiché si le courriel est parti
 */
async function deliverInvitation(
  user: CurrentUser,
  studyId: string,
  email: string,
  role: InviteRole,
  token: string,
  sentMessage: string,
): Promise<InviteState> {
  const supabase = await createClient();
  const [study, displayName] = await Promise.all([
    supabase
      .from("studies")
      .select("company_name")
      .eq("id", studyId)
      .maybeSingle<{ company_name: string }>(),
    getMyDisplayName(user.id),
  ]);
  const url = invitationUrl(token);
  const result = await sendEmail(
    buildInvitationEmail({
      to: email,
      inviterName: displayName ?? user.email ?? "",
      companyName: study.data?.company_name ?? "",
      role,
      url,
    }),
  );
  return result === "sent" ? { message: sentMessage } : { message: tm.invite.notSent, link: url };
}

// ==================== INVITATIONS (PROPRIÉTAIRE) ====================

/** Invite un courriel avec un rôle (identifiant de l'étude lié par .bind). */
export async function inviteMember(
  studyId: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await requireUser(teamPath(studyId));
  if (!isUuid(studyId)) return { error: s.errors.generic };
  const email = normalizeEmail(field(formData, "email"));
  if (!email) return { error: tm.errors.invalid_email };
  const role = field(formData, "role");
  if (!isInviteRole(role)) return { error: tm.errors.invalid_role };

  const token = newInvitationToken();
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_invite_member", {
    p_study_id: studyId,
    p_email: email,
    p_role: role,
    p_token: token,
  });
  if (error) return { error: teamError(error) };

  const state = await deliverInvitation(
    user, studyId, email, role, token, interpolate(tm.invite.sent, { email }),
  );
  refresh();
  return state;
}

/** Renvoie une invitation : nouveau lien valable 14 jours, l'ancien ne fonctionne plus. */
export async function renewInvitation(
  studyId: string,
  invitationId: string,
): Promise<InviteState> {
  const user = await requireUser(teamPath(studyId));
  if (!isUuid(studyId) || !isUuid(invitationId)) return { error: s.errors.generic };

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("study_invitations")
    .select("email, role")
    .eq("id", invitationId)
    .eq("study_id", studyId)
    .maybeSingle<{ email: string; role: string }>();
  if (!invitation || !isInviteRole(invitation.role)) return { error: s.errors.not_owner };

  const token = newInvitationToken();
  const { error } = await supabase.rpc("strategy_renew_invitation", {
    p_invitation_id: invitationId,
    p_token: token,
  });
  if (error) return { error: teamError(error) };

  const state = await deliverInvitation(
    user, studyId, invitation.email, invitation.role, token,
    interpolate(tm.pending.renewed, { email: invitation.email }),
  );
  refresh();
  return state;
}

/** Annule une invitation en attente. */
export async function revokeInvitation(
  studyId: string,
  invitationId: string,
): Promise<FormState> {
  await requireUser(teamPath(studyId));
  if (!isUuid(studyId) || !isUuid(invitationId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_revoke_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) return { error: teamError(error) };
  refresh();
  return { message: tm.pending.revoked };
}

// ==================== INVITATIONS (INVITÉ) ====================

/**
 * Accepte (ouvre alors l'étude) ou refuse une invitation adressée à l'utilisateur connecté.
 * @param invitationId - Invitation concernée
 * @param accept       - Vrai pour accepter
 */
export async function respondInvitation(
  invitationId: string,
  accept: boolean,
): Promise<FormState> {
  await requireUser("/strategie");
  if (!isUuid(invitationId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_respond_invitation", {
    p_invitation_id: invitationId,
    p_accept: accept,
  });
  if (error || typeof data !== "string") return { error: teamError(error ?? {}) };
  if (accept) redirect(`/strategie/etudes/${data}`);
  refresh();
  return { message: tm.invitation.declined };
}

// ==================== MEMBRES ====================

/** Donne le rôle Contributeur ou Observateur à un membre (propriétaire). */
export async function setMemberRole(
  studyId: string,
  userId: string,
  role: string,
): Promise<FormState> {
  await requireUser(teamPath(studyId));
  if (!isUuid(studyId) || !isUuid(userId)) return { error: s.errors.generic };
  if (!isInviteRole(role)) return { error: tm.errors.invalid_role };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_set_member_role", {
    p_study_id: studyId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) return { error: teamError(error) };
  refresh();
  return { message: tm.members.roleChanged };
}

/** Retire un membre (propriétaire) ou quitte l'étude (soi-même : retour à « Mes études »). */
export async function removeMember(studyId: string, userId: string): Promise<FormState> {
  const user = await requireUser(teamPath(studyId));
  if (!isUuid(studyId) || !isUuid(userId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_remove_member", {
    p_study_id: studyId,
    p_user_id: userId,
  });
  if (error) return { error: teamError(error) };
  if (userId === user.id) redirect("/strategie");
  refresh();
  return { message: tm.members.removed };
}

// ==================== ATTRIBUTION ET NOM ====================

/**
 * Attribue une étape à un membre, ou retire l'attribution (userId vide).
 * @param studyId - Étude concernée
 * @param stepNo  - Étape (1 à 9)
 * @param userId  - Membre responsable, ou chaîne vide
 */
export async function assignStep(
  studyId: string,
  stepNo: number,
  userId: string,
): Promise<FormState> {
  await requireUser(teamPath(studyId));
  if (!isUuid(studyId) || !isStepNo(stepNo) || (userId !== "" && !isUuid(userId))) {
    return { error: s.errors.generic };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_assign_step", {
    p_study_id: studyId,
    p_step_no: stepNo,
    p_user_id: userId || null,
  });
  if (error) return { error: teamError(error) };
  refresh();
  return { message: tm.assign.saved };
}

/** Enregistre le nom affiché de l'utilisateur (identifiant de l'étude lié par .bind). */
export async function saveDisplayName(
  studyId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(teamPath(studyId));
  const name = field(formData, "display_name");
  if (name.length > DISPLAY_NAME_MAX) return { error: tm.errors.invalid_name };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name || null })
    .eq("id", user.id);
  if (error) return { error: s.errors.generic };
  refresh();
  return { message: tm.name.saved };
}
