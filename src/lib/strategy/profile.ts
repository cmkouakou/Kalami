/**
 * =============================================================
 *  Fichier    : profile.ts
 *  Projet     : Kalami Stratégie
 *  Description: Profil de l'entreprise (cahier des charges §3.2) : schéma Zod, lecture du
 *               formulaire et règle « profil complet » (miroir de la fonction SQL
 *               strategy_profile_complete). Périmètre : entreprise entière ou division /
 *               département d'une entreprise mère (S4b).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-13
 *  Dépendances: zod
 * =============================================================
 */

import { z } from "zod";

// ==================== LIMITES ====================

export const COMPANY_NAME_MAX = 200;
export const QUESTION_MAX = 1000;
const TEXT_MAX = 120;
const ITEM_MAX = 200;
const LIST_MAX = 50;
const CURRENT_YEAR = new Date().getFullYear();

// ==================== SCHÉMAS ====================

/** Périmètre étudié : l'entreprise entière ou une de ses divisions / départements. */
export const SCOPES = ["company", "unit"] as const;
export type Scope = (typeof SCOPES)[number];

/** Liste de textes courts (une entrée par ligne dans le formulaire). */
const textList = z.array(z.string().trim().min(1).max(ITEM_MAX)).max(LIST_MAX);

/** Équipe de l'organigramme simplifié. */
const teamSchema = z.object({
  role: z.string().trim().min(1).max(TEXT_MAX),
  headcount: z.number().int().min(0).max(1_000_000).nullable(),
});

/** Réponses du questionnaire stockées dans company_profiles.data. */
export const profileDataSchema = z.object({
  scope: z.enum(SCOPES),
  /** Entreprise dont fait partie la division étudiée (périmètre « unit »). */
  parentCompany: z.string().trim().max(COMPANY_NAME_MAX),
  sector: z.string().trim().max(TEXT_MAX),
  employees: z.number().int().min(0).max(10_000_000).nullable(),
  revenueRange: z.string().trim().max(TEXT_MAX),
  foundedYear: z.number().int().min(1800).max(CURRENT_YEAR).nullable(),
  countries: textList,
  cities: textList,
  markets: textList,
  teams: z.array(teamSchema).max(LIST_MAX),
  offers: textList,
  clients: textList,
  competitors: textList,
});

export type ProfileData = z.infer<typeof profileDataSchema>;

/** Contenu complet du formulaire : nom et question (table studies) + réponses. */
export const profileInputSchema = z.object({
  companyName: z.string().trim().min(1).max(COMPANY_NAME_MAX),
  strategicQuestion: z.string().trim().max(QUESTION_MAX),
  data: profileDataSchema,
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Profil vide (étude qui vient d'être créée). */
export const EMPTY_PROFILE: ProfileData = {
  scope: "company",
  parentCompany: "",
  sector: "",
  employees: null,
  revenueRange: "",
  foundedYear: null,
  countries: [],
  cities: [],
  markets: [],
  teams: [],
  offers: [],
  clients: [],
  competitors: [],
};

// ==================== LECTURE ====================

/**
 * Relit un profil enregistré ; les champs absents ou invalides prennent la valeur vide.
 * @param raw - Contenu JSON de company_profiles.data
 */
export function readProfileData(raw: unknown): ProfileData {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof ProfileData)[]) {
    const parsed = profileDataSchema.shape[key].safeParse(source[key]);
    if (parsed.success) Object.assign(result, { [key]: parsed.data });
  }
  return result;
}

/** Texte d'un champ du formulaire (chaîne vide si absent). */
function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Entier facultatif : null si vide, NaN si non numérique (refusé par le schéma). */
function optionalInt(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "");
  return trimmed === "" ? null : Number(trimmed);
}

/** Lignes non vides d'une zone de texte, sans doublons. */
export function lines(value: string): string[] {
  const items = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return [...new Set(items)];
}

/**
 * Lit et valide le formulaire du profil.
 * @param formData - Données envoyées
 * @returns Profil validé, ou la liste des champs en erreur
 */
export function parseProfileForm(
  formData: FormData,
): { ok: true; value: ProfileInput } | { ok: false; fields: string[] } {
  const roles = formData.getAll("team_role").map((v) => (typeof v === "string" ? v.trim() : ""));
  const counts = formData.getAll("team_headcount").map((v) => (typeof v === "string" ? v : ""));
  const teams = roles
    .map((role, i) => ({ role, headcount: optionalInt(counts[i] ?? "") }))
    .filter((team) => team.role.length > 0);

  const candidate = {
    companyName: text(formData, "companyName"),
    strategicQuestion: text(formData, "strategicQuestion"),
    data: {
      scope: text(formData, "scope") === "unit" ? "unit" : "company",
      parentCompany: text(formData, "scope") === "unit" ? text(formData, "parentCompany") : "",
      sector: text(formData, "sector"),
      employees: optionalInt(text(formData, "employees")),
      revenueRange: text(formData, "revenueRange"),
      foundedYear: optionalInt(text(formData, "foundedYear")),
      countries: lines(text(formData, "countries")),
      cities: lines(text(formData, "cities")),
      markets: lines(text(formData, "markets")),
      teams,
      offers: lines(text(formData, "offers")),
      clients: lines(text(formData, "clients")),
      competitors: lines(text(formData, "competitors")),
    },
  };

  const parsed = profileInputSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, value: parsed.data };
  // Nom du champ fautif : « companyName » ou la clé dans data (« employees »…)
  const fields = parsed.error.issues.map((issue) =>
    String(issue.path[0] === "data" ? issue.path[1] : issue.path[0]),
  );
  return { ok: false, fields: [...new Set(fields)] };
}

// ==================== RÈGLE MÉTIER ====================

/** Réponses indispensables pour ouvrir les étapes 1 à 4. */
export const REQUIRED_FIELDS = ["strategicQuestion", "sector", "countries", "offers"] as const;

/**
 * Champs indispensables encore vides (même règle que strategy_profile_complete en SQL).
 * @param strategicQuestion - Question stratégique de l'étude
 * @param data              - Réponses du questionnaire
 */
export function missingProfileFields(
  strategicQuestion: string,
  data: ProfileData,
): (typeof REQUIRED_FIELDS)[number][] {
  const missing: (typeof REQUIRED_FIELDS)[number][] = [];
  if (strategicQuestion.trim() === "") missing.push("strategicQuestion");
  if (data.sector.trim() === "") missing.push("sector");
  if (data.countries.length === 0) missing.push("countries");
  if (data.offers.length === 0) missing.push("offers");
  return missing;
}

/** Vrai si le profil permet d'ouvrir les étapes 1 à 4. */
export function isProfileComplete(strategicQuestion: string, data: ProfileData): boolean {
  return missingProfileFields(strategicQuestion, data).length === 0;
}
