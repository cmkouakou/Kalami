/**
 * =============================================================
 *  Fichier    : actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur de l'assistant stratégie : création d'une étude (crédit),
 *               profil de l'entreprise, démarrage, validation et réouverture d'une étape,
 *               enregistrement et restauration du contenu des gabarits. Les droits et les
 *               dépendances sont appliqués par les fonctions SQL ; ici, chaque argument est
 *               vérifié et chaque erreur traduite. Le plan de l'étape 9 s'enregistre et se
 *               restaure comme un gabarit (S8a).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/profile.ts, lib/strategy/steps.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { COMPANY_NAME_MAX, parseProfileForm, QUESTION_MAX } from "@/lib/strategy/profile";
import { isStepNo } from "@/lib/strategy/steps";
import { isEditableStep, parseStepPayload } from "@/lib/strategy/templates";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const s = t.strategy;

type StrategyErrorKey = keyof typeof s.errors;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Traduit l'erreur levée par une fonction SQL (« no_credit », « not_owner »…).
 * @param error - Erreur PostgREST (code et message)
 */
function strategyError(error: { code?: string; message?: string }): string {
  if (error.message && error.message in s.errors) {
    return s.errors[error.message as StrategyErrorKey];
  }
  if (error.code === "42501") return s.errors.forbidden;
  return s.errors.generic;
}

/** Texte d'un champ du formulaire (chaîne vide si absent). */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Libellés des champs du profil, pour un message d'erreur lisible. */
function fieldLabels(fields: string[]): string {
  const labels = s.profile.fields as Record<string, string>;
  return fields.map((name) => labels[name] ?? name).join(", ");
}

// ==================== ÉTUDE ====================

/** Crée une étude en consommant un crédit, puis ouvre son profil. */
export async function createStudy(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/strategie/nouvelle");
  const companyName = field(formData, "companyName");
  const question = field(formData, "strategicQuestion");
  if (!companyName || companyName.length > COMPANY_NAME_MAX || question.length > QUESTION_MAX) {
    return { error: interpolate(s.profile.invalid, { fields: fieldLabels(["companyName"]) }) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_create_study", {
    p_company_name: companyName,
    p_strategic_question: question,
  });
  if (error || typeof data !== "string") return { error: strategyError(error ?? {}) };
  redirect(`/strategie/etudes/${data}/profil`);
}

/** Enregistre le profil de l'entreprise (identifiant de l'étude lié par .bind). */
export async function saveProfile(
  studyId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(`/strategie/etudes/${studyId}/profil`);
  if (!isUuid(studyId)) return { error: s.errors.generic };

  const parsed = parseProfileForm(formData);
  if (!parsed.ok) {
    return { error: interpolate(s.profile.invalid, { fields: fieldLabels(parsed.fields) }) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_save_profile", {
    p_study_id: studyId,
    p_company_name: parsed.value.companyName,
    p_strategic_question: parsed.value.strategicQuestion,
    p_data: parsed.value.data,
  });
  if (error) return { error: strategyError(error) };
  refresh();
  return { message: s.profile.saved };
}

// ==================== ÉTAPES ====================

/**
 * Vérifie les arguments communs aux actions d'étape.
 * @returns Numéro d'étape, ou null si les arguments sont invalides
 */
function stepArgs(studyId: string, stepNo: number): number | null {
  return isUuid(studyId) && isStepNo(stepNo) ? stepNo : null;
}

/** Passe une étape ouverte de « à faire » à « en cours ». */
export async function startStep(studyId: string, stepNo: number): Promise<FormState> {
  await requireUser(`/strategie/etudes/${studyId}`);
  const no = stepArgs(studyId, stepNo);
  if (no === null) return { error: s.errors.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_start_step", {
    p_study_id: studyId,
    p_step_no: no,
  });
  if (error) return { error: strategyError(error) };
  refresh();
  return undefined;
}

/** Valide une étape (propriétaire seulement, prérequis validés). */
export async function validateStep(studyId: string, stepNo: number): Promise<FormState> {
  await requireUser(`/strategie/etudes/${studyId}`);
  const no = stepArgs(studyId, stepNo);
  if (no === null) return { error: s.errors.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_validate_step", {
    p_study_id: studyId,
    p_step_no: no,
  });
  if (error) return { error: strategyError(error) };
  refresh();
  return undefined;
}

/** Rouvre une étape validée ; les étapes aval commencées passent « à revoir ». */
export async function reopenStep(studyId: string, stepNo: number): Promise<FormState> {
  await requireUser(`/strategie/etudes/${studyId}`);
  const no = stepArgs(studyId, stepNo);
  if (no === null) return { error: s.errors.generic };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_reopen_step", {
    p_study_id: studyId,
    p_step_no: no,
  });
  if (error) return { error: strategyError(error) };
  refresh();
  return { message: interpolate(s.step.reopened, { count: String(data ?? 0) }) };
}

// ==================== GABARITS ====================

/** Retour d'un enregistrement de gabarit (sauvegarde automatique, restauration). */
export type SaveResult =
  | { ok: true; revision: number; savedAt: string }
  | { ok: false; error: string; conflict: boolean };

/** Traduit l'erreur d'un enregistrement en retour lisible par le gabarit. */
function saveFailure(error: { code?: string; message?: string }): SaveResult {
  return {
    ok: false,
    error: strategyError(error),
    conflict: error.message === "revision_conflict",
  };
}

/**
 * Enregistre le contenu d'un gabarit (sauvegarde automatique). Pas de rafraîchissement de
 * la page : le gabarit garde la saisie en cours ; seule la révision revient.
 * @param studyId  - Identifiant de l'étude
 * @param stepNo   - Étape dotée d'un gabarit
 * @param payload  - Contenu complet du gabarit (validé ici par Zod)
 * @param revision - Révision sur laquelle repose la saisie
 */
export async function saveStepPayload(
  studyId: string,
  stepNo: number,
  payload: unknown,
  revision: number,
): Promise<SaveResult> {
  await requireUser(`/strategie/etudes/${studyId}`);
  if (!isUuid(studyId) || !isEditableStep(stepNo) || !Number.isInteger(revision)
    || revision < 0) {
    return { ok: false, error: s.errors.generic, conflict: false };
  }
  const data = parseStepPayload(stepNo, payload);
  if (!data) return { ok: false, error: s.errors.invalid_payload, conflict: false };

  const supabase = await createClient();
  const { data: next, error } = await supabase.rpc("strategy_save_step", {
    p_study_id: studyId,
    p_step_no: stepNo,
    p_payload: data,
    p_revision: revision,
  });
  if (error || typeof next !== "number") return saveFailure(error ?? {});
  return { ok: true, revision: next, savedAt: new Date().toISOString() };
}

/**
 * Restaure une version du gabarit ; la page est rafraîchie pour afficher son contenu.
 * @param studyId   - Identifiant de l'étude
 * @param stepNo    - Étape concernée
 * @param versionId - Version à restaurer
 * @param revision  - Révision affichée (refus si le contenu a changé entre-temps)
 */
export async function restoreStepVersion(
  studyId: string,
  stepNo: number,
  versionId: string,
  revision: number,
): Promise<SaveResult> {
  await requireUser(`/strategie/etudes/${studyId}`);
  if (!isUuid(studyId) || !isUuid(versionId) || !isEditableStep(stepNo)
    || !Number.isInteger(revision)) {
    return { ok: false, error: s.errors.generic, conflict: false };
  }

  const supabase = await createClient();
  const { data: next, error } = await supabase.rpc("strategy_restore_version", {
    p_study_id: studyId,
    p_step_no: stepNo,
    p_version_id: versionId,
    p_revision: revision,
  });
  if (error || typeof next !== "number") return saveFailure(error ?? {});
  refresh();
  return { ok: true, revision: next, savedAt: new Date().toISOString() };
}
