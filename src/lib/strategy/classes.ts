/**
 * =============================================================
 *  Fichier    : classes.ts
 *  Projet     : Kalami Stratégie
 *  Description: Règles du mode enseignant (S10a), sans accès à la base : types des lignes
 *               lues par les fonctions SQL de classe, validation des formulaires (classe,
 *               réglages, groupes de la distribution), progression d'une étude, retard
 *               par rapport à la date limite indicative et traduction des erreurs.
 *               Utilisable côté serveur comme côté navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: zod, i18n, lib/strategy/steps.ts
 * =============================================================
 */

import { z } from "zod";

import { getDictionary } from "@/i18n";
import { type StepNo, type StepStatus, STEPS, type StudyRole } from "@/lib/strategy/steps";

const s = getDictionary().strategy;
const cl = s.classes;

// ==================== CONSTANTES ====================

/** Longueurs maximales (mêmes valeurs qu'en SQL). */
export const CLASS_NAME_MAX = 120;
export const INSTITUTION_MAX = 160;
export const TERM_MAX = 60;
export const COMPANY_MAX = 200;
export const QUESTION_MAX = 1000;

/** Taille d'une équipe et nombre d'études par distribution. */
export const GROUP_MAX = 6;
export const GROUPS_MAX = 100;

/** Plafond d'IA par étude qu'une classe peut fixer, en dollars américains. */
export const BUDGET_MAX = 50;

/** Étapes où l'enseignant peut couper le coach (le plan, étape 9, n'a pas de coach). */
export const COACH_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const satisfies readonly StepNo[];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// ==================== TYPES ====================

export type ClassStatus = "active" | "archived";

/** Classe vue par son enseignant (table classes). */
export type ClassRow = {
  id: string;
  name: string;
  institution: string;
  term: string;
  due_date: string | null;
  coach_disabled_steps: number[];
  study_budget_usd: number | null;
  join_token_hash: string | null;
  status: ClassStatus;
  created_at: string;
};

/** Étudiant inscrit (strategy_class_students). */
export type ClassStudent = {
  user_id: string;
  display_name: string | null;
  email: string;
  joined_at: string;
  studies: number;
};

/** Invitation d'un étudiant (table class_invitations). */
export type ClassInvitation = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

export type TrackingMember = { userId: string; role: StudyRole; name: string | null };

/** Ligne du suivi d'une classe (strategy_class_tracking). */
export type TrackingRow = {
  study_id: string;
  company_name: string;
  created_at: string;
  last_activity: string;
  members: TrackingMember[];
  steps: StepStatus[];
};

/** Classe vue par un étudiant (strategy_student_classes). */
export type StudentClass = {
  class_id: string;
  name: string;
  institution: string;
  term: string;
  due_date: string | null;
  status: ClassStatus;
  teacher_name: string | null;
  joined_at: string;
};

/** Classe d'une étude, vue par ses membres (strategy_study_class). */
export type StudyClass = {
  class_id: string;
  name: string;
  due_date: string | null;
  coach_disabled_steps: number[];
  teacher_id: string;
  teacher_name: string | null;
};

/** Classe désignée par un lien de classe ou d'invitation (strategy_class_by_token). */
export type ClassByToken = {
  class_id: string;
  name: string;
  institution: string;
  term: string;
  teacher_name: string | null;
  class_status: ClassStatus;
  kind: "link" | "invitation";
  invitation_email: string | null;
  invitation_status: ClassInvitation["status"] | null;
  expired: boolean;
  email_matches: boolean;
  is_teacher: boolean;
  already_member: boolean;
};

// ==================== FORMULAIRES ====================

/** Date AAAA-MM-JJ valide, ou chaîne vide (aucune date limite). */
const dueDateField = z
  .string()
  .trim()
  .refine((value) => value === "" || (DATE_PATTERN.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))), { message: "invalid_date" })
  .transform((value) => value || null);

/** Description d'une classe (création et réglages). */
export const classInfoSchema = z.object({
  name: z.string().trim().min(1, "invalid_name").max(CLASS_NAME_MAX, "text_too_long"),
  institution: z.string().trim().max(INSTITUTION_MAX, "text_too_long"),
  term: z.string().trim().max(TERM_MAX, "text_too_long"),
  dueDate: dueDateField,
});
export type ClassInfo = z.infer<typeof classInfoSchema>;

/** Réglages du coach : étapes coupées et plafond par étude (vide : plafond général). */
export const classCoachSchema = z.object({
  coachDisabledSteps: z
    .array(z.coerce.number().int().min(1).max(8))
    .transform((steps) => [...new Set(steps)].sort((a, b) => a - b)),
  studyBudget: z
    .string()
    .trim()
    .transform((value) => value.replace(",", "."))
    .refine((value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value), "invalid_budget")
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || value <= BUDGET_MAX, "invalid_budget"),
});
export type ClassCoach = z.infer<typeof classCoachSchema>;

/** Sujet de l'étude distribuée. */
export const distributionSchema = z.object({
  companyName: z.string().trim().min(1, "invalid_study").max(COMPANY_MAX, "invalid_study"),
  question: z.string().trim().max(QUESTION_MAX, "invalid_study"),
});

/**
 * Groupes de la distribution : 1 à 100 groupes de 1 à 6 étudiants, chacun dans un seul
 * groupe. Null si la valeur ne respecte pas ces règles.
 * @param value - Valeur reçue (JSON déjà lu)
 */
export function parseGroups(value: unknown): string[][] | null {
  const parsed = z
    .array(z.array(z.uuid()).min(1).max(GROUP_MAX))
    .min(1)
    .max(GROUPS_MAX)
    .safeParse(value);
  if (!parsed.success) return null;
  const all = parsed.data.flat();
  return new Set(all).size === all.length ? parsed.data : null;
}

/**
 * Groupes d'une étude par étudiant, dans l'ordre donné.
 * @param studentIds - Étudiants retenus
 */
export function individualGroups(studentIds: readonly string[]): string[][] {
  return studentIds.map((id) => [id]);
}

/**
 * Groupes d'une répartition par équipes : une équipe par numéro choisi (0 : pas d'étude),
 * dans l'ordre des numéros ; dans chaque équipe, les étudiants gardent l'ordre de la
 * liste (le premier sera propriétaire).
 * @param studentIds - Étudiants, dans l'ordre affiché
 * @param teams      - Numéro d'équipe choisi pour chaque étudiant
 */
export function teamGroups(
  studentIds: readonly string[],
  teams: Readonly<Record<string, number>>,
): string[][] {
  const byTeam = new Map<number, string[]>();
  for (const id of studentIds) {
    const team = teams[id] ?? 0;
    if (team > 0) byTeam.set(team, [...(byTeam.get(team) ?? []), id]);
  }
  return [...byTeam.entries()].sort(([a], [b]) => a - b).map(([, ids]) => ids);
}

// ==================== PROGRESSION ET RETARD ====================

export type Progress = { validated: number; total: number; percent: number };

/**
 * Progression d'une étude : étapes validées sur 9.
 * @param steps - Statuts des étapes, dans l'ordre
 */
export function progressOf(steps: readonly StepStatus[]): Progress {
  const total = STEPS.length;
  const validated = steps.filter((status) => status === "validated").length;
  return { validated, total, percent: Math.round((validated / total) * 100) };
}

/**
 * Vrai si l'étude n'est pas terminée alors que la date limite est passée. La date
 * limite est indicative : rien n'est bloqué, l'étude est seulement signalée.
 * @param steps   - Statuts des étapes
 * @param dueDate - Date limite AAAA-MM-JJ (null : aucune)
 * @param today   - Date du jour AAAA-MM-JJ (fuseau de l'enseignant)
 */
export function isLate(
  steps: readonly StepStatus[],
  dueDate: string | null,
  today: string,
): boolean {
  if (!dueDate) return false;
  return today > dueDate && progressOf(steps).validated < STEPS.length;
}

/**
 * Vrai si l'enseignant a coupé le coach pour cette étape.
 * @param studyClass - Classe de l'étude (null hors classe)
 * @param stepNo     - Étape ouverte
 */
export function coachDisabledFor(
  studyClass: Pick<StudyClass, "coach_disabled_steps"> | null,
  stepNo: number,
): boolean {
  return Boolean(studyClass?.coach_disabled_steps.includes(stepNo));
}

/** Date du jour AAAA-MM-JJ dans le fuseau de Montréal (référence des échéances). */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(now);
}

// ==================== ERREURS ====================

type ClassErrorKey = keyof typeof cl.errors;
type TeamErrorKey = keyof typeof s.team.errors;
type StrategyErrorKey = keyof typeof s.errors;

/**
 * Traduit l'erreur levée par une fonction SQL de classe ou un schéma (« class_full »…).
 * @param error - Erreur PostgREST (code et message) ou clé de validation
 */
export function classError(error: { code?: string; message?: string }): string {
  const key = error.message ?? "";
  if (key in cl.errors) return cl.errors[key as ClassErrorKey];
  if (key in s.team.errors) return s.team.errors[key as TeamErrorKey];
  if (key in s.errors) return s.errors[key as StrategyErrorKey];
  if (error.code === "42501") return s.errors.forbidden;
  return s.errors.generic;
}

/**
 * Première erreur d'un schéma Zod, traduite.
 * @param issues - Problèmes relevés par safeParse
 */
export function firstIssue(issues: readonly { message: string }[]): string {
  return classError({ message: issues[0]?.message });
}
