/**
 * =============================================================
 *  Fichier    : essentiel.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: L'essentiel du cours pour une étape de Kalami Stratégie, transmis au coach
 *               comme source au même titre que le livre (v0.41.0). Pour chaque leçon des
 *               modules rattachés à l'étape : la fiche de fin de leçon et les encadrés
 *               « À retenir », « Piège fréquent » et « Définition ». Les récits « Sur le
 *               terrain », exercices et notions dépliables sont laissés de côté pour garder
 *               le message court. Les fondements (module 1, sans étape) s'ajoutent aux
 *               étapes de décision (6 à 8). Essentiel du plan (étape 9) : étapes 8 et 9.
 *               Fonctions pures, résultat mis en mémoire par étape.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/modules.ts, lib/cours/lecons/index.ts, lib/cours/content.ts
 * =============================================================
 */

import type { ContenuLecon, EncadreBlock } from "@/lib/cours/content";
import { contenuLecon } from "@/lib/cours/lecons";
import { MODULES } from "@/lib/cours/modules";
import type { StepNo } from "@/lib/strategy/steps";

// ==================== CONSTANTES ====================

/** Préfixe de chaque encadré retenu, selon son ton. */
const PREFIXES: Partial<Record<EncadreBlock["ton"], string>> = {
  retenir: "À retenir",
  piege: "Piège fréquent",
  definition: "Définition",
};

/** Étapes de décision, qui reçoivent aussi les fondements (modules sans étape). */
const ETAPES_FONDEMENTS: readonly StepNo[] = [6, 7, 8];

/** Étapes dont l'essentiel accompagne la rédaction du plan. */
const ETAPES_PLAN: readonly StepNo[] = [8, 9];

/** Essentiel déjà construit, par étape (le cours ne change qu'au déploiement). */
const MEMOIRE = new Map<StepNo, string>();

// ==================== FONCTIONS UTILITAIRES ====================

/** Retire le gras Markdown (« **mot** ») du texte des leçons. */
function texteBrut(texte: string): string {
  return texte.replace(/\*\*/g, "").trim();
}

/**
 * Lignes d'un encadré retenu : préfixe, titre éventuel, texte, puis ses points.
 * @param bloc - Encadré de la leçon
 * @returns Lignes à ajouter (vide si le ton n'est pas retenu)
 */
function lignesEncadre(bloc: EncadreBlock): string[] {
  const prefixe = PREFIXES[bloc.ton];
  if (!prefixe) return [];
  const titre = bloc.titre ? ` (${texteBrut(bloc.titre)})` : "";
  const lignes = [`- ${prefixe}${titre} : ${texteBrut(bloc.texte)}`];
  for (const point of bloc.points ?? []) lignes.push(`  · ${texteBrut(point)}`);
  return lignes;
}

/**
 * Essentiel d'une leçon : fiche de fin de leçon puis encadrés retenus.
 * @param contenu - Blocs de la leçon
 * @returns Lignes de l'essentiel (vide si la leçon n'a rien à retenir)
 */
function lignesLecon(contenu: ContenuLecon): string[] {
  const encadres: string[] = [];
  const fiche: string[] = [];
  for (const bloc of contenu) {
    if (bloc.kind === "encadre") encadres.push(...lignesEncadre(bloc));
    if (bloc.kind === "fiche") fiche.push(...bloc.points.map((p) => `- ${texteBrut(p)}`));
  }
  return [...fiche, ...encadres];
}

// ==================== ESSENTIEL PAR ÉTAPE ====================

/**
 * Essentiel du cours pour une étape de Kalami Stratégie.
 *
 * @param etape - Étape de la démarche (1 à 9)
 * @returns Texte « Leçon m.l — titre » suivi des points ; chaîne vide si aucun module
 *          n'est rattaché à l'étape
 *
 * Exemple d'utilisation :
 *   const cours = essentielDuCours(1); // modules du macroenvironnement
 */
export function essentielDuCours(etape: StepNo): string {
  const deja = MEMOIRE.get(etape);
  if (deja !== undefined) return deja;

  const sections: string[] = [];
  const avecFondements = ETAPES_FONDEMENTS.includes(etape);
  const modules = MODULES.filter(
    (m) => m.etape === etape || (avecFondements && m.etape === null),
  );
  for (const mod of modules) {
    for (const lecon of mod.lecons) {
      const contenu = contenuLecon(lecon.id);
      const lignes = contenu ? lignesLecon(contenu) : [];
      if (lignes.length === 0) continue;
      sections.push([`Leçon ${mod.numero}.${lecon.numero} — ${lecon.titre}`, ...lignes].join("\n"));
    }
  }
  const texte = sections.join("\n\n");
  MEMOIRE.set(etape, texte);
  return texte;
}

/**
 * Essentiel du cours pour la rédaction du plan : fondements, mise en œuvre et suivi, cas
 * intégrateur (étapes 8 et 9).
 *
 * @returns Texte des leçons retenues
 */
export function essentielDuPlan(): string {
  return ETAPES_PLAN.map((etape) => essentielDuCours(etape)).filter(Boolean).join("\n\n");
}
