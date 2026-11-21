/**
 * =============================================================
 *  Fichier    : use-brouillon.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Garde dans le navigateur les réponses non envoyées (v0.44.0) : chaque
 *               choix ou frappe est enregistré aussitôt, et remis en place à la
 *               réouverture de la page, même après une fermeture brusque. Le stockage
 *               peut être indisponible (navigation privée) : la page marche sans lui.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: react 19.2+ (useEffectEvent), lib/cours/brouillon.ts (clés, validation)
 * =============================================================
 */

"use client";

import { useCallback, useEffect, useEffectEvent, useRef } from "react";

// ==================== STOCKAGE ====================

/** Lit une valeur JSON ; undefined si absente, illisible ou stockage indisponible. */
function lireStockage(cle: string): unknown {
  try {
    const texte = window.localStorage.getItem(cle);
    return texte === null ? undefined : JSON.parse(texte);
  } catch {
    return undefined;
  }
}

/** Écrit une valeur JSON, ou l'efface si elle vaut null (échec silencieux). */
function ecrireStockage(cle: string, valeur: unknown): void {
  try {
    if (valeur === null) window.localStorage.removeItem(cle);
    else window.localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // Stockage plein ou bloqué : le brouillon n'est simplement pas gardé
  }
}

// ==================== HOOK ====================

type Options<T> = {
  /** Valide la valeur gardée ; null pour l'écarter. */
  lire: (brut: unknown) => T | null;
  /** Remet la valeur gardée dans l'état du composant. */
  appliquer: (valeur: T) => void;
  /** Ce qu'il faut garder pour cette valeur ; null s'il n'y a rien à garder. */
  aGarder: (valeur: T) => unknown;
};

/**
 * Brouillon d'une saisie en cours.
 *
 * @param cle    - Clé de stockage (cleBrouillon), ou null pour ne rien garder
 * @param valeur - Saisie actuelle
 * @param options - Lecture validée, remise en place et valeur à garder
 * @returns Fonction qui efface le brouillon (à appeler une fois la réponse envoyée)
 *
 * Exemple d'utilisation :
 *   const effacer = useBrouillon(cle, valeurs, { lire, appliquer: setValeurs, aGarder });
 */
export function useBrouillon<T>(
  cle: string | null,
  valeur: T,
  { lire, appliquer, aGarder }: Options<T>,
): () => void {
  // Vrai juste après une remise en place : l'enregistrement suivant porterait encore
  // la valeur de départ et écraserait le brouillon, il est donc sauté une fois.
  const sauter = useRef(false);

  const restaurer = useEffectEvent((c: string) => {
    const brut = lireStockage(c);
    const garde = brut === undefined ? null : lire(brut);
    if (garde === null) return;
    sauter.current = true;
    appliquer(garde);
  });

  const enregistrer = useEffectEvent((c: string, v: T) => {
    if (sauter.current) {
      sauter.current = false;
      return;
    }
    ecrireStockage(c, aGarder(v));
  });

  useEffect(() => {
    if (cle) restaurer(cle);
  }, [cle]);

  useEffect(() => {
    if (cle) enregistrer(cle, valeur);
  }, [cle, valeur]);

  return useCallback(() => {
    if (cle) ecrireStockage(cle, null);
  }, [cle]);
}
