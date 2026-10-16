/**
 * =============================================================
 *  Fichier    : team-queries.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lectures du travail en équipe (S9a) avec la session de l'utilisateur :
 *               membres d'une étude (nom et courriel), invitations en attente (propriétaire),
 *               invitation désignée par un lien, invitations reçues, journal d'activité et
 *               nom affiché de l'utilisateur. Les droits sont vérifiés par la RLS et par les
 *               fonctions SQL.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/supabase/server.ts, lib/strategy/team.ts
 * =============================================================
 */

import "server-only";

import { isUuid } from "@/lib/admin/validation";
import type { StudyRole } from "@/lib/strategy/steps";
import { type ActivityEntry, type InviteRole, isActivityAction } from "@/lib/strategy/team";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type StudyMember = {
  user_id: string;
  role: StudyRole;
  display_name: string | null;
  email: string;
  joined_at: string;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: InviteRole;
  last_sent_at: string;
  expires_at: string;
  expired: boolean;
};

export type InvitationPreview = {
  invitation_id: string;
  study_id: string;
  company_name: string;
  inviter_name: string | null;
  role: InviteRole;
  email: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expired: boolean;
  email_matches: boolean;
  already_member: boolean;
};

export type ReceivedInvitation = {
  invitation_id: string;
  study_id: string;
  company_name: string;
  inviter_name: string | null;
  role: InviteRole;
  expires_at: string;
};

/** Nombre d'entrées du journal par page. */
export const ACTIVITY_PAGE = 50;

// ==================== FONCTIONS UTILITAIRES ====================

/** Lève une erreur explicite si une requête échoue (jamais d'échec silencieux). */
function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

// ==================== MEMBRES ET INVITATIONS ====================

/**
 * Membres d'une étude : propriétaire, contributeurs puis observateurs.
 * À n'appeler qu'après getStudy (la fonction SQL refuse les non-membres).
 * @param studyId - Identifiant de l'étude
 */
export async function getStudyMembers(studyId: string): Promise<StudyMember[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_study_members", { p_study_id: studyId });
  return (check(result, "membres de l'étude") ?? []) as StudyMember[];
}

/**
 * Invitations en attente d'une étude, échues comprises (à renvoyer ou annuler).
 * Réservé au propriétaire : la RLS renvoie une liste vide aux autres membres.
 * @param studyId - Identifiant de l'étude
 */
export async function getPendingInvitations(studyId: string): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("study_invitations")
    .select("id, email, role, last_sent_at, expires_at")
    .eq("study_id", studyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const rows = (check(result, "invitations") ?? []) as Omit<PendingInvitation, "expired">[];
  const now = Date.now();
  return rows.map((row) => ({ ...row, expired: Date.parse(row.expires_at) <= now }));
}

/**
 * Invitation désignée par le lien reçu ; null si le lien est inconnu.
 * @param token - Jeton tiré de l'adresse
 */
export async function getInvitationByToken(token: string): Promise<InvitationPreview | null> {
  if (!token || token.length > 200) return null;
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_invitation_by_token", { p_token: token });
  const rows = (check(result, "invitation") ?? []) as InvitationPreview[];
  return rows[0] ?? null;
}

/** Invitations en attente adressées au courriel confirmé de l'utilisateur connecté. */
export async function getMyInvitations(): Promise<ReceivedInvitation[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_my_invitations");
  return (check(result, "invitations reçues") ?? []) as ReceivedInvitation[];
}

// ==================== JOURNAL ET PROFIL ====================

/**
 * Une page du journal d'activité, de la plus récente à la plus ancienne.
 * @param studyId - Identifiant de l'étude
 * @param before  - Identifiant de la dernière entrée déjà affichée (null = début)
 */
export async function getStudyActivity(
  studyId: string,
  before: number | null,
): Promise<ActivityEntry[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_study_activity", {
    p_study_id: studyId,
    p_before: before,
    p_limit: ACTIVITY_PAGE,
  });
  const rows = (check(result, "journal") ?? []) as (Omit<ActivityEntry, "details"> & {
    details: unknown;
  })[];
  return rows
    .filter((row) => isActivityAction(row.action))
    .map((row) => ({
      ...row,
      details:
        row.details && typeof row.details === "object" && !Array.isArray(row.details)
          ? (row.details as Record<string, unknown>)
          : {},
    }));
}

/**
 * Nom affiché de l'utilisateur connecté (null s'il ne l'a pas renseigné).
 * @param userId - Utilisateur connecté
 */
export async function getMyDisplayName(userId: string): Promise<string | null> {
  if (!isUuid(userId)) return null;
  const supabase = await createClient();
  const result = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle<{ display_name: string | null }>();
  return check(result, "profil")?.display_name?.trim() || null;
}
