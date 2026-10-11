/**
 * =============================================================
 *  Fichier    : page.tsx (categories/[slug])
 *  Projet     : Kalami
 *  Description: Livres publiés d'une catégorie, avec les autres catégories en pastilles.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/catalog/queries.ts, components/catalog, components/ui
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookGrid } from "@/components/catalog/book-card";
import { PAGE, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { getCategories, getCategoryWithBooks } from "@/lib/catalog/queries";

const t = getDictionary();

// ==================== MÉTADONNÉES ====================

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryWithBooks(slug);
  if (!result) return {};
  return {
    title: result.category.name,
    description: result.category.description ?? undefined,
    alternates: { canonical: `/categories/${result.category.slug}` },
  };
}

// ==================== PAGE ====================

export default function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  return (
    <main className={`${PAGE} py-10 sm:py-12`}>
      <Suspense fallback={<div aria-hidden="true" className="h-40 animate-pulse" />}>
        <CategoryContent params={params} />
      </Suspense>
    </main>
  );
}

/** Charge la catégorie demandée ; page 404 si elle n'existe pas. */
async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, categories] = await Promise.all([getCategoryWithBooks(slug), getCategories()]);
  if (!result) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-h1">{result.category.name}</h1>
        {result.category.description && (
          <p className="max-w-measure text-body text-ink-muted">{result.category.description}</p>
        )}
      </header>
      <nav aria-label={t.catalog.categories}>
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = category.slug === result.category.slug;
            return (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={active ? PILL_ACTIVE : PILL}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <BookGrid books={result.books} />
    </div>
  );
}
