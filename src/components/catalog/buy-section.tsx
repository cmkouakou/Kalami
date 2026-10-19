/**
 * =============================================================
 *  Fichier    : buy-section.tsx
 *  Projet     : Kalami
 *  Description: Zone d'achat d'un livre (composant serveur rendu en flux) : « déjà dans votre
 *               bibliothèque », invitation à se connecter, ou bouton d'achat dans la devise
 *               préférée du visiteur. Utilisée par la fiche du livre et la fin de l'extrait.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: buy-button.tsx, lib/auth/dal.ts, lib/content/chapters.ts
 * =============================================================
 */

import Link from "next/link";
import { Suspense } from "react";

import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import type { Price } from "@/lib/catalog/types";
import { getReaderAccess } from "@/lib/content/chapters";
import { getPreferredCurrency } from "@/lib/currency-server";

import { BuyButton } from "./buy-button";

const t = getDictionary();

type BuySectionProps = {
  bookId: string;
  prices: Price[];
  /** Page où revenir après la connexion */
  returnPath: string;
  className?: string;
};

/** Contenu selon le visiteur (lit la session : rendu à la demande). */
async function BuyContent({ bookId, prices, returnPath, className }: BuySectionProps) {
  const user = await getCurrentUser();
  if (user && (await getReaderAccess(bookId, user)).full) {
    return (
      <p className={`text-small text-ink-muted ${className ?? ""}`}>{t.catalog.purchase.owned}</p>
    );
  }
  if (prices.length === 0) return null;
  if (!user) {
    return (
      <Link
        href={`/connexion?suivant=${encodeURIComponent(returnPath)}`}
        className={`${BUTTON_PRIMARY} w-full ${className ?? ""}`}
      >
        {t.catalog.purchase.signInToBuy}
      </Link>
    );
  }
  return (
    <BuyButton
      item={{ item: "book", bookId }}
      groupName={bookId}
      prices={prices}
      initialCurrency={await getPreferredCurrency()}
      className={className}
    />
  );
}

/** Zone d'achat avec emplacement réservé pendant le chargement. */
export function BuySection(props: BuySectionProps) {
  return (
    <Suspense
      fallback={
        <span aria-hidden="true" className="h-11 w-full animate-pulse rounded-md bg-line" />
      }
    >
      <BuyContent {...props} />
    </Suspense>
  );
}
