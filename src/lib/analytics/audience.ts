/**
 * =============================================================
 *  Fichier    : audience.ts (lib/analytics)
 *  Projet     : Kalami
 *  Description: Règles du tableau de bord « Lecture et audience » (v0.16.1) : périodes
 *               proposées, statut d'un lecteur (actif, en pause, abandonné, terminé),
 *               jours écoulés et durées lisibles.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
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
