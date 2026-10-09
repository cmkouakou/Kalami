/**
 * =============================================================
 *  Fichier    : use-protection.ts (reader)
 *  Projet     : Kalami
 *  Description: Protection du texte dans la liseuse : menu contextuel, glisser,
 *               copier/couper et raccourcis Ctrl/Cmd + C, X, A, P, S, U bloqués.
 *               La sélection n'est permise que dans le texte du livre (pour surligner,
 *               annoter, citer ou partager) et dans les références à citer, seules
 *               copiables. Une sélection trop longue est annulée. L'impression est masquée
 *               par CSS (@media print). Dissuasif seulement : les captures d'écran restent
 *               possibles, d'où le filigrane personnel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-10
 *  Dépendances: react, lib/reader/annotations.ts
 * =============================================================
 */

"use client";

import { type RefObject, useEffect } from "react";

import { MAX_QUOTE_LENGTH } from "@/lib/reader/annotations";

/** Touches bloquées avec Ctrl (ou Cmd sur macOS). */
const BLOCKED_KEYS = new Set(["c", "x", "a", "p", "s", "u"]);

/** Zones où la sélection est permise. */
const SELECTABLE = ".liseuse-texte, [data-selectionnable]";
/** Zones dont le texte peut être copié (références bibliographiques). */
const COPYABLE = "[data-selectionnable]";

/** Vrai si l'événement vient d'un champ de saisie (recherche, nom de signet, note). */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Élément d'un nœud (le parent pour un nœud texte). */
function elementOf(node: unknown): Element | null {
  if (node instanceof Element) return node;
  return node instanceof Node ? node.parentElement : null;
}

/** Vrai si un nœud est dans une zone correspondant au sélecteur. */
function isInside(node: unknown, selector: string): boolean {
  return Boolean(elementOf(node)?.closest(selector));
}

/** Vrai si la sélection courante est entièrement dans une référence à citer. */
function isCopyableSelection(): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  return isInside(range.startContainer, COPYABLE) && isInside(range.endContainer, COPYABLE);
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
    const onSelectStart = (event: Event) => {
      if (!isEditable(event.target) && !isInside(event.target, SELECTABLE)) {
        event.preventDefault();
      }
    };
    const onCopy = (event: Event) => {
      if (!isEditable(event.target) && !isCopyableSelection()) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!(event.ctrlKey || event.metaKey) || !BLOCKED_KEYS.has(key)) return;
      if (isEditable(event.target)) return;
      if (key === "c" && isCopyableSelection()) return;
      event.preventDefault();
    };
    // Sélection trop longue (copie déguisée par « Partager » du système) : annulée
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      if (!root.contains(selection.getRangeAt(0).commonAncestorContainer)) return;
      if (selection.toString().length > MAX_QUOTE_LENGTH) selection.removeAllRanges();
    };

    const rootEvents = ["contextmenu", "dragstart"] as const;
    const documentEvents = ["copy", "cut"] as const;
    rootEvents.forEach((name) => root.addEventListener(name, block));
    root.addEventListener("selectstart", onSelectStart);
    documentEvents.forEach((name) => document.addEventListener(name, onCopy));
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("selectionchange", onSelectionChange);

    return () => {
      rootEvents.forEach((name) => root.removeEventListener(name, block));
      root.removeEventListener("selectstart", onSelectStart);
      documentEvents.forEach((name) => document.removeEventListener(name, onCopy));
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [ref]);
}
