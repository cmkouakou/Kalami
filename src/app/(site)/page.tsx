/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Accueil : présentation, catégories, sélection, nouveautés et avantages.
 *               Données du catalogue en cache ; seuls les prix (devise) sont rendus en flux.
 *  Auteur     : Claude Marcel
 *  Version    : 3.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/catalog/queries.ts, components/catalog, components/ui
 * =============================================================
 */

import Link from "next/link";

import { BookGrid } from "@/components/catalog/book-card";
import { BookCover } from "@/components/catalog/book-cover";
import { IconBookOpen, IconShield, IconSmartphone } from "@/components/ui/icons";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  PAGE,
  PANEL_SAND,
  PILL,
} from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { getCategories, getFeaturedBooks, getNewReleases } from "@/lib/catalog/queries";

const t = getDictionary();

/** Icônes des trois avantages, dans l'ordre du dictionnaire. */
const BENEFIT_ICONS = [IconBookOpen, IconSmartphone, IconShield];

export default async function HomePage() {
  const [featured, newReleases, categories] = await Promise.all([
    getFeaturedBooks(),
    getNewReleases(),
    getCategories(),
  ]);
  // Couvertures de la vitrine : la sélection d'abord, sinon les nouveautés
  const showcase = (featured.length > 0 ? featured : newReleases).slice(0, 3);

  return (
    <main className={`${PAGE} flex flex-col gap-16 py-12 sm:py-16`}>
      {/* ==================== PRÉSENTATION ==================== */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <p className="text-caption text-ocre-text uppercase">{t.home.kicker}</p>
          <h1 className="font-serif text-h1 sm:text-display">{t.home.title}</h1>
          <p className="max-w-xl text-body text-ink-muted">{t.home.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/recherche" className={BUTTON_PRIMARY}>
              {t.home.browse}
            </Link>
            {showcase[0] && (
              <Link href={`/livres/${showcase[0].slug}/lire`} className={BUTTON_SECONDARY}>
                {t.home.readExcerpt}
              </Link>
            )}
          </div>
        </div>

        {showcase.length > 0 && (
          <ul
            aria-label={t.catalog.featured}
            className={`${PANEL_SAND} grid grid-cols-3 items-end gap-4 p-6 sm:p-10`}
          >
            {showcase.map((book, index) => (
              <li key={book.id} className={index === 1 ? "-translate-y-4" : undefined}>
                <Link href={`/livres/${book.slug}`} aria-label={book.title}>
                  <BookCover
                    title={book.title}
                    coverPath={book.cover_path}
                    sizes="(min-width: 1024px) 10rem, 30vw"
                    priority
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ==================== CATÉGORIES ==================== */}
      {categories.length > 0 && (
        <section aria-labelledby="titre-categories" className="flex flex-col gap-4">
          <h2 id="titre-categories" className="font-serif text-h2">
            {t.home.exploreCategories}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/categories/${category.slug}`} className={PILL}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ==================== SÉLECTION ==================== */}
      {featured.length > 0 && (
        <section aria-labelledby="titre-selection" className="flex flex-col gap-6">
          <h2 id="titre-selection" className="font-serif text-h2">
            {t.catalog.featured}
          </h2>
          <BookGrid books={featured} />
        </section>
      )}

      {/* ==================== NOUVEAUTÉS ==================== */}
      <section aria-labelledby="titre-nouveautes" className="flex flex-col gap-6">
        <h2 id="titre-nouveautes" className="font-serif text-h2">
          {t.catalog.newReleases}
        </h2>
        <BookGrid books={newReleases} emptyText={t.home.comingSoon} />
      </section>

      {/* ==================== AVANTAGES ==================== */}
      <section className={`${PANEL_SAND} grid gap-8 p-8 sm:grid-cols-3`}>
        {t.home.benefits.map((benefit, index) => {
          const BenefitIcon = BENEFIT_ICONS[index];
          return (
            <div key={benefit.title} className="flex flex-col gap-2">
              <BenefitIcon size={24} className="text-encre" />
              <h2 className="text-h3">{benefit.title}</h2>
              <p className="text-small text-ink-muted">{benefit.text}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
