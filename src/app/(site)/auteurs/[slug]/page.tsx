/**
 * =============================================================
 *  Fichier    : page.tsx (auteurs/[slug])
 *  Projet     : Kalami
 *  Description: Page publique d'un auteur : photo, biographie et livres publiés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/catalog/queries.ts, components/catalog, components/ui
 * =============================================================
 */

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookGrid } from "@/components/catalog/book-card";
import { PAGE } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { publicImageUrl } from "@/lib/catalog/images";
import { getAuthorWithBooks } from "@/lib/catalog/queries";

const t = getDictionary();

// ==================== MÉTADONNÉES ====================

export async function generateMetadata({
  params,
}: PageProps<"/auteurs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAuthorWithBooks(slug);
  if (!result) return {};
  return {
    title: result.author.display_name,
    description: result.author.bio?.slice(0, 160) || undefined,
    alternates: { canonical: `/auteurs/${result.author.slug}` },
  };
}

// ==================== PAGE ====================

export default function AuthorPage({ params }: PageProps<"/auteurs/[slug]">) {
  return (
    <main className={`${PAGE} py-10 sm:py-12`}>
      <Suspense fallback={<div aria-hidden="true" className="h-40 animate-pulse" />}>
        <AuthorContent params={params} />
      </Suspense>
    </main>
  );
}

/** Charge l'auteur demandé ; page 404 s'il n'existe pas. */
async function AuthorContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getAuthorWithBooks(slug);
  if (!result) notFound();

  const { author, books } = result;
  const photo = publicImageUrl(author.photo_path);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {photo && (
          <Image
            src={photo}
            alt={author.display_name}
            width={160}
            height={160}
            className="size-32 rounded-full object-cover sm:size-40"
            priority
          />
        )}
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-h1">{author.display_name}</h1>
          {author.bio && (
            <p className="max-w-measure font-serif text-reading-small whitespace-pre-line">
              {author.bio}
            </p>
          )}
        </div>
      </header>

      <section aria-labelledby="titre-livres" className="flex flex-col gap-5">
        <h2 id="titre-livres" className="font-serif text-h2">
          {t.catalog.author.books}
        </h2>
        <BookGrid books={books} />
      </section>
    </div>
  );
}
