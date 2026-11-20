/**
 * =============================================================
 *  Fichier    : index.ts (leçons du cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Registre des leçons rédigées, par identifiant stable. Une leçon absente
 *               du registre est affichée « bientôt » dans le programme.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts, lecons/*.ts
 * =============================================================
 */

import type { ContenuLecon } from "@/lib/cours/content";
import { M01_L01 } from "@/lib/cours/lecons/m01-l01";
import { M01_L02 } from "@/lib/cours/lecons/m01-l02";
import { M01_L03 } from "@/lib/cours/lecons/m01-l03";
import { M01_L04 } from "@/lib/cours/lecons/m01-l04";
import { M01_L05 } from "@/lib/cours/lecons/m01-l05";
import { M02_L01 } from "@/lib/cours/lecons/m02-l01";
import { M02_L02 } from "@/lib/cours/lecons/m02-l02";
import { M02_L03 } from "@/lib/cours/lecons/m02-l03";
import { M02_L04 } from "@/lib/cours/lecons/m02-l04";

/** Contenu des leçons rédigées. */
const LECONS_REDIGEES: Readonly<Record<string, ContenuLecon>> = {
  "m01-l01": M01_L01,
  "m01-l02": M01_L02,
  "m01-l03": M01_L03,
  "m01-l04": M01_L04,
  "m01-l05": M01_L05,
  "m02-l01": M02_L01,
  "m02-l02": M02_L02,
  "m02-l03": M02_L03,
  "m02-l04": M02_L04,
};

/** Contenu d'une leçon ; null si elle n'est pas encore rédigée. */
export function contenuLecon(id: string): ContenuLecon | null {
  return LECONS_REDIGEES[id] ?? null;
}

/** Vrai si la leçon est rédigée. */
export function estRedigee(id: string): boolean {
  return id in LECONS_REDIGEES;
}
