/**
 * =============================================================
 *  Fichier    : page.tsx (categories/[slug])
 *  Projet     : Kalami
 *  Description: Livres publiés d'une catégorie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/catalog/queries.ts, components/catalog
 * =============================================================
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookGrid } from "@/components/catalog/book-card";
import { getCategoryWithBooks } from "@/lib/catalog/queries";

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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<div aria-hidden="true" className="h-40 animate-pulse" />}>
        <CategoryContent params={params} />
      </Suspense>
    </main>
  );
}

/** Charge la catégorie demandée ; page 404 si elle n'existe pas. */
async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCategoryWithBooks(slug);
  if (!result) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{result.category.name}</h1>
        {result.category.description && (
          <p className="max-w-prose text-texte-doux">{result.category.description}</p>
        )}
      </header>
      <BookGrid books={result.books} />
    </div>
  );
}
