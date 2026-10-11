/**
 * =============================================================
 *  Fichier    : stakeholders.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 4 (cahier des charges §5.4) : parties prenantes, attentes,
 *               pouvoir et intérêt de 1 à 5 (« fort » à partir de 3), case de la matrice
 *               pouvoir-intérêt calculée ou placée à la main, niveau d'engagement actuel et
 *               souhaité, approche et actions. Schéma Zod, lecture tolérante et liste de
 *               contrôle (miroir de strategy_checklist_ok en SQL).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 *  Dépendances: zod, templates/common.ts
 * =============================================================
 */

import { z } from "zod";

import {
  asObject,
  freeText,
  itemId,
  readList,
  type ChecklistItem,
} from "@/lib/strategy/templates/common";

// ==================== RÉFÉRENCES ====================

/**
 * Cases de la matrice pouvoir-intérêt :
 * manage (pouvoir fort, intérêt fort), satisfy (pouvoir fort, intérêt faible),
 * inform (pouvoir faible, intérêt fort), monitor (pouvoir faible, intérêt faible).
 */
export const STAKE_QUADRANTS = ["manage", "satisfy", "inform", "monitor"] as const;

export type StakeQuadrant = (typeof STAKE_QUADRANTS)[number];

/** Niveaux d'engagement : ignorant, réfractaire, neutre, favorable, moteur. */
export const ENGAGEMENTS = ["unaware", "resistant", "neutral", "supportive", "leading"] as const;

export type Engagement = (typeof ENGAGEMENTS)[number];

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 5;
/** Seuil à partir duquel le pouvoir ou l'intérêt est « fort ». */
export const LEVEL_HIGH = 3;
export const STAKEHOLDERS_MAX = 40;
/** Minimum de parties prenantes nommées (choisi par l'auteur). */
export const STAKEHOLDERS_MIN = 5;

/** Cases « pouvoir fort » : il faut au moins une partie prenante dans l'une d'elles. */
export const HIGH_POWER: readonly StakeQuadrant[] = ["manage", "satisfy"];
const NAME_MAX = 200;
const TEXT_MAX = 1500;

// ==================== SCHÉMAS ====================

const level = z.number().int().min(LEVEL_MIN).max(LEVEL_MAX).nullable();

const stakeholderSchema = z.object({
  id: itemId,
  name: freeText(NAME_MAX),
  expectations: freeText(TEXT_MAX),
  power: level,
  interest: level,
  /** Case choisie à la main ; null = case calculée depuis le pouvoir et l'intérêt. */
  quadrantOverride: z.enum(STAKE_QUADRANTS).nullable(),
  engagementCurrent: z.enum(ENGAGEMENTS).nullable(),
  engagementDesired: z.enum(ENGAGEMENTS).nullable(),
  approach: freeText(TEXT_MAX),
  actions: freeText(TEXT_MAX),
});

export type Stakeholder = z.infer<typeof stakeholderSchema>;

export const stakeholdersSchema = z.object({
  stakeholders: z.array(stakeholderSchema).max(STAKEHOLDERS_MAX),
});

export type StakeholdersPayload = z.infer<typeof stakeholdersSchema>;

// ==================== CONTENU VIDE ====================

/** Gabarit vide (étape jamais enregistrée). */
export function emptyStakeholders(): StakeholdersPayload {
  return { stakeholders: [] };
}

/**
 * Nouvelle partie prenante vide.
 * @param id - Identifiant unique (crypto.randomUUID côté navigateur)
 */
export function newStakeholder(id: string): Stakeholder {
  return {
    id,
    name: "",
    expectations: "",
    power: null,
    interest: null,
    quadrantOverride: null,
    engagementCurrent: null,
    engagementDesired: null,
    approach: "",
    actions: "",
  };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; les parties prenantes invalides sont écartées.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readStakeholders(raw: unknown): StakeholdersPayload {
  const source = asObject(raw);
  return { stakeholders: readList(source.stakeholders, stakeholderSchema, STAKEHOLDERS_MAX) };
}

// ==================== MATRICE POUVOIR-INTÉRÊT ====================

/**
 * Case calculée depuis le pouvoir et l'intérêt (fort à partir de LEVEL_HIGH).
 * @returns Case, ou null tant que le pouvoir ou l'intérêt manque
 */
export function autoQuadrant(stakeholder: Stakeholder): StakeQuadrant | null {
  const { power, interest } = stakeholder;
  if (power === null || interest === null) return null;
  if (power >= LEVEL_HIGH) return interest >= LEVEL_HIGH ? "manage" : "satisfy";
  return interest >= LEVEL_HIGH ? "inform" : "monitor";
}

/** Case affichée : celle choisie à la main, sinon la case calculée. */
export function quadrantOf(stakeholder: Stakeholder): StakeQuadrant | null {
  return stakeholder.quadrantOverride ?? autoQuadrant(stakeholder);
}

// ==================== LISTE DE CONTRÔLE ====================

/** Parties prenantes nommées (les fiches sans nom sont ignorées). */
export function namedStakeholders(payload: StakeholdersPayload): Stakeholder[] {
  return payload.stakeholders.filter((s) => s.name.trim().length > 0);
}

/** Vrai si aucune partie prenante nommée ne figure dans une case « pouvoir fort ». */
export function noHighPower(payload: StakeholdersPayload): boolean {
  return !namedStakeholders(payload).some((s) => {
    const quadrant = quadrantOf(s);
    return quadrant !== null && HIGH_POWER.includes(quadrant);
  });
}

export type StakeholdersChecklistKey = "count" | "placed" | "highPower";

/**
 * Liste de contrôle : au moins STAKEHOLDERS_MIN parties prenantes nommées, toutes placées
 * dans la matrice, et au moins une dans « gérer de près » ou « garder satisfaits ».
 */
export function stakeholdersChecklist(
  payload: StakeholdersPayload,
): ChecklistItem<StakeholdersChecklistKey>[] {
  const named = namedStakeholders(payload);
  return [
    { key: "count", ok: named.length >= STAKEHOLDERS_MIN },
    { key: "placed", ok: named.length > 0 && named.every((s) => quadrantOf(s) !== null) },
    { key: "highPower", ok: !noHighPower(payload) },
  ];
}
