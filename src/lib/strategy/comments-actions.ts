/**
 * =============================================================
 *  Fichier    : comments-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur de la discussion d'équipe (S9b) : publier un commentaire
 *               ou une réponse (mentions repérées ici, courriel aux personnes mentionnées
 *               après la réponse), le modifier, le supprimer, résoudre ou rouvrir un fil ;
 *               ouvrir une notification, tout marquer comme lu, enregistrer la préférence
 *               de courriel. Les droits sont appliqués par les fonctions SQL ; ici, chaque
 *               argument est vérifié et chaque erreur traduite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/comments.ts, comments-email.ts, lib/email/send.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import {
  COMMENT_MAX,
  commentError,
  commentTargets,
  extractMentions,
} from "@/lib/strategy/comments";
import { buildMentionEmail, commentPath, commentUrl } from "@/lib/strategy/comments-email";
import { getStepContent } from "@/lib/strategy/queries";
import { isStepNo, type StepNo } from "@/lib/strategy/steps";
import { memberLabel } from "@/lib/strategy/team";
import { getStudyMembers, type StudyMember } from "@/lib/strategy/team-queries";
import { createClient } from "@/lib/supabase/server";

const s = getDictionary().strategy;
const cm = s.comments;

/** Résultat d'une publication : identifiant du commentaire créé, ou erreur. */
export type CommentState = { error?: string; id?: string };

// ==================== FONCTIONS UTILITAIRES ====================

/** Chemin de la page d'une étape, pour revenir après connexion. */
function stepPath(studyId: string, stepNo: number): string {
  return `/strategie/etudes/${studyId}/etapes/${stepNo}`;
}

/** Texte d'un commentaire, ou null s'il est vide ou trop long. */
function cleanBody(raw: string): string | null {
  const body = raw.trim();
  return body && body.length <= COMMENT_MAX ? body : null;
}

/**
 * Libellé de l'élément visé, relu dans le contenu enregistré de l'étape ; null si
 * l'élément n'existe pas (supprimé, ou pas encore enregistré).
 */
async function targetLabel(
  studyId: string,
  stepNo: StepNo,
  targetId: string,
): Promise<string | null> {
  const { payload } = await getStepContent(studyId, stepNo);
  return commentTargets(stepNo, payload).find((t) => t.id === targetId)?.label ?? null;
}

/**
 * Prépare l'envoi des courriels de mention, après la réponse au navigateur.
 * @param emails  - Courriels des personnes mentionnées qui acceptent les envois
 * @param members - Membres de l'étude (nom de l'auteur)
 * @param context - Auteur, étude, étape, commentaire et texte
 */
async function scheduleMentionEmails(
  emails: string[],
  members: StudyMember[],
  context: { userId: string; studyId: string; stepNo: StepNo; commentId: string; body: string },
): Promise<void> {
  if (emails.length === 0 || !isEmailConfigured()) return;
  const supabase = await createClient();
  const { data: study } = await supabase
    .from("studies")
    .select("company_name")
    .eq("id", context.studyId)
    .maybeSingle<{ company_name: string }>();
  const author = members.find((m) => m.user_id === context.userId);
  const actorName = author ? memberLabel(author) : cm.someone;
  const url = commentUrl(context.studyId, context.stepNo, context.commentId);

  after(async () => {
    // Un échec d'envoi n'annule pas le commentaire : la notification reste dans la cloche
    await Promise.all(emails.map((to) => sendEmail(buildMentionEmail({
      to,
      actorName,
      companyName: study?.company_name ?? "",
      stepNo: context.stepNo,
      body: context.body,
      url,
    }))));
  });
}

// ==================== COMMENTAIRES ====================

/**
 * Publie un commentaire sur une étape (ou un élément de l'étape), ou une réponse à un fil.
 * @param studyId  - Étude
 * @param stepNo   - Étape (1 à 9)
 * @param parentId - Premier commentaire du fil auquel on répond, ou chaîne vide
 * @param targetId - Élément visé (nouveau fil seulement), ou chaîne vide
 * @param rawBody  - Texte saisi
 */
export async function addComment(
  studyId: string,
  stepNo: number,
  parentId: string,
  targetId: string,
  rawBody: string,
): Promise<CommentState> {
  const user = await requireUser(stepPath(studyId, stepNo));
  if (!isUuid(studyId) || !isStepNo(stepNo) || (parentId !== "" && !isUuid(parentId))) {
    return { error: s.errors.generic };
  }
  const body = cleanBody(rawBody);
  if (!body) return { error: cm.errors.invalid_comment };

  let label: string | null = null;
  if (!parentId && targetId) {
    label = await targetLabel(studyId, stepNo, targetId);
    if (!label) return { error: cm.errors.invalid_target };
  }

  let members: StudyMember[];
  try {
    members = await getStudyMembers(studyId);
  } catch {
    return { error: s.errors.forbidden };
  }
  const mentions = extractMentions(
    body,
    members.map((m) => ({ id: m.user_id, label: memberLabel(m) })),
  );

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_add_comment", {
    p_study_id: studyId,
    p_step_no: stepNo,
    p_body: body,
    p_parent_id: parentId || null,
    p_target_id: parentId ? null : targetId || null,
    p_target_label: label,
    p_mentions: mentions,
  });
  if (error) return { error: commentError(error) };

  const result = (data ?? {}) as { id?: unknown; emails?: unknown };
  const id = typeof result.id === "string" ? result.id : "";
  const emails = Array.isArray(result.emails)
    ? result.emails.filter((e): e is string => typeof e === "string")
    : [];
  if (id) {
    await scheduleMentionEmails(emails, members, {
      userId: user.id, studyId, stepNo, commentId: id, body,
    });
  }
  refresh();
  return { id };
}

/** Modifie le texte de son propre commentaire. */
export async function editComment(
  studyId: string,
  stepNo: number,
  commentId: string,
  rawBody: string,
): Promise<FormState> {
  await requireUser(stepPath(studyId, stepNo));
  if (!isUuid(commentId)) return { error: s.errors.generic };
  const body = cleanBody(rawBody);
  if (!body) return { error: cm.errors.invalid_comment };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_edit_comment", {
    p_comment_id: commentId,
    p_body: body,
  });
  if (error) return { error: commentError(error) };
  refresh();
  return undefined;
}

/** Supprime un commentaire (son auteur ou le propriétaire de l'étude). */
export async function deleteComment(
  studyId: string,
  stepNo: number,
  commentId: string,
): Promise<FormState> {
  await requireUser(stepPath(studyId, stepNo));
  if (!isUuid(commentId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_delete_comment", { p_comment_id: commentId });
  if (error) return { error: commentError(error) };
  refresh();
  return undefined;
}

/** Marque un fil résolu, ou le rouvre. */
export async function resolveThread(
  studyId: string,
  stepNo: number,
  commentId: string,
  resolved: boolean,
): Promise<FormState> {
  await requireUser(stepPath(studyId, stepNo));
  if (!isUuid(commentId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_resolve_thread", {
    p_comment_id: commentId,
    p_resolved: resolved,
  });
  if (error) return { error: commentError(error) };
  refresh();
  return undefined;
}

// ==================== NOTIFICATIONS ====================

/**
 * Marque une notification comme lue puis ouvre le commentaire qu'elle signale. Le lien est
 * construit ici à partir d'identifiants vérifiés (jamais d'adresse reçue du navigateur).
 */
export async function openNotification(
  notificationId: number,
  studyId: string,
  stepNo: number,
  commentId: string,
): Promise<void> {
  await requireUser("/strategie/notifications");
  if (!Number.isSafeInteger(notificationId) || !isUuid(studyId) || !isStepNo(stepNo)
    || !isUuid(commentId)) {
    redirect("/strategie/notifications");
  }
  const supabase = await createClient();
  await supabase.rpc("strategy_mark_notifications_read", { p_ids: [notificationId] });
  redirect(commentPath(studyId, stepNo, commentId));
}

/** Marque toutes les notifications comme lues. */
export async function markAllRead(): Promise<void> {
  await requireUser("/strategie/notifications");
  const supabase = await createClient();
  await supabase.rpc("strategy_mark_notifications_read", { p_ids: null });
  refresh();
}

/** Enregistre la préférence « recevoir un courriel quand on me mentionne ». */
export async function saveNotifyEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/strategie/notifications");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ notify_email: formData.get("notify_email") === "on" })
    .eq("id", user.id);
  if (error) return { error: s.errors.generic };
  refresh();
  return { message: s.notifications.preference.saved };
}
