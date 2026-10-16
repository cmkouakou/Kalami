/**
 * =============================================================
 *  Fichier    : comments-queries.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lectures de la discussion d'équipe (S9b) avec la session de l'utilisateur :
 *               commentaires d'une étape, notifications par pages, nombre de non-lues
 *               (cloche de l'en-tête) et préférence de courriel. Les droits sont vérifiés
 *               par les fonctions SQL.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/supabase/server.ts, lib/strategy/comments.ts
 * =============================================================
 */

import "server-only";

import { isUuid } from "@/lib/admin/validation";
import {
  isNotificationKind,
  type NotificationEntry,
  type StepComment,
} from "@/lib/strategy/comments";
import type { StepNo } from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

/** Nombre de notifications par page. */
export const NOTIFICATIONS_PAGE = 30;

// ==================== FONCTIONS UTILITAIRES ====================

/** Lève une erreur explicite si une requête échoue (jamais d'échec silencieux). */
function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

// ==================== COMMENTAIRES ====================

/**
 * Commentaires d'une étape, du plus ancien au plus récent.
 * À n'appeler qu'après getStudy (la fonction SQL refuse les non-membres).
 * @param studyId - Identifiant de l'étude
 * @param stepNo  - Étape
 */
export async function getStepComments(studyId: string, stepNo: StepNo): Promise<StepComment[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_step_comments", {
    p_study_id: studyId,
    p_step_no: stepNo,
  });
  const rows = (check(result, "commentaires") ?? []) as StepComment[];
  return rows.map((row) => ({ ...row, mentions: row.mentions ?? [] }));
}

// ==================== NOTIFICATIONS ====================

/**
 * Une page des notifications de l'utilisateur connecté, de la plus récente à la plus ancienne.
 * @param before - Identifiant de la dernière notification déjà affichée (null = début)
 */
export async function getNotifications(before: number | null): Promise<NotificationEntry[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_my_notifications", {
    p_before: before,
    p_limit: NOTIFICATIONS_PAGE,
  });
  const rows = (check(result, "notifications") ?? []) as NotificationEntry[];
  return rows.filter((row) => isNotificationKind(row.kind));
}

/**
 * Nombre de notifications non lues. Retourne 0 en cas d'erreur : la cloche ne doit pas
 * empêcher l'affichage de l'en-tête (migration absente, coupure passagère).
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_unread_notifications");
  return error || typeof data !== "number" ? 0 : data;
}

/**
 * Vrai si l'utilisateur accepte les courriels de mention (vrai par défaut).
 * @param userId - Utilisateur connecté
 */
export async function getNotifyEmail(userId: string): Promise<boolean> {
  if (!isUuid(userId)) return true;
  const supabase = await createClient();
  const result = await supabase
    .from("profiles")
    .select("notify_email")
    .eq("id", userId)
    .maybeSingle<{ notify_email: boolean }>();
  return check(result, "profil")?.notify_email ?? true;
}
