/**
 * =============================================================
 *  Fichier    : lien-en-cours.tsx
 *  Projet     : Kalami Données
 *  Description: Signal discret posé dans un lien « précédent / suivant » : un point
 *               pulse dès le clic, tant que la page demandée n'est pas affichée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: next/link (useLinkStatus), powerbi.css (classe .lien-attente)
 * =============================================================
 */

"use client";

import { useLinkStatus } from "next/link";

/** Point d'attente, visible seulement pendant la navigation du lien parent. */
export function LienEnCours() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={pending ? "lien-attente actif" : "lien-attente"} />;
}
