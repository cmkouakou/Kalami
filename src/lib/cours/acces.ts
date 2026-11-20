/**
 * =============================================================
 *  Fichier    : acces.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Accès au cours et lectures côté serveur : droit d'accès de l'utilisateur
 *               courant, progression, meilleures notes et annotations d'une leçon.
 *               La RLS limite chaque lecture aux lignes de l'apprenant connecté.
 *               v0.33.0 : calendrier de diffusion de la cohorte et état de chaque leçon.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-19
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/cours/notation.ts,
 *               lib/cours/calendrier.ts
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
import { estRedigee } from "@/lib/cours/lecons";
import { LECONS } from "@/lib/cours/modules";
import type { LigneProgression } from "@/lib/cours/notation";
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
