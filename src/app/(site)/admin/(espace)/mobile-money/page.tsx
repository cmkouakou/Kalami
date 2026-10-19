/**
 * =============================================================
 *  Fichier    : page.tsx (admin/mobile-money)
 *  Projet     : Kalami
 *  Description: Administration du Mobile Money (Sprint 6, v0.11.0) : opérateurs à activer
 *               ou éteindre, numéros marchands par opérateur et par pays (un formulaire
 *               d'ajout, un formulaire par numéro existant). La validation des paiements se
 *               fait dans « Commandes ». Frais par opérateur (v0.12.0) : retenus dans le
               grand livre avant le partage auteur / Kalami.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/admin/mobile-money-actions.ts, lib/admin/mobile-money-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { BADGE, CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import {
  saveMobileMoneyAccount,
  setMobileMoneyOperator,
} from "@/lib/admin/mobile-money-actions";
import {
  type AdminMobileMoneyAccount,
  type AdminMobileMoneyOperator,
  listMobileMoneyAccounts,
  listMobileMoneyOperators,
} from "@/lib/admin/mobile-money-queries";
import { requireAdmin } from "@/lib/auth/dal";
import { MM_COUNTRIES } from "@/lib/payments/mobile-money";
import { saveMobileMoneyFee } from "@/lib/revenue/actions";
import { bpsToPercent } from "@/lib/revenue/ledger";

const t = getDictionary();
const am = t.admin.mobileMoney;

const COUNTRY_OPTIONS = MM_COUNTRIES.map((code) => ({
  value: code,
  label: t.mobileMoney.countries[code],
}));

export const metadata: Metadata = { title: am.title };

export default function AdminMobileMoneyPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{am.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{am.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminMobileMoney />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Opérateurs et numéros marchands (administrateur aal2). */
async function AdminMobileMoney() {
  await requireAdmin();
  const [operators, accounts] = await Promise.all([
    listMobileMoneyOperators(),
    listMobileMoneyAccounts(),
  ]);
  const operatorOptions = operators.map((op) => ({ value: op.code, label: op.name }));
  const names = new Map(operators.map((op) => [op.code, op.name]));

  return (
    <>
      {/* ==================== OPÉRATEURS ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{am.operatorsTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {operators.map((operator) => (
            <OperatorCard key={operator.code} operator={operator} />
          ))}
        </ul>
      </section>

      {/* ==================== NUMÉROS MARCHANDS ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{am.accountsTitle}</h2>
        {accounts.length === 0 && <p className="text-ink-muted">{am.none}</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {accounts.map((account) => (
            <AccountForm
              key={account.id}
              account={account}
              title={`${names.get(account.operator) ?? account.operator} — ${
                t.mobileMoney.countries[account.country]
              }`}
              operatorOptions={operatorOptions}
            />
          ))}
          <AccountForm account={null} title={am.save} operatorOptions={operatorOptions} />
        </div>
      </section>
    </>
  );
}

/** Opérateur : état, bouton pour l'activer ou l'éteindre, frais retenus. */
function OperatorCard({ operator }: { operator: AdminMobileMoneyOperator }) {
  return (
    <li className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4`}>
      <span className="font-semibold">
        {operator.name}
        <span className={`${BADGE} ml-2`}>{operator.enabled ? am.enabled : am.disabled}</span>
      </span>
      <ActionForm
        action={setMobileMoneyOperator.bind(null, operator.code, !operator.enabled)}
        submitLabel={operator.enabled ? am.disable : am.enable}
      >
        {null}
      </ActionForm>
      <div className="w-full">
        <ActionForm action={saveMobileMoneyFee} submitLabel={am.feeSave}>
          <input type="hidden" name="operator" value={operator.code} />
          <Field
            id={`frais-${operator.code}`}
            name="fee"
            label={am.fee}
            hint={am.feeHint}
            defaultValue={bpsToPercent(operator.feeBps)}
            inputMode="decimal"
            maxLength={6}
            required
          />
        </ActionForm>
      </div>
    </li>
  );
}

type AccountFormProps = {
  /** Numéro existant, ou null pour un ajout */
  account: AdminMobileMoneyAccount | null;
  title: string;
  operatorOptions: { value: string; label: string }[];
};

/** Numéro marchand d'un opérateur dans un pays (ajout ou modification). */
function AccountForm({ account, title, operatorOptions }: AccountFormProps) {
  const suffix = account?.id ?? "nouveau";
  return (
    <div className={`${CARD} flex flex-col gap-3 p-4`}>
      <p className="font-semibold">
        {title}
        {account && !account.active && <span className={`${BADGE} ml-2`}>{am.inactive}</span>}
      </p>
      <ActionForm action={saveMobileMoneyAccount} submitLabel={am.save} resetOnSuccess={!account}>
        <SelectField
          id={`operateur-${suffix}`}
          name="operator"
          label={am.operator}
          options={operatorOptions}
          defaultValue={account?.operator}
          required
        />
        <SelectField
          id={`pays-${suffix}`}
          name="country"
          label={am.country}
          options={COUNTRY_OPTIONS}
          defaultValue={account?.country ?? "CI"}
          required
        />
        <Field
          id={`numero-${suffix}`}
          name="merchantNumber"
          type="tel"
          label={am.number}
          hint={am.numberHint}
          defaultValue={account?.merchantNumber}
          maxLength={20}
          required
        />
        <Field
          id={`nom-${suffix}`}
          name="accountName"
          label={am.name}
          defaultValue={account?.accountName}
          minLength={2}
          maxLength={80}
          required
        />
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={account?.active ?? true}
            className="size-5"
          />
          {am.active}
        </label>
      </ActionForm>
    </div>
  );
}
