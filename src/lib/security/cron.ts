/**
 * =============================================================
 *  Fichier    : cron.ts
 *  Projet     : Kalami
 *  Description: Contrôle du secret des tâches planifiées Vercel (CRON_SECRET), en temps
 *               constant pour ne rien révéler du secret par la durée de la comparaison.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: node:crypto
 * =============================================================
 */

import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compare deux chaînes en temps constant (empreintes de même longueur).
 * @param a - Première chaîne
 * @param b - Seconde chaîne
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Vrai si la requête porte « Authorization: Bearer {CRON_SECRET} ».
 * @param headers - En-têtes de la requête
 * @param secret  - Secret attendu (par défaut : variable d'environnement CRON_SECRET)
 * @returns false si le secret n'est pas configuré
 */
export function isCronAuthorized(
  headers: Headers,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret) return false;
  return constantTimeEqual(headers.get("authorization") ?? "", `Bearer ${secret}`);
}
