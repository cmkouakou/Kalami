/**
 * =============================================================
 *  Fichier    : page.tsx (admin/fonctionnalites)
 *  Projet     : Kalami
 *  Description: Page « Fonctionnalités » (v0.24.0) : un interrupteur par offre pour la
 *               mettre en vente ou la masquer, sans toucher à ses prix (modifiés dans
 *               Commandes, Coach IA ou Atelier). Offres d'étude et lots, forfaits du coach,
 *               cas d'entraînement, forfaits de l'Atelier de l'auteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/admin/order-queries.ts, lib/strategy/coach/queries.ts,
 *               lib/strategy/cases/queries.ts, lib/author/workshop/queries.ts,
 *               components/admin/feature-toggle.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FeatureToggle } from "@/components/admin/feature-toggle";
import { CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import type { FeatureKind } from "@/lib/admin/features";
import { listStudyOffersForAdmin } from "@/lib/admin/order-queries";
import { requireAdmin } from "@/lib/auth/dal";
import { listWorkshopPacksForAdmin } from "@/lib/author/workshop/queries";
import { listPracticeCasesForAdmin } from "@/lib/strategy/cases/queries";
import { listCoachPacksForAdmin } from "@/lib/strategy/coach/queries";

const t = getDictionary();
const f = t.admin.features;

const XOF = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const DECIMAL = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Une offre affichée avec son interrupteur. */
type FeatureItem = {
  key: string;
  name: string;
  active: boolean;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
};

/** Un groupe d'offres de même type. */
type FeatureGroup = {
  kind: FeatureKind;
  title: string;
  help: string;
  priceHref: string;
  items: FeatureItem[];
};

export const metadata: Metadata = { title: f.title };

export default function AdminFeaturesPage() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{f.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{f.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <Features />
      </Suspense>
    </main>
  );
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Prix d'une offre en une ligne (« 5 000 FCFA · 7,99 € · 12,99 $CA »).
 * @param item - Offre et ses trois prix
 * @returns Texte des prix saisis, ou « Prix à saisir »
 */
function priceLine(item: FeatureItem): string {
  const parts = [
    item.priceXof === null ? null : `${XOF.format(item.priceXof)} FCFA`,
    item.priceEur === null ? null : `${DECIMAL.format(item.priceEur)} €`,
    item.priceCad === null ? null : `${DECIMAL.format(item.priceCad)} $CA`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : f.noPrice;
}

// ==================== CONTENU ====================

/** Groupes d'offres et leurs interrupteurs (administrateur aal2). */
async function Features() {
  await requireAdmin();
  const [offers, coachPacks, cases, workshopPacks] = await Promise.all([
    listStudyOffersForAdmin(),
    listCoachPacksForAdmin(),
    listPracticeCasesForAdmin(),
    listWorkshopPacksForAdmin(),
  ]);

  const groups: FeatureGroup[] = [
    {
      kind: "study_offer",
      title: f.groups.studyOffers,
      help: f.help.studyOffers,
      priceHref: "/admin/commandes",
      items: offers.map((row) => ({ ...row, key: row.code })),
    },
    {
      kind: "coach_pack",
      title: f.groups.coachPacks,
      help: f.help.coachPacks,
      priceHref: "/admin/strategie/coach/forfaits",
      items: coachPacks.map((row) => ({ ...row, key: row.id })),
    },
    {
      kind: "practice_case",
      title: f.groups.practiceCases,
      help: f.help.practiceCases,
      priceHref: "/admin/commandes",
      items: cases.map((row) => ({ ...row, key: row.code, name: row.title })),
    },
    {
      kind: "workshop_pack",
      title: f.groups.workshopPacks,
      help: f.help.workshopPacks,
      priceHref: "/admin/atelier",
      items: workshopPacks.map((row) => ({ ...row, key: row.id })),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <GroupSection key={group.kind} group={group} />
      ))}
    </div>
  );
}

/** Un groupe : titre, explication et une ligne par offre. */
function GroupSection({ group }: { group: FeatureGroup }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">{group.title}</h2>
        <Link href={group.priceHref} className="text-sm text-encre underline">
          {f.editPrices}
        </Link>
      </div>
      <p className="max-w-3xl text-small text-ink-muted">{group.help}</p>
      {group.items.length === 0 ? (
        <p className="text-ink-muted">{f.none}</p>
      ) : (
        <ul className={`${CARD} divide-y divide-line`}>
          {group.items.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{item.name}</span>
                <span className="text-small text-ink-muted">{priceLine(item)}</span>
              </div>
              <FeatureToggle
                kind={group.kind}
                featureKey={item.key}
                active={item.active}
                name={item.name}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
