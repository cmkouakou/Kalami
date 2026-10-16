/**
 * =============================================================
 *  Fichier    : element-editors.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Verrouillage doux (S9c) : indicateur « X modifie cet élément », placé par la
 *               pastille de commentaire de chaque élément d'un gabarit. Simple avertissement :
 *               les champs restent modifiables (le contrôle de révision protège les données).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: presence-context.tsx, lib/strategy/presence.ts
 * =============================================================
 */

"use client";

import { usePresence } from "@/components/strategy/presence/presence-context";
import { IconPencil } from "@/components/ui/icons";
import { getDictionary, interpolate } from "@/i18n";
import { editorsOf, initials } from "@/lib/strategy/presence";

const pr = getDictionary().strategy.presence;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Liste de noms lisible : « A », « A et B », « A, B et C ».
 * @param names - Noms des membres
 */
export function joinNames(names: string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")}${pr.and}${names[names.length - 1]}`;
}

// ==================== COMPOSANT ====================

/**
 * Indicateur « X modifie cet élément » (verrouillage doux).
 * @param targetId - Identifiant de l'élément dans le gabarit
 */
export function ElementEditors({ targetId }: { targetId: string }) {
  const presence = usePresence();
  if (!presence || presence.stepNo === null) return null;
  const names = editorsOf(presence.peers, presence.stepNo, targetId);
  if (names.length === 0) return null;
  const text = interpolate(names.length > 1 ? pr.editingElementMany : pr.editingElement, {
    names: joinNames(names),
  });

  return (
    <span
      role="status"
      title={text}
      className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full bg-warning/20
        px-2 text-small font-medium"
    >
      <IconPencil size={14} />
      <span aria-hidden="true">{names.map(initials).join(", ")}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
