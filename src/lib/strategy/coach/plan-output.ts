/**
 * =============================================================
 *  Fichier    : plan-output.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Forme de la réponse du coach quand il rédige une section du plan
 *               stratégique (fonction « plan », S8a) et nettoyage de cette réponse : textes
 *               tronqués, sources inconnues du catalogue rejetées, paragraphes sans source
 *               restante écartés et comptés. Le schéma envoyé à l'API reste sans bornes.
 *               Fonctions pures, utilisables côté client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: zod, lib/strategy/plan-trace.ts, templates/plan.ts
 * =============================================================
 */

import { z } from "zod";

import { knownSources, type CatalogEntry } from "@/lib/strategy/plan-trace";
import {
  BLOCK_TEXT_MAX,
  BLOCKS_MAX,
  SOURCES_MAX,
  type PlanBlock,
  type PlanSection,
  type PlanSectionKey,
  type PlanSource,
} from "@/lib/strategy/templates/plan";

// ==================== CONSTANTES ====================

const SUMMARY_MAX = 1500;

// ==================== SCHÉMA ENVOYÉ À L'API ====================

/** Réponse brute attendue du modèle (une section du plan). */
export const planOutputSchema = z.object({
  summary: z.string(),
  blocks: z.array(
    z.object({
      text: z.string(),
      sources: z.array(z.object({ step: z.number(), id: z.string() })),
    }),
  ),
});

export type PlanOutput = z.infer<typeof planOutputSchema>;

/** Proposition nettoyée, telle qu'enregistrée et affichée. */
export type PlanProposal = {
  summary: string;
  /** Section proposée (origine « coach »), prête à remplacer l'actuelle. */
  section: PlanSection;
  /** Paragraphes écartés faute de source connue. */
  dropped: number;
};

// ==================== NETTOYAGE ====================

/** Texte rogné puis tronqué. */
function clip(text: string, max: number): string {
  return text.trim().slice(0, max);
}

/**
 * Sources citées qui figurent au catalogue, recopiées depuis celui-ci (étape et
 * identifiant exacts), sans doublon et bornées.
 * @param sources - Sources proposées par le modèle
 * @param index   - Index du catalogue (clé « étape:id »)
 */
function citedSources(
  sources: PlanOutput["blocks"][number]["sources"],
  index: Map<string, CatalogEntry>,
): PlanSource[] {
  const found = sources.flatMap((source): PlanSource[] => {
    const entry = index.get(`${source.step}:${source.id.trim()}`);
    return entry ? [{ step: entry.step, id: entry.id }] : [];
  });
  return knownSources(found, index).slice(0, SOURCES_MAX);
}

/**
 * Nettoie la section rédigée par le coach.
 *
 * @param raw   - Réponse validée par planOutputSchema
 * @param key   - Section demandée
 * @param index - Index du catalogue des éléments citables
 * @returns Proposition : résumé, section d'origine « coach », paragraphes écartés
 *
 * Exemple d'utilisation :
 *   const proposal = sanitizePlan(raw, "risks", catalogIndex(sourceCatalog(inputs)));
 */
export function sanitizePlan(
  raw: PlanOutput,
  key: PlanSectionKey,
  index: Map<string, CatalogEntry>,
): PlanProposal {
  const blocks: PlanBlock[] = [];
  let dropped = 0;
  for (const item of raw.blocks) {
    const text = clip(item.text, BLOCK_TEXT_MAX);
    if (!text) continue;
    const sources = citedSources(item.sources, index);
    if (sources.length === 0 || blocks.length >= BLOCKS_MAX) {
      dropped += 1;
      continue;
    }
    blocks.push({ id: `coach-${key}-${blocks.length + 1}`, text, sources });
  }
  return {
    summary: clip(raw.summary, SUMMARY_MAX),
    section: { key, origin: "coach", blocks },
    dropped,
  };
}
