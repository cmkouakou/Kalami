/**
 * =============================================================
 *  Fichier    : sprints.ts (guide)
 *  Projet     : Kalami Données
 *  Description: Registre des 7 sprints du chantier BRVM Power BI : ordre, recherche par
 *               adresse, voisins, cases à cocher de chaque sprint et calcul d'avancement
 *               (un sprint est terminé quand toutes ses cases sont cochées, comme dans le
 *               guide d'origine).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: guide/sprints/sprint-1.ts … sprint-7.ts
 * =============================================================
 */

import type { ContentBlock } from "@/lib/powerbi/content";

import { sprint1 } from "./sprints/sprint-1";
import { sprint2 } from "./sprints/sprint-2";
import { sprint3 } from "./sprints/sprint-3";
import { sprint4 } from "./sprints/sprint-4";
import { sprint5 } from "./sprints/sprint-5";
import { sprint6 } from "./sprints/sprint-6";
import { sprint7 } from "./sprints/sprint-7";
import type { Sprint } from "./types";

export type { Sprint } from "./types";

/** Les sprints, dans l'ordre du chantier. */
export const SPRINTS: readonly Sprint[] = [
  sprint1,
  sprint2,
  sprint3,
  sprint4,
  sprint5,
  sprint6,
  sprint7,
];

/** Retourne le sprint d'une adresse, ou null. */
export function getSprint(slug: string): Sprint | null {
  return SPRINTS.find((s) => s.slug === slug) ?? null;
}

/** Sprints précédent et suivant. */
export function getSprintsVoisins(slug: string): {
  precedent: Sprint | null;
  suivant: Sprint | null;
} {
  const i = SPRINTS.findIndex((s) => s.slug === slug);
  if (i === -1) return { precedent: null, suivant: null };
  return { precedent: SPRINTS[i - 1] ?? null, suivant: SPRINTS[i + 1] ?? null };
}

/** Identifiants des cases à cocher d'une suite de blocs, notions comprises. */
function casesDe(blocs: readonly ContentBlock[]): string[] {
  return blocs.flatMap((b) => {
    if (b.kind === "checklist") return b.items.map((item) => item.id);
    if (b.kind === "notion") return casesDe(b.contenu);
    return [];
  });
}

/** Identifiants des cases à cocher d'un sprint. */
export function getCases(sprint: Sprint): string[] {
  return casesDe(sprint.contenu);
}

/** Toutes les cases du chantier : seules ces valeurs peuvent être enregistrées. */
export const TOUTES_LES_CASES: ReadonlySet<string> = new Set(SPRINTS.flatMap(getCases));

/** Avancement d'un sprint selon les cases cochées. */
export function getAvancementSprint(
  sprint: Sprint,
  coches: ReadonlySet<string>,
): { cochees: number; total: number; termine: boolean } {
  const cases = getCases(sprint);
  const cochees = cases.filter((id) => coches.has(id)).length;
  return { cochees, total: cases.length, termine: cases.length > 0 && cochees === cases.length };
}
