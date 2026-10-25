/**
 * =============================================================
 *  Fichier    : case-offers.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Présentation des cas d'entraînement en vente, sur l'accueil de l'assistant :
 *               ce que le cas apporte, comment le corrigé de l'auteur s'ouvre, puis une
 *               carte par cas (titre, résumé, prix dans la devise préférée) qui mène à sa
 *               page. Un cas déjà acheté propose de continuer. Rien n'est affiché tant
 *               qu'aucun cas n'est en vente. Composant serveur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/cases/queries.ts, cases/registry.ts, lib/payments/offers.ts
 * =============================================================
 */

import Link from "next/link";

import { BADGE, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currency-server";
import { pricesOf } from "@/lib/payments/offers";
import { getMyCaseAccess, listCasesForSale } from "@/lib/strategy/cases/queries";
import { getPracticeCase } from "@/lib/strategy/cases/registry";

const c = getDictionary().strategy.cases;

/** Section des cas d'entraînement en vente. */
export async function CaseOffers() {
  const [forSale, currency, user] = await Promise.all([
    listCasesForSale(),
    getPreferredCurrency(),
    getCurrentUser(),
  ]);
  // Seuls les cas dont le contenu existe dans l'application sont présentés
  const cases = forSale.flatMap((sale) => {
    const practiceCase = getPracticeCase(sale.code);
    return practiceCase ? [{ sale, statement: practiceCase.statement }] : [];
  });
  if (cases.length === 0) return null;

  const owned = user
    ? await Promise.all(cases.map(({ sale }) => getMyCaseAccess(sale.code)))
    : cases.map(() => null);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="titre-cas">
      <p className="text-caption uppercase text-ink-muted">{c.kicker}</p>
      <h2 id="titre-cas" className="-mt-3 font-serif text-h2 font-semibold">
        {c.promo.title}
      </h2>
      <p className="max-w-2xl text-ink-muted">{c.promo.intro}</p>

      <div className={`${PANEL_SAND} flex max-w-2xl flex-col gap-2 p-4`}>
        <h3 className="font-semibold">{c.promo.howTitle}</h3>
        <ol className="flex list-decimal flex-col gap-1 pl-6 text-small">
          {c.promo.how.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {cases.map(({ sale, statement }, index) => {
          const prices = pricesOf(sale);
          const shown = prices.find((p) => p.currency === currency) ?? prices[0];
          const access = owned[index];
          return (
            <li key={sale.code} className={`${CARD} flex flex-col gap-3 p-4 sm:p-6`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-h3 font-semibold">{statement.title}</h3>
                {access && <span className={BADGE}>{c.promo.owned}</span>}
              </div>
              <p className="text-small text-ink-muted">{statement.lead}</p>
              {!access && shown && (
                <p className="font-semibold">
                  {formatPrice(shown.amount_minor, shown.currency)}
                </p>
              )}
              <Link
                href={`/strategie/cas/${sale.code}`}
                className={`${access ? BUTTON_SECONDARY : BUTTON_PRIMARY} mt-auto w-fit`}
              >
                {access ? c.promo.continue : c.promo.discover}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
