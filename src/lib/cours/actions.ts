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
 *               réussite. v0.38.0 : examen final (3 essais espacés de 24 h, verrou en
 *               base ; seules la note et les questions manquées sont renvoyées),
 *               délivrance du diplôme ; seuil des quiz lu dans les réglages.
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-11-20
 *  Dépendances: lib/auth/dal.ts, lib/supabase/{server,admin}.ts, lib/cours/*,
 *               lib/reader/annotations.ts
 * =============================================================
 */

"use server";

import { getCourseDictionary } from "@/i18n/course";
import { interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  COLONNES_ANNOTATION,
  aAccesAuCours,
  bilanConnecte,
  diffusionApprenant,
  diplomeApprenant,
  reglagesEvaluation,
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
import { QUESTIONS_EXAMEN } from "@/lib/cours/examen";
import { contenuLecon } from "@/lib/cours/lecons";
import { MODULES, leconParId } from "@/lib/cours/modules";
import {
  DELAI_EXAMEN_HEURES,
  ESSAIS_EXAMEN,
  nomImprime,
  numeroDiplome,
} from "@/lib/cours/note-finale";
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
      if (error.message === "lesson_closed") {
        return { ok: false, error: t.diffusion.plusOuverte };
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
  const etatLecon = etats.get(leconId)?.etat;
  if (etatLecon === "expiree") return { ok: false, error: t.diffusion.plusOuverte };
  if (etatLecon !== "ouverte") return { ok: false, error: t.diffusion.pasEncore };

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

  const { seuilQuiz } = await reglagesEvaluation();
  const reussi = estReussi(correction.score, seuilQuiz);
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

// ==================== EXAMEN FINAL ====================

/** Résultat d'un essai d'examen : la note et les numéros des questions manquées. */
export type ResultatExamen =
  | { ok: true; score: number; reussi: boolean; manquees: number[] }
  | { ok: false; error: string };

/**
 * Corrige et enregistre un essai d'examen. La base refuse un 4e essai ou un essai moins
 * de 24 h après le précédent (verrou par apprenant, à l'abri des envois simultanés).
 *
 * @param reponses - Réponses de l'apprenant, dans l'ordre des questions (non fiables)
 * @returns La note et les questions manquées (jamais les bonnes réponses)
 *
 * Erreurs possibles : non connecté, réponses invalides, pas d'accès, quiz pas tous
 * réussis, diplôme déjà délivré, trop tôt, plus d'essai, échec d'enregistrement.
 */
export async function soumettreExamen(reponses: unknown): Promise<ResultatExamen> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.erreurs.connexion };
  const correction = corrigerQuiz(QUESTIONS_EXAMEN, reponses);
  if (!correction) return { ok: false, error: t.erreurs.invalide };
  if (!(await aAccesAuCours())) return { ok: false, error: t.erreurs.acces };
  const [bilan, diplome, reglages] = await Promise.all([
    bilanConnecte(),
    diplomeApprenant(),
    reglagesEvaluation(),
  ]);
  if (diplome) return { ok: false, error: t.examen.termine };
  if (!bilan.tousQuizReussis) {
    return {
      ok: false,
      error: interpolate(t.examen.verrouille, {
        n: String(bilan.quizReussis),
        total: String(bilan.quizTotal),
      }),
    };
  }

  try {
    const { data, error } = await createAdminClient().rpc("course_record_exam_attempt", {
      p_user_id: user.id,
      p_score: correction.score,
      p_answers: { reponses: (reponses as Reponse[]).map(reponseNette) },
      p_max: ESSAIS_EXAMEN,
      p_gap_hours: DELAI_EXAMEN_HEURES,
    });
    if (error) return { ok: false, error: t.examen.erreur };
    if (data === "too_soon") return { ok: false, error: t.examen.tropTot };
    if (data === "max_attempts") return { ok: false, error: t.examen.plusDEssais };
    if (data !== "ok") return { ok: false, error: t.examen.erreur };
  } catch {
    return { ok: false, error: t.examen.erreur };
  }

  return {
    ok: true,
    score: correction.score,
    reussi: estReussi(correction.score, reglages.seuilExamen),
    manquees: correction.corrections.flatMap((c, i) => (c.score < 100 ? [i + 1] : [])),
  };
}

// ==================== DIPLÔME ====================

/** Résultat de la délivrance du diplôme. */
export type ResultatDiplome = { ok: true; numero: string } | { ok: false; error: string };

/** Code PostgreSQL d'une contrainte d'unicité violée. */
const UNIQUE_VIOLATION = "23505";

/**
 * Délivre le diplôme de l'apprenant connecté, avec le nom qu'il a confirmé. Les notes
 * sont figées à cet instant. Un seul diplôme par apprenant : s'il existe déjà, son
 * numéro est renvoyé.
 *
 * @param nom      - Nom à imprimer, saisi par l'apprenant
 * @param confirme - Case « je confirme l'orthographe » cochée
 * @returns Le numéro du diplôme
 */
export async function delivrerDiplome(
  nom: unknown,
  confirme: unknown,
): Promise<ResultatDiplome> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.erreurs.connexion };
  const nomNet = nomImprime(nom);
  if (!nomNet || confirme !== true) return { ok: false, error: t.diplome.nomInvalide };
  if (!(await aAccesAuCours())) return { ok: false, error: t.erreurs.acces };
  const [bilan, existant] = await Promise.all([bilanConnecte(), diplomeApprenant()]);
  if (existant) return { ok: true, numero: existant.numero };
  if (!bilan.admissible || !bilan.mention || bilan.examen === null) {
    return { ok: false, error: t.diplome.nonAdmissible };
  }

  const admin = createAdminClient();
  // Quelques essais au cas (très improbable) où le numéro tiré existe déjà
  for (let essai = 0; essai < 4; essai++) {
    const numero = numeroDiplome(
      new Date().getUTCFullYear(),
      crypto.getRandomValues(new Uint8Array(8)),
    );
    try {
      const { error } = await admin.from("course_diplomas").insert({
        user_id: user.id,
        number: numero,
        printed_name: nomNet,
        final_score: bilan.finale,
        honours: bilan.mention,
        quiz_score: bilan.quiz,
        exercises_score: bilan.exercices,
        exam_score: bilan.examen,
      });
      if (!error) return { ok: true, numero };
      if (error.code !== UNIQUE_VIOLATION) break;
      // Deux envois simultanés : le diplôme de l'apprenant existe déjà
      const { data } = await admin
        .from("course_diplomas")
        .select("number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data && typeof data.number === "string") return { ok: true, numero: data.number };
    } catch {
      break;
    }
  }
  return { ok: false, error: t.diplome.erreur };
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
