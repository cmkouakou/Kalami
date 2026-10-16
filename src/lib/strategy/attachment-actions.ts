/**
 * =============================================================
 *  Fichier    : attachment-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur des pièces jointes du profil (S5b) : enregistrer une pièce
 *               déjà déposée dans le seau, la supprimer, obtenir un lien de téléchargement
 *               (60 secondes), l'analyser (résumé et propositions du coach) et appliquer les
 *               propositions retenues au profil. Rôles, nombre de pièces, débit et plafond
 *               sont vérifiés en SQL ; l'application enregistre directement le profil.
 *               Forfait absent ou épuisé : « pay » renvoie vers la page du coach (v0.11.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
 *  Dépendances: coach/extract.ts, lib/strategy/prefill.ts, lib/strategy/profile.ts,
 *               lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireUser } from "@/lib/auth/dal";
import {
  ATTACHMENTS_BUCKET,
  ATTACHMENT_FORMATS,
  extensionOf,
  FILE_NAME_MAX,
} from "@/lib/strategy/attachments";
import { needsPack } from "@/lib/strategy/coach/context";
import { runExtract } from "@/lib/strategy/coach/extract";
import { getCoachUsage, type CoachUsage } from "@/lib/strategy/coach/queries";
import { mergeProposals, readExtract, type Extract } from "@/lib/strategy/prefill";
import { profileDataSchema, readProfileData } from "@/lib/strategy/profile";
import { createClient } from "@/lib/supabase/server";

const s = getDictionary().strategy;
const a = s.attachments;

// ==================== TYPES ====================

export type AttachmentActionResult = { ok: true } | { ok: false; error: string };

export type AnalyzeResult =
  | { ok: true; requestId: string; output: Extract; usage: CoachUsage | null }
  | { ok: false; error: string; usage: CoachUsage | null; pay?: boolean };

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Traduit l'erreur d'une fonction SQL des pièces jointes.
 * @param error - Erreur PostgREST (code et message)
 */
function attachmentError(error: { code?: string; message?: string }): string {
  if (error.message === "too_many_attachments") return a.errors.tooMany;
  if (error.message === "object_missing") return a.errors.missing;
  if (error.code === "42501") return s.errors.forbidden;
  return s.errors.generic;
}

// ==================== PIÈCES ====================

/**
 * Enregistre une pièce déposée par le navigateur dans le seau. En cas de refus, le fichier
 * déposé est retiré du seau.
 * @param studyId  - Identifiant de l'étude
 * @param path     - Chemin dans le seau (etudes/<étude>/<uuid>.<extension>)
 * @param fileName - Nom d'origine du fichier
 */
export async function registerAttachment(
  studyId: string,
  path: string,
  fileName: string,
): Promise<AttachmentActionResult> {
  await requireUser(`/strategie/etudes/${studyId}/profil`);
  const extension = extensionOf(fileName);
  const name = fileName.trim().slice(0, FILE_NAME_MAX);
  const pattern = new RegExp(`^etudes/${studyId}/[0-9a-f-]{36}\\.${extension}$`);
  if (!isUuid(studyId) || !extension || !name || !pattern.test(path)) {
    return { ok: false, error: a.errors.format };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_add_attachment", {
    p_study_id: studyId,
    p_storage_path: path,
    p_file_name: name,
    p_mime_type: ATTACHMENT_FORMATS[extension],
  });
  if (error) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);
    return { ok: false, error: attachmentError(error) };
  }
  refresh();
  return { ok: true };
}

/**
 * Supprime une pièce (ligne, puis fichier du seau). L'analyse déjà faite reste comptée
 * dans la consommation de l'étude.
 * @param attachmentId - Identifiant de la pièce
 */
export async function deleteAttachment(attachmentId: string): Promise<AttachmentActionResult> {
  await requireUser("/strategie");
  if (!isUuid(attachmentId)) return { ok: false, error: s.errors.generic };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("strategy_delete_attachment", {
    p_attachment_id: attachmentId,
  });
  if (error || typeof data !== "string") return { ok: false, error: attachmentError(error ?? {}) };
  // Un fichier resté orphelin ne gêne pas : il n'est plus référencé ni compté par la table
  await supabase.storage.from(ATTACHMENTS_BUCKET).remove([data]);
  refresh();
  return { ok: true };
}

/**
 * Lien signé de téléchargement d'une pièce, valable 60 secondes.
 * @param attachmentId - Identifiant de la pièce
 */
export async function attachmentLink(
  attachmentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireUser("/strategie");
  if (!isUuid(attachmentId)) return { ok: false, error: s.errors.generic };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("study_attachments")
    .select("storage_path, file_name")
    .eq("id", attachmentId)
    .maybeSingle<{ storage_path: string; file_name: string }>();
  if (!row) return { ok: false, error: s.errors.forbidden };

  const { data } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(row.storage_path, 60, { download: row.file_name });
  if (!data?.signedUrl) return { ok: false, error: a.errors.missing };
  return { ok: true, url: data.signedUrl };
}

// ==================== ANALYSE ====================

/**
 * Demande au coach le résumé d'une pièce et des propositions pour le profil.
 * @param studyId      - Identifiant de l'étude
 * @param attachmentId - Identifiant de la pièce
 */
export async function analyzeAttachment(
  studyId: string,
  attachmentId: string,
): Promise<AnalyzeResult> {
  await requireUser(`/strategie/etudes/${studyId}/profil`);
  if (!isUuid(studyId) || !isUuid(attachmentId)) {
    return { ok: false, error: s.coach.errors.failed, usage: null };
  }

  const result = await runExtract(studyId, attachmentId);
  const usage = await getCoachUsage(studyId).catch(() => null);
  if (!result.ok) {
    const pay = needsPack(result.error);
    return { ok: false, error: s.coach.errors[result.error], usage, pay };
  }
  refresh();
  return { ok: true, requestId: result.requestId, output: result.output, usage };
}

/**
 * Applique au profil les propositions retenues d'une analyse, puis note la décision prise
 * sur chacune (retenue : acceptée ; non retenue : rejetée).
 *
 * @param studyId   - Identifiant de l'étude
 * @param requestId - Analyse concernée (fonction extract, réussie)
 * @param selected  - Indices des propositions retenues
 * @returns Succès, ou message d'erreur
 */
export async function applyProposals(
  studyId: string,
  requestId: string,
  selected: number[],
): Promise<AttachmentActionResult> {
  await requireUser(`/strategie/etudes/${studyId}/profil`);
  if (!isUuid(studyId) || !isUuid(requestId) || !Array.isArray(selected)
    || !selected.every((index) => Number.isInteger(index) && index >= 0)) {
    return { ok: false, error: s.errors.generic };
  }

  const supabase = await createClient();
  const [request, study] = await Promise.all([
    supabase
      .from("coach_requests")
      .select("output")
      .eq("id", requestId)
      .eq("study_id", studyId)
      .eq("function", "extract")
      .eq("status", "done")
      .maybeSingle<{ output: unknown }>(),
    supabase
      .from("studies")
      .select("company_name, strategic_question, company_profiles (data)")
      .eq("id", studyId)
      .maybeSingle<{
        company_name: string;
        strategic_question: string;
        company_profiles: { data: unknown } | null;
      }>(),
  ]);
  const extract = readExtract(request.data?.output);
  if (!extract || !study.data) return { ok: false, error: s.errors.forbidden };

  const chosen = new Set(selected.filter((index) => index < extract.proposals.length));
  if (chosen.size > 0) {
    const profile = readProfileData(study.data.company_profiles?.data);
    const merged = profileDataSchema.safeParse(
      mergeProposals(profile, extract.proposals.filter((_, index) => chosen.has(index))),
    );
    if (!merged.success) return { ok: false, error: s.errors.invalid_profile };

    const { error } = await supabase.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: study.data.company_name,
      p_strategic_question: study.data.strategic_question,
      p_data: merged.data,
    });
    if (error) {
      return { ok: false, error: error.code === "42501" ? s.errors.forbidden : s.errors.generic };
    }
  }

  // Suivi des décisions : un échec ici n'annule pas l'enregistrement du profil
  await Promise.all(
    extract.proposals.map((_, index) =>
      supabase.rpc("coach_decide", {
        p_request_id: requestId,
        p_index: index,
        p_decision: chosen.has(index) ? "accepted" : "rejected",
      }),
    ),
  );
  refresh();
  return { ok: true };
}
