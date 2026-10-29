/**
 * =============================================================
 *  Fichier    : balance.ts (atelier)
 *  Projet     : Kalami
 *  Description: Message du solde de Crédits Atelier (v0.15.1), partagé par l'atelier de
 *               l'auteur et la page de relecture d'un chapitre. Jamais de dollars.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/queries.ts (type)
 * =============================================================
 */

import { interpolate } from "@/i18n";
import type { WorkshopBalance } from "@/lib/author/workshop/queries";
import { getWorkshopDictionary } from "@/i18n/workshop";

const w = getWorkshopDictionary();

/** Message du solde selon l'état des crédits. */
export function balanceMessage(balance: WorkshopBalance): string {
  if (!balance.enabled) return w.balance.disabled;
  if (!balance.unlocked) return w.balance.locked;
  if (balance.remainingPct <= 0) return w.balance.exhausted;
  return interpolate(w.balance.remaining, {
    pct: String(balance.remainingPct),
    chapters: String(balance.approxChapters),
  });
}

/** Vrai si l'auteur peut lancer une analyse payante. */
export function canRunTools(balance: WorkshopBalance): boolean {
  return balance.enabled && balance.unlocked && balance.remainingPct > 0;
}
