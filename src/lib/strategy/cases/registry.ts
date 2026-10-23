/**
 * =============================================================
 *  Fichier    : registry.ts
 *  Projet     : Kalami Stratégie
 *  Description: Registre des cas d'entraînement : pour chaque code de la table
 *               practice_cases, l'énoncé, l'épilogue, l'étude préremplie (nom, question,
 *               profil) et le corrigé des neuf étapes. Contenu payant : serveur seul.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: server-only, cases/ajinomoto/*
 * =============================================================
 */

import "server-only";

import type { ProfileData } from "@/lib/strategy/profile";
import type { StepNo } from "@/lib/strategy/steps";

import { CASE_STATEMENT as AJINOMOTO_STATEMENT } from "./ajinomoto/enonce";
import { CASE_EPILOGUE as AJINOMOTO_EPILOGUE } from "./ajinomoto/epilogue";
import { CASE_STEP_1 } from "./ajinomoto/etape-1";
import { CASE_STEP_2 } from "./ajinomoto/etape-2";
import { CASE_STEP_3 } from "./ajinomoto/etape-3";
import { CASE_STEP_4 } from "./ajinomoto/etape-4";
import { CASE_STEP_5 } from "./ajinomoto/etape-5";
import { CASE_STEP_6 } from "./ajinomoto/etape-6";
import { CASE_STEP_7 } from "./ajinomoto/etape-7";
import { CASE_STEP_8 } from "./ajinomoto/etape-8";
import { CASE_STEP_9 } from "./ajinomoto/etape-9";
import {
  CASE_COMPANY_NAME,
  CASE_PROFILE,
  CASE_STRATEGIC_QUESTION,
} from "./ajinomoto/profil";
import type { CaseEpilogue, CaseStatement } from "./types";

// ==================== TYPES ====================

export type PracticeCase = {
  code: string;
  statement: CaseStatement;
  epilogue: CaseEpilogue;
  /** Étude ouverte pour l'acheteur. */
  companyName: string;
  strategicQuestion: string;
  profile: ProfileData;
  /** Corrigé de chaque étape (contenu des modèles d'étape). */
  corrections: Record<StepNo, unknown>;
};

// ==================== CAS ====================

const CASES: Record<string, PracticeCase> = {
  ajinomoto: {
    code: "ajinomoto",
    statement: AJINOMOTO_STATEMENT,
    epilogue: AJINOMOTO_EPILOGUE,
    companyName: CASE_COMPANY_NAME,
    strategicQuestion: CASE_STRATEGIC_QUESTION,
    profile: CASE_PROFILE,
    corrections: {
      1: CASE_STEP_1,
      2: CASE_STEP_2,
      3: CASE_STEP_3,
      4: CASE_STEP_4,
      5: CASE_STEP_5,
      6: CASE_STEP_6,
      7: CASE_STEP_7,
      8: CASE_STEP_8,
      9: CASE_STEP_9,
    },
  },
};

/**
 * Cas d'entraînement par son code.
 * @param code - Code du cas (« ajinomoto »)
 * @returns Cas, ou null si le code est inconnu
 */
export function getPracticeCase(code: string): PracticeCase | null {
  return Object.hasOwn(CASES, code) ? CASES[code] : null;
}
