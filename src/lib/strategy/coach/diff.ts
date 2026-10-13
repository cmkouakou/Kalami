/**
 * =============================================================
 *  Fichier    : diff.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Comparaison ligne à ligne de deux versions d'une consigne du coach (plus
 *               longue sous-suite commune), pour montrer à l'administrateur ce qu'un
 *               brouillon change par rapport à la version publiée. Fonction pure.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Ligne de la comparaison : inchangée, retirée (ancienne version) ou ajoutée. */
export type DiffLine = { kind: "same" | "removed" | "added"; text: string };

/** Au-delà, la table serait trop lourde : les deux textes sont alors confrontés en bloc. */
const MAX_CELLS = 1_000_000;

// ==================== COMPARAISON ====================

/**
 * Compare deux textes ligne à ligne.
 *
 * @param before - Texte de référence (version publiée)
 * @param after  - Nouveau texte (brouillon)
 * @returns Lignes dans l'ordre de lecture, retraits avant ajouts à chaque écart
 *
 * Exemple d'utilisation :
 *   diffLines("a\nb", "a\nc") → same a, removed b, added c
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  if (a.length * b.length > MAX_CELLS) {
    return [
      ...a.map((text): DiffLine => ({ kind: "removed", text })),
      ...b.map((text): DiffLine => ({ kind: "added", text })),
    ];
  }

  // lengths[i][j] : longueur de la plus longue sous-suite commune de a[i..] et b[j..]
  const lengths = Array.from(
    { length: a.length + 1 },
    () => new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lengths[i][j] = a[i] === b[j]
        ? lengths[i + 1][j + 1] + 1
        : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ kind: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      result.push({ kind: "removed", text: a[i] });
      i += 1;
    } else {
      result.push({ kind: "added", text: b[j] });
      j += 1;
    }
  }
  for (; i < a.length; i += 1) result.push({ kind: "removed", text: a[i] });
  for (; j < b.length; j += 1) result.push({ kind: "added", text: b[j] });
  return result;
}

/** Vrai si la comparaison contient au moins une différence. */
export function hasChanges(lines: readonly DiffLine[]): boolean {
  return lines.some((line) => line.kind !== "same");
}
