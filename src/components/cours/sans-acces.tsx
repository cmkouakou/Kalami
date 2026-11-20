/**
 * =============================================================
 *  Fichier    : sans-acces.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Encart affiché à un membre connecté qui n'a pas encore accès au cours :
 *               comment l'obtenir (cohorte : courriel du compte à transmettre au
 *               formateur ; v1.1 : achat par carte ou Mobile Money si le cours est en
 *               vente).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-19
 *  Dépendances: i18n/course.ts, lib/cours/offre.ts, components/catalog/buy-button.tsx
 * =============================================================
 */

import { BuyButton } from "@/components/catalog/buy-button";
import { PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { lireOffreCours } from "@/lib/cours/offre";
import { getPreferredCurrency } from "@/lib/currency-server";

const t = getCourseDictionary();

type SansAccesProps = {
  email: string | null;
  /** Vrai au retour d'un paiement abandonné (?paiement=annule). */
  paiementAnnule?: boolean;
};

/** Encart « réservé aux inscrits », avec l'achat en ligne quand le cours est en vente. */
export async function SansAcces({ email, paiementAnnule = false }: SansAccesProps) {
  const [offre, devise] = await Promise.all([lireOffreCours(), getPreferredCurrency()]);

  return (
    <section className={`${PANEL_SAND} flex flex-col gap-3 p-6`}>
      <h2 className="font-serif text-h2">{t.sansAcces.titre}</h2>
      {paiementAnnule && (
        <p role="status" className="text-small text-ink-muted">
          {t.sansAcces.annule}
        </p>
      )}
      <p>{t.sansAcces.texte}</p>
      {email && (
        <p className="text-small text-ink-muted">
          {interpolate(t.sansAcces.compte, { email })}
        </p>
      )}
      {offre.enVente ? (
        <>
          <p>{t.sansAcces.acheter}</p>
          <BuyButton
            item={{ item: "course" }}
            groupName="cours-strategie"
            prices={offre.prix}
            initialCurrency={devise}
            className="self-start"
          />
        </>
      ) : (
        <p className="text-small text-ink-muted">{t.sansAcces.bientot}</p>
      )}
    </section>
  );
}
