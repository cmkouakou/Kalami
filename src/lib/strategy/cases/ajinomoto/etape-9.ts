/**
 * =============================================================
 *  Fichier    : etape-9.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 9 (plan) : le plan est
 *               assemblé à partir des étapes 5 à 8 du corrigé par le même code que pour
 *               les études des utilisateurs, à une date fixe (fin de la mission, 2016).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/plan-assemble.ts, profil.ts, etape-5.ts à etape-8.ts
 * =============================================================
 */

import "server-only";

import { assemblePlan } from "@/lib/strategy/plan-assemble";
import type { PlanPayload } from "@/lib/strategy/templates/plan";

import { CASE_STEP_5 } from "./etape-5";
import { CASE_STEP_6 } from "./etape-6";
import { CASE_STEP_7 } from "./etape-7";
import { CASE_STEP_8 } from "./etape-8";
import {
  CASE_COMPANY_NAME,
  CASE_PROFILE,
  CASE_STRATEGIC_QUESTION,
} from "./profil";

// ==================== CORRIGÉ ====================

/** Date de génération affichée : remise du plan à la direction régionale. */
const PLAN_DATE = new Date("2016-06-30T12:00:00Z");

export const CASE_STEP_9: PlanPayload = assemblePlan(
  {
    companyName: CASE_COMPANY_NAME,
    question: CASE_STRATEGIC_QUESTION,
    profile: CASE_PROFILE,
    synthesis: CASE_STEP_5,
    direction: CASE_STEP_6,
    choice: CASE_STEP_7,
    action: CASE_STEP_8,
  },
  PLAN_DATE,
);
