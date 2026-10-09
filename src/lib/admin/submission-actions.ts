/**
 * =============================================================
 *  Fichier    : submission-actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur d'administration de l'espace auteur : publication d'une
 *               nouvelle version du contrat, validation ou refus d'une soumission de livre.
 *               Les fonctions SQL écrivent elles-mêmes le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, lib/author/validation.ts, supabase
 * =============================================================
 */

"use server";

import { refresh, updateTag } from "next/cache";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { parseContract, parseReview } from "@/lib/author/validation";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const e = t.admin.errors;

/** Publie une nouvelle version du contrat auteur (numéro attribué par la base). */
export async function publishContract(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseContract(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_publish_contract", {
    p_title: parsed.value.title,
    p_body: parsed.value.body,
  });
  if (error) return { error: e.generic };
  refresh();
  return { message: t.admin.contract.published };
}

/** Valide ou refuse une soumission (identifiant lié par .bind). */
export async function reviewSubmission(
  submissionId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(submissionId)) return { error: e.generic };
  const parsed = parseReview(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_submission", {
    p_submission_id: submissionId,
    p_approve: parsed.value.approve,
    p_reason: parsed.value.reason,
  });
  if (error?.message === "submission_closed") return { error: t.admin.submissions.closed };
  if (error?.message === "reason_required") return { error: e.rejectionReason };
  if (error) return { error: e.generic };

  updateTag(CATALOG_TAG);
  refresh();
  const s = t.admin.submissions;
  return { message: parsed.value.approve ? s.approved : s.rejected };
}
