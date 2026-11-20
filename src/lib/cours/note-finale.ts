/**
 * =============================================================
 *  Fichier    : note-finale.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Évaluation finale du cours (fonctions pures, sans accès à la base) :
 *               réglages d'évaluation (seuils, pondération, mentions), bilan d'un
 *               apprenant (moyenne des quiz, des exercices, meilleure note à l'examen,
 *               note finale pondérée, mention), état de l'examen (verrouillé, ouvert,
 *               en attente de 24 h, essais épuisés), numéro de diplôme et nom imprimé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts, lib/cours/lecons, lib/cours/modules.ts,
 *               lib/cours/notation.ts, lib/cours/evaluation.ts
 * =============================================================
 */

import { exercicesDe } from "@/lib/cours/content";
import { idQuiz } from "@/lib/cours/evaluation";
import { contenuLecon } from "@/lib/cours/lecons";
import { LECONS, MODULES } from "@/lib/cours/modules";
import { estNote } from "@/lib/cours/notation";

// ==================== CONSTANTES ====================

/** Identifiant de tentative de l'examen final. */
export const ID_EXAMEN = "examen";

/** Nombre d'essais permis à l'examen. */
export const ESSAIS_EXAMEN = 3;

/** Délai minimal entre deux essais d'examen, en heures. */
export const DELAI_EXAMEN_HEURES = 24;

/** Mentions possibles, du plus bas au plus haut. */
export const MENTIONS = ["reussite", "bien", "tres_bien"] as const;
export type Mention = (typeof MENTIONS)[number];

/** Vrai si la valeur est une mention connue. */
export const estMention = (v: unknown): v is Mention =>
  typeof v === "string" && (MENTIONS as readonly string[]).includes(v);

// ==================== RÉGLAGES ====================

/** Réglages d'évaluation (table course_settings), modifiables dans l'admin. */
export type ReglagesEvaluation = {
  seuilQuiz: number;
  seuilExamen: number;
  poidsQuiz: number;
  poidsExercices: number;
  poidsExamen: number;
  mentionBien: number;
  mentionTresBien: number;
};

/** Valeurs par défaut (mêmes que la migration). */
export const REGLAGES_DEFAUT: ReglagesEvaluation = {
  seuilQuiz: 70,
  seuilExamen: 70,
  poidsQuiz: 40,
  poidsExercices: 20,
  poidsExamen: 40,
  mentionBien: 80,
  mentionTresBien: 90,
};

/** Correspondance entre les champs et les colonnes de course_settings. */
export const COLONNES_REGLAGES: Record<keyof ReglagesEvaluation, string> = {
  seuilQuiz: "quiz_threshold",
  seuilExamen: "exam_threshold",
  poidsQuiz: "weight_quizzes",
  poidsExercices: "weight_exercises",
  poidsExamen: "weight_exam",
  mentionBien: "honours_good",
  mentionTresBien: "honours_very_good",
};

/**
 * Lit les réglages d'une ligne de course_settings ; une valeur absente ou invalide
 * reprend sa valeur par défaut (base pas encore migrée, par exemple).
 * @param ligne - Ligne brute lue dans la base
 */
export function lireReglagesEvaluation(ligne: unknown): ReglagesEvaluation {
  const source = (typeof ligne === "object" && ligne !== null ? ligne : {}) as Record<
    string,
    unknown
  >;
  const reglages = { ...REGLAGES_DEFAUT };
  for (const [cle, colonne] of Object.entries(COLONNES_REGLAGES)) {
    const v = Number(source[colonne]);
    if (source[colonne] != null && Number.isInteger(v) && v >= 0 && v <= 100) {
      reglages[cle as keyof ReglagesEvaluation] = v;
    }
  }
  const somme = reglages.poidsQuiz + reglages.poidsExercices + reglages.poidsExamen;
  if (somme !== 100 || reglages.mentionBien >= reglages.mentionTresBien) {
    return { ...REGLAGES_DEFAUT };
  }
  return reglages;
}

// ==================== EXERCICES NOTÉS ====================

/** Identifiants complets (« m01-l01-e2 ») de tous les exercices notés du cours. */
export const EXERCICES_NOTES: readonly string[] = LECONS.flatMap((l) =>
  exercicesDe(contenuLecon(l.id) ?? [])
    .filter(estNote)
    .map((e) => `${l.id}-${e.id}`),
);

// ==================== BILAN ====================

/** Tentative telle que lue dans course_attempts. */
export type TentativeCours = {
  exercise_id: string;
  score: number | string;
  created_at?: string;
};

/** Bilan d'évaluation d'un apprenant. */
export type Bilan = {
  /** Moyenne des meilleures notes aux 13 quiz (quiz non fait : 0). */
  quiz: number;
  quizReussis: number;
  quizTotal: number;
  tousQuizReussis: boolean;
  /** Moyenne des meilleures notes à tous les exercices notés (non fait : 0). */
  exercices: number;
  /** Meilleure note à l'examen ; null s'il n'a jamais été tenté. */
  examen: number | null;
  essaisExamen: number;
  /** Date du dernier essai d'examen (ms) ; null si aucun. */
  dernierExamen: number | null;
  examenReussi: boolean;
  /** Note finale pondérée sur 100 (les parties non faites comptent 0). */
  finale: number;
  /** Vrai si le diplôme peut être délivré (13 quiz et examen réussis). */
  admissible: boolean;
  mention: Mention | null;
};

/** Arrondi à deux décimales. */
const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Moyenne d'une liste (0 si vide). */
const moyenne = (notes: number[]) =>
  notes.length === 0 ? 0 : notes.reduce((s, n) => s + n, 0) / notes.length;

/**
 * Mention correspondant à une note finale.
 * @param note     - Note finale sur 100
 * @param reglages - Seuils des mentions
 */
export function mentionDe(note: number, reglages: ReglagesEvaluation): Mention {
  if (note >= reglages.mentionTresBien) return "tres_bien";
  if (note >= reglages.mentionBien) return "bien";
  return "reussite";
}

/**
 * Meilleure note par identifiant de tentative.
 * @param tentatives - Lignes de course_attempts d'un apprenant
 */
function meilleures(tentatives: TentativeCours[]): Map<string, number> {
  const notes = new Map<string, number>();
  for (const t of tentatives) {
    const score = Number(t.score);
    if (!Number.isFinite(score)) continue;
    notes.set(t.exercise_id, Math.max(notes.get(t.exercise_id) ?? 0, score));
  }
  return notes;
}

/**
 * Calcule le bilan d'un apprenant à partir de toutes ses tentatives.
 *
 * @param tentatives - Lignes de course_attempts (exercices, quiz, examen)
 * @param reglages   - Réglages d'évaluation
 * @param exercices  - Exercices notés pris en compte (par défaut : tout le cours)
 * @returns Le bilan, note finale et mention compris
 *
 * Exemple : bilanApprenant(lignes, REGLAGES_DEFAUT).finale → 84.5
 */
export function bilanApprenant(
  tentatives: TentativeCours[],
  reglages: ReglagesEvaluation,
  exercices: readonly string[] = EXERCICES_NOTES,
): Bilan {
  const notes = meilleures(tentatives);
  const quizNotes = MODULES.map((m) => notes.get(idQuiz(m.id)) ?? 0);
  const quizReussis = quizNotes.filter((n) => n >= reglages.seuilQuiz).length;
  const quiz = moyenne(quizNotes);
  const exercicesMoy = moyenne(exercices.map((id) => notes.get(id) ?? 0));

  const essais = tentatives.filter((t) => t.exercise_id === ID_EXAMEN);
  const examen = notes.has(ID_EXAMEN) ? (notes.get(ID_EXAMEN) as number) : null;
  const dates = essais
    .map((t) => (t.created_at ? Date.parse(t.created_at) : NaN))
    .filter(Number.isFinite);
  const examenReussi = examen !== null && examen >= reglages.seuilExamen;

  const finale = arrondi(
    (reglages.poidsQuiz * quiz +
      reglages.poidsExercices * exercicesMoy +
      reglages.poidsExamen * (examen ?? 0)) /
      100,
  );
  const tousQuizReussis = quizReussis === MODULES.length;
  const admissible = tousQuizReussis && examenReussi;
  return {
    quiz: arrondi(quiz),
    quizReussis,
    quizTotal: MODULES.length,
    tousQuizReussis,
    exercices: arrondi(exercicesMoy),
    examen,
    essaisExamen: essais.length,
    dernierExamen: dates.length ? Math.max(...dates) : null,
    examenReussi,
    finale,
    admissible,
    mention: admissible ? mentionDe(finale, reglages) : null,
  };
}

// ==================== ÉTAT DE L'EXAMEN ====================

/** État de l'examen pour l'apprenant, à un instant donné. */
export type EtatExamen =
  | { etat: "verrouille" }
  | { etat: "ouvert"; restants: number }
  | { etat: "attente"; prochain: number; restants: number }
  | { etat: "epuise" }
  | { etat: "termine" };

/**
 * État de l'examen : verrouillé tant que les 13 quiz ne sont pas réussis, terminé une
 * fois le diplôme délivré, épuisé après 3 essais, en attente pendant 24 h après un essai.
 *
 * @param bilan      - Bilan de l'apprenant
 * @param maintenant - Instant présent (ms)
 * @param diplome    - Vrai si le diplôme est déjà délivré
 */
export function etatExamen(bilan: Bilan, maintenant: number, diplome: boolean): EtatExamen {
  if (diplome) return { etat: "termine" };
  if (!bilan.tousQuizReussis) return { etat: "verrouille" };
  const restants = ESSAIS_EXAMEN - bilan.essaisExamen;
  if (restants <= 0) return { etat: "epuise" };
  if (bilan.dernierExamen !== null) {
    const prochain = bilan.dernierExamen + DELAI_EXAMEN_HEURES * 3_600_000;
    if (prochain > maintenant) return { etat: "attente", prochain, restants };
  }
  return { etat: "ouvert", restants };
}

// ==================== DIPLÔME ====================

/** Alphabet des numéros : sans 0, 1, I ni O, pour éviter les confusions à la lecture. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Forme d'un numéro de diplôme : « KS-2026-7KQM-X3PD ». */
export const FORME_NUMERO = /^KS-[0-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/**
 * Génère un numéro de diplôme.
 * @param annee  - Année de délivrance
 * @param octets - 8 octets aléatoires (crypto.getRandomValues)
 */
export function numeroDiplome(annee: number, octets: Uint8Array): string {
  const car = [...octets.slice(0, 8)].map((o) => ALPHABET[o % ALPHABET.length]).join("");
  return `KS-${annee}-${car.slice(0, 4)}-${car.slice(4, 8)}`;
}

/**
 * Normalise un numéro saisi ou lu dans une adresse ; null s'il n'a pas la bonne forme.
 * @param valeur - Numéro brut
 */
export function lireNumero(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const n = valeur.trim().toUpperCase();
  return FORME_NUMERO.test(n) ? n : null;
}

/** Longueurs permises du nom imprimé. */
export const NOM_MIN = 2;
export const NOM_MAX = 120;

/**
 * Nettoie le nom à imprimer (espaces superflus retirés) ; null s'il est invalide.
 * @param valeur - Nom saisi
 */
export function nomImprime(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const nom = valeur.trim().replace(/\s+/g, " ");
  if (nom.length < NOM_MIN || nom.length > NOM_MAX) return null;
  // Lettres (tous alphabets), espaces, apostrophes, traits d'union et points seulement
  return /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(nom) ? nom : null;
}
