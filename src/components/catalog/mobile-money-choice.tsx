/**
 * =============================================================
 *  Fichier    : mobile-money-choice.tsx
 *  Projet     : Kalami
 *  Description: Achat par Mobile Money (composant client, Sprint 6, v0.11.0), proposé sous
 *               le bouton d'achat quand la devise est le FCFA. Charge les numéros marchands
 *               ouverts, fait choisir l'opérateur et le pays, crée la commande puis envoie
 *               l'acheteur sur sa page (montant, numéro, référence, déclaration).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-28
 *  Dépendances: api/paiement/mobile-money, lib/currency.ts
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { formatPrice } from "@/lib/currency";
import type { CheckoutItem } from "@/lib/payments/checkout-request";
import type { MobileMoneyOption } from "@/lib/payments/mobile-money-provider";

const t = getDictionary();
const mm = t.mobileMoney;

type MobileMoneyChoiceProps = {
  /** Article acheté */
  item: CheckoutItem;
  /** Nom unique du groupe de boutons radio */
  groupName: string;
  /** Montant affiché en FCFA (après code promo éventuel) */
  amountMinor: number;
  /** Code promo utilisable, ou null */
  promoCode: string | null;
  /** Autre paiement en cours : choix bloqué */
  disabled: boolean;
  /** Message lisible d'une erreur d'achat commune (devise, promo, limite…) */
  errorMessage: (code: unknown) => string;
};

type Step = "closed" | "loading" | "choose";

/** Choix de l'opérateur Mobile Money et création de la commande. */
export function MobileMoneyChoice(props: MobileMoneyChoiceProps) {
  const { item, groupName, amountMinor, promoCode, disabled, errorMessage } = props;
  const router = useRouter();
  const [step, setStep] = useState<Step>("closed");
  const [options, setOptions] = useState<MobileMoneyOption[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Message d'une erreur propre au Mobile Money, sinon message commun. */
  function failure(code: unknown): string {
    const errors = mm.errors as Record<string, string>;
    return typeof code === "string" && code in errors ? errors[code] : errorMessage(code);
  }

  /** Charge les numéros marchands ouverts. */
  async function open() {
    setStep("loading");
    setError(null);
    try {
      const response = await fetch("/api/paiement/mobile-money");
      const body = (await response.json().catch(() => null)) as
        | { options?: MobileMoneyOption[]; error?: string }
        | null;
      if (!response.ok) {
        setError(failure(body?.error));
        setStep("closed");
        return;
      }
      const list = body?.options ?? [];
      setOptions(list);
      setAccountId(list.length === 1 ? list[0].accountId : null);
      setStep("choose");
    } catch {
      setError(failure(null));
      setStep("closed");
    }
  }

  /** Crée la commande Mobile Money puis ouvre sa page. */
  async function start() {
    if (!accountId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/paiement/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          currency: "XOF",
          accountId,
          // Case cochée dans le bouton d'achat (sinon ce choix reste désactivé)
          withdrawalWaiver: true,
          ...(promoCode ? { promoCode } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { orderId?: string; error?: string }
        | null;
      if (response.ok && body?.orderId) {
        router.push(`/compte/achats/${body.orderId}`);
        return;
      }
      setError(failure(body?.error));
    } catch {
      setError(failure(null));
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {step === "closed" && (
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className={`${BUTTON_SECONDARY} w-full`}
        >
          {mm.choose}
        </button>
      )}
      {step === "loading" && (
        <p role="status" className="text-small text-ink-muted">
          {mm.loading}
        </p>
      )}
      {step === "choose" && options.length === 0 && (
        <p role="status" className="text-small text-ink-muted">
          {mm.none}
        </p>
      )}
      {step === "choose" && options.length > 0 && (
        <fieldset className="flex flex-col gap-2 text-small">
          <legend className="mb-1 text-ink-muted">{mm.chooseHelp}</legend>
          {options.map((option) => (
            <label
              key={option.accountId}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border
                border-line px-3 has-[:checked]:border-encre has-[:checked]:text-encre"
            >
              <input
                type="radio"
                name={`mobile-money-${groupName}`}
                value={option.accountId}
                checked={accountId === option.accountId}
                onChange={() => setAccountId(option.accountId)}
              />
              {option.operatorName} — {mm.countries[option.country]}
            </label>
          ))}
          <button
            type="button"
            onClick={start}
            disabled={pending || disabled || !accountId}
            aria-busy={pending}
            className={`${BUTTON_PRIMARY} w-full`}
          >
            {pending
              ? mm.starting
              : interpolate(mm.continue, { price: formatPrice(amountMinor, "XOF") })}
          </button>
          <button
            type="button"
            onClick={() => setStep("closed")}
            disabled={pending}
            className={`${BUTTON_TERTIARY} w-fit`}
          >
            {mm.cancel}
          </button>
        </fieldset>
      )}
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
