/**
 * =============================================================
 *  Fichier    : actions.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Actions serveur du cours : battement de présence (temps de formation),
 *               leçon terminée, correction d'un exercice et annotations (surlignage,
 *               note). La note d'un exercice est calculée ici, d'après le corrigé du
 *               code, puis écrite avec la clé serveur : le navigateur ne peut pas
 *               s'attribuer une note.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
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
  versSurlignage,
  type LigneAnnotation,
} from "@/lib/cours/acces";
import { exercicesDe } from "@/lib/cours/content";
import { contenuLecon } from "@/lib/cours/lecons";
import { leconParId } from "@/lib/cours/modules";
import { corriger, type Correction, type Reponse } from "@/lib/cours/notation";
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
