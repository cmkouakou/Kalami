/**
 * =============================================================
 *  Fichier    : audience.ts (lib/analytics)
 *  Projet     : Kalami
 *  Description: Règles du tableau de bord « Lecture et audience » (v0.16.1) : périodes
 *               proposées, statut d'un lecteur (actif, en pause, abandonné, terminé),
 *               jours écoulés et durées lisibles. v0.24.0 : onglets de la page et
 *               filtres des membres connectés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-16
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== CONSTANTES ====================

/** Périodes proposées, en jours (365 = conservation maximale du détail). */
export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];
export const DEFAULT_PERIOD: Period = 30;

export const READER_STATUSES = ["active", "paused", "abandoned", "finished"] as const;
export type ReaderStatus = (typeof READER_STATUSES)[number];

/** Au-delà de 7 jours sans lecture : en pause ; au-delà de 30 : abandonné. */
const ACTIVE_DAYS = 7;
export const ABANDONED_DAYS = 30;
/** Avancement à partir duquel un livre est considéré comme terminé. */
const FINISHED_PROGRESS = 0.98;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Onglets de la page « Lecture et audience » (le premier est l'onglet par défaut). */
export const AUDIENCE_TABS = ["overview", "members", "pages", "reading"] as const;
export type AudienceTab = (typeof AUDIENCE_TABS)[number];

/** Filtres de la liste des membres : vus sur la période, nouveaux inscrits, tous. */
export const MEMBER_FILTERS = ["active", "new", "all"] as const;
export type MemberFilter = (typeof MEMBER_FILTERS)[number];

/** Champs d'un membre utiles au filtrage. */
type MemberDates = { signed_up_at: string; views: number };

// ==================== FONCTIONS ====================

/**
 * Période demandée dans l'adresse, ou la période par défaut.
 * @param raw - Paramètre « periode »
 */
export function parsePeriod(raw: unknown): Period {
  const value = Number(raw);
  return PERIODS.find((period) => period === value) ?? DEFAULT_PERIOD;
}

/**
 * Premier jour inclus d'une période (UTC, format AAAA-MM-JJ).
 * @param period - Nombre de jours, aujourd'hui compris
 * @param now    - Instant de référence
 */
export function periodStart(period: Period, now: Date = new Date()): string {
  return new Date(now.getTime() - (period - 1) * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Jours entiers écoulés depuis une date.
 * @param iso - Date ISO
 * @param now - Instant de référence
 */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

/**
 * Statut d'une lecture selon l'avancement et la dernière activité.
 * @param progress   - Avancement de 0 à 1
 * @param lastReadAt - Date ISO de la dernière lecture
 * @param now        - Instant de référence
 */
export function readerStatus(progress: number, lastReadAt: string, now = new Date()): ReaderStatus {
  if (progress >= FINISHED_PROGRESS) return "finished";
  const idle = daysSince(lastReadAt, now);
  if (idle <= ACTIVE_DAYS) return "active";
  return idle <= ABANDONED_DAYS ? "paused" : "abandoned";
}

/**
 * Durée lisible : « 45 s », « 12 min », « 3 h 05 ».
 * @param seconds - Durée en secondes
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Onglet demandé dans l'adresse, ou la vue d'ensemble.
 * @param raw - Paramètre « onglet »
 */
export function parseTab(raw: unknown): AudienceTab {
  return AUDIENCE_TABS.find((tab) => tab === raw) ?? "overview";
}

/**
 * Filtre des membres demandé dans l'adresse, ou « vus sur la période ».
 * @param raw - Paramètre « membres »
 */
export function parseMemberFilter(raw: unknown): MemberFilter {
  return MEMBER_FILTERS.find((filter) => filter === raw) ?? "active";
}

/**
 * Membres retenus par un filtre.
 * @param members - Membres avec leurs pages vues sur la période
 * @param filter  - Filtre choisi
 * @param since   - Premier jour de la période (AAAA-MM-JJ)
 */
export function filterMembers<T extends MemberDates>(
  members: T[],
  filter: MemberFilter,
  since: string,
): T[] {
  if (filter === "all") return members;
  if (filter === "new") return members.filter((row) => row.signed_up_at.slice(0, 10) >= since);
  return members.filter((row) => row.views > 0);
}
