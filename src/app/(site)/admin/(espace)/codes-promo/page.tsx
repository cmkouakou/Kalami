/**
 * =============================================================
 *  Fichier    : page.tsx (admin/codes-promo)
 *  Projet     : Kalami
 *  Description: Administration des codes promo et des taxes (v0.10.3) : interrupteur
 *               Stripe Tax (prix taxes comprises, éteint par défaut), formulaire de création
 *               d'un code (portée, pourcentage ou montants, expiration, limite) et liste des
 *               codes avec leurs utilisations et un bouton pour les désactiver.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/admin/promo-actions.ts, lib/admin/promo-queries.ts,
 *               lib/admin/catalog-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField, TextArea } from "@/components/ui/form";
import { BADGE, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { listBooksAdmin } from "@/lib/admin/catalog-queries";
import { createPromoCode, setPromoCodeActive, setStripeTax } from "@/lib/admin/promo-actions";
import {
  type AdminPromoCode,
  isStripeTaxEnabled,
  listPromoCodesForAdmin,
} from "@/lib/admin/promo-queries";
import { PROMO_SCOPES } from "@/lib/admin/promo-validation";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { DATE_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const p = t.admin.promos;

export const metadata: Metadata = { title: p.title };

export default function AdminPromoCodesPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{p.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{p.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminPromoCodes />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Interrupteur des taxes, formulaire et liste des codes (administrateur aal2). */
async function AdminPromoCodes() {
  await requireAdmin();
  const [taxOn, codes, books] = await Promise.all([
    isStripeTaxEnabled(),
    listPromoCodesForAdmin(),
    listBooksAdmin(),
  ]);
  const bookOptions = [
    { value: "", label: p.noBook },
    ...books.map((book) => ({ value: book.id, label: book.title })),
  ];

  return (
    <>
      {/* ==================== STRIPE TAX ==================== */}
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 className="text-xl font-semibold">{p.taxTitle}</h2>
        <p className={taxOn ? "text-ink" : "text-ink-muted"}>{taxOn ? p.taxOn : p.taxOff}</p>
        <ActionForm
          action={setStripeTax.bind(null, !taxOn)}
          submitLabel={taxOn ? p.taxDisable : p.taxEnable}
        >
          {null}
        </ActionForm>
      </section>

      {/* ==================== NOUVEAU CODE ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-4`}>
        <h2 className="text-xl font-semibold">{p.newTitle}</h2>
        <ActionForm action={createPromoCode} submitLabel={p.create}>
          <Field
            id="promo-code"
            name="code"
            label={p.code}
            hint={p.codeHint}
            maxLength={30}
            autoComplete="off"
            required
          />
          <SelectField
            id="promo-portee"
            name="scope"
            label={p.scope}
            options={PROMO_SCOPES.map((scope) => ({ value: scope, label: p.scopes[scope] }))}
            defaultValue="books"
          />
          <SelectField id="promo-livre" name="bookId" label={p.book} options={bookOptions} />
          <Field
            id="promo-pourcentage"
            name="percentOff"
            type="number"
            label={p.percentOff}
            hint={p.percentHint}
            min={1}
            max={90}
            step="1"
          />
          <fieldset className="flex flex-col gap-3">
            <legend className="text-small text-ink-muted">{p.amountHint}</legend>
            <Field id="promo-xof" name="amountXof" type="number" label={p.amountXof} min={1} />
            <Field
              id="promo-eur"
              name="amountEur"
              type="number"
              label={p.amountEur}
              min={0.01}
              step="0.01"
            />
            <Field
              id="promo-cad"
              name="amountCad"
              type="number"
              label={p.amountCad}
              min={0.01}
              step="0.01"
            />
          </fieldset>
          <Field
            id="promo-expiration"
            name="expiresOn"
            type="date"
            label={p.expiresOn}
            hint={p.expiresHint}
          />
          <Field
            id="promo-max"
            name="maxUses"
            type="number"
            label={p.maxUses}
            hint={p.maxUsesHint}
            min={1}
            max={100000}
            step="1"
          />
          <TextArea id="promo-note" name="note" label={p.note} rows={2} maxLength={200} />
        </ActionForm>
      </section>

      {/* ==================== CODES EXISTANTS ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{p.listTitle}</h2>
        {codes.length === 0 ? (
          <p className="text-ink-muted">{p.none}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {codes.map((code) => (
              <PromoRow key={code.id} promo={code} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// ==================== AFFICHAGE D'UN CODE ====================

/**
 * Réduction lisible : « 20 % », ou les montants par devise.
 * @param promo - Code promo
 */
function discountLabel(promo: AdminPromoCode): string {
  if (promo.percentOff !== null) return `${promo.percentOff} %`;
  const amounts: string[] = [];
  if (promo.amountOffXof !== null) amounts.push(formatPrice(promo.amountOffXof, "XOF"));
  if (promo.amountOffEur !== null) {
    amounts.push(formatPrice(Math.round(promo.amountOffEur * 100), "EUR"));
  }
  if (promo.amountOffCad !== null) {
    amounts.push(formatPrice(Math.round(promo.amountOffCad * 100), "CAD"));
  }
  return amounts.join(" · ");
}

/** Un code : réduction, portée, utilisations, expiration et activation. */
function PromoRow({ promo }: { promo: AdminPromoCode }) {
  const expiry = promo.expiresAt
    ? promo.expired
      ? p.expired
      : interpolate(p.expires, { date: DATE_FORMAT.format(new Date(promo.expiresAt)) })
    : p.noExpiry;
  const uses =
    promo.maxUses === null
      ? interpolate(p.uses, { count: String(promo.usesCount) })
      : interpolate(p.usesOf, { count: String(promo.usesCount), max: String(promo.maxUses) });
  const scope = promo.scope === "book" ? `${p.scopes.book} : ${promo.bookTitle ?? "—"}` : null;

  return (
    <li className={`${CARD} flex flex-col gap-2 p-4 ${promo.active ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono font-semibold">{promo.code}</span>
        <span className="text-ocre-text">{discountLabel(promo)}</span>
      </div>
      <p className="text-small text-ink-muted">
        {scope ?? p.scopes[promo.scope]} · {uses} · {expiry}
      </p>
      {promo.note && <p className="text-small text-ink">{promo.note}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {!promo.active && <span className={BADGE}>{p.inactive}</span>}
        <ActionForm
          action={setPromoCodeActive.bind(null, promo.id, !promo.active)}
          submitLabel={promo.active ? p.deactivate : p.activate}
        >
          {null}
        </ActionForm>
      </div>
    </li>
  );
}
