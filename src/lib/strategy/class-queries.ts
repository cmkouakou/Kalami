/**
 * =============================================================
 *  Fichier    : class-queries.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lectures du mode enseignant (S10a) avec la session de l'utilisateur :
 *               statut d'enseignant, classes et leurs effectifs, étudiants inscrits,
 *               invitations en attente, suivi des études distribuées, classes et études
 *               de classe d'un étudiant, classe d'une étude et classe désignée par un lien.
 *               Liste des enseignants pour l'administrateur.
 *               Les droits sont vérifiés par la RLS et par les fonctions SQL.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/server.ts, lib/strategy/classes.ts
 * =============================================================
 */

import "server-only";

import { isUuid } from "@/lib/admin/validation";
import type {
  ClassByToken,
  ClassInvitation,
  ClassRow,
  ClassStudent,
  StudentClass,
  StudyClass,
  TrackingMember,
  TrackingRow,
} from "@/lib/strategy/classes";
import type { StepStatus, StudyRole } from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Classe de l'enseignant, avec ses effectifs. */
export type ClassSummary = ClassRow & { students: number; studies: number };

/** Invitation en attente, échue ou non. */
export type PendingClassInvitation = ClassInvitation & { last_sent_at: string; expired: boolean };

/** Étude de classe vue par un étudiant. */
export type ClassStudy = {
  id: string;
  class_id: string;
  company_name: string;
  updated_at: string;
};

const STEP_STATUSES: readonly StepStatus[] = [
  "todo", "in_progress", "submitted", "validated", "needs_review",
];
const STUDY_ROLES: readonly StudyRole[] = ["owner", "contributor", "observer"];

const CLASS_COLUMNS =
  "id, name, institution, term, due_date, coach_disabled_steps, study_budget_usd, " +
  "join_token_hash, status, created_at";

// ==================== FONCTIONS UTILITAIRES ====================

/** Lève une erreur explicite si une requête échoue (jamais d'échec silencieux). */
function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

/** Montant numérique de PostgREST (nombre ou chaîne), ou null. */
function toAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * Normalise une classe lue en base (plafond numérique, étapes en nombres).
 * @param row - Ligne brute de la table classes
 */
function toClassRow(row: ClassRow): ClassRow {
  return {
    ...row,
    coach_disabled_steps: (row.coach_disabled_steps ?? []).map(Number),
    study_budget_usd: toAmount(row.study_budget_usd),
  };
}

/**
 * Membres d'une ligne de suivi (jsonb) : on écarte toute entrée mal formée.
 * @param value - Tableau JSON renvoyé par strategy_class_tracking
 */
function toMembers(value: unknown): TrackingMember[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = item as { userId?: unknown; role?: unknown; name?: unknown };
    const role = entry.role as StudyRole;
    if (typeof entry.userId !== "string" || !STUDY_ROLES.includes(role)) return [];
    return [{
      userId: entry.userId,
      role,
      name: typeof entry.name === "string" ? entry.name : null,
    }];
  });
}

/**
 * Statuts des étapes d'une ligne de suivi (jsonb), dans l'ordre.
 * @param value - Tableau JSON renvoyé par strategy_class_tracking
 */
function toSteps(value: unknown): StepStatus[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StepStatus =>
    STEP_STATUSES.includes(item as StepStatus));
}

/**
 * Compte les lignes par classe.
 * @param rows - Lignes portant un class_id
 */
function countBy(rows: { class_id: string | null }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.class_id) counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1);
  }
  return counts;
}

// ==================== ENSEIGNANT ====================

/** Enseignant vu par l'administrateur (admin_strategy_teachers). */
export type AdminTeacherRow = {
  user_id: string;
  email: string;
  created_at: string;
  credits_available: number;
  classes: number;
};

/** Enseignants avec leurs crédits disponibles et leurs classes (administrateur). */
export async function listTeachersForAdmin(): Promise<AdminTeacherRow[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("admin_strategy_teachers");
  return (check(result, "enseignants (admin)") ?? []) as AdminTeacherRow[];
}

/** Vrai si l'utilisateur connecté a le statut d'enseignant. */
export async function isTeacher(): Promise<boolean> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_is_teacher");
  return check(result, "statut d'enseignant") === true;
}

/**
 * Classes de l'enseignant, les plus récentes d'abord, avec leurs effectifs.
 * @param userId - Enseignant connecté
 */
export async function listMyClasses(userId: string): Promise<ClassSummary[]> {
  if (!isUuid(userId)) return [];
  const supabase = await createClient();
  const result = await supabase
    .from("classes")
    .select(CLASS_COLUMNS)
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });
  const classes = (check(result, "classes") ?? []) as unknown as ClassRow[];
  if (classes.length === 0) return [];

  const ids = classes.map((row) => row.id);
  const [members, studies] = await Promise.all([
    supabase.from("class_members").select("class_id").in("class_id", ids),
    supabase.from("studies").select("class_id").in("class_id", ids),
  ]);
  const students = countBy(check(members, "inscriptions") ?? []);
  const distributed = countBy(check(studies, "études de classe") ?? []);
  return classes.map((row) => ({
    ...toClassRow(row),
    students: students.get(row.id) ?? 0,
    studies: distributed.get(row.id) ?? 0,
  }));
}

/**
 * Une classe de l'enseignant connecté ; null si elle n'existe pas ou n'est pas la sienne.
 * @param classId - Identifiant de la classe
 */
export async function getClass(classId: string): Promise<ClassRow | null> {
  if (!isUuid(classId)) return null;
  const supabase = await createClient();
  const result = await supabase
    .from("classes")
    .select(CLASS_COLUMNS)
    .eq("id", classId)
    .maybeSingle();
  const row = check(result, "classe") as unknown as ClassRow | null;
  return row ? toClassRow(row) : null;
}

/**
 * Étudiants inscrits, par ordre d'inscription.
 * @param classId - Classe de l'enseignant connecté
 */
export async function getClassStudents(classId: string): Promise<ClassStudent[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_class_students", { p_class_id: classId });
  return (check(result, "étudiants") ?? []) as ClassStudent[];
}

/**
 * Invitations en attente de la classe, échues comprises (à renvoyer ou annuler).
 * @param classId - Classe de l'enseignant connecté
 */
export async function getClassInvitations(classId: string): Promise<PendingClassInvitation[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("class_invitations")
    .select("id, email, status, last_sent_at, expires_at, created_at")
    .eq("class_id", classId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const rows = (check(result, "invitations") ?? []) as Omit<PendingClassInvitation, "expired">[];
  const now = Date.now();
  return rows.map((row) => ({ ...row, expired: Date.parse(row.expires_at) <= now }));
}

/**
 * Suivi des études distribuées dans la classe, par ordre de distribution.
 * @param classId - Classe de l'enseignant connecté
 */
export async function getClassTracking(classId: string): Promise<TrackingRow[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_class_tracking", { p_class_id: classId });
  const rows = (check(result, "suivi") ?? []) as (Omit<TrackingRow, "members" | "steps"> & {
    members: unknown;
    steps: unknown;
  })[];
  return rows.map((row) => ({
    ...row,
    members: toMembers(row.members),
    steps: toSteps(row.steps),
  }));
}

// ==================== ÉTUDIANT ====================

/** Classes de l'étudiant connecté. */
export async function getStudentClasses(): Promise<StudentClass[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_student_classes");
  return (check(result, "classes suivies") ?? []) as StudentClass[];
}

/**
 * Études de classe dont l'utilisateur est membre, les plus récemment modifiées d'abord.
 * @param userId - Utilisateur connecté
 */
export async function listMyClassStudies(userId: string): Promise<ClassStudy[]> {
  if (!isUuid(userId)) return [];
  const supabase = await createClient();
  const result = await supabase
    .from("study_members")
    .select("studies!inner (id, class_id, company_name, updated_at)")
    .eq("user_id", userId)
    .not("studies.class_id", "is", null);
  const rows = (check(result, "études de classe") ?? []) as unknown as {
    studies: ClassStudy | null;
  }[];
  return rows
    .flatMap((row) => (row.studies?.class_id ? [row.studies] : []))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * Classe d'une étude, vue par ses membres ; null hors classe.
 * @param studyId - Identifiant de l'étude
 */
export async function getStudyClass(studyId: string): Promise<StudyClass | null> {
  if (!isUuid(studyId)) return null;
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_study_class", { p_study_id: studyId });
  const row = ((check(result, "classe de l'étude") ?? []) as StudyClass[])[0];
  return row ? { ...row, coach_disabled_steps: row.coach_disabled_steps.map(Number) } : null;
}

/**
 * Classe désignée par un lien de classe ou d'invitation ; null si le lien est inconnu.
 * @param token - Jeton tiré de l'adresse
 */
export async function getClassByToken(token: string): Promise<ClassByToken | null> {
  if (!token || token.length > 200) return null;
  const supabase = await createClient();
  const result = await supabase.rpc("strategy_class_by_token", { p_token: token });
  return ((check(result, "lien de classe") ?? []) as ClassByToken[])[0] ?? null;
}
