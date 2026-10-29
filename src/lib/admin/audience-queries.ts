/**
 * =============================================================
 *  Fichier    : audience-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures du tableau de bord « Lecture et audience » (v0.16.1) : synthèse
 *               des visites et de la lecture sur une période, liste des lecteurs avec leur
 *               parcours, activité jour par jour d'un lecteur. Fonctions SQL réservées à
 *               l'administrateur (is_admin) et RLS.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type AudienceDay = {
  day: string;
  views: number;
  entries: number;
  readers: number;
  seconds: number;
};

export type AudienceSummary = {
  days: AudienceDay[];
  pages: { path: string; views: number; entries: number }[];
  countries: { country: string; views: number; entries: number; readers: number }[];
  referrers: { referrer: string; entries: number }[];
  totals: { views: number; entries: number; readers: number; seconds: number };
};

/** Une lecture : un lecteur sur un livre. */
export type ReaderRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  book_id: string;
  book_title: string;
  chapter_count: number | null;
  chapter_position: number;
  progress: number;
  started_at: string;
  last_read_at: string;
  total_seconds: number;
  active_days: number;
  chapters_opened: number;
  country: string | null;
};

/** Activité d'un lecteur un jour donné sur un livre. */
export type ReaderDay = {
  day: string;
  book_id: string;
  seconds: number;
  chapters: number[];
  country: string | null;
};

// ==================== LECTURES ====================

/**
 * Synthèse de l'audience depuis une date.
 * @param since - Premier jour inclus (AAAA-MM-JJ, UTC)
 */
export async function getAudienceSummary(since: string): Promise<AudienceSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_audience_summary", { p_since: since });
  if (error) throw new Error(`Lecture de l'audience impossible : ${error.message}`);
  return data as AudienceSummary;
}

/**
 * Lecteurs et leur parcours (les plus récents d'abord).
 * @param userId - Un seul lecteur, ou tous si absent
 */
export async function listReaders(userId?: string): Promise<ReaderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_reader_list", { p_user_id: userId ?? null });
  if (error) throw new Error(`Lecture des lecteurs impossible : ${error.message}`);
  return ((data ?? []) as ReaderRow[]).map((row) => ({
    ...row,
    progress: Number(row.progress),
    total_seconds: Number(row.total_seconds),
    active_days: Number(row.active_days),
    chapters_opened: Number(row.chapters_opened),
  }));
}

/**
 * Activité jour par jour d'un lecteur (12 derniers mois, plus récente d'abord).
 * @param userId - Identifiant du lecteur
 */
export async function listReaderDays(userId: string): Promise<ReaderDay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_activity")
    .select("day, book_id, seconds, chapters, country")
    .eq("user_id", userId)
    .order("day", { ascending: false })
    .limit(400);
  if (error) throw new Error(`Lecture de l'activité impossible : ${error.message}`);
  return (data ?? []) as ReaderDay[];
}
