/**
 * =============================================================
 *  Fichier    : queries.ts (cases)
 *  Projet     : Kalami Stratégie
 *  Description: Lectures des cas d'entraînement : cas en vente (prix publics), accès du
 *               compte connecté, corrigé des seules étapes déverrouillées, liste de
 *               l'administration. Les fonctions SQL vérifient l'accès et le rôle. Liste
 *               des cas en vente pour la présentation de l'accueil (v0.14.2). Étude
 *               résolue de l'acheteur et comptes qui ont accès à un cas (v0.14.3). Cas du
 *               compte pour l'accueil (v0.14.4).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-24
 *  Dépendances: lib/supabase/server.ts, cases/registry.ts, cases/unlock.ts,
 *               migrations 20261113120000_practice_cases.sql,
 *               20261114120000_practice_case_example.sql
 * =============================================================
 */

import "server-only";

import type { StepNo } from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

import { getPracticeCase, listPracticeCaseCodes } from "./registry";
import { type CaseAccess, readUnlockedSteps, unlockedCorrections } from "./unlock";

// ==================== TYPES ====================

/** Cas en vente, avec ses prix (null : devise non proposée). */
export type CaseForSale = {
  code: string;
  title: string;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
};

/** Compte qui a accès à un cas, vu par l'administration. */
export type AdminCaseAccess = {
  email: string;
  source: CaseAccess["source"];
  grantedAt: string;
  hasStudy: boolean;
  hasExample: boolean;
};

/** Cas vu par l'administration. */
export type AdminPracticeCase = CaseForSale & {
  active: boolean;
  unlockImmediately: boolean;
  accessCount: number;
};

type CaseRow = {
  code: string;
  title: string;
  price_xof: number | string | null;
  price_eur: number | string | null;
  price_cad: number | string | null;
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Prix lu dans la base (numeric arrive parfois en texte). */
function price(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

/** Cas lu dans une ligne SQL. */
function toCase(row: CaseRow): CaseForSale {
  return {
    code: row.code,
    title: row.title,
    priceXof: price(row.price_xof),
    priceEur: price(row.price_eur),
    priceCad: price(row.price_cad),
  };
}

// ==================== ACHETEUR ====================

/**
 * Cas ouverts à la vente, dans l'ordre choisi par l'administration.
 * @returns Cas en vente (liste vide si la lecture échoue)
 */
export async function listCasesForSale(): Promise<CaseForSale[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("practice_case_list");
  if (error) {
    console.error("[cas] lecture impossible :", error.code, error.message);
    return [];
  }
  return ((data ?? []) as CaseRow[]).map(toCase);
}

/**
 * Un cas ouvert à la vente.
 * @param code - Code du cas
 * @returns Cas, ou null s'il est fermé ou inconnu
 */
export async function getCaseForSale(code: string): Promise<CaseForSale | null> {
  const cases = await listCasesForSale();
  return cases.find((item) => item.code === code) ?? null;
}

/**
 * Accès du compte connecté à un cas.
 * @param code - Code du cas
 * @returns Accès, ou null (pas d'accès, ou visiteur non connecté)
 */
export async function getMyCaseAccess(code: string): Promise<CaseAccess | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("practice_case_my_access", { p_code: code });
  if (error) {
    console.error("[cas] accès illisible :", error.code, error.message);
    return null;
  }
  const row = (data ?? [])[0] as
    | { study_id: string | null; example_study_id: string | null; unlocked_steps: unknown;
        unlock_immediately: boolean; source: CaseAccess["source"] }
    | undefined;
  if (!row) return null;
  return {
    studyId: row.study_id,
    exampleStudyId: row.example_study_id ?? null,
    unlockedSteps: readUnlockedSteps(row.unlocked_steps),
    unlockImmediately: row.unlock_immediately,
    source: row.source,
  };
}

/** Cas auquel le compte connecté a accès, en vente ou non. */
export type MyCase = { code: string; shortName: string };

/**
 * Cas auxquels le compte connecté a accès (achat ou accès accordé), même fermés à la vente.
 * @returns Cas accessibles (liste vide pour un visiteur)
 */
export async function listMyCases(): Promise<MyCase[]> {
  const codes = listPracticeCaseCodes();
  const accesses = await Promise.all(codes.map((code) => getMyCaseAccess(code)));
  return codes.flatMap((code, index) => {
    const practiceCase = getPracticeCase(code);
    return accesses[index] && practiceCase ? [{ code, shortName: practiceCase.shortName }] : [];
  });
}

/**
 * Corrigé des seules étapes déverrouillées (le reste ne quitte jamais le serveur).
 * @param code - Code du cas
 * @param access - Accès de l'acheteur
 * @returns Contenu par étape ouverte
 */
export function unlockedCaseCorrections(
  code: string,
  access: CaseAccess,
): Partial<Record<StepNo, unknown>> {
  const practiceCase = getPracticeCase(code);
  if (!practiceCase) return {};
  return Object.fromEntries(
    unlockedCorrections(access).map((step) => [step, practiceCase.corrections[step]]),
  );
}

// ==================== ADMINISTRATION ====================

/** Tous les cas, ouverts ou non, avec le nombre d'accès actifs (administrateur aal2). */
export async function listPracticeCasesForAdmin(): Promise<AdminPracticeCase[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_practice_cases");
  if (error) throw new Error(`Lecture des cas impossible : ${error.message}`);
  type AdminRow = CaseRow & {
    active: boolean;
    unlock_immediately: boolean;
    access_count: number | string;
  };
  return ((data ?? []) as AdminRow[]).map((row) => ({
    ...toCase(row),
    active: row.active,
    unlockImmediately: row.unlock_immediately,
    accessCount: Number(row.access_count),
  }));
}

/**
 * Comptes qui ont accès à un cas, du plus récent au plus ancien (administrateur aal2).
 * @param code - Code du cas
 */
export async function listCaseAccessesForAdmin(code: string): Promise<AdminCaseAccess[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_practice_case_accesses", { p_code: code });
  if (error) throw new Error(`Lecture des accès impossible : ${error.message}`);
  type AccessRow = {
    email: string;
    source: CaseAccess["source"];
    granted_at: string;
    has_study: boolean;
    has_example: boolean;
  };
  return ((data ?? []) as AccessRow[]).map((row) => ({
    email: row.email,
    source: row.source,
    grantedAt: row.granted_at,
    hasStudy: row.has_study,
    hasExample: row.has_example,
  }));
}
