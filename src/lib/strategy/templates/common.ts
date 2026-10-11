/**
 * =============================================================
 *  Fichier    : common.ts
 *  Projet     : Kalami Stratégie
 *  Description: Briques communes des gabarits : identifiant d'élément, lecture tolérante
 *               d'une liste JSON (les éléments invalides sont écartés, pas toute la liste)
 *               et forme d'une liste de contrôle avant validation.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: zod
 * =============================================================
 */

import { z } from "zod";

// ==================== SCHÉMAS ====================

/** Identifiant d'un élément de gabarit (UUID généré par le navigateur). */
export const itemId = z.string().regex(/^[A-Za-z0-9-]{1,40}$/);

/** Texte libre borné ; vide accepté pendant la saisie (la liste de contrôle tranche). */
export function freeText(max: number) {
  return z.string().max(max);
}

// ==================== LECTURE ====================

/**
 * Relit une liste enregistrée en ne gardant que les éléments valides.
 * @param raw    - Valeur JSON lue en base
 * @param schema - Schéma d'un élément
 * @param max    - Nombre maximal d'éléments conservés
 */
export function readList<T>(raw: unknown, schema: z.ZodType<T>, max: number): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }).slice(0, max);
}

/** Objet JSON (ou objet vide si la valeur n'en est pas un). */
export function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

// ==================== LISTE DE CONTRÔLE ====================

/** Un point de la liste de contrôle ; key renvoie au texte de fr-strategy.ts (checklist). */
export type ChecklistItem<K extends string = string> = { key: K; ok: boolean };

/** Vrai si tous les points sont remplis. */
export function checklistOk(items: ChecklistItem[]): boolean {
  return items.every((item) => item.ok);
}
