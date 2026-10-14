/**
 * =============================================================
 *  Fichier    : strategy-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions d'administration de l'assistant stratégie : octroi de crédits
 *               d'étude à un compte (en attendant l'ouverture des paiements), guide de chaque
 *               étape (explication, exemple Infosystem, raison du verrou, chapitre) et livre
 *               guide, réglages du coach IA (modèle, prix, plafond, débit, recherche Web :
 *               prix et nombre de recherches par demande), supplément de
 *               plafond d'une étude, versions des consignes du coach (brouillon, publication,
 *               abandon, restauration ; « extract » sans étape) et erreurs classiques. Les
 *               fonctions SQL vérifient le rôle administrateur (aal2) et écrivent le journal
 *               d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-14
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { isUuid } from "@/lib/admin/validation";
import { PROMPT_FUNCTIONS } from "@/lib/strategy/coach/context";
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
/** Longueurs maximales (mêmes contrôles que les fonctions SQL). */
const PROMPT_BODY_MAX = 20_000;
const RULE_TITLE_MAX = 300;
const RULE_CODE_PATTERN = /^[a-z0-9_]{2,60}$/;
const POSITION_MAX = 1000;

/** Lit une étape facultative (vide = consigne ou règle générale) ; undefined si invalide. */
function readOptionalStep(formData: FormData): number | null | undefined {
  const raw = String(formData.get("stepNo") ?? "").trim();
  if (raw === "") return null;
  const stepNo = Number(raw);
  return isStepNo(stepNo) ? stepNo : undefined;
}

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

/** Enregistre les réglages du coach : activation, modèle, prix, plafond, débit, recherche. */
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
  const searchPrice = readNumber(formData, "searchPrice");
  const searchMaxUses = readNumber(formData, "searchMaxUses");

  if (!MODEL_PATTERN.test(model)) return { error: c.invalidModel };
  const pricesOk = [inputPrice, outputPrice, searchPrice].every(
    (price) => Number.isFinite(price) && price >= 0 && price <= PRICE_MAX,
  );
  if (!pricesOk || !Number.isFinite(budget) || budget <= 0 || budget > AMOUNT_MAX
    || !Number.isInteger(rateLimit) || rateLimit < 1 || rateLimit > 100
    || !Number.isInteger(rateWindow) || rateWindow < 1 || rateWindow > 1440
    || !Number.isInteger(searchMaxUses) || searchMaxUses < 1 || searchMaxUses > 20) {
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
    p_search_price: searchPrice,
    p_search_max_uses: searchMaxUses,
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

// ==================== CONSIGNES DU COACH ====================

/** Messages des refus levés par les fonctions SQL des consignes. */
function promptError(message: string): string {
  const p = a.coachPrompts;
  if (message === "invalid_body") return interpolate(p.tooLong, { max: String(PROMPT_BODY_MAX) });
  if (message === "not_a_draft") return p.notDraft;
  if (message === "prompt_not_found") return p.notFound;
  if (message === "invalid_prompt") return p.invalid;
  return t.strategy.errors.generic;
}

/**
 * Enregistre le brouillon d'une consigne : met à jour le brouillon existant de la fonction
 * et de l'étape, ou en crée un avec le numéro de version suivant. Rien n'est publié.
 */
export async function saveCoachPromptDraft(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const p = a.coachPrompts;
  const fn = String(formData.get("fn") ?? "");
  const stepNo = readOptionalStep(formData);
  const body = String(formData.get("body") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, NOTE_MAX);

  // L'analyse des pièces jointes (extract) n'a qu'une consigne générale, sans étape ;
  // le préremplissage (synthesize) ne sert qu'à l'étape 5
  if (!(PROMPT_FUNCTIONS as readonly string[]).includes(fn) || stepNo === undefined
    || (fn === "extract" && stepNo !== null)
    || (fn === "synthesize" && stepNo !== null && stepNo !== 5)) {
    return { error: p.invalid };
  }
  if (body === "") return { error: p.emptyBody };
  if (body.length > PROMPT_BODY_MAX) {
    return { error: interpolate(p.tooLong, { max: String(PROMPT_BODY_MAX) }) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_coach_prompt_draft", {
    p_function: fn,
    p_step_no: stepNo,
    p_body: body,
    p_note: note,
  });
  if (error) return { error: promptError(error.message) };
  refresh();
  return { message: p.saved };
}

/**
 * Applique une action sur une version désignée par son identifiant.
 * @param formData - Formulaire portant le champ id
 * @param rpc      - Fonction SQL à appeler
 * @param done     - Message de réussite
 */
async function promptAction(
  formData: FormData,
  rpc: "admin_publish_coach_prompt" | "admin_discard_coach_prompt_draft"
    | "admin_restore_coach_prompt",
  done: string,
): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!isUuid(id)) return { error: t.strategy.errors.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc(rpc, { p_id: id });
  if (error) return { error: promptError(error.message) };
  refresh();
  return { message: done };
}

/** Publie un brouillon : il devient la consigne utilisée par le coach. */
export async function publishCoachPrompt(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return promptAction(formData, "admin_publish_coach_prompt", a.coachPrompts.published);
}

/** Supprime un brouillon jamais publié. */
export async function discardCoachPromptDraft(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return promptAction(formData, "admin_discard_coach_prompt_draft", a.coachPrompts.discarded);
}

/** Copie une ancienne version dans le brouillon, à relire puis publier. */
export async function restoreCoachPrompt(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return promptAction(formData, "admin_restore_coach_prompt", a.coachPrompts.restored);
}

// ==================== ERREURS CLASSIQUES ====================

/**
 * Crée ou modifie une erreur classique : étape, titre, explication du livre, ordre et
 * activation. Le code n'est saisi qu'à la création ; l'état précédent est historisé en SQL.
 */
export async function saveCoachRule(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const r = a.coachRules;
  const rawId = String(formData.get("id") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const stepNo = readOptionalStep(formData);
  const title = String(formData.get("title") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  const position = Number(String(formData.get("position") ?? "0").trim() || "0");

  if (rawId !== "" && !isUuid(rawId)) return { error: t.strategy.errors.generic };
  if (rawId === "" && !RULE_CODE_PATTERN.test(code)) return { error: r.invalidCode };
  if (stepNo === undefined || title === "" || title.length > RULE_TITLE_MAX
    || !Number.isInteger(position) || position < 0 || position > POSITION_MAX) {
    return { error: r.invalid };
  }
  if (explanation.length > GUIDE_TEXT_MAX) {
    return { error: interpolate(a.guides.tooLong, { max: String(GUIDE_TEXT_MAX) }) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_coach_rule", {
    p_id: rawId === "" ? null : rawId,
    p_code: code,
    p_step_no: stepNo,
    p_title: title,
    p_explanation: explanation,
    p_position: position,
    p_active: formData.get("active") === "on",
  });
  if (error) {
    const known: Record<string, string> = {
      invalid_rule: r.invalid,
      invalid_code: r.invalidCode,
      code_taken: r.codeTaken,
      rule_not_found: r.notFound,
    };
    return { error: known[error.message] ?? t.strategy.errors.generic };
  }
  refresh();
  return { message: rawId === "" ? r.created : r.saved };
}
