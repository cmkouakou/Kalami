/**
 * =============================================================
 *  Fichier    : brouillon.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Brouillons des réponses non envoyées (v0.44.0) : clé de stockage par
 *               compte, et relecture validée de ce que le navigateur a gardé (réponses
 *               d'exercices, de quiz et d'examen, texte des questions ouvertes, saisie
 *               des ateliers). Une valeur abîmée ou périmée (contenu modifié depuis) est
 *               écartée. Fonctions pures, testées ; le stockage est dans use-brouillon.ts.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Réponse en cours à une question notée (une case par partie ; null : non répondue). */
export type Valeurs = (number | boolean | null)[];

/** Forme d'une question notée, suffisante pour valider une réponse gardée. */
export type FormeQuestion =
  | { type: "qcm"; id: string; choix: unknown[] }
  | { type: "vrai-faux"; id: string; affirmations: unknown[] }
  | { type: "classement"; id: string; elements: unknown[]; categories: unknown[] };

/** Brouillon de questions notées, tel qu'il est gardé dans le navigateur. */
type BrouillonReponses = { ids: string[]; valeurs: Valeurs[] };

/** Longueur maximale gardée pour un texte libre (question ouverte, atelier). */
export const TEXTE_MAX = 5000;

const PREFIXE = "kalami:cours:brouillon:";

// ==================== CLÉ ====================

/**
 * Clé de stockage d'un brouillon : propre au compte, pour qu'un appareil partagé ne
 * montre pas les réponses d'un autre apprenant.
 * @param compte - Identifiant du compte connecté
 * @param id     - Identifiant de l'élément (« m01-l01-e2 », « m01-quiz », « examen »)
 *
 * Exemple d'utilisation :
 *   cleBrouillon("3f…", "m01-quiz"); // « kalami:cours:brouillon:3f…:m01-quiz »
 */
export function cleBrouillon(compte: string, id: string): string {
  return `${PREFIXE}${compte}:${id}`;
}

// ==================== QUESTIONS NOTÉES ====================

/** Nombre de parties d'une question (cases de la réponse). */
function parties(q: FormeQuestion): number {
  if (q.type === "qcm") return 1;
  if (q.type === "vrai-faux") return q.affirmations.length;
  return q.elements.length;
}

/** Vrai si la valeur gardée est permise pour cette question. */
function caseValide(q: FormeQuestion, v: unknown): boolean {
  if (v === null) return true;
  if (q.type === "vrai-faux") return typeof v === "boolean";
  const max = q.type === "qcm" ? q.choix.length : q.categories.length;
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) < max;
}

/**
 * Brouillon à garder pour des questions notées.
 * @param questions - Questions affichées, dans l'ordre
 * @param valeurs   - Réponses en cours
 * @returns Objet à enregistrer, ou null si rien n'est encore répondu
 */
export function brouillonReponses(
  questions: FormeQuestion[],
  valeurs: Valeurs[],
): BrouillonReponses | null {
  if (!valeurs.some((vals) => vals.some((v) => v !== null))) return null;
  return { ids: questions.map((q) => q.id), valeurs };
}

/**
 * Relit un brouillon de questions notées.
 * @param brut      - Valeur lue dans le navigateur (non fiable)
 * @param questions - Questions affichées, dans l'ordre
 * @returns Réponses à remettre en place, ou null si le brouillon ne correspond plus
 */
export function lireReponses(
  brut: unknown,
  questions: FormeQuestion[],
): Valeurs[] | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { ids, valeurs } = brut as Partial<BrouillonReponses>;
  if (!Array.isArray(ids) || !Array.isArray(valeurs)) return null;
  if (ids.length !== questions.length || valeurs.length !== questions.length) return null;
  const valide = questions.every((q, i) => {
    const vals: unknown = valeurs[i];
    return (
      ids[i] === q.id &&
      Array.isArray(vals) &&
      vals.length === parties(q) &&
      vals.every((v) => caseValide(q, v))
    );
  });
  return valide ? valeurs : null;
}

// ==================== TEXTE LIBRE ====================

/**
 * Relit le texte gardé d'une question ouverte.
 * @param brut - Valeur lue dans le navigateur (non fiable)
 * @returns Texte, ou null s'il est absent, vide ou trop long
 */
export function lireTexte(brut: unknown): string | null {
  return typeof brut === "string" && brut.length > 0 && brut.length <= TEXTE_MAX
    ? brut
    : null;
}

/**
 * Relit la saisie gardée d'un atelier : seuls les champs de l'atelier, en texte, sont
 * repris (sans dépasser leur longueur) ; les champs absents restent ceux de départ.
 * @param brut    - Valeur lue dans le navigateur (non fiable)
 * @param champs  - Champs de l'atelier (texte avec longueur maximale, ou liste de choix)
 * @param depart  - Saisie de départ (dernière saisie corrigée, sinon vide)
 * @returns Saisie fusionnée, ou null si rien n'est repris
 */
export function lireSaisieAtelier(
  brut: unknown,
  champs: (
    | { type: "texte"; id: string; max: number }
    | { type: "choix"; id: string; options: { valeur: string }[] }
  )[],
  depart: Record<string, string>,
): Record<string, string> | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const source = brut as Record<string, unknown>;
  const saisie = { ...depart };
  let repris = false;
  for (const champ of champs) {
    const v = source[champ.id];
    if (typeof v !== "string") continue;
    const permis =
      champ.type === "texte"
        ? v.length <= Math.min(champ.max, TEXTE_MAX)
        : v === "" || champ.options.some((o) => o.valeur === v);
    if (!permis) continue;
    saisie[champ.id] = v;
    repris = true;
  }
  return repris ? saisie : null;
}
