/**
 * =============================================================
 *  Fichier    : currency-select.tsx
 *  Projet     : Kalami
 *  Description: Liste déroulante de devise (composant client) : envoie le formulaire dès
 *               que le choix change ; sans JavaScript, un bouton « OK » reste disponible.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/currency-actions.ts
 * =============================================================
 */

"use client";

import { getDictionary } from "@/i18n";
import { CURRENCIES, type Currency } from "@/lib/catalog/types";
import { setCurrency } from "@/lib/currency-actions";

const t = getDictionary();

/** Libellés courts affichés dans l'en-tête. */
const LABELS: Record<Currency, string> = { XOF: "FCFA", EUR: "€ EUR", CAD: "$ CAD" };

/** Formulaire de changement de devise. */
export function CurrencySelect({ current }: { current: Currency }) {
  return (
    <form action={setCurrency} className="flex items-center">
      <label htmlFor="choix-devise" className="sr-only">
        {t.catalog.currency}
      </label>
      <select
        id="choix-devise"
        name="currency"
        defaultValue={current}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="min-h-11 rounded-md border border-bordure bg-surface px-2 text-sm"
      >
        {CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {LABELS[code]}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="ml-1 min-h-11 px-2 text-sm">
          OK
        </button>
      </noscript>
    </form>
  );
}
