/**
 * =============================================================
 *  Fichier    : promo-validation.ts
 *  Projet     : Kalami
 *  Description: Lecture du formulaire « Nouveau code promo » de l'administration (v0.10.3) :
 *               code, portée, livre, réduction (pourcentage OU montants par devise), date
 *               d'expiration, nombre maximal d'utilisations et note. Fonction pure : la base
 *               revérifie tout (contraintes de la table promo_codes).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/admin/validation.ts, lib/payments/promo.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { normalizePromoCode } from "@/lib/payments/promo";

// ==================== TYPES ====================

/** Portées d'un code : un livre, tous les livres, les offres Stratégie, ou tout. */
export const PROMO_SCOPES = ["book", "books", "strategy", "all"] as const;
export type PromoScope = (typeof PROMO_SCOPES)[number];

/** Paramètres de la fonction admin_create_promo_code. */
export type PromoCodeInput = {
  p_code: string;
  p_scope: PromoScope;
  p_book_id: string | null;
  p_percent_off: number | null;
  p_amount_off_xof: number | null;
  p_amount_off_eur: number | null;
  p_amount_off_cad: number | null;
  p_expires_at: string | null;
  p_max_uses: number | null;
  p_note: string | null;
};

/** Résultat : paramètres prêts, ou code d'erreur (clé de admin.promos.errors). */
export type PromoParse = { ok: true; value: PromoCodeInput } | { ok: false; error: string };

/** Plafonds (identiques aux contraintes SQL). */
const PERCENT_MAX = 90;
const MAX_USES_LIMIT = 100_000;
const AMOUNT_MAX = 10_000_000;
const NOTE_MAX = 200;

// ==================== FONCTIONS UTILITAIRES ====================

/** Texte d'un champ, sans espaces autour. */
function text(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}

/** Nombre facultatif (virgule acceptée) : null si vide, NaN si invalide. */
function optionalNumber(fd: FormData, name: string): number | null {
  const raw = text(fd, name).replace(",", ".");
  return raw === "" ? null : Number(raw);
}

/** Vrai si la valeur est absente, ou un montant positif (entier si demandé). */
function validAmount(value: number | null, integer: boolean): boolean {
  if (value === null) return true;
  if (!Number.isFinite(value) || value <= 0 || value > AMOUNT_MAX) return false;
  return !integer || Number.isInteger(value);
}

// ==================== LECTURE DU FORMULAIRE ====================

/**
 * Valide le formulaire de création d'un code promo.
 *
 * Description : le code est mis en majuscules ; la réduction est un pourcentage (1 à 90)
 * OU au moins un montant (FCFA entier, euros et dollars canadiens au centime) ; la date
 * d'expiration (AAAA-MM-JJ) vaut jusqu'à la fin de ce jour (UTC).
 *
 * @param fd - Données du formulaire
 * @param now - Instant de référence (paramètre pour les tests)
 * @returns Paramètres de admin_create_promo_code, ou code d'erreur
 *
 * Exemple :
 *   parsePromoCodeForm(fd) → { ok: true, value: { p_code: "RENTREE-25", … } }
 */
export function parsePromoCodeForm(fd: FormData, now = new Date()): PromoParse {
  const code = normalizePromoCode(fd.get("code"));
  if (!code) return { ok: false, error: "invalid_code" };

  const scope = PROMO_SCOPES.find((known) => known === text(fd, "scope"));
  if (!scope) return { ok: false, error: "invalid_scope" };
  const bookId = text(fd, "bookId");
  if (scope === "book" && !isUuid(bookId)) return { ok: false, error: "book_required" };

  const percent = optionalNumber(fd, "percentOff");
  const xof = optionalNumber(fd, "amountXof");
  const eur = optionalNumber(fd, "amountEur");
  const cad = optionalNumber(fd, "amountCad");
  const hasAmount = xof !== null || eur !== null || cad !== null;
  if ((percent === null) === !hasAmount) return { ok: false, error: "discount_choice" };
  if (
    percent !== null &&
    (!Number.isInteger(percent) || percent < 1 || percent > PERCENT_MAX)
  ) {
    return { ok: false, error: "invalid_percent" };
  }
  if (!validAmount(xof, true) || !validAmount(eur, false) || !validAmount(cad, false)) {
    return { ok: false, error: "invalid_amount" };
  }

  const expiry = text(fd, "expiresOn");
  let expiresAt: string | null = null;
  if (expiry !== "") {
    const end = new Date(`${expiry}T23:59:59Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(end.getTime())) {
      return { ok: false, error: "invalid_date" };
    }
    if (end.getTime() <= now.getTime()) return { ok: false, error: "date_past" };
    expiresAt = end.toISOString();
  }

  const maxUses = optionalNumber(fd, "maxUses");
  if (
    maxUses !== null &&
    (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > MAX_USES_LIMIT)
  ) {
    return { ok: false, error: "invalid_max_uses" };
  }
  const note = text(fd, "note");
  if (note.length > NOTE_MAX) return { ok: false, error: "invalid_note" };

  const cents = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);
  return {
    ok: true,
    value: {
      p_code: code,
      p_scope: scope,
      p_book_id: scope === "book" ? bookId : null,
      p_percent_off: percent,
      p_amount_off_xof: xof,
      p_amount_off_eur: cents(eur),
      p_amount_off_cad: cents(cad),
      p_expires_at: expiresAt,
      p_max_uses: maxUses,
      p_note: note === "" ? null : note,
    },
  };
}
