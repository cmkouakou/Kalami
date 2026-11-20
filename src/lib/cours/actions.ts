/**
 * =============================================================
 *  Fichier    : actions.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Actions serveur du cours : battement de présence (temps de formation),
 *               leçon terminée, correction d'un exercice et annotations (surlignage,
 *               note). La note d'un exercice est calculée ici, d'après le corrigé du
 *               code, puis écrite avec la clé serveur : le navigateur ne peut pas
 *               s'attribuer une note. v0.33.0 : exercices refusés sur une leçon pas
 *               encore ouverte (diffusion programmée). v0.37.0 : quiz de module, corrigé
 *               et enregistré ici ; les bonnes réponses ne sont renvoyées qu'en cas de
 *               réussite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-20
 *  Dépendances: lib/auth/dal.ts, lib/supabase/{server,admin}.ts, lib/cours/*,
 *               lib/reader/annotations.ts
 * =============================================================
 */

"use server";

import { getCourseDictionary } from "@/i18n/course";
import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  COLONNES_ANNOTATION,
  aAccesAuCours,
  diffusionApprenant,
  versSurlignage,
  type LigneAnnotation,
} from "@/lib/cours/acces";
import { exercicesDe, type QuestionQuiz } from "@/lib/cours/content";
import {
  corrigerQuiz,
  estReussi,
  idQuiz,
  quizOuvert,
  reponseNette,
} from "@/lib/cours/evaluation";
import { contenuLecon } from "@/lib/cours/lecons";
import { MODULES, leconParId } from "@/lib/cours/modules";
import { corriger, type Correction, type Reponse } from "@/lib/cours/notation";
import { quizDe } from "@/lib/cours/quiz";
import {
  cleanNote,
  cleanQuote,
  isHighlightColor,
  parseAnchor,
} from "@/lib/reader/annotations";
import type { Highlight, HighlightColor } from "@/lib/reader/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const t = getCourseDictionary();

/** Code PostgreSQL levé par le déclencheur de plafond (program_limit_exceeded). */
const LIMIT_EXCEEDED = "54000";

export type Resultat = { ok: true } | { ok: false; error: string };

/** Vrai si l'identifiant désigne une leçon du programme. */
const leconValide = (id: unknown): id is string =>
  typeof id === "string" && !!leconParId(id);

// ==================== PROGRESSION ET TEMPS ====================

/**
 * Battement de présence : ouvre la leçon au premier appel, puis cumule le temps actif.
 * Silencieux en cas d'échec (le temps d'une coupure réseau est simplement perdu).
 * @param leconId - Identifiant stable « m01-l01 »
 */
export async function battement(leconId: string): Promise<void> {
  if (!leconValide(leconId)) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("record_course_activity", { p_lesson: leconId });
  } catch {
    // Rien à afficher : un battement perdu ne gêne pas l'apprenant
  }
}

/**
 * Marque une leçon comme terminée.
 * @param leconId - Identifiant stable « m01-l01 »
 */
export async function terminerLecon(leconId: string): Promise<Resultat> {
  if (!leconValide(leconId)) return { ok: false, error: t.erreurs.invalide };
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("complete_course_lesson", {
      p_lesson: leconId,
    });
    if (error) {
      if (error.message === "lesson_locked") {
        return { ok: false, error: t.diffusion.pasEncore };
      }
      const refuse = error.code === "42501";
      return {
        ok: false,
        error: refuse ? t.erreurs.acces : t.lecon.erreurTerminer,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: t.lecon.erreurTerminer };
  }
}

// ==================== EXERCICES ====================

export type ResultatExercice =
  { ok: true; correction: Correction } | { ok: false; error: string };

/**
 * Corrige et enregistre la réponse à un exercice.
 *
 * @param leconId    - Identifiant stable de la leçon
 * @param exerciceId - Identifiant local de l'exercice (« e1 »)
 * @param reponse    - Réponse de l'apprenant (non fiable : validée par corriger())
 * @returns Correction (note et justesse de chaque partie), ou message d'erreur
 */
export async function soumettreReponse(
  leconId: string,
  exerciceId: string,
  reponse: Reponse,
): Promise<ResultatExercice> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.erreurs.connexion };
  if (
    !leconValide(leconId) ||
    typeof reponse !== "object" ||
    reponse === null
  ) {
    return { ok: false, error: t.erreurs.invalide };
  }
  const exercice = exercicesDe(contenuLecon(leconId) ?? []).find(
    (e) => e.id === exerciceId,
  );
  const correction = exercice ? corriger(exercice, reponse) : null;
  if (!exercice || !correction) return { ok: false, error: t.erreurs.invalide };
  if (!(await aAccesAuCours())) return { ok: false, error: t.erreurs.acces };
  const { etats } = await diffusionApprenant();
  if (etats.get(leconId)?.etat !== "ouverte") {
    return { ok: false, error: t.diffusion.pasEncore };
  }

  // Une question ouverte n'est pas notée : rien à enregistrer
  if (exercice.type === "ouvert") return { ok: true, correction };

  try {
    const { error } = await createAdminClient()
      .from("course_attempts")
      .insert({
        user_id: user.id,
        exercise_id: `${leconId}-${exercice.id}`,
        score: correction.score,
        answers: reponse,
      });
    if (error) return { ok: false, error: t.exercices.erreur };
    return { ok: true, correction };
  } catch {
    return { ok: false, error: t.exercices.erreur };
  }
}

// ==================== QUIZ DE MODULE ====================

/**
 * Résultat d'un essai de quiz. En cas d'échec, seule la note de chaque question est
 * renvoyée (pas le détail par partie, qui trahirait les bonnes réponses). En cas de
 * réussite, les questions complètes et leurs corrections permettent d'afficher le corrigé.
 */
export type ResultatQuiz =
  | {
      ok: true;
      score: number;
      reussi: boolean;
      notes: number[];
      questions?: QuestionQuiz[];
      corrections?: Correction[];
    }
  | { ok: false; error: string };

/**
 * Corrige et enregistre un essai de quiz de module.
 *
 * @param moduleId - Identifiant du module (« m01 »)
 * @param reponses - Réponses de l'apprenant, dans l'ordre des questions (non fiables)
 * @returns Note globale, note par question et, si réussi, le corrigé complet
 *
 * Erreurs possibles : non connecté, quiz inconnu ou réponses invalides, pas d'accès,
 * leçons du module pas toutes ouvertes, échec d'enregistrement.
 */
export async function soumettreQuiz(
  moduleId: string,
  reponses: unknown,
): Promise<ResultatQuiz> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.erreurs.connexion };
  const mod = MODULES.find((m) => m.id === moduleId);
  const questions = mod ? quizDe(mod.id) : null;
  const correction = questions ? corrigerQuiz([...questions], reponses) : null;
  if (!mod || !questions || !correction) return { ok: false, error: t.erreurs.invalide };
  if (!(await aAccesAuCours())) return { ok: false, error: t.erreurs.acces };
  const { etats } = await diffusionApprenant();
  if (!quizOuvert(mod.lecons.map((l) => l.id), etats)) {
    return { ok: false, error: t.quiz.verrouille };
  }

  try {
    const { error } = await createAdminClient()
      .from("course_attempts")
      .insert({
        user_id: user.id,
        exercise_id: idQuiz(mod.id),
        score: correction.score,
        answers: { reponses: (reponses as Reponse[]).map(reponseNette) },
      });
    if (error) return { ok: false, error: t.quiz.erreur };
  } catch {
    return { ok: false, error: t.quiz.erreur };
  }

  const reussi = estReussi(correction.score);
  const notes = correction.corrections.map((c) => c.score);
  if (!reussi) return { ok: true, score: correction.score, reussi, notes };
  return {
    ok: true,
    score: correction.score,
    reussi,
    notes,
    questions: [...questions],
    corrections: correction.corrections,
  };
}

// ==================== ANNOTATIONS ====================

export type ResultatAnnotation =
  { ok: true; highlight: Highlight } | { ok: false; error: string };

/**
 * Surligne un passage d'une leçon.
 * @param leconId - Identifiant stable de la leçon
 * @param ancrage - Début et fin (bloc, décalage) ; le chapitre est ignoré
 * @param couleur - Couleur choisie
 * @param passage - Texte sélectionné
 */
export async function creerAnnotation(
  leconId: string,
  ancrage: unknown,
  couleur: HighlightColor,
  passage: string,
): Promise<ResultatAnnotation> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.annotations.connexion };
  const anchor =
    typeof ancrage === "object" && ancrage !== null
      ? parseAnchor({ ...(ancrage as object), chapter: 0 })
      : null;
  const quote = cleanQuote(passage);
  if (
    !leconValide(leconId) ||
    !anchor ||
    !quote ||
    !isHighlightColor(couleur)
  ) {
    return { ok: false, error: t.erreurs.invalide };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_annotations")
      .insert({
        user_id: user.id,
        lesson_id: leconId,
        start_block: anchor.start.block,
        start_offset: anchor.start.offset,
        end_block: anchor.end.block,
        end_offset: anchor.end.offset,
        color: couleur,
        quote,
      })
      .select(COLONNES_ANNOTATION)
      .single<LigneAnnotation>();
    if (error?.code === LIMIT_EXCEEDED)
      return { ok: false, error: t.annotations.tropNombreuses };
    if (error || !data) return { ok: false, error: t.annotations.erreur };
    return { ok: true, highlight: versSurlignage(data) };
  } catch {
    return { ok: false, error: t.annotations.erreur };
  }
}

/**
 * Change la couleur ou la note d'une annotation (la RLS limite à ses propres lignes).
 * @param id         - Identifiant de l'annotation
 * @param changement - Nouvelle couleur et/ou nouvelle note (vide : note retirée)
 */
export async function modifierAnnotation(
  id: string,
  changement: { color?: HighlightColor; note?: string | null },
): Promise<ResultatAnnotation> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.annotations.connexion };
  if (!isUuid(id) || typeof changement !== "object" || changement === null) {
    return { ok: false, error: t.erreurs.invalide };
  }

  const maj: { color?: HighlightColor; note?: string | null } = {};
  if (changement.color !== undefined) {
    if (!isHighlightColor(changement.color))
      return { ok: false, error: t.erreurs.invalide };
    maj.color = changement.color;
  }
  if (changement.note !== undefined) {
    const { valid, note } = cleanNote(changement.note);
    if (!valid) return { ok: false, error: t.annotations.noteInvalide };
    maj.note = note;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_annotations")
      .update(maj)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(COLONNES_ANNOTATION)
      .single<LigneAnnotation>();
    if (error || !data) return { ok: false, error: t.annotations.erreur };
    return { ok: true, highlight: versSurlignage(data) };
  } catch {
    return { ok: false, error: t.annotations.erreur };
  }
}

/** Retire une annotation. */
export async function supprimerAnnotation(id: string): Promise<Resultat> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.annotations.connexion };
  if (!isUuid(id)) return { ok: false, error: t.erreurs.invalide };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("course_annotations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    return error ? { ok: false, error: t.annotations.erreur } : { ok: true };
  } catch {
    return { ok: false, error: t.annotations.erreur };
  }
}
