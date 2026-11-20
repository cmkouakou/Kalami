/**
 * =============================================================
 *  Fichier    : admin-queries.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Lectures de l'administration du cours (v0.29.0) : réglages de vente,
 *               cohortes, apprenants avec leur suivi (fonction SQL admin_course_learners)
 *               et fiche d'un apprenant (progression, notes, temps par jour, lus grâce aux
 *               politiques « ou administrateur »).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/supabase/server.ts, lib/cours/suivi.ts,
 *               migrations 20261124120000_course.sql et 20261125120000_course_admin.sql
 * =============================================================
 */

import "server-only";

import {
  enrichir,
  type ApprenantSuivi,
  type LigneApprenant,
  type ProgressionLecon,
  type Tentative,
} from "@/lib/cours/suivi";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type ReglagesCours = {
  on_sale: boolean;
  price_xof: number | null;
  price_eur: number | null;
  price_cad: number | null;
  book_id: string | null;
  updated_at: string | null;
};

export type Cohorte = {
  id: string;
  name: string;
  country: string | null;
  starts_on: string | null;
  ends_on: string | null;
  note: string | null;
  created_at: string;
};

export type LivreChoix = { id: string; title: string; status: string };

export type JourActivite = { day: string; seconds: number };

export type FicheApprenant = {
  apprenant: ApprenantSuivi;
  progression: ProgressionLecon[];
  tentatives: Tentative[];
  jours: JourActivite[];
};

// ==================== OUTILS ====================

/**
 * Convertit une colonne numeric (texte côté PostgREST) en nombre.
 * @param valeur - Valeur lue
 */
function nombre(valeur: unknown): number | null {
  if (valeur === null || valeur === undefined) return null;
  const n = Number(valeur);
  return Number.isFinite(n) ? n : null;
}

/**
 * Journalise une lecture en échec (sans données personnelles) et renvoie la valeur par
 * défaut, pour que la page reste affichable.
 */
function echec<T>(
  quoi: string,
  error: { code?: string; message: string },
  defaut: T,
): T {
  console.error(`[cours admin] ${quoi} :`, error.code, error.message);
  return defaut;
}

// ==================== RÉGLAGES ====================

/** Réglages de vente du cours (ligne unique). */
export async function lireReglagesCours(): Promise<ReglagesCours> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_settings")
    .select("on_sale, price_xof, price_eur, price_cad, book_id, updated_at")
    .maybeSingle();
  const vide: ReglagesCours = {
    on_sale: false,
    price_xof: null,
    price_eur: null,
    price_cad: null,
    book_id: null,
    updated_at: null,
  };
  if (error) return echec("réglages", error, vide);
  if (!data) return vide;
  return {
    on_sale: data.on_sale === true,
    price_xof: nombre(data.price_xof),
    price_eur: nombre(data.price_eur),
    price_cad: nombre(data.price_cad),
    book_id: data.book_id ?? null,
    updated_at: data.updated_at ?? null,
  };
}

/** Livres proposables comme livre associé (tous statuts, par titre). */
export async function listerLivresChoix(): Promise<LivreChoix[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, status")
    .order("title", { ascending: true })
    .limit(500);
  if (error) return echec("livres", error, []);
  return (data ?? []) as LivreChoix[];
}

// ==================== COHORTES ====================

/** Cohortes, les plus récentes en premier. */
export async function listerCohortes(): Promise<Cohorte[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_cohorts")
    .select("id, name, country, starts_on, ends_on, note, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return echec("cohortes", error, []);
  return (data ?? []) as Cohorte[];
}

// ==================== APPRENANTS ====================

/**
 * Apprenants ayant un accès actif, avec leur suivi.
 * @param cohortId - Filtre facultatif sur une cohorte
 */
export async function listerApprenants(
  cohortId: string | null = null,
): Promise<ApprenantSuivi[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_course_learners", {
    p_cohort_id: cohortId,
    p_user_id: null,
  });
  if (error) return echec("apprenants", error, []);
  return enrichir((data ?? []) as LigneApprenant[]);
}

/**
 * Fiche complète d'un apprenant (accès actif requis).
 * @param userId - Identifiant du compte
 * @returns Fiche, ou null si le compte n'a pas d'accès actif
 */
export async function lireFicheApprenant(
  userId: string,
): Promise<FicheApprenant | null> {
  const supabase = await createClient();
  const [ligne, progression, tentatives, jours] = await Promise.all([
    supabase.rpc("admin_course_learners", {
      p_cohort_id: null,
      p_user_id: userId,
    }),
    supabase
      .from("course_lesson_progress")
      .select("lesson_id, started_at, completed_at, seconds")
      .eq("user_id", userId),
    supabase
      .from("course_attempts")
      .select("exercise_id, score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(2000),
    supabase
      .from("course_activity")
      .select("day, seconds")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(90),
  ]);
  if (ligne.error) return echec("fiche", ligne.error, null);
  const [apprenant] = enrichir((ligne.data ?? []) as LigneApprenant[]);
  if (!apprenant) return null;
  return {
    apprenant,
    progression: (progression.data ?? []) as ProgressionLecon[],
    tentatives: (tentatives.data ?? []) as Tentative[],
    jours: (jours.data ?? []) as JourActivite[],
  };
}
