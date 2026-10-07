/**
 * =============================================================
 *  Fichier    : use-protection.ts (reader)
 *  Projet     : Kalami
 *  Description: Protection du texte dans la liseuse : sélection, menu contextuel, glisser,
 *               copier/couper et raccourcis Ctrl/Cmd + C, X, A, P, S, U bloqués.
 *               L'impression est masquée par CSS (@media print). Dissuasif seulement : les
 *               captures d'écran restent possibles, d'où le filigrane personnel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: react
 * =============================================================
 */

"use client";

import { type RefObject, useEffect } from "react";

/** Touches bloquées avec Ctrl (ou Cmd sur macOS). */
const BLOCKED_KEYS = new Set(["c", "x", "a", "p", "s", "u"]);

/** Vrai si l'événement vient d'un champ de saisie (recherche, nom de signet). */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Active la protection sur la zone de la liseuse.
 * @param ref - Racine de la liseuse
 */
export function useProtection(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const block = (event: Event) => {
      if (!isEditable(event.target)) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && BLOCKED_KEYS.has(key) && !isEditable(event.target)) {
        event.preventDefault();
      }
    };

    const rootEvents = ["contextmenu", "selectstart", "dragstart"] as const;
    const documentEvents = ["copy", "cut"] as const;
    rootEvents.forEach((name) => root.addEventListener(name, block));
    documentEvents.forEach((name) => document.addEventListener(name, block));
    document.addEventListener("keydown", onKeyDown);

    return () => {
      rootEvents.forEach((name) => root.removeEventListener(name, block));
      documentEvents.forEach((name) => document.removeEventListener(name, block));
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref]);
}
