/**
 * =============================================================
 *  Fichier    : evaluation.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz de module : correction d'un quiz entier (côté serveur), version
 *               « publique » des questions sans les réponses (envoyée au navigateur
 *               tant que le quiz n'est pas réussi), ouverture du quiz selon la diffusion
 *               programmée, meilleure note par module. Fonctions pures, sans accès à
 *               la base. Le seuil de réussite deviendra réglable dans l'admin (S8b2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts, lib/cours/notation.ts, lib/cours/calendrier.ts
 * =============================================================
 */

import type { EtatDiffusion } from "@/lib/cours/calendrier";
import type { QuestionQuiz } from "@/lib/cours/content";
import { corriger, type Correction, type Reponse } from "@/lib/cours/notation";

// ==================== CONSTANTES ====================

/** Seuil de réussite par défaut d'un quiz, en pourcentage. */
export const SEUIL_REUSSITE = 70;

/** Nombre de questions permis par quiz (programme : 8 à 10). */
export const QUESTIONS_MIN = 8;
export const QUESTIONS_MAX = 10;

/** Identifiant de tentative d'un quiz : « m01-quiz ». */
export const idQuiz = (moduleId: string) => `${moduleId}-quiz`;

// ==================== VERSION PUBLIQUE ====================

/**
 * Question telle qu'envoyée au navigateur avant la réussite : le texte et les choix,
 * jamais la bonne réponse ni les explications.
 */
export type QuestionPublique =
  | { type: "qcm"; id: string; question: string; choix: string[] }
  | { type: "vrai-faux"; id: string; consigne: string; affirmations: string[] }
  | {
      type: "classement";
      id: string;
      consigne: string;
      categories: string[];
      elements: string[];
    };

/**
 * Retire les réponses et les explications d'une question.
 * @param q - Question complète (côté serveur)
 * @returns La question sans aucune information de correction
 */
export function versionPublique(q: QuestionQuiz): QuestionPublique {
  switch (q.type) {
    case "qcm":
      return {
        type: "qcm",
        id: q.id,
        question: q.question,
        choix: q.choix.map((c) => c.texte),
      };
    case "vrai-faux":
      return {
        type: "vrai-faux",
        id: q.id,
        consigne: q.consigne,
        affirmations: q.affirmations.map((a) => a.texte),
      };
    case "classement":
      return {
        type: "classement",
        id: q.id,
        consigne: q.consigne,
        categories: [...q.categories],
        elements: q.elements.map((e) => e.texte),
      };
  }
}

// ==================== CORRECTION ====================

/** Correction d'un quiz : note globale et correction de chaque question. */
export type CorrectionQuiz = {
  /** Note sur 100 : moyenne des questions, chacune comptant autant. */
  score: number;
  corrections: Correction[];
};

/**
 * Corrige un quiz entier. Chaque question compte autant ; une question à plusieurs
 * parties (vrai ou faux, classement) donne des points partiels.
 *
 * @param questions - Questions du quiz (côté serveur)
 * @param reponses  - Réponses reçues du navigateur (non fiables), dans l'ordre
 * @returns La correction, ou null si une réponse manque ou ne correspond pas
 *
 * Exemple : corrigerQuiz(QUIZ_M01, reponses) → { score: 87.5, corrections: [...] }
 */
export function corrigerQuiz(
  questions: QuestionQuiz[],
  reponses: unknown,
): CorrectionQuiz | null {
  if (!Array.isArray(reponses) || reponses.length !== questions.length) return null;
  if (questions.length === 0) return null;
  const corrections: Correction[] = [];
  for (const [i, q] of questions.entries()) {
    const r = reponses[i] as Reponse | null;
    if (typeof r !== "object" || r === null) return null;
    const c = corriger(q, r);
    if (!c) return null;
    corrections.push(c);
  }
  const total = corrections.reduce((s, c) => s + c.score, 0);
  return {
    score: Math.round((total / corrections.length) * 100) / 100,
    corrections,
  };
}

/**
 * Copie d'une réponse déjà validée, réduite à ses seuls champs utiles (pour l'enregistrer
 * sans champ superflu envoyé par le navigateur).
 * @param r - Réponse validée par corrigerQuiz()
 */
export function reponseNette(r: Reponse): Reponse {
  if (r.type === "qcm") return { type: "qcm", choix: r.choix };
  if (r.type === "vrai-faux") return { type: "vrai-faux", valeurs: [...r.valeurs] };
  if (r.type === "classement") return { type: "classement", categories: [...r.categories] };
  return { type: "ouvert" };
}

/** Vrai si la note atteint le seuil de réussite. */
export function estReussi(score: number | null, seuil = SEUIL_REUSSITE): boolean {
  return score !== null && score >= seuil;
}

/**
 * Réponse modèle d'une question (pour afficher le corrigé sans réponse de l'apprenant).
 * @param q - Question complète
 */
export function reponseModele(q: QuestionQuiz): Reponse {
  if (q.type === "qcm") return { type: "qcm", choix: q.bonne };
  if (q.type === "vrai-faux") {
    return { type: "vrai-faux", valeurs: q.affirmations.map((a) => a.vrai) };
  }
  return { type: "classement", categories: q.elements.map((e) => e.categorie) };
}

// ==================== OUVERTURE ====================

/**
 * Un quiz s'ouvre quand toutes les leçons de son module sont ouvertes (diffusion
 * programmée). Sans calendrier, l'état d'une leçon est absent : elle est ouverte.
 *
 * @param leconIds - Leçons du module
 * @param etats    - État de diffusion de chaque leçon pour l'apprenant
 */
export function quizOuvert(
  leconIds: readonly string[],
  etats: ReadonlyMap<string, EtatDiffusion>,
): boolean {
  return leconIds.every((id) => (etats.get(id)?.etat ?? "ouverte") === "ouverte");
}

// ==================== MEILLEURES NOTES ====================

/** Résultat d'un apprenant à un quiz. */
export type ResultatQuiz = { meilleure: number; essais: number };

/**
 * Meilleure note et nombre d'essais par quiz, à partir des tentatives.
 * @param tentatives - Lignes de course_attempts (tous exercices confondus)
 * @returns Résultat par identifiant de module (« m01 »)
 */
export function resultatsQuiz(
  tentatives: { exercise_id: string; score: number | string }[],
): Map<string, ResultatQuiz> {
  const resultats = new Map<string, ResultatQuiz>();
  for (const t of tentatives) {
    const m = /^(m[0-9]{2})-quiz$/.exec(t.exercise_id);
    const score = Number(t.score);
    if (!m || !Number.isFinite(score)) continue;
    const actuel = resultats.get(m[1]);
    resultats.set(m[1], {
      meilleure: Math.max(actuel?.meilleure ?? 0, score),
      essais: (actuel?.essais ?? 0) + 1,
    });
  }
  return resultats;
}
