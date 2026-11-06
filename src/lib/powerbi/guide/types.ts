/**
 * =============================================================
 *  Fichier    : types.ts (guide)
 *  Projet     : Kalami Données
 *  Description: Forme d'un sprint du chantier BRVM Power BI.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts
 * =============================================================
 */

import type { LessonContent } from "@/lib/powerbi/content";

/** Un sprint : une séance de travail dans Power BI, close par sa liste de cases. */
export type Sprint = {
  numero: number;
  /** Adresse : /powerbi/chantier/<slug> */
  slug: string;
  titre: string;
  /** Objectif de la séance, affiché sous le titre. */
  lede: string;
  contenu: LessonContent;
};
