/**
 * =============================================================
 *  Fichier    : eac.ts
 *  Projet     : Kalami Stratégie
 *  Description: Liaison avec Entrepreneur au Combat (v0.26.0) : schéma Zod du dossier reçu,
 *               conversion des informations de l'entreprise en profil Kalami, lecture du
 *               contexte enregistré et réglages (clé partagée, compte propriétaire, budget
 *               du coach). Fonctions pures, sans accès base.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-17
 *  Dépendances: zod, lib/strategy/profile.ts, lib/admin/validation.ts
 * =============================================================
 */

import { z } from "zod";

import { isUuid } from "@/lib/admin/validation";
import {
  COMPANY_NAME_MAX,
  EMPTY_PROFILE,
  ITEM_MAX,
  LIST_MAX,
  QUESTION_MAX,
  TEXT_MAX,
  type ProfileData,
} from "@/lib/strategy/profile";

// ==================== LIMITES ====================

/** Longueur maximale d'une section de travail transmise (une des 4 étapes). */
export const CONTEXT_TEXT_MAX = 20_000;

/** Nombre maximal de membres de l'équipe EAC ajoutés à l'étude. */
export const MEMBERS_MAX = 10;

/** Budget du coach IA accordé par défaut à une étude EAC (dollars US). */
export const DEFAULT_COACH_BUDGET_USD = 6;

/** Les 4 étapes de la méthode, telles que nommées par EAC. */
export const EAC_STAGES = ["comprendre", "synthetiser", "decider", "agir"] as const;
export type EacStage = (typeof EAC_STAGES)[number];

// ==================== SCHÉMAS ====================

const shortText = z.string().trim().max(TEXT_MAX).default("");
const contextText = z.string().trim().max(CONTEXT_TEXT_MAX).default("");

/** Informations de l'entreprise, telles que saisies par l'entrepreneur dans EAC. */
const eacCompanySchema = z.object({
  secteur: shortText,
  domaine: shortText,
  pays: shortText,
  ville: shortText,
  anneeCreation: z.number().int().min(1800).max(2100).nullable().default(null),
  trancheCa: shortText,
  canauxVente: z.array(z.string().trim().max(ITEM_MAX)).max(LIST_MAX).default([]),
  concurrents: z.string().trim().max(5000).default(""),
});

/** Contexte du dossier, montré à l'équipe et transmis au coach. */
export const eacContextSchema = z.object({
  besoin: contextText,
  comprehension: contextText,
  etapes: z.object({
    comprendre: contextText,
    synthetiser: contextText,
    decider: contextText,
    agir: contextText,
  }).default({ comprendre: "", synthetiser: "", decider: "", agir: "" }),
});

export type EacContext = z.infer<typeof eacContextSchema>;

/** Corps de la requête POST /api/eac/etudes. */
export const eacOpenStudySchema = z.object({
  dossierId: z.string().refine(isUuid, "dossierId invalide"),
  dossierNumero: z.string().trim().max(50).default(""),
  companyName: z.string().trim().min(1).max(COMPANY_NAME_MAX),
  strategicQuestion: z.string().trim().max(QUESTION_MAX).default(""),
  company: eacCompanySchema,
  context: eacContextSchema,
  members: z.array(z.object({ email: z.email().max(254) })).max(MEMBERS_MAX).default([]),
});

export type EacOpenStudy = z.infer<typeof eacOpenStudySchema>;

// ==================== CONVERSION ====================

/**
 * Découpe un texte libre (lignes, virgules ou points-virgules) en éléments de liste.
 * @param raw - Texte saisi (ex. « Kalis, Dabo ; Sika »)
 * @returns Éléments non vides, sans doublons (casse ignorée), tronqués aux limites du profil
 */
export function splitList(raw: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    const item = part.trim().slice(0, ITEM_MAX);
    const key = item.toLowerCase();
    if (item.length === 0 || seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length === LIST_MAX) break;
  }
  return items;
}

/**
 * Convertit les informations d'entreprise d'EAC en profil Kalami. Les champs sans
 * équivalent (offres, clients, équipes, effectif exact) restent vides : l'équipe les
 * complète dans Kalami.
 * @param company - Informations reçues (déjà validées)
 * @returns Profil prêt à enregistrer
 *
 * Exemple : profileFromEac({ secteur: "Commerce", pays: "Côte d'Ivoire", ... })
 */
export function profileFromEac(company: EacOpenStudy["company"]): ProfileData {
  const sector = [company.secteur, company.domaine].filter((v) => v.length > 0).join(" — ");
  return {
    ...EMPTY_PROFILE,
    sector: sector.slice(0, TEXT_MAX),
    revenueRange: company.trancheCa,
    foundedYear: company.anneeCreation !== null && company.anneeCreation <= new Date().getFullYear()
      ? company.anneeCreation
      : null,
    countries: splitList(company.pays),
    cities: splitList(company.ville),
    markets: splitList(company.canauxVente.join("\n")),
    competitors: splitList(company.concurrents),
  };
}

/**
 * Relit le contexte enregistré dans study_external_links.context ; null s'il est illisible.
 * @param raw - Contenu JSON enregistré
 */
export function readEacContext(raw: unknown): EacContext | null {
  const parsed = eacContextSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Vrai si le contexte ne contient aucun texte (rien à montrer). */
export function isContextEmpty(context: EacContext): boolean {
  return context.besoin === "" && context.comprehension === ""
    && EAC_STAGES.every((stage) => context.etapes[stage] === "");
}

// ==================== RÉGLAGES ====================

/** Réglages de la liaison, lus dans l'environnement. */
export type EacSettings = { secret: string; ownerId: string; coachBudgetUsd: number };

/**
 * Lit les réglages de la liaison ; null si la clé ou le compte propriétaire manquent
 * (la liaison est alors désactivée).
 * @param env - Variables d'environnement (par défaut : process.env)
 */
export function eacSettings(env: Record<string, string | undefined> = process.env): EacSettings | null {
  const secret = env.EAC_API_SECRET?.trim() ?? "";
  const ownerId = env.EAC_OWNER_ID?.trim() ?? "";
  if (secret.length < 32 || !isUuid(ownerId)) return null;
  const raw = env.EAC_COACH_BUDGET_USD?.trim();
  const budget = raw ? Number(raw) : DEFAULT_COACH_BUDGET_USD;
  const coachBudgetUsd = Number.isFinite(budget) && budget >= 0 && budget <= 1000
    ? budget
    : DEFAULT_COACH_BUDGET_USD;
  return { secret, ownerId, coachBudgetUsd };
}

/**
 * Bloc de texte du contexte EAC pour le coach IA (données, pas des instructions).
 * @param context - Contexte relu
 * @returns Texte, vide si le contexte est vide
 */
export function eacContextLines(context: EacContext): string {
  if (isContextEmpty(context)) return "";
  const titles: Record<EacStage, string> = {
    comprendre: "Comprendre",
    synthetiser: "Synthétiser",
    decider: "Décider",
    agir: "Agir",
  };
  const parts = [
    context.besoin && `Besoin exprimé par l'entrepreneur :\n${context.besoin}`,
    context.comprehension && `Compréhension validée par l'entrepreneur :\n${context.comprehension}`,
    ...EAC_STAGES.map((stage) =>
      context.etapes[stage] && `Notes de l'équipe — ${titles[stage]} :\n${context.etapes[stage]}`),
  ];
  return parts.filter((part) => part).join("\n\n");
}
