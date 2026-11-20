/**
 * =============================================================
 *  Fichier    : acces.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Accès au cours et lectures côté serveur : droit d'accès de l'utilisateur
 *               courant, progression, meilleures notes et annotations d'une leçon.
 *               La RLS limite chaque lecture aux lignes de l'apprenant connecté.
 *               v0.33.0 : calendrier de diffusion de la cohorte et état de chaque leçon.
 *               v0.37.0 : meilleure note et nombre d'essais de chaque quiz de module.
 *               v0.38.0 : réglages d'évaluation, bilan (note finale) et diplôme.
 *               v0.38.2 : toutes les annotations de l'apprenant (page Mes annotations).
 *  Auteur     : Claude Marcel
 *  Version    : 1.4
 *  Date       : 2026-11-20
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/cours/notation.ts,
 *               lib/cours/calendrier.ts, lib/cours/evaluation.ts, lib/cours/note-finale.ts
 * =============================================================
 */

import "server-only";

import { cache } from "react";

import { getCurrentUser, requireUser, type CurrentUser } from "@/lib/auth/dal";
import {
  etatsDiffusion,
  lireCalendrier,
  type Calendrier,
  type EtatDiffusion,
} from "@/lib/cours/calendrier";
import { resultatsQuiz, type ResultatQuiz } from "@/lib/cours/evaluation";
import { estRedigee } from "@/lib/cours/lecons";
import { LECONS } from "@/lib/cours/modules";
import type { LigneProgression } from "@/lib/cours/notation";
import {
  COLONNES_REGLAGES,
  bilanApprenant,
  estMention,
  etatExamen,
  lireReglagesEvaluation,
  type Bilan,
  type EtatExamen,
  type Mention,
  type ReglagesEvaluation,
  type TentativeCours,
} from "@/lib/cours/note-finale";
import type { Highlight, HighlightColor } from "@/lib/reader/types";
import { createClient } from "@/lib/supabase/server";

// ==================== ACCÈS ====================

/** Vrai si l'utilisateur connecté peut suivre le cours (droit actif ou administrateur). */
export const aAccesAuCours = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("has_course_access");
    return !error && data === true;
  } catch {
    return false;
  }
});

/**
 * Exige un utilisateur connecté (sinon redirection vers la connexion) et indique s'il a
 * accès au cours ; la page affiche l'offre d'accès quand ce n'est pas le cas.
 * @param nextPath - Adresse où revenir après la connexion
 */
export async function exigerConnexionCours(
  nextPath: string,
): Promise<{ user: CurrentUser; acces: boolean }> {
  const user = await requireUser(nextPath);
  return { user, acces: await aAccesAuCours() };
}

// ==================== DIFFUSION PROGRAMMÉE ====================

/** Calendrier de la cohorte de l'apprenant connecté ; null : tout est ouvert. */
export const calendrierApprenant = cache(async (): Promise<Calendrier | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("course_my_calendar");
  return error ? null : lireCalendrier(data);
});

/** Calendrier et état de chaque leçon pour l'apprenant connecté, à cet instant. */
export const diffusionApprenant = cache(
  async (): Promise<{
    calendrier: Calendrier | null;
    etats: Map<string, EtatDiffusion>;
  }> => {
    const calendrier = await calendrierApprenant();
    const etats = etatsDiffusion(
      calendrier,
      Date.now(),
      LECONS.map((l) => l.id),
      estRedigee,
    );
    return { calendrier, etats };
  },
);

// ==================== PROGRESSION ====================

/** Progression de l'apprenant connecté, leçon par leçon. */
export const progressionApprenant = cache(
  async (): Promise<LigneProgression[]> => {
    const user = await getCurrentUser();
    if (!user) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_lesson_progress")
      .select("lesson_id, completed_at, seconds")
      .eq("user_id", user.id);
    return error || !data ? [] : (data as LigneProgression[]);
  },
);

/**
 * Meilleure note obtenue à chaque exercice d'une leçon.
 * @param leconId - Identifiant stable « m01-l01 »
 * @returns Note sur 100 par identifiant d'exercice local (« e1 »)
 */
export async function meilleuresNotes(
  leconId: string,
): Promise<Record<string, number>> {
  const user = await getCurrentUser();
  if (!user) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_attempts")
    .select("exercise_id, score")
    .eq("user_id", user.id)
    .like("exercise_id", `${leconId}-e%`);
  if (error || !data) return {};
  const notes: Record<string, number> = {};
  for (const ligne of data as { exercise_id: string; score: number }[]) {
    const local = ligne.exercise_id.slice(leconId.length + 1);
    notes[local] = Math.max(notes[local] ?? 0, Number(ligne.score));
  }
  return notes;
}

/** Meilleure note et nombre d'essais de chaque quiz de module, pour l'apprenant connecté. */
export const resultatsQuizApprenant = cache(
  async (): Promise<Map<string, ResultatQuiz>> => {
    const user = await getCurrentUser();
    if (!user) return new Map();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_attempts")
      .select("exercise_id, score")
      .eq("user_id", user.id)
      .like("exercise_id", "%-quiz");
    return error || !data ? new Map() : resultatsQuiz(data);
  },
);

// ==================== ÉVALUATION FINALE ====================

/** Réglages d'évaluation (lecture publique de course_settings). */
export const reglagesEvaluation = cache(async (): Promise<ReglagesEvaluation> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_settings")
      .select(Object.values(COLONNES_REGLAGES).join(", "))
      .maybeSingle();
    return lireReglagesEvaluation(error ? null : data);
  } catch {
    return lireReglagesEvaluation(null);
  }
});

/** Toutes les tentatives de l'apprenant connecté (exercices, quiz, examen). */
export const tentativesApprenant = cache(async (): Promise<TentativeCours[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_attempts")
    .select("exercise_id, score, created_at")
    .eq("user_id", user.id);
  return error || !data ? [] : (data as TentativeCours[]);
});

/** Bilan de l'apprenant connecté : moyennes, examen, note finale et mention. */
export const bilanConnecte = cache(async (): Promise<Bilan> => {
  const [tentatives, reglages] = await Promise.all([
    tentativesApprenant(),
    reglagesEvaluation(),
  ]);
  return bilanApprenant(tentatives, reglages);
});

/** Diplôme tel que lu par l'apprenant ou l'administrateur. */
export type Diplome = {
  id: string;
  numero: string;
  nom: string;
  finale: number;
  mention: Mention;
  quiz: number;
  exercices: number;
  examen: number;
  delivreLe: string;
};

/** Colonnes lues pour un diplôme. */
export const COLONNES_DIPLOME =
  "id, number, printed_name, final_score, honours, quiz_score, exercises_score, " +
  "exam_score, issued_at";

/**
 * Convertit une ligne de course_diplomas ; null si elle est incomplète.
 * @param l - Ligne brute
 */
export function versDiplome(l: Record<string, unknown> | null): Diplome | null {
  if (!l || typeof l.id !== "string" || typeof l.number !== "string") return null;
  if (typeof l.printed_name !== "string" || !estMention(l.honours)) return null;
  return {
    id: l.id,
    numero: l.number,
    nom: l.printed_name,
    finale: Number(l.final_score),
    mention: l.honours,
    quiz: Number(l.quiz_score),
    exercices: Number(l.exercises_score),
    examen: Number(l.exam_score),
    delivreLe: String(l.issued_at),
  };
}

/** Diplôme de l'apprenant connecté ; null s'il n'est pas encore délivré. */
export const diplomeApprenant = cache(async (): Promise<Diplome | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_diplomas")
    .select(COLONNES_DIPLOME)
    .eq("user_id", user.id)
    .maybeSingle();
  return error ? null : versDiplome(data as Record<string, unknown> | null);
});

/** État de l'examen de l'apprenant connecté, à l'instant de la requête. */
export const etatExamenConnecte = cache(async (): Promise<EtatExamen> => {
  const [bilan, diplome] = await Promise.all([bilanConnecte(), diplomeApprenant()]);
  return etatExamen(bilan, Date.now(), diplome !== null);
});

// ==================== ANNOTATIONS ====================

/** Colonnes lues pour une annotation. */
export const COLONNES_ANNOTATION =
  "id, start_block, start_offset, end_block, end_offset, color, quote, note, created_at";

/** Ligne d'annotation telle que lue en base. */
export type LigneAnnotation = {
  id: string;
  start_block: number;
  start_offset: number;
  end_block: number;
  end_offset: number;
  color: HighlightColor;
  quote: string;
  note: string | null;
  created_at: string;
};

/** Convertit une ligne en surlignage au format de la liseuse (chapitre 0 : la leçon). */
export function versSurlignage(l: LigneAnnotation): Highlight {
  return {
    id: l.id,
    chapter: 0,
    start: { block: l.start_block, offset: l.start_offset },
    end: { block: l.end_block, offset: l.end_offset },
    color: l.color,
    quote: l.quote,
    note: l.note,
    createdAt: l.created_at,
  };
}

/**
 * Toutes les annotations de l'apprenant connecté, pour la page « Mes annotations ».
 * Le champ chapter porte le rang de la leçon dans le cours (1 à 52), ce qui permet de
 * trier et regrouper avec les outils de la liseuse ; les leçons inconnues sont ignorées.
 */
export const annotationsApprenant = cache(async (): Promise<Highlight[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_annotations")
    .select(`lesson_id, ${COLONNES_ANNOTATION}`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error || !data) return [];
  return (data as (LigneAnnotation & { lesson_id: string })[]).flatMap((l) => {
    const rang = LECONS.findIndex((x) => x.id === l.lesson_id) + 1;
    return rang > 0 ? [{ ...versSurlignage(l), chapter: rang }] : [];
  });
});

/** Annotations de l'apprenant connecté sur une leçon, de la plus ancienne à la plus récente. */
export async function annotationsLecon(leconId: string): Promise<Highlight[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_annotations")
    .select(COLONNES_ANNOTATION)
    .eq("user_id", user.id)
    .eq("lesson_id", leconId)
    .order("created_at", { ascending: true });
  return error || !data ? [] : (data as LigneAnnotation[]).map(versSurlignage);
}
