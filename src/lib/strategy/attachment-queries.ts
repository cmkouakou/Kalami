/**
 * =============================================================
 *  Fichier    : attachment-queries.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lectures des pièces jointes du profil (S5b), avec la session de l'utilisateur
 *               (membres de l'étude seulement) : pièces de l'étude, résumé et dernière analyse
 *               réussie de chacune (propositions et décisions déjà prises), consommation du
 *               coach et disponibilité de la fonction « extract » (consigne publiée).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: lib/supabase/server.ts, lib/supabase/admin.ts, coach/queries.ts,
 *               lib/strategy/prefill.ts
 * =============================================================
 */

import "server-only";

import {
  check,
  getCoachUsage,
  readDecisions,
  type CoachDecision,
  type CoachUsage,
} from "@/lib/strategy/coach/queries";
import { readExtract, type Extract } from "@/lib/strategy/prefill";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Dernière analyse réussie d'une pièce. */
export type AttachmentAnalysis = {
  requestId: string;
  output: Extract;
  decisions: Record<number, CoachDecision>;
};

/** Pièce jointe telle qu'affichée dans le panneau du profil. */
export type StudyAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  analyzedAt: string | null;
  analysis: AttachmentAnalysis | null;
};

/** État du panneau : pièces, consommation et disponibilité de l'analyse. */
export type AttachmentsState = {
  attachments: StudyAttachment[];
  usage: CoachUsage;
  /** Vrai si une consigne « extract » est publiée. */
  canAnalyze: boolean;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  analyzed_at: string | null;
  analysis_request_id: string | null;
};

type RequestRow = { id: string; output: unknown; decisions: unknown };

// ==================== LECTURES ====================

/** Vrai si une consigne « extract » est publiée (rôle service : seul le nombre sort). */
async function isExtractPublished(): Promise<boolean> {
  const result = await createAdminClient()
    .from("coach_prompts")
    .select("id", { count: "exact", head: true })
    .eq("function", "extract")
    .not("published_at", "is", null);
  if (result.error) {
    throw new Error(`Lecture impossible (consigne extract) : ${result.error.message}`);
  }
  return (result.count ?? 0) > 0;
}

/**
 * Pièces de l'étude (les plus anciennes d'abord) avec leur dernière analyse réussie.
 * @param studyId - Étude dont l'utilisateur est membre
 */
export async function listAttachments(studyId: string): Promise<StudyAttachment[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("study_attachments")
      .select("id, file_name, mime_type, size_bytes, created_at, analyzed_at, analysis_request_id")
      .eq("study_id", studyId)
      .order("created_at")
      .returns<AttachmentRow[]>(),
    "pièces jointes",
  ) ?? [];

  const requestIds = rows.flatMap((row) => row.analysis_request_id ?? []);
  const requests = requestIds.length === 0 ? [] : check(
    await supabase
      .from("coach_requests")
      .select("id, output, decisions")
      .in("id", requestIds)
      .returns<RequestRow[]>(),
    "analyses des pièces",
  ) ?? [];
  const byId = new Map(requests.map((request) => [request.id, request]));

  return rows.map((row) => {
    const request = row.analysis_request_id ? byId.get(row.analysis_request_id) : undefined;
    const output = request ? readExtract(request.output) : null;
    return {
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      createdAt: row.created_at,
      analyzedAt: row.analyzed_at,
      analysis: request && output
        ? { requestId: request.id, output, decisions: readDecisions(request.decisions) }
        : null,
    };
  });
}

/**
 * État complet du panneau des pièces jointes.
 * @param studyId - Étude dont l'utilisateur est membre
 */
export async function getAttachmentsState(studyId: string): Promise<AttachmentsState> {
  const [attachments, usage, canAnalyze] = await Promise.all([
    listAttachments(studyId),
    getCoachUsage(studyId),
    isExtractPublished(),
  ]);
  return { attachments, usage, canAnalyze };
}
