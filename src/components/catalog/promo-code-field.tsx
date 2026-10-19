/**
 * =============================================================
 *  Fichier    : promo-code-field.tsx
 *  Projet     : Kalami
 *  Description: Champ « code promo » du bouton d'achat (composant client, v0.10.3) : lien
 *               qui ouvre le champ, vérification du code par l'API (aperçu de la réduction)
 *               et bouton pour retirer un code appliqué. Le montant final est toujours
 *               recalculé par la base à la création de la commande.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: api/paiement/promo, lib/payments/promo.ts
 * =============================================================
 */

"use client";

import { useId, useState } from "react";

import { BUTTON_SECONDARY, BUTTON_TERTIARY, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { CheckoutItem } from "@/lib/payments/checkout-request";
import { normalizePromoCode, type PromoPreview } from "@/lib/payments/promo";

const t = getDictionary();

type PromoCodeFieldProps = {
  /** Article affiché (le code est vérifié pour cet article) */
  item: CheckoutItem;
  /** Code appliqué (null : aucun) */
  promo: PromoPreview | null;
  /** Appelé quand un code est accepté (aperçu) ou retiré (null) */
  onChange: (promo: PromoPreview | null) => void;
  /** Champ désactivé (paiement en cours) */
  disabled: boolean;
  /** Message d'erreur lisible pour un code d'erreur de l'API */
  errorMessage: (code: unknown) => string;
};

/** Champ de code promo, replié par défaut. */
export function PromoCodeField(props: PromoCodeFieldProps) {
  const { item, promo, onChange, disabled, errorMessage } = props;
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Vérifie le code saisi auprès de l'API et transmet l'aperçu de la réduction.
   * Un code mal formé est refusé sans appel réseau.
   */
  async function applyCode() {
    const code = normalizePromoCode(value);
    if (!code) {
      setError(errorMessage("promo_invalid"));
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/paiement/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, code }),
      });
      const body = (await response.json().catch(() => null)) as
        | { promo?: PromoPreview; error?: string }
        | null;
      if (response.ok && body?.promo) {
        onChange(body.promo);
        setValue("");
      } else {
        setError(errorMessage(body?.error));
      }
    } catch {
      setError(errorMessage(null));
    }
    setChecking(false);
  }

  // Code déjà appliqué : rappel du code et bouton pour le retirer
  if (promo) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 text-small text-ink">
        <span role="status">
          {interpolate(t.catalog.purchase.promoApplied, { code: promo.code })}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className={BUTTON_TERTIARY}
        >
          {t.catalog.purchase.promoRemove}
        </button>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-expanded={false}
        className={`${BUTTON_TERTIARY} self-start text-small`}
      >
        {t.catalog.purchase.promoToggle}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-small text-ink-muted">
        {t.catalog.purchase.promoLabel}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            // Entrée vérifie le code sans soumettre un éventuel formulaire parent
            if (event.key === "Enter") {
              event.preventDefault();
              void applyCode();
            }
          }}
          maxLength={30}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={disabled || checking}
          aria-invalid={error !== null}
          className={`${CONTROL} min-w-0 flex-1 uppercase`}
        />
        <button
          type="button"
          onClick={applyCode}
          disabled={disabled || checking || value.trim() === ""}
          aria-busy={checking}
          className={BUTTON_SECONDARY}
        >
          {checking ? t.catalog.purchase.promoChecking : t.catalog.purchase.promoApply}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
