/**
 * =============================================================
 *  Fichier    : payout-form.tsx
 *  Projet     : Kalami
 *  Description: Coordonnées de versement de l'auteur : virement bancaire ou Mobile Money.
 *               Seuls les champs du mode choisi sont affichés (et donc envoyés).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: components/admin/action-form.tsx, lib/author/actions.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { savePayoutDetails } from "@/lib/author/actions";
import {
  MOBILE_OPERATORS,
  PAYOUT_METHODS,
  type PayoutInput,
  type PayoutMethod,
} from "@/lib/author/validation";

const t = getDictionary();
const p = t.author.profile;

/** Formulaire prérempli avec les coordonnées enregistrées, s'il y en a. */
export function PayoutForm({ payout }: { payout: PayoutInput | null }) {
  const [method, setMethod] = useState<PayoutMethod>(payout?.method ?? "mobile_money");

  return (
    <ActionForm action={savePayoutDetails} submitLabel={t.admin.common.save}>
      <SelectField
        label={p.method}
        name="method"
        value={method}
        onChange={(event) => setMethod(event.currentTarget.value as PayoutMethod)}
        options={PAYOUT_METHODS.map((value) => ({ value, label: p.methods[value] }))}
      />
      <Field
        label={p.accountHolder}
        name="account_holder"
        required
        maxLength={120}
        autoComplete="name"
        defaultValue={payout?.account_holder ?? ""}
      />
      {method === "bank" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={p.bankName}
            name="bank_name"
            required
            maxLength={120}
            defaultValue={payout?.bank_name ?? ""}
          />
          <Field
            label={p.accountNumber}
            name="account_number"
            required
            maxLength={64}
            defaultValue={payout?.account_number ?? ""}
          />
          <Field
            label={p.swift}
            name="swift"
            maxLength={11}
            pattern="[A-Za-z0-9]{8}([A-Za-z0-9]{3})?"
            defaultValue={payout?.swift ?? ""}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={p.mobileOperator}
            name="mobile_operator"
            required
            defaultValue={payout?.mobile_operator ?? ""}
            options={[
              { value: "", label: "—" },
              ...MOBILE_OPERATORS.map((value) => ({ value, label: p.operators[value] })),
            ]}
          />
          <Field
            label={p.mobileNumber}
            name="mobile_number"
            type="tel"
            required
            maxLength={20}
            autoComplete="tel"
            defaultValue={payout?.mobile_number ?? ""}
          />
        </div>
      )}
    </ActionForm>
  );
}
