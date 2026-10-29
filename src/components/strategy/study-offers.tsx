/**
 * =============================================================
 *  Fichier    : study-offers.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Offres d'étude et de lots (1, 10, 30 crédits) avec leur prix dans la devise
 *               du visiteur, le prix par étude des lots et le bouton d'achat par carte.
 *               Composant serveur : à placer sous Suspense (lit la devise préférée).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/strategy/queries.ts, lib/payments/offers.ts,
 *               components/catalog/buy-button.tsx
 * =============================================================
 */

import { BuyButton } from "@/components/catalog/buy-button";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { formatPrice } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currency-server";
import { pricesOf } from "@/lib/payments/offers";
import { listStudyOffers } from "@/lib/strategy/queries";
import { getStrategyDictionary } from "@/i18n/strategy";

const so = getStrategyDictionary().studies.offers;

type StudyOffersProps = {
  /** Identifiant du titre (plusieurs sections sur une page) */
  headingId?: string;
};

/** Section d'achat des études et des lots. */
export async function StudyOffers({ headingId = "titre-offres" }: StudyOffersProps) {
  const [offers, currency] = await Promise.all([listStudyOffers(), getPreferredCurrency()]);

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-serif text-h2 font-semibold">
        {so.title}
      </h2>
      <p className="max-w-2xl text-small text-ink-muted">{so.intro}</p>
      {offers.length === 0 ? (
        <p className="text-ink-muted">{so.none}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3">
          {offers.map((offer) => {
            const prices = pricesOf(offer);
            if (prices.length === 0) return null;
            // Prix par étude dans la devise affichée d'abord (lots seulement)
            const shown = prices.find((p) => p.currency === currency) ?? prices[0];
            return (
              <li key={offer.code} className={`${CARD} flex flex-col gap-2 p-4`}>
                <h3 className="font-semibold">{offer.name}</h3>
                <p className="text-ink-muted">
                  {interpolate(so.credits, { count: String(offer.credits) })}
                </p>
                {offer.credits > 1 && (
                  <p className="text-small text-ink-muted">
                    {interpolate(so.perStudy, {
                      price: formatPrice(
                        Math.round(shown.amount_minor / offer.credits),
                        shown.currency,
                      ),
                    })}
                  </p>
                )}
                <BuyButton
                  item={{ item: "study_offer", code: offer.code }}
                  groupName={`offre-${offer.code}`}
                  prices={prices}
                  initialCurrency={currency}
                  className="mt-auto"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
