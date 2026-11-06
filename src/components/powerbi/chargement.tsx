/**
 * =============================================================
 *  Fichier    : chargement.tsx
 *  Projet     : Kalami Données
 *  Description: Écran d'attente des pages de l'espace /powerbi, affiché dès le clic
 *               pendant que le serveur prépare la page (vérification du compte,
 *               progression). Reprend la carte et les blocs du guide.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: i18n/powerbi, powerbi.css (classes .chargement, .card)
 * =============================================================
 */

import { getPowerbiDictionary } from "@/i18n/powerbi";

const d = getPowerbiDictionary();

/** Carte d'attente : titre et lignes estompées, annoncée aux lecteurs d'écran. */
export function ChargementPage() {
  return (
    <div className="chargement" role="status">
      <span className="sr-only">{d.chargement}</span>
      <div className="ligne courte" aria-hidden="true" />
      <div className="ligne titre" aria-hidden="true" />
      <div className="card stack" aria-hidden="true">
        <div className="ligne" />
        <div className="ligne" />
        <div className="ligne moyenne" />
      </div>
    </div>
  );
}
