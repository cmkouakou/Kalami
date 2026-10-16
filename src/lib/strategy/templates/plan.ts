/**
 * =============================================================
 *  Fichier    : plan.ts
 *  Projet     : Kalami Stratégie
 *  Description: Contenu de l'étape 9, « Plan stratégique » (cahier des charges §3.5) : huit
 *               sections faites de paragraphes, chacun relié à ses sources (étape et
 *               identifiant de l'élément d'origine) pour l'annexe de traçabilité. Schéma Zod,
 *               lecture tolérante et outils d'édition. Le plan ne se valide jamais.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: zod, templates/common.ts
 * =============================================================
 */

import { z } from "zod";

import { asObject, freeText, itemId, readList } from "@/lib/strategy/templates/common";

// ==================== RÉFÉRENCES ====================

/** Sections du plan, dans l'ordre du cahier des charges. */
export const PLAN_SECTIONS = [
  "situation",
  "issues",
  "direction",
  "strategy",
  "workstreams",
  "objectives",
  "risks",
  "monitoring",
] as const;

export type PlanSectionKey = (typeof PLAN_SECTIONS)[number];

/**
 * Étapes qu'un paragraphe peut citer : 0 pour le profil, 5 à 8 pour les étapes validées.
 * Les analyses 1 à 4 sont citées à travers la SWOT de l'étape 5, qui garde leur origine.
 */
export const PLAN_SOURCE_STEPS = [0, 5, 6, 7, 8] as const;

export type PlanSourceStep = (typeof PLAN_SOURCE_STEPS)[number];

/** Origine d'une section : assemblée depuis les étapes, rédigée par le coach, modifiée. */
export const SECTION_ORIGINS = ["assembled", "coach", "edited"] as const;

export type SectionOrigin = (typeof SECTION_ORIGINS)[number];

export const BLOCKS_MAX = 20;
export const BLOCK_TEXT_MAX = 3000;
export const SOURCES_MAX = 40;

// ==================== SCHÉMAS ====================

const sourceSchema = z.object({
  step: z.union([z.literal(0), z.literal(5), z.literal(6), z.literal(7), z.literal(8)]),
  id: itemId,
});

export type PlanSource = z.infer<typeof sourceSchema>;

const blockSchema = z.object({
  id: itemId,
  text: freeText(BLOCK_TEXT_MAX),
  sources: z.array(sourceSchema).max(SOURCES_MAX),
});

export type PlanBlock = z.infer<typeof blockSchema>;

const sectionSchema = z.object({
  key: z.enum(PLAN_SECTIONS),
  origin: z.enum(SECTION_ORIGINS),
  blocks: z.array(blockSchema).max(BLOCKS_MAX),
});

export type PlanSection = z.infer<typeof sectionSchema>;

/** Date ISO de la dernière génération complète, ou vide si le plan n'a jamais été généré. */
const generatedAtField = z.union([z.literal(""), z.iso.datetime({ offset: true })]);

export const planSchema = z.object({
  generatedAt: generatedAtField,
  sections: z.array(sectionSchema).length(PLAN_SECTIONS.length).refine(
    (sections) => sections.every((section, index) => section.key === PLAN_SECTIONS[index]),
  ),
});

export type PlanPayload = z.infer<typeof planSchema>;

// ==================== CONTENU VIDE ====================

/** Section vide. */
export function emptySection(key: PlanSectionKey): PlanSection {
  return { key, origin: "assembled", blocks: [] };
}

/** Plan jamais généré : huit sections vides. */
export function emptyPlan(): PlanPayload {
  return { generatedAt: "", sections: PLAN_SECTIONS.map(emptySection) };
}

/** Nouveau paragraphe vide (ajouté à la main, sans source). */
export function newBlock(id: string): PlanBlock {
  return { id, text: "", sources: [] };
}

// ==================== LECTURE ====================

/**
 * Relit le plan enregistré : sections remises dans l'ordre, sections absentes vides,
 * paragraphes et sources invalides écartés.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readPlan(raw: unknown): PlanPayload {
  const source = asObject(raw);
  const stored = Array.isArray(source.sections) ? source.sections : [];
  const generatedAt = generatedAtField.safeParse(source.generatedAt);
  return {
    generatedAt: generatedAt.success ? generatedAt.data : "",
    sections: PLAN_SECTIONS.map((key) => {
      const found = asObject(stored.find((item) => asObject(item).key === key));
      const origin = z.enum(SECTION_ORIGINS).safeParse(found.origin);
      const blocks = readList(found.blocks, z.unknown(), BLOCKS_MAX).flatMap((item) => {
        const block = asObject(item);
        const id = itemId.safeParse(block.id);
        if (!id.success || typeof block.text !== "string") return [];
        return [{
          id: id.data,
          text: block.text.slice(0, BLOCK_TEXT_MAX),
          sources: readList(block.sources, sourceSchema, SOURCES_MAX),
        }];
      });
      return { key, origin: origin.success ? origin.data : "edited", blocks };
    }),
  };
}

/** Vrai si le plan a déjà été généré au moins une fois. */
export function isGenerated(plan: PlanPayload): boolean {
  return plan.generatedAt !== "";
}

// ==================== ÉDITION ====================

/**
 * Remplace une section ; les autres sont inchangées.
 * @param plan    - Plan actuel
 * @param section - Nouvelle section (sa clé désigne celle remplacée)
 * @returns Nouveau plan (l'original n'est pas modifié)
 */
export function replaceSection(plan: PlanPayload, section: PlanSection): PlanPayload {
  return {
    ...plan,
    sections: plan.sections.map((item) => (item.key === section.key ? section : item)),
  };
}

/**
 * Applique une modification à une section et la marque « modifiée ».
 * @param plan   - Plan actuel
 * @param key    - Section modifiée
 * @param blocks - Nouveaux paragraphes
 */
export function editSection(
  plan: PlanPayload,
  key: PlanSectionKey,
  blocks: PlanBlock[],
): PlanPayload {
  return replaceSection(plan, { key, origin: "edited", blocks: blocks.slice(0, BLOCKS_MAX) });
}

/** Clé unique d'une source (pour les ensembles et l'annexe). */
export function sourceKey(source: PlanSource): string {
  return `${source.step}:${source.id}`;
}
