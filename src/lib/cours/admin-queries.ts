/**
 * =============================================================
 *  Fichier    : admin-queries.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Lectures de l'administration du cours (v0.29.0) : réglages de vente,
 *               cohortes, apprenants avec leur suivi (fonction SQL admin_course_learners)
 *               et fiche d'un apprenant (progression, notes, temps par jour, lus grâce aux
 *               politiques « ou administrateur ») ; calendrier de diffusion d'une
 *               cohorte (v0.33.0) ; diplômes délivrés (v0.38.0) ; dates individuelles
 *               d'ouverture et de fermeture par apprenant (v0.42.0).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-20
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
import {
  estFuseau,
  FUSEAUX,
  jourDansFuseau,
  type Fuseau,
} from "@/lib/cours/calendrier";
import type { DateIndividuelle } from "@/lib/cours/liste-apprenants";
import { estMention, type Mention } from "@/lib/cours/note-finale";
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
  /** Diffusion programmée (v0.33.0) ; absent tant que la migration n'est pas appliquée. */
  schedule_enabled?: boolean;
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
    // « * » : la liste reste lisible avant comme après la migration du calendrier
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return echec("cohortes", error, []);
  return (data ?? []) as Cohorte[];
}

/** Calendrier de diffusion d'une cohorte, dates ramenées au jour dans son fuseau. */
export type CalendrierCohorte = {
  cohorte: Cohorte;
  active: boolean;
  lectureAvance: boolean;
  fuseau: Fuseau;
  /** Date AAAA-MM-JJ par module ou leçon. */
  jours: Record<string, string>;
};

/**
 * Lit une cohorte avec ses réglages de diffusion et ses dates d'ouverture.
 * @param id - Identifiant de la cohorte
 * @returns null si la cohorte est introuvable (ou la lecture en échec)
 */
export async function lireCalendrierCohorte(
  id: string,
): Promise<CalendrierCohorte | null> {
  const supabase = await createClient();
  const [cohorte, dates] = await Promise.all([
    supabase
      .from("course_cohorts")
      .select(
        "id, name, country, starts_on, ends_on, note, created_at, " +
          "schedule_enabled, read_ahead, timezone",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("course_schedule")
      .select("item_id, opens_at")
      .eq("cohort_id", id),
  ]);
  if (cohorte.error) return echec("calendrier (cohorte)", cohorte.error, null);
  if (dates.error) return echec("calendrier (dates)", dates.error, null);
  if (!cohorte.data) return null;
  const ligne = cohorte.data as unknown as Cohorte & {
    schedule_enabled: boolean;
    read_ahead: boolean;
    timezone: string;
  };
  const fuseau: Fuseau = estFuseau(ligne.timezone) ? ligne.timezone : FUSEAUX[0];
  const jours: Record<string, string> = {};
  for (const d of (dates.data ?? []) as { item_id: string; opens_at: string }[]) {
    jours[d.item_id] = jourDansFuseau(d.opens_at, fuseau);
  }
  return {
    cohorte: ligne,
    active: ligne.schedule_enabled,
    lectureAvance: ligne.read_ahead,
    fuseau,
    jours,
  };
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

type LigneDateIndividuelle = {
  user_id: string;
  item_id: string;
  opens_at: string | null;
  closes_at: string | null;
  timezone: string;
};

/**
 * Dates individuelles de tous les apprenants, regroupées par compte.
 * @returns Dates par identifiant de compte (vide en cas d'erreur)
 */
export async function listerDatesIndividuelles(): Promise<
  Record<string, DateIndividuelle[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_learner_schedule")
    .select("user_id, item_id, opens_at, closes_at, timezone")
    .order("item_id")
    .limit(20000);
  if (error) return echec("dates individuelles", error, {});
  const parCompte: Record<string, DateIndividuelle[]> = {};
  for (const l of (data ?? []) as LigneDateIndividuelle[]) {
    const fuseau: Fuseau = estFuseau(l.timezone) ? l.timezone : FUSEAUX[0];
    const jour = (iso: string | null) => (iso ? jourDansFuseau(iso, fuseau) : null);
    (parCompte[l.user_id] ??= []).push({
      item: l.item_id,
      ouvre: jour(l.opens_at),
      ferme: jour(l.closes_at),
      fuseau,
    });
  }
  return parCompte;
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

// ==================== DIPLÔMES (v0.38.0) ====================

/** Diplôme délivré, tel que listé dans l'administration. */
export type DiplomeAdmin = {
  id: string;
  numero: string;
  nom: string;
  mention: Mention;
  finale: number;
  delivreLe: string;
  corrigeLe: string | null;
};

/** Diplômes délivrés, du plus récent au plus ancien (politique « ou administrateur »). */
export async function listerDiplomes(): Promise<DiplomeAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_diplomas")
    .select("id, number, printed_name, honours, final_score, issued_at, name_corrected_at")
    .order("issued_at", { ascending: false })
    .limit(500);
  if (error) return echec("diplômes", error, []);
  return (data ?? []).flatMap((l) =>
    estMention(l.honours)
      ? [
          {
            id: String(l.id),
            numero: String(l.number),
            nom: String(l.printed_name),
            mention: l.honours,
            finale: Number(l.final_score),
            delivreLe: String(l.issued_at),
            corrigeLe: l.name_corrected_at ? String(l.name_corrected_at) : null,
          },
        ]
      : [],
  );
}
