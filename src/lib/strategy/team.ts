/**
 * =============================================================
 *  Fichier    : team.ts
 *  Projet     : Kalami Stratégie
 *  Description: Règles du travail en équipe (S9a), sans accès à la base : rôles qu'une
 *               invitation peut donner, validation du courriel et du nom affiché, phrases
 *               du journal d'activité et traduction des erreurs des fonctions SQL d'équipe.
 *               Utilisable côté serveur comme côté navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: i18n, lib/strategy/steps.ts
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import { isStepNo, type StudyRole } from "@/lib/strategy/steps";

const s = getDictionary().strategy;
const tm = s.team;

// ==================== RÔLES ET CHAMPS ====================

/** Rôles qu'une invitation peut donner (le propriétaire est unique). */
export const INVITE_ROLES = ["contributor", "observer"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

/** Longueur maximale d'un courriel (RFC 5321) et du nom affiché (profil). */
export const EMAIL_MAX = 254;
export const DISPLAY_NAME_MAX = 120;

/** Durée de validité d'un lien d'invitation, en jours (même valeur qu'en SQL). */
export const INVITATION_DAYS = 14;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Vrai si la valeur est un rôle d'invitation. */
export function isInviteRole(value: unknown): value is InviteRole {
  return (INVITE_ROLES as readonly unknown[]).includes(value);
}

/**
 * Courriel normalisé (espaces retirés, minuscules), ou null s'il est invalide.
 * @param raw - Saisie brute
 */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return email.length <= EMAIL_MAX && EMAIL_PATTERN.test(email) ? email : null;
}

/** Nom affiché d'un membre : son nom s'il est renseigné, sinon son courriel. */
export function memberLabel(member: { display_name: string | null; email: string }): string {
  return member.display_name?.trim() || member.email;
}

/** Vrai si ce rôle peut être responsable d'une étape (il peut la remplir). */
export function canBeAssigned(role: StudyRole): boolean {
  return role === "owner" || role === "contributor";
}

// ==================== JOURNAL D'ACTIVITÉ ====================

export const ACTIVITY_ACTIONS = [
  "invitation_sent",
  "invitation_renewed",
  "invitation_revoked",
  "invitation_declined",
  "member_joined",
  "member_role_changed",
  "member_removed",
  "member_left",
  "step_assigned",
  "step_unassigned",
  "step_started",
  "step_validated",
  "step_reopened",
  "step_needs_review",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export type ActivityEntry = {
  id: number;
  action: ActivityAction;
  step_no: number | null;
  actor_name: string | null;
  target_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

/** Vrai si la valeur est une action connue du journal. */
export function isActivityAction(value: unknown): value is ActivityAction {
  return (ACTIVITY_ACTIONS as readonly unknown[]).includes(value);
}

/**
 * Phrase du journal pour une entrée (« Awa a validé l'étape 3 — Analyse interne. »).
 * Un auteur inconnu (compte supprimé, action du système) devient « Une personne ».
 * @param entry - Entrée lue par strategy_study_activity
 */
export function describeActivity(entry: ActivityEntry): string {
  const role = entry.details.role;
  const step = isStepNo(entry.step_no)
    ? `${entry.step_no} — ${s.steps[entry.step_no].title}`
    : "";
  return interpolate(tm.journal.actions[entry.action], {
    actor: entry.actor_name ?? tm.journal.someone,
    target: entry.target_name ?? tm.journal.someone,
    role: isInviteRole(role) ? s.studies.roles[role].toLowerCase() : "",
    step,
  });
}

// ==================== ERREURS ====================

type TeamErrorKey = keyof typeof tm.errors;
type StrategyErrorKey = keyof typeof s.errors;

/**
 * Traduit l'erreur levée par une fonction SQL d'équipe (« already_member »…).
 * @param error - Erreur PostgREST (code et message)
 */
export function teamError(error: { code?: string; message?: string }): string {
  const key = error.message ?? "";
  if (key in tm.errors) return tm.errors[key as TeamErrorKey];
  if (key in s.errors) return s.errors[key as StrategyErrorKey];
  if (error.code === "42501") return s.errors.forbidden;
  return s.errors.generic;
}
