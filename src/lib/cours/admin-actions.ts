/**
 * =============================================================
 *  Fichier    : admin-actions.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Actions serveur de l'administration du cours (v0.29.0) : réglages de
 *               vente, cohortes (création, modification, suppression), accès accordés
 *               par liste de courriels, changement de cohorte et retrait d'un accès ;
 *               calendrier de diffusion d'une cohorte (v0.33.0) ; réglages
 *               d'évaluation et correction du nom d'un diplôme (v0.38.0) ; dates
 *               individuelles d'ouverture et de fermeture, en lot (v0.42.0).
 *               Les fonctions SQL vérifient le rôle administrateur (aal2) et écrivent
 *               le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-20
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/cours/admin-validation.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import {
  lireAccord,
  lireCalendrierSaisi,
  lireCohorte,
  lireDiffusionSaisie,
  lireEvaluation,
  lireNomDiplome,
  lireReglages,
  lireRetraitDiffusion,
} from "@/lib/cours/admin-validation";
import { createClient } from "@/lib/supabase/server";

const a = getCourseDictionary().admin;

// ==================== TYPES ====================

export type StatutAccord =
  "granted" | "moved" | "already" | "no_account" | "invalid";

/** Retour du formulaire « Donner l'accès » : message, plus le rapport par courriel. */
export type EtatAccord =
  | (NonNullable<FormState> & {
      rapport?: { email: string; status: StatutAccord }[];
      ignores?: string[];
    })
  | undefined;

// ==================== OUTILS ====================

/**
 * Message d'erreur connu (code levé par la base ou par la validation), sinon générique.
 * @param code - Code d'erreur
 */
function erreur(code: string | undefined): string {
  const connus: Record<string, string> = a.erreursAdmin;
  return (code && connus[code]) || a.erreursAdmin.generique;
}

// ==================== RÉGLAGES ====================

/** Enregistre la mise en vente, les prix et le livre associé. */
export async function enregistrerReglages(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const lu = lireReglages(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_save_settings", lu.valeur);
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: a.prix.enregistre };
}

// ==================== COHORTES ====================

/** Crée une cohorte (sans id) ou modifie la cohorte indiquée. */
export async function enregistrerCohorte(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const lu = lireCohorte(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_save_cohort", lu.valeur);
  if (error) return { error: erreur(error.message) };
  refresh();
  return {
    message: lu.valeur.p_id ? a.cohortes.enregistree : a.cohortes.creee,
  };
}

/**
 * Supprime une cohorte ; ses apprenants gardent leur accès, sans cohorte.
 * @param id - Identifiant de la cohorte
 */
export async function supprimerCohorte(id: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: erreur("cohort_not_found") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_delete_cohort", {
    p_id: id,
  });
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: a.cohortes.supprimee };
}

/** Enregistre le calendrier de diffusion d'une cohorte (remplace les dates précédentes). */
export async function enregistrerCalendrier(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const lu = lireCalendrierSaisi(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_save_schedule", lu.valeur);
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: a.calendrier.enregistre };
}

// ==================== ACCÈS ====================

/**
 * Donne l'accès à une liste de courriels et renvoie le statut de chacun.
 * @returns Message de synthèse, rapport détaillé et fragments ignorés
 */
export async function accorderAcces(
  _prev: EtatAccord,
  formData: FormData,
): Promise<EtatAccord> {
  await requireAdmin();
  const lu = lireAccord(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };
  const { invalides, ...parametres } = lu.valeur;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_course_grant", parametres);
  if (error) return { error: erreur(error.message), ignores: invalides };

  const rapport = (data ?? []) as { email: string; status: StatutAccord }[];
  const compte = (statut: StatutAccord) =>
    String(rapport.filter((r) => r.status === statut).length);
  refresh();
  return {
    message: interpolate(a.accorder.rapport, {
      granted: compte("granted"),
      moved: compte("moved"),
      already: compte("already"),
      no_account: compte("no_account"),
      invalid: compte("invalid"),
    }),
    rapport,
    ignores: invalides,
  };
}

/** Change la cohorte d'un apprenant (champ « cohort_id » vide : sans cohorte). */
export async function changerCohorte(
  accessId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const brut = formData.get("cohort_id");
  const cohorte = typeof brut === "string" && brut !== "" ? brut : null;
  if (!isUuid(accessId)) return { error: erreur("access_not_found") };
  if (cohorte !== null && !isUuid(cohorte))
    return { error: erreur("cohort_not_found") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_set_cohort", {
    p_access_id: accessId,
    p_cohort_id: cohorte,
  });
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: a.liste.cohorteChangee };
}

/** Retire l'accès d'un apprenant ; case « retire_book » : retire aussi le livre donné. */
export async function retirerAcces(
  accessId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(accessId)) return { error: erreur("access_not_found") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_revoke", {
    p_access_id: accessId,
    p_revoke_book: formData.get("revoke_book") === "on",
  });
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: a.liste.retire };
}

// ==================== DATES INDIVIDUELLES (v0.42.0) ====================

/**
 * Pose des dates d'ouverture et/ou de fermeture pour les apprenants et les modules ou
 * leçons cochés ; elles l'emportent sur le calendrier de leur cohorte.
 */
export async function poserDiffusion(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const lu = lireDiffusionSaisie(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "admin_course_set_learner_schedule",
    lu.valeur,
  );
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: interpolate(a.diffusionPerso.pose, { n: String(data ?? 0) }) };
}

/** Retire les dates individuelles des apprenants cochés (éléments cochés, ou toutes). */
export async function retirerDiffusion(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const lu = lireRetraitDiffusion(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "admin_course_clear_learner_schedule",
    lu.valeur,
  );
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: interpolate(a.diffusionPerso.retire, { n: String(data ?? 0) }) };
}

// ==================== ÉVALUATION ET DIPLÔMES (v0.38.0) ====================

/** Enregistre les seuils, les poids de la note finale et les mentions. */
export async function enregistrerEvaluation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const lu = lireEvaluation(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_save_evaluation", lu.valeur);
  if (error) return { error: erreur(error.message) };
  refresh();
  return { message: a.diplomes.enregistre };
}

/**
 * Corrige le nom imprimé d'un diplôme (le prochain PDF le reprend).
 * @param id - Identifiant du diplôme (lié par .bind)
 */
export async function renommerDiplome(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: erreur("diploma_not_found") };
  const lu = lireNomDiplome(formData);
  if (!lu.ok) return { error: erreur(lu.erreur) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_course_rename_diploma", {
    p_id: id,
    p_name: lu.valeur,
  });
  if (error) {
    // Le nom refusé par la base a son propre message (celui des cohortes ne convient pas)
    const code = error.message === "invalid_name" ? "invalid_diploma_name" : error.message;
    return { error: erreur(code) };
  }
  refresh();
  return { message: a.diplomes.renomme };
}
