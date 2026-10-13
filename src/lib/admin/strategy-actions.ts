/**
 * =============================================================
 *  Fichier    : strategy-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions d'administration de l'assistant stratégie : octroi de crédits
 *               d'étude à un compte (en attendant l'ouverture des paiements), guide de chaque
 *               étape (explication, exemple Infosystem, raison du verrou, chapitre) et livre
 *               guide, réglages du coach IA (modèle, prix, plafond, débit) et supplément de
 *               plafond d'une étude. Les fonctions SQL vérifient le rôle administrateur (aal2) et
 *               écrivent le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-13
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { isUuid } from "@/lib/admin/validation";
import { isStepNo } from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const a = t.strategy.admin;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTE_MAX = 500;
const GUIDE_TEXT_MAX = 5000;
const LOCK_REASON_MAX = 500;
const CHAPTER_MAX = 1000;
/** Identifiant de modèle accepté (même contrôle que la contrainte SQL). */
const MODEL_PATTERN = /^[a-z0-9][a-z0-9.-]{1,79}$/;
const PRICE_MAX = 10_000;
const AMOUNT_MAX = 1000;

/** Lit un nombre saisi avec une virgule ou un point décimal ; NaN si vide ou invalide. */
function readNumber(formData: FormData, name: string): number {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  return raw === "" ? Number.NaN : Number(raw);
}

/** Accorde un ou plusieurs crédits d'étude au compte désigné par son courriel. */
export async function grantStudyCredits(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const note = String(formData.get("note") ?? "").trim().slice(0, NOTE_MAX);

  if (!EMAIL_PATTERN.test(email)) return { error: a.userNotFound };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return { error: a.invalidQuantity };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("strategy_grant_credits", {
    p_email: email,
    p_quantity: quantity,
    p_note: note,
  });
  if (error) {
    if (error.message === "user_not_found") return { error: a.userNotFound };
    if (error.message === "invalid_quantity") return { error: a.invalidQuantity };
    return { error: t.strategy.errors.generic };
  }
  refresh();
  return { message: interpolate(a.granted, { quantity: String(quantity), email }) };
}

/**
 * Enregistre le guide d'une étape : explication et exemple de l'auteur, raison du verrou,
 * chapitre du livre guide (vide = aucun lien).
 */
export async function saveStepGuide(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const stepNo = Number(formData.get("stepNo"));
  const explanation = String(formData.get("explanation") ?? "").trim();
  const example = String(formData.get("example") ?? "").trim();
  const lockReason = String(formData.get("lockReason") ?? "").trim();
  const rawChapter = String(formData.get("chapter") ?? "").trim();
  const chapter = rawChapter === "" ? null : Number(rawChapter);

  if (!isStepNo(stepNo)) return { error: t.strategy.errors.generic };
  if (explanation.length > GUIDE_TEXT_MAX || example.length > GUIDE_TEXT_MAX) {
    return { error: interpolate(a.guides.tooLong, { max: String(GUIDE_TEXT_MAX) }) };
  }
  if (lockReason.length > LOCK_REASON_MAX) {
    return { error: interpolate(a.guides.tooLong, { max: String(LOCK_REASON_MAX) }) };
  }
  if (chapter !== null && (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTER_MAX)) {
    return { error: a.guides.invalidChapter };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_strategy_step", {
    p_step_no: stepNo,
    p_explanation: explanation,
    p_example: example,
    p_lock_reason: lockReason,
    p_chapter_position: chapter,
  });
  if (error) return { error: t.strategy.errors.generic };
  refresh();
  return { message: a.guides.saved };
}

/** Choisit le livre guide dont les chapitres accompagnent les étapes (vide = aucun). */
export async function setGuideBook(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = String(formData.get("bookId") ?? "").trim();
  if (raw !== "" && !isUuid(raw)) return { error: t.strategy.errors.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_strategy_guide_book", {
    p_book_id: raw === "" ? null : raw,
  });
  if (error) return { error: t.strategy.errors.generic };
  refresh();
  return { message: a.guides.bookSaved };
}

// ==================== COACH IA ====================

/** Enregistre les réglages du coach : activation, modèle, prix, plafond et débit. */
export async function saveCoachSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const c = a.coach;
  const model = String(formData.get("model") ?? "").trim();
  const inputPrice = readNumber(formData, "inputPrice");
  const outputPrice = readNumber(formData, "outputPrice");
  const budget = readNumber(formData, "budget");
  const rateLimit = readNumber(formData, "rateLimit");
  const rateWindow = readNumber(formData, "rateWindow");

  if (!MODEL_PATTERN.test(model)) return { error: c.invalidModel };
  const pricesOk = [inputPrice, outputPrice].every(
    (price) => Number.isFinite(price) && price >= 0 && price <= PRICE_MAX,
  );
  if (!pricesOk || !Number.isFinite(budget) || budget <= 0 || budget > AMOUNT_MAX
    || !Number.isInteger(rateLimit) || rateLimit < 1 || rateLimit > 100
    || !Number.isInteger(rateWindow) || rateWindow < 1 || rateWindow > 1440) {
    return { error: c.invalid };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_coach_settings", {
    p_enabled: formData.get("enabled") === "on",
    p_model: model,
    p_input_price: inputPrice,
    p_output_price: outputPrice,
    p_budget: budget,
    p_rate_limit: rateLimit,
    p_rate_window: rateWindow,
  });
  if (error) return { error: t.strategy.errors.generic };
  refresh();
  return { message: c.saved };
}

/** Accorde un supplément de plafond (dollars US) à une étude. */
export async function grantCoachAllowance(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const c = a.coach;
  const studyId = String(formData.get("studyId") ?? "").trim();
  const amount = readNumber(formData, "amount");
  const note = String(formData.get("note") ?? "").trim().slice(0, NOTE_MAX);

  if (!isUuid(studyId)) return { error: t.strategy.errors.generic };
  if (!Number.isFinite(amount) || amount < 0.01 || amount > AMOUNT_MAX) {
    return { error: c.invalidAmount };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_coach_allowance", {
    p_study_id: studyId,
    p_amount: Math.round(amount * 100) / 100,
    p_note: note,
  });
  if (error) {
    if (error.message === "invalid_amount") return { error: c.invalidAmount };
    return { error: t.strategy.errors.generic };
  }
  refresh();
  return { message: interpolate(c.granted, { amount: amount.toFixed(2).replace(".", ",") }) };
}
