/**
 * =============================================================
 *  Fichier    : index.ts (leçons du cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Registre des leçons rédigées, par identifiant stable. Une leçon absente
 *               du registre est affichée « bientôt » dans le programme.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts, lecons/*.ts
 * =============================================================
 */

import type { ContenuLecon } from "@/lib/cours/content";
import { M01_L01 } from "@/lib/cours/lecons/m01-l01";

/** Contenu des leçons rédigées. */
const LECONS_REDIGEES: Readonly<Record<string, ContenuLecon>> = {
  "m01-l01": M01_L01,
};

/** Contenu d'une leçon ; null si elle n'est pas encore rédigée. */
export function contenuLecon(id: string): ContenuLecon | null {
  return LECONS_REDIGEES[id] ?? null;
}

/** Vrai si la leçon est rédigée. */
export function estRedigee(id: string): boolean {
  return id in LECONS_REDIGEES;
}
