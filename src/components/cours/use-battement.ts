/**
 * =============================================================
 *  Fichier    : use-battement.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Mesure du temps de formation. Un battement est envoyé à l'ouverture,
 *               puis toutes les 30 secondes tant que l'onglet est visible et que
 *               l'apprenant a bougé, tapé, défilé ou écouté la leçon dans les 2 dernières
 *               minutes. Le serveur ne cumule que des écarts de 2 minutes au plus.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/actions.ts (battement)
 * =============================================================
 */

"use client";

import { useEffect, useRef } from "react";

import { battement } from "@/lib/cours/actions";

/** Intervalle entre deux battements (ms). */
const INTERVALLE = 30_000;
/** Au-delà de ce délai sans activité, l'apprenant est considéré absent (ms). */
const INACTIVITE = 120_000;
/** Événements qui prouvent une activité. */
const EVENEMENTS = ["pointerdown", "keydown", "scroll", "pointermove"] as const;

/**
 * Envoie les battements de présence d'une leçon.
 * @param leconId - Identifiant stable de la leçon
 * @param ecoute  - Vrai pendant la lecture à voix haute (compte comme une activité)
 */
export function useBattement(leconId: string, ecoute: boolean): void {
  const derniere = useRef(0);
  const ecouteRef = useRef(ecoute);

  useEffect(() => {
    ecouteRef.current = ecoute;
  }, [ecoute]);

  useEffect(() => {
    derniere.current = Date.now();
    const actif = () => {
      derniere.current = Date.now();
    };
    const envoyer = () => {
      const present =
        Date.now() - derniere.current < INACTIVITE || ecouteRef.current;
      if (document.visibilityState === "visible" && present)
        void battement(leconId);
    };

    envoyer();
    const minuterie = window.setInterval(envoyer, INTERVALLE);
    for (const nom of EVENEMENTS)
      window.addEventListener(nom, actif, { passive: true });
    return () => {
      window.clearInterval(minuterie);
      for (const nom of EVENEMENTS) window.removeEventListener(nom, actif);
    };
  }, [leconId]);
}
