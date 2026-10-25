/**
 * =============================================================
 *  Fichier    : workshop-actions.ts
 *  Projet     : Kalami
 *  Description: Actions d'administration de l'atelier de l'auteur (v0.15.0) : réglages des
 *               outils IA (activation, modèle, prix, débit), forfaits de Crédits Atelier
 *               (création, modification) et octroi gratuit d'un forfait à un auteur. Les
 *               fonctions SQL vérifient le rôle administrateur et écrivent le journal d'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { isUuid } from "@/lib/admin/validation";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const w = t.workshop.admin;

// ==================== CONSTANTES ====================

/** Identifiant de modèle accepté (même contrôle que pour le coach). */
const MODEL_PATTERN = /^[a-z0-9][a-z0-9.-]{1,79}$/;
/** Bornes des fonctions SQL. */
const PRICE_MAX = 1000;
const AMOUNT_MAX = 1000;
const POSITION_MAX = 1000;
const NOTE_MAX = 500;
const SALE_PRICE_MAX = 10_000_000;

// ==================== UTILITAIRES ====================

/** Lit un nombre saisi avec une virgule ou un point décimal ; NaN si vide ou invalide. */
function readNumber(formData: FormData, name: string): number {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  return raw === "" ? Number.NaN : Number(raw);
}

/** Lit un prix facultatif : null si vide, NaN si invalide. */
function readOptionalPrice(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  return raw === "" ? null : readNumber(formData, name);
}

/** Message d'un refus levé par une fonction SQL de l'atelier. */
function workshopError(message: string): string {
  const errors: Record<string, string> = w.errors;
  return errors[message] ?? w.errors.generic;
}

/** Arrondi au cent ; null conservé. */
function toCents(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100) / 100;
}

// ==================== RÉGLAGES ====================

/** Enregistre les réglages des outils IA : activation, modèle, prix et débit par auteur. */
export async function saveWorkshopSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const s = w.settings;
  const model = String(formData.get("model") ?? "").trim();
  const inputPrice = readNumber(formData, "inputPrice");
  const outputPrice = readNumber(formData, "outputPrice");
  const rateLimit = readNumber(formData, "rateLimit");
  const rateWindow = readNumber(formData, "rateWindow");

  if (!MODEL_PATTERN.test(model)) return { error: s.invalidModel };
  const pricesOk = [inputPrice, outputPrice].every(
    (price) => Number.isFinite(price) && price >= 0 && price <= PRICE_MAX,
  );
  if (!pricesOk
    || !Number.isInteger(rateLimit) || rateLimit < 1 || rateLimit > 1000
    || !Number.isInteger(rateWindow) || rateWindow < 1 || rateWindow > 1440) {
    return { error: s.invalid };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_workshop_settings", {
    p_enabled: formData.get("enabled") === "on",
    p_model: model,
    p_input_price: inputPrice,
    p_output_price: outputPrice,
    p_rate_limit: rateLimit,
    p_rate_window: rateWindow,
  });
  if (error) return { error: workshopError(error.message) };
  refresh();
  return { message: s.saved };
}

// ==================== FORFAITS ====================

/**
 * Crée ou modifie un forfait de Crédits Atelier : nom, coût Anthropic couvert (dollars US),
 * prix facultatifs (FCFA entier, euros et dollars canadiens à deux décimales), état, ordre.
 */
export async function saveWorkshopPack(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const errors = w.errors;
  const rawId = String(formData.get("packId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const cost = readNumber(formData, "cost");
  const priceXof = readOptionalPrice(formData, "priceXof");
  const priceEur = readOptionalPrice(formData, "priceEur");
  const priceCad = readOptionalPrice(formData, "priceCad");
  const position = Number(formData.get("position") ?? 0);

  if (rawId !== "" && !isUuid(rawId)) return { error: errors.generic };
  if (name.length < 1 || name.length > 80) return { error: errors.invalid_name };
  if (!Number.isFinite(cost) || cost < 0.01 || cost > AMOUNT_MAX) {
    return { error: errors.invalid_amount };
  }
  const pricesOk = [priceXof, priceEur, priceCad].every(
    (price) => price === null || (Number.isFinite(price) && price > 0 && price <= SALE_PRICE_MAX),
  );
  if (!pricesOk || (priceXof !== null && !Number.isInteger(priceXof))) {
    return { error: errors.invalid_price };
  }
  if (!Number.isInteger(position) || position < 0 || position > POSITION_MAX) {
    return { error: errors.generic };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_workshop_pack", {
    p_id: rawId === "" ? null : rawId,
    p_name: name,
    p_cost: toCents(cost),
    p_price_xof: priceXof,
    p_price_eur: toCents(priceEur),
    p_price_cad: toCents(priceCad),
    p_active: formData.get("active") === "on",
    p_position: position,
  });
  if (error) return { error: workshopError(error.message) };
  refresh();
  return { message: w.packs.saved };
}

/** Offre un forfait à un auteur : ajoute ses crédits sans paiement. */
export async function grantWorkshopPack(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const authorId = String(formData.get("authorId") ?? "").trim();
  const packId = String(formData.get("packId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, NOTE_MAX);
  if (!isUuid(authorId) || !isUuid(packId)) return { error: w.errors.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_workshop_pack", {
    p_author_id: authorId,
    p_pack_id: packId,
    p_note: note,
  });
  if (error) return { error: workshopError(error.message) };
  refresh();
  return { message: w.grant.granted };
}
