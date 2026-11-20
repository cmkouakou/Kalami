/**
 * =============================================================
 *  Fichier    : vente-cours.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Page de vente du cours, montrée aux visiteurs et aux membres non inscrits
 *               (v0.39.0) : appel à l'action (offre, leçon offerte), ce que l'apprenant
 *               saura faire, format du cours, programme, offre et prix, auteur, questions
 *               fréquentes (avec leurs données structurées FAQPage).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/{offre,modules}.ts, lib/seo/course-json-ld.ts,
 *               components/cours/sans-acces.tsx, components/catalog/buy-button.tsx
 * =============================================================
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { BuyButton } from "@/components/catalog/buy-button";
import { SansAcces } from "@/components/cours/sans-acces";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { authPath } from "@/lib/auth/routes";
import type { CurrentUser } from "@/lib/auth/dal";
import { DUREE_TOTALE_MINUTES, LECON_OFFERTE, adresseLecon, leconParId } from "@/lib/cours/modules";
import { lireOffreCours } from "@/lib/cours/offre";
import { formatPrice } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currency-server";
import { CHEMIN_COURS, faqJsonLd } from "@/lib/seo/course-json-ld";
import { serializeJsonLd } from "@/lib/seo/book-json-ld";

const t = getCourseDictionary();
const v = t.vente;

/** Nombre d'heures de lecture, arrondi. */
export const HEURES_COURS = String(Math.round(DUREE_TOTALE_MINUTES / 60));

/** Questions fréquentes, durée du cours insérée. */
const FAQ = v.faq.map((f) => ({
  question: f.question,
  reponse: interpolate(f.reponse, { heures: HEURES_COURS }),
}));

/** Adresse de la leçon offerte. */
function adresseOfferte(): string {
  const trouve = leconParId(LECON_OFFERTE);
  return trouve ? adresseLecon(trouve.module, trouve.lecon) : CHEMIN_COURS;
}

// ==================== SECTIONS ====================

/** Section titrée de la page de vente. */
function Section({ id, titre, children }: { id: string; titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={id}>
      <h2 id={id} className="font-serif text-h2 font-semibold">
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Offre pour un visiteur non connecté : prix, puis connexion pour acheter. */
async function OffreVisiteur() {
  const [offre, devise] = await Promise.all([lireOffreCours(), getPreferredCurrency()]);
  if (!offre.enVente) return <p className="text-ink-muted">{v.bientot}</p>;
  const prix = offre.prix.find((p) => p.currency === devise) ?? offre.prix[0];
  return (
    <>
      {prix && (
        <p className="font-serif text-h2 font-semibold">
          {formatPrice(prix.amount_minor, prix.currency)}
        </p>
      )}
      <Link href={authPath("connexion", CHEMIN_COURS)} className={`${BUTTON_PRIMARY} self-start`}>
        {getDictionary().catalog.purchase.signInToBuy}
      </Link>
    </>
  );
}

/** Offre pour un membre connecté : achat direct, ou consignes de cohorte (SansAcces). */
async function OffreMembre({ email, paiementAnnule }: OffreProps) {
  const offre = await lireOffreCours();
  if (!offre.enVente) return <SansAcces email={email} paiementAnnule={paiementAnnule} />;
  return (
    <>
      {paiementAnnule && (
        <p role="status" className="text-small text-ink-muted">
          {t.sansAcces.annule}
        </p>
      )}
      <BuyButton
        item={{ item: "course" }}
        groupName="cours-strategie"
        prices={offre.prix}
        initialCurrency={await getPreferredCurrency()}
        className="self-start"
      />
      <p className="text-small text-ink-muted">
        {t.sansAcces.texte} {interpolate(t.sansAcces.compte, { email: email ?? "" })}
      </p>
    </>
  );
}

type OffreProps = { email: string | null; paiementAnnule: boolean };

// ==================== PAGE DE VENTE ====================

type VenteCoursProps = {
  /** Membre connecté sans accès ; null pour un visiteur. */
  user: CurrentUser | null;
  paiementAnnule: boolean;
  /** Programme du cours (rendu par la page). */
  programme: ReactNode;
};

/** Page de vente du cours (visiteurs et membres non inscrits). */
export function VenteCours({ user, paiementAnnule, programme }: VenteCoursProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* Données structurées « FAQPage » des questions affichées plus bas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(FAQ)) }}
      />

      {/* ==================== APPEL À L'ACTION ==================== */}
      <div className="flex flex-wrap gap-3">
        <a href="#offre" className={BUTTON_PRIMARY}>
          {v.voirOffre}
        </a>
        <Link href={adresseOfferte()} className={BUTTON_SECONDARY}>
          {v.apercu}
        </Link>
      </div>

      {/* ==================== CE QUE VOUS SAUREZ FAIRE ==================== */}
      <Section id="apprendre" titre={v.apprendreTitre}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {v.apprendre.map((a) => (
            <li key={a} className={`${CARD} p-4`}>
              {a}
            </li>
          ))}
        </ul>
      </Section>

      {/* ==================== FORMAT ==================== */}
      <Section id="format" titre={v.formatTitre}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {v.format.map((f) => (
            <li key={f.titre} className={`${CARD} flex flex-col gap-1 p-4`}>
              <span className="font-semibold">{f.titre}</span>
              <span className="text-small text-ink-muted">{f.texte}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ==================== PROGRAMME ==================== */}
      <Section id="programme" titre={v.programmeTitre}>
        {programme}
      </Section>

      {/* ==================== OFFRE ==================== */}
      <section
        id="offre"
        aria-labelledby="titre-offre"
        className={`${PANEL_SAND} flex scroll-mt-24 flex-col gap-3 p-6`}
      >
        <h2 id="titre-offre" className="font-serif text-h2 font-semibold">
          {v.offreTitre}
        </h2>
        <p>{v.offreTexte}</p>
        <p className="text-small text-ink-muted">{v.paiement}</p>
        {user ? (
          <OffreMembre email={user.email} paiementAnnule={paiementAnnule} />
        ) : (
          <>
            <OffreVisiteur />
            <p className="text-small text-ink-muted">{v.connexion}</p>
          </>
        )}
      </section>

      {/* ==================== AUTEUR ==================== */}
      <Section id="auteur" titre={v.auteurTitre}>
        <p className="max-w-2xl">{v.auteur}</p>
      </Section>

      {/* ==================== QUESTIONS FRÉQUENTES ==================== */}
      <Section id="faq" titre={v.faqTitre}>
        <div className="flex flex-col gap-2">
          {FAQ.map((f) => (
            <details key={f.question} className={`${CARD} p-4`}>
              <summary className="min-h-11 cursor-pointer font-semibold">{f.question}</summary>
              <p className="pt-2 text-ink-muted">{f.reponse}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}
