/**
 * =============================================================
 *  Fichier    : index.ts (leçons du cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Registre des leçons rédigées, par identifiant stable. Une leçon absente
 *               du registre est affichée « bientôt » dans le programme.
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-11-20
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
import { M03_L01 } from "@/lib/cours/lecons/m03-l01";
import { M03_L02 } from "@/lib/cours/lecons/m03-l02";
import { M03_L03 } from "@/lib/cours/lecons/m03-l03";
import { M03_L04 } from "@/lib/cours/lecons/m03-l04";
import { M04_L01 } from "@/lib/cours/lecons/m04-l01";
import { M04_L02 } from "@/lib/cours/lecons/m04-l02";
import { M04_L03 } from "@/lib/cours/lecons/m04-l03";
import { M04_L04 } from "@/lib/cours/lecons/m04-l04";
import { M04_L05 } from "@/lib/cours/lecons/m04-l05";
import { M05_L01 } from "@/lib/cours/lecons/m05-l01";
import { M05_L02 } from "@/lib/cours/lecons/m05-l02";
import { M05_L03 } from "@/lib/cours/lecons/m05-l03";
import { M06_L01 } from "@/lib/cours/lecons/m06-l01";
import { M06_L02 } from "@/lib/cours/lecons/m06-l02";
import { M06_L03 } from "@/lib/cours/lecons/m06-l03";
import { M06_L04 } from "@/lib/cours/lecons/m06-l04";
import { M07_L01 } from "@/lib/cours/lecons/m07-l01";
import { M07_L02 } from "@/lib/cours/lecons/m07-l02";
import { M07_L03 } from "@/lib/cours/lecons/m07-l03";

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
  "m03-l01": M03_L01,
  "m03-l02": M03_L02,
  "m03-l03": M03_L03,
  "m03-l04": M03_L04,
  "m04-l01": M04_L01,
  "m04-l02": M04_L02,
  "m04-l03": M04_L03,
  "m04-l04": M04_L04,
  "m04-l05": M04_L05,
  "m05-l01": M05_L01,
  "m05-l02": M05_L02,
  "m05-l03": M05_L03,
  "m06-l01": M06_L01,
  "m06-l02": M06_L02,
  "m06-l03": M06_L03,
  "m06-l04": M06_L04,
  "m07-l01": M07_L01,
  "m07-l02": M07_L02,
  "m07-l03": M07_L03,
};

/** Contenu d'une leçon ; null si elle n'est pas encore rédigée. */
export function contenuLecon(id: string): ContenuLecon | null {
  return LECONS_REDIGEES[id] ?? null;
}

/** Vrai si la leçon est rédigée. */
export function estRedigee(id: string): boolean {
  return id in LECONS_REDIGEES;
}
