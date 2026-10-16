/**
 * =============================================================
 *  Fichier    : class-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur du mode enseignant (S10a) : créer une classe, modifier sa
 *               description, ses réglages du coach et son statut, créer ou désactiver le
 *               lien de classe, inviter des étudiants par courriel (sinon liens à
 *               transmettre), renvoyer ou annuler une invitation, retirer un étudiant,
 *               distribuer une étude, rejoindre ou quitter une classe. Les droits sont
 *               appliqués par les fonctions SQL ; ici, chaque argument est vérifié et chaque
 *               erreur traduite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/email/send.ts, lib/strategy/classes.ts, lib/strategy/class-email.ts,
 *               lib/strategy/class-queries.ts
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
import {
  type ClassRow,
  classCoachSchema,
  classError,
  classInfoSchema,
  distributionSchema,
  firstIssue,
  parseGroups,
} from "@/lib/strategy/classes";
import {
  buildClassInvitationEmail,
  classJoinUrl,
  newInvitationToken,
} from "@/lib/strategy/class-email";
import { getClass } from "@/lib/strategy/class-queries";
import { normalizeEmail } from "@/lib/strategy/team";
import { getMyDisplayName } from "@/lib/strategy/team-queries";
import { createClient } from "@/lib/supabase/server";

const s = getDictionary().strategy;
const cl = s.classes;

/** Nombre maximal de courriels par envoi d'invitations. */
const EMAILS_PER_SEND = 30;

/** Lien à transmettre soi-même quand le courriel n'est pas parti. */
export type ManualLink = { email: string; url: string };

/** Résultat d'une invitation : message, refus et liens à transmettre. */
export type ClassInviteState =
  | { error?: string; message?: string; failed?: string; links?: ManualLink[] }
  | undefined;

/** Résultat du lien de classe : le nouveau lien n'est rendu qu'une fois. */
export type ClassLinkState = { error?: string; message?: string; link?: string } | undefined;

// ==================== FONCTIONS UTILITAIRES ====================

/** Texte d'un champ du formulaire (chaîne vide si absent). */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Chemin de la page d'une classe, pour revenir après connexion. */
function classPath(classId: string): string {
  return `/strategie/classes/${classId}`;
}

/**
 * Enregistre une classe en entier (la fonction SQL remplace chaque champ) : on part de
 * la classe actuelle et on applique les changements.
 * @param classId - Classe de l'enseignant connecté
 * @param patch   - Champs modifiés
 */
async function saveClass(
  classId: string,
  patch: Partial<Pick<ClassRow,
    "name" | "institution" | "term" | "due_date" | "coach_disabled_steps" |
    "study_budget_usd" | "status">>,
): Promise<string | null> {
  const current = await getClass(classId);
  if (!current) return cl.errors.not_teacher;
  const next = { ...current, ...patch };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_update_class", {
    p_class_id: classId,
    p_name: next.name,
    p_institution: next.institution,
    p_term: next.term,
    p_due_date: next.due_date,
    p_coach_disabled_steps: next.coach_disabled_steps,
    p_study_budget: next.study_budget_usd,
    p_status: next.status,
  });
  return error ? classError(error) : null;
}

/**
 * Envoie le courriel d'invitation ; rend le lien si le courriel n'est pas parti.
 * @param input - Destinataire, enseignant, classe et jeton
 */
async function deliver(input: {
  email: string;
  teacherName: string;
  className: string;
  token: string;
}): Promise<ManualLink | null> {
  const url = classJoinUrl(input.token);
  const result = await sendEmail(buildClassInvitationEmail({
    to: input.email,
    teacherName: input.teacherName,
    className: input.className,
    url,
  }));
  return result === "sent" ? null : { email: input.email, url };
}

/**
 * Nom qui signe les invitations : nom affiché, sinon courriel.
 * @param user - Enseignant connecté
 */
async function teacherName(user: CurrentUser): Promise<string> {
  return (await getMyDisplayName(user.id)) ?? user.email ?? "";
}

/**
 * Courriels d'un envoi : séparés par des retours à la ligne, virgules ou points-virgules,
 * normalisés et sans doublon. Les adresses invalides sont rendues à part.
 * @param raw - Texte saisi
 */
function splitEmails(raw: string): { valid: string[]; invalid: string[] } {
  const valid = new Set<string>();
  const invalid: string[] = [];
  for (const part of raw.split(/[\s,;]+/).filter(Boolean)) {
    const email = normalizeEmail(part);
    if (email) valid.add(email);
    else invalid.push(part);
  }
  return { valid: [...valid], invalid };
}

// ==================== CLASSE (ENSEIGNANT) ====================

/** Crée une classe puis ouvre sa page. */
export async function createClass(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/strategie/classes");
  const parsed = classInfoSchema.safeParse({
    name: field(formData, "name"),
    institution: field(formData, "institution"),
    term: field(formData, "term"),
    dueDate: field(formData, "due_date"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_create_class", {
    p_name: parsed.data.name,
    p_institution: parsed.data.institution,
    p_term: parsed.data.term,
    p_due_date: parsed.data.dueDate,
  });
  if (error || typeof data !== "string") return { error: classError(error ?? {}) };
  redirect(classPath(data));
}

/** Modifie la description de la classe (identifiant lié par .bind). */
export async function updateClassInfo(
  classId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId)) return { error: s.errors.generic };
  const parsed = classInfoSchema.safeParse({
    name: field(formData, "name"),
    institution: field(formData, "institution"),
    term: field(formData, "term"),
    dueDate: field(formData, "due_date"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const error = await saveClass(classId, {
    name: parsed.data.name,
    institution: parsed.data.institution,
    term: parsed.data.term,
    due_date: parsed.data.dueDate,
  });
  if (error) return { error };
  refresh();
  return { message: cl.settings.saved };
}

/** Modifie les réglages du coach : étapes coupées et plafond par étude. */
export async function updateClassCoach(
  classId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId)) return { error: s.errors.generic };
  const parsed = classCoachSchema.safeParse({
    coachDisabledSteps: formData.getAll("coach_steps").map(String),
    studyBudget: field(formData, "study_budget"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const error = await saveClass(classId, {
    coach_disabled_steps: parsed.data.coachDisabledSteps,
    study_budget_usd: parsed.data.studyBudget,
  });
  if (error) return { error };
  refresh();
  return { message: cl.settings.saved };
}

/** Archive la classe ou la réactive. Aucune étude n'est supprimée. */
export async function setClassArchived(classId: string, archived: boolean): Promise<FormState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId)) return { error: s.errors.generic };
  const error = await saveClass(classId, { status: archived ? "archived" : "active" });
  if (error) return { error };
  refresh();
  return { message: archived ? cl.settings.archivedDone : cl.settings.unarchivedDone };
}

// ==================== INSCRIPTIONS (ENSEIGNANT) ====================

/**
 * Crée ou régénère le lien de classe (rendu une seule fois), ou le désactive.
 * @param classId - Classe de l'enseignant connecté
 * @param enabled - Vrai pour un nouveau lien, faux pour désactiver
 */
export async function setClassLink(classId: string, enabled: boolean): Promise<ClassLinkState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId)) return { error: s.errors.generic };
  const token = enabled ? newInvitationToken() : null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_set_class_link", {
    p_class_id: classId,
    p_token: token,
  });
  if (error) return { error: classError(error) };
  refresh();
  return token ? { link: classJoinUrl(token) } : { message: cl.link.disabled };
}

/** Invite jusqu'à 30 courriels (identifiant de la classe lié par .bind). */
export async function inviteStudents(
  classId: string,
  _prev: ClassInviteState,
  formData: FormData,
): Promise<ClassInviteState> {
  const user = await requireUser(classPath(classId));
  if (!isUuid(classId)) return { error: s.errors.generic };
  const { valid, invalid } = splitEmails(field(formData, "emails"));
  if (valid.length === 0 && invalid.length === 0) return { error: cl.invite.empty };
  if (valid.length + invalid.length > EMAILS_PER_SEND) return { error: cl.invite.tooMany };

  const current = await getClass(classId);
  if (!current) return { error: cl.errors.not_teacher };
  const name = await teacherName(user);
  const supabase = await createClient();
  const failed = invalid.map((part) => `${part} (${s.team.errors.invalid_email})`);
  const links: ManualLink[] = [];
  let sent = 0;

  for (const email of valid) {
    const token = newInvitationToken();
    const { error } = await supabase.rpc("strategy_invite_student", {
      p_class_id: classId,
      p_email: email,
      p_token: token,
    });
    if (error) {
      failed.push(`${email} (${classError(error)})`);
      continue;
    }
    const link = await deliver({ email, teacherName: name, className: current.name, token });
    if (link) links.push(link);
    else sent += 1;
  }

  refresh();
  return {
    message: sent > 0 ? interpolate(cl.invite.sent, { count: String(sent) }) : undefined,
    failed: failed.length > 0 ? interpolate(cl.invite.failed, { list: failed.join(", ") })
      : undefined,
    links: links.length > 0 ? links : undefined,
  };
}

/** Renvoie une invitation : nouveau lien valable 14 jours, l'ancien ne fonctionne plus. */
export async function renewClassInvitation(
  classId: string,
  invitationId: string,
): Promise<ClassInviteState> {
  const user = await requireUser(classPath(classId));
  if (!isUuid(classId) || !isUuid(invitationId)) return { error: s.errors.generic };

  const supabase = await createClient();
  const [current, invitation] = await Promise.all([
    getClass(classId),
    supabase
      .from("class_invitations")
      .select("email")
      .eq("id", invitationId)
      .eq("class_id", classId)
      .maybeSingle<{ email: string }>(),
  ]);
  if (!current || !invitation.data) return { error: cl.errors.not_teacher };

  const token = newInvitationToken();
  const { error } = await supabase.rpc("strategy_renew_class_invitation", {
    p_invitation_id: invitationId,
    p_token: token,
  });
  if (error) return { error: classError(error) };

  const email = invitation.data.email;
  const link = await deliver({
    email, teacherName: await teacherName(user), className: current.name, token,
  });
  refresh();
  return link
    ? { links: [link] }
    : { message: interpolate(cl.pending.renewed, { email }) };
}

/** Annule une invitation en attente. */
export async function revokeClassInvitation(
  classId: string,
  invitationId: string,
): Promise<FormState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId) || !isUuid(invitationId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_revoke_class_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) return { error: classError(error) };
  refresh();
  return { message: cl.pending.revoked };
}

/** Retire un étudiant de la classe ; ses études restent en place. */
export async function removeStudent(classId: string, userId: string): Promise<FormState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId) || !isUuid(userId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_remove_student", {
    p_class_id: classId,
    p_user_id: userId,
  });
  if (error) return { error: classError(error) };
  refresh();
  return { message: cl.students.removed };
}

// ==================== DISTRIBUTION (ENSEIGNANT) ====================

/**
 * Distribue une étude à chaque groupe (identifiant de la classe lié par .bind). Les
 * groupes arrivent en JSON dans le champ « groups » ; tout ou rien.
 */
export async function distributeStudies(
  classId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(classPath(classId));
  if (!isUuid(classId)) return { error: s.errors.generic };
  const parsed = distributionSchema.safeParse({
    companyName: field(formData, "company_name"),
    question: field(formData, "question"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  let raw: unknown;
  try {
    raw = JSON.parse(field(formData, "groups") || "null");
  } catch {
    raw = null;
  }
  const groups = parseGroups(raw);
  if (!groups) return { error: cl.errors.invalid_groups };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_distribute_studies", {
    p_class_id: classId,
    p_company_name: parsed.data.companyName,
    p_strategic_question: parsed.data.question,
    p_groups: groups,
  });
  if (error) return { error: classError(error) };
  refresh();
  const count = Array.isArray(data) ? data.length : groups.length;
  return { message: interpolate(cl.distribute.done, { count: String(count) }) };
}

// ==================== ÉTUDIANT ====================

/**
 * Rejoint la classe désignée par le lien, puis revient à l'accueil de Stratégie.
 * @param token - Jeton du lien de classe ou de l'invitation
 */
export async function joinClass(token: string): Promise<FormState> {
  await requireUser(`/strategie/classe/${encodeURIComponent(token)}`);
  if (!token || token.length > 200) return { error: cl.errors.link_not_found };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_join_class", { p_token: token });
  if (error) return { error: classError(error) };
  redirect("/strategie");
}

/** Quitte une classe ; les études déjà distribuées restent accessibles. */
export async function leaveClass(classId: string): Promise<FormState> {
  const user = await requireUser("/strategie");
  if (!isUuid(classId)) return { error: s.errors.generic };
  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_remove_student", {
    p_class_id: classId,
    p_user_id: user.id,
  });
  if (error) return { error: classError(error) };
  refresh();
  return { message: cl.student.left };
}
