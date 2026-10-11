/**
 * =============================================================
 *  Fichier    : queries.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lectures de l'assistant stratégie avec la session de l'utilisateur : la RLS
 *               ne laisse voir que les études dont il est membre. Études, crédits, étude
 *               complète (rôle, profil, étapes) et vue d'ensemble de l'administrateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/supabase/server.ts, lib/strategy/steps.ts, lib/strategy/profile.ts
 * =============================================================
 */

import "server-only";

import { isUuid } from "@/lib/admin/validation";
import { readProfileData, type ProfileData, isProfileComplete } from "@/lib/strategy/profile";
import {
  isStepNo,
  type StepNo,
  type StepStatus,
  type StudyRole,
} from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type StudySummary = {
  id: string;
  company_name: string;
  updated_at: string;
  role: StudyRole;
  validated: number;
};

export type ReviewReason = { step: StepNo; at: string };

export type StudyStep = {
  no: StepNo;
  status: StepStatus;
  validated_at: string | null;
  review_reasons: ReviewReason[];
};

export type StudyDetail = {
  id: string;
  company_name: string;
  strategic_question: string;
  updated_at: string;
  role: StudyRole;
  member_count: number;
  profile: ProfileData;
  profileComplete: boolean;
  steps: Record<StepNo, StudyStep>;
  /** Raison pédagogique du verrou de chaque étape (administrable). */
  lockReasons: Record<StepNo, string>;
};

export type AdminStudyRow = {
  id: string;
  company_name: string;
  owner_email: string | null;
  created_at: string;
  updated_at: string;
  validated_steps: number;
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Lève une erreur explicite si une requête échoue (jamais d'échec silencieux). */
function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

/** Relit les raisons « à revoir » enregistrées en JSON. */
function readReasons(raw: unknown): ReviewReason[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const step = (item as { step?: unknown })?.step;
    const at = (item as { at?: unknown })?.at;
    return isStepNo(step) && typeof at === "string" ? [{ step, at }] : [];
  });
}

// ==================== ÉTUDES DE L'UTILISATEUR ====================

/**
 * Études dont l'utilisateur est membre, de la plus récemment modifiée à la plus ancienne.
 * @param userId - Utilisateur connecté
 */
export async function listMyStudies(userId: string): Promise<StudySummary[]> {
  const supabase = await createClient();
  const [members, steps] = await Promise.all([
    supabase
      .from("study_members")
      .select("role, studies (id, company_name, updated_at)")
      .eq("user_id", userId),
    supabase.from("study_steps").select("study_id").eq("status", "validated"),
  ]);

  const rows = check(members, "études") as unknown as {
    role: StudyRole;
    studies: { id: string; company_name: string; updated_at: string } | null;
  }[];
  const validated = new Map<string, number>();
  for (const row of check(steps, "étapes") as { study_id: string }[]) {
    validated.set(row.study_id, (validated.get(row.study_id) ?? 0) + 1);
  }

  return rows
    .filter((row) => row.studies !== null)
    .map((row) => ({
      ...row.studies!,
      role: row.role,
      validated: validated.get(row.studies!.id) ?? 0,
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/** Nombre de crédits d'étude encore disponibles pour l'utilisateur. */
export async function countAvailableCredits(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("study_credits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("consumed_at", null);
  if (error) throw new Error(`Lecture impossible (crédits) : ${error.message}`);
  return count ?? 0;
}

// ==================== ÉTUDE COMPLÈTE ====================

/**
 * Étude complète vue par un membre ; null si elle n'existe pas ou s'il n'en est pas membre.
 * @param studyId - Identifiant de l'étude
 * @param userId  - Utilisateur connecté
 */
export async function getStudy(studyId: string, userId: string): Promise<StudyDetail | null> {
  if (!isUuid(studyId)) return null;
  const supabase = await createClient();

  const study = await supabase
    .from("studies")
    .select("id, company_name, strategic_question, updated_at")
    .eq("id", studyId)
    .maybeSingle<{
      id: string;
      company_name: string;
      strategic_question: string;
      updated_at: string;
    }>();
  const base = check(study, "étude");
  if (!base) return null;

  const [members, profile, steps, definitions] = await Promise.all([
    supabase.from("study_members").select("user_id, role").eq("study_id", studyId),
    supabase.from("company_profiles").select("data").eq("study_id", studyId).maybeSingle(),
    supabase
      .from("study_steps")
      .select("step_no, status, validated_at, review_reasons")
      .eq("study_id", studyId),
    supabase.from("strategy_steps").select("step_no, lock_reason"),
  ]);

  const memberRows = check(members, "membres") as { user_id: string; role: StudyRole }[];
  const role = memberRows.find((m) => m.user_id === userId)?.role;
  if (!role) return null;

  const data = readProfileData((check(profile, "profil") as { data: unknown } | null)?.data);

  const stepMap = {} as Record<StepNo, StudyStep>;
  const rawSteps = check(steps, "étapes") as {
    step_no: number;
    status: StepStatus;
    validated_at: string | null;
    review_reasons: unknown;
  }[];
  for (const row of rawSteps) {
    if (!isStepNo(row.step_no)) continue;
    stepMap[row.step_no] = {
      no: row.step_no,
      status: row.status,
      validated_at: row.validated_at,
      review_reasons: readReasons(row.review_reasons),
    };
  }

  const lockReasons = {} as Record<StepNo, string>;
  for (const row of check(definitions, "référence") as { step_no: number; lock_reason: string }[]) {
    if (isStepNo(row.step_no)) lockReasons[row.step_no] = row.lock_reason;
  }

  return {
    ...base,
    role,
    member_count: memberRows.length,
    profile: data,
    profileComplete: isProfileComplete(base.strategic_question, data),
    steps: stepMap,
    lockReasons,
  };
}

/** Statuts des étapes d'une étude, sous la forme attendue par les règles de steps.ts. */
export function statusesOf(study: StudyDetail): Record<StepNo, StepStatus> {
  const statuses = {} as Record<StepNo, StepStatus>;
  for (const step of Object.values(study.steps)) statuses[step.no] = step.status;
  return statuses;
}

// ==================== ADMINISTRATION ====================

/** Études de la plateforme (métadonnées seulement) — administrateur aal2. */
export async function listStudiesForAdmin(): Promise<AdminStudyRow[]> {
  const supabase = await createClient();
  return check(await supabase.rpc("admin_strategy_studies"), "études (admin)") as AdminStudyRow[];
}
