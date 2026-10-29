/**
 * =============================================================
 *  Fichier    : workshop.ts
 *  Projet     : Kalami
 *  Description: Accès aux textes de l'atelier d'écriture, séparés du dictionnaire principal
 *               pour que les pages de la librairie ne les téléchargent pas.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: fr-workshop.ts
 * =============================================================
 */

import workshopFr from "./fr-workshop";

/** Structure des textes de l'atelier d'écriture. */
export type WorkshopDictionary = typeof workshopFr;

/** Retourne les textes de l'atelier d'écriture (français). */
export function getWorkshopDictionary(): WorkshopDictionary {
  return workshopFr;
}
