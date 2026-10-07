/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Accueil : présentation, sélection mise en avant, nouveautés et catégories.
 *               Données du catalogue en cache ; seuls les prix (devise) sont rendus en flux.
 *  Auteur     : Claude Marcel
 *  Version    : 2.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/catalog/queries.ts, components/catalog
 * =============================================================
 */

import Link from "next/link";

import { BookGrid } from "@/components/catalog/book-card";
import { getDictionary } from "@/i18n";
import { getCategories, getFeaturedBooks, getNewReleases } from "@/lib/catalog/queries";

const t = getDictionary();

export default async function HomePage() {
  const [featured, newReleases, categories] = await Promise.all([
    getFeaturedBooks(),
    getNewReleases(),
    getCategories(),
  ]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12 sm:py-16">
      {/* ==================== PRÉSENTATION ==================== */}
      <section className="flex max-w-3xl flex-col gap-5">
        <h1 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
          {t.home.title}
        </h1>
        <p className="text-lg text-texte-doux">{t.home.subtitle}</p>
        <Link
          href="/recherche"
          className="flex min-h-11 w-fit items-center rounded-md bg-principale px-5 font-medium
            text-principale-texte"
        >
          {t.home.browse}
        </Link>
      </section>

      {/* ==================== SÉLECTION ==================== */}
      {featured.length > 0 && (
        <section aria-labelledby="titre-selection" className="flex flex-col gap-5">
          <h2 id="titre-selection" className="font-serif text-2xl font-semibold">
            {t.catalog.featured}
          </h2>
          <BookGrid books={featured} />
        </section>
      )}

      {/* ==================== NOUVEAUTÉS ==================== */}
      <section aria-labelledby="titre-nouveautes" className="flex flex-col gap-5">
        <h2 id="titre-nouveautes" className="font-serif text-2xl font-semibold">
          {t.catalog.newReleases}
        </h2>
        <BookGrid books={newReleases} emptyText={t.home.comingSoon} />
      </section>

      {/* ==================== CATÉGORIES ==================== */}
      <section aria-labelledby="titre-categories" className="flex flex-col gap-5">
        <h2 id="titre-categories" className="font-serif text-2xl font-semibold">
          {t.catalog.categories}
        </h2>
        <ul className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                className="flex min-h-11 items-center rounded-full border border-bordure
                  bg-surface px-4 hover:border-principale hover:text-principale"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
