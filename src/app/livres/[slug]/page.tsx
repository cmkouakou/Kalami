/**
 * =============================================================
 *  Fichier    : page.tsx (livres/[slug])
 *  Projet     : Kalami
 *  Description: Fiche publique d'un livre : couverture, auteur, prix, informations, résumé.
 *               Sommaire avec extrait gratuit ; liseuse au Sprint 4, achat au Sprint 5.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-08
 *  Dépendances: lib/catalog/queries.ts, components/catalog
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { BookCover } from "@/components/catalog/book-cover";
import { PriceTag } from "@/components/catalog/price-tag";
import { getDictionary, interpolate } from "@/i18n";
import { getBookBySlug, getBookToc } from "@/lib/catalog/queries";
import type { BookDetail, TocEntry } from "@/lib/catalog/types";

const t = getDictionary();
const NUMBER_FORMAT = new Intl.NumberFormat("fr-FR");

/** Longueur maximale de la description pour les moteurs de recherche. */
const META_DESCRIPTION_LENGTH = 160;

// ==================== MÉTADONNÉES ====================

export async function generateMetadata({
  params,
}: PageProps<"/livres/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};

  const description = (book.summary ?? book.subtitle ?? "").slice(0, META_DESCRIPTION_LENGTH);
  return {
    title: `${book.title} — ${book.author.display_name}`,
    description: description || undefined,
    alternates: { canonical: `/livres/${book.slug}` },
  };
}

// ==================== PAGE ====================

export default function BookPage({ params }: PageProps<"/livres/[slug]">) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<BookSkeleton />}>
        <BookContent params={params} />
      </Suspense>
    </main>
  );
}

/** Charge le livre demandé ; page 404 s'il n'existe pas ou n'est pas publié. */
async function BookContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();
  const toc = await getBookToc(book.id);

  return (
    <article className="flex flex-col gap-10">
      <div className="grid gap-8 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="mx-auto w-48 sm:w-full">
          <BookCover
            title={book.title}
            coverPath={book.cover_path}
            sizes="(min-width: 640px) 16rem, 12rem"
            priority
          />
        </div>
        <BookHeader book={book} />
      </div>

      <BookDetails book={book} />

      {book.summary && (
        <section aria-labelledby="titre-resume" className="flex flex-col gap-3">
          <h2 id="titre-resume" className="font-serif text-2xl font-semibold">
            {t.catalog.book.summary}
          </h2>
          <p className="max-w-prose font-serif text-lg leading-relaxed whitespace-pre-line">
            {book.summary}
          </p>
        </section>
      )}

      <BookToc toc={toc} />

      {book.author.bio && (
        <section aria-labelledby="titre-auteur" className="flex flex-col gap-3">
          <h2 id="titre-auteur" className="font-serif text-2xl font-semibold">
            {t.catalog.book.aboutAuthor}
          </h2>
          <p className="max-w-prose whitespace-pre-line">{book.author.bio}</p>
          <Link href={`/auteurs/${book.author.slug}`} className="w-fit text-principale underline">
            {book.author.display_name}
          </Link>
        </section>
      )}
    </article>
  );
}

// ==================== SOUS-COMPOSANTS ====================

/** Titre, auteur, prix et boutons d'action (inactifs jusqu'aux sprints 3 et 5). */
function BookHeader({ book }: { book: BookDetail }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl leading-tight font-semibold sm:text-4xl">
          {book.title}
        </h1>
        {book.subtitle && <p className="text-xl text-texte-doux">{book.subtitle}</p>}
      </div>
      <p>
        {t.catalog.by}{" "}
        <Link href={`/auteurs/${book.author.slug}`} className="font-medium text-principale">
          {book.author.display_name}
        </Link>
      </p>
      <PriceTag prices={book.book_prices} className="text-2xl" />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="min-h-11 rounded-md border border-bordure px-5 font-medium opacity-60"
        >
          {t.catalog.book.readExcerpt}
        </button>
        <button
          type="button"
          disabled
          className="min-h-11 rounded-md bg-principale px-5 font-medium text-principale-texte
            opacity-60"
        >
          {t.catalog.book.buy}
        </button>
      </div>
      <p className="text-sm text-texte-doux">{t.catalog.book.soon}</p>
    </header>
  );
}

/** Sommaire public : titres, longueur et chapitres compris dans l'extrait gratuit. */
function BookToc({ toc }: { toc: TocEntry[] }) {
  return (
    <section aria-labelledby="titre-sommaire" className="flex flex-col gap-3">
      <h2 id="titre-sommaire" className="font-serif text-2xl font-semibold">
        {t.catalog.book.toc}
      </h2>
      {toc.length === 0 ? (
        <p className="text-texte-doux">{t.catalog.book.tocSoon}</p>
      ) : (
        <ol className="flex max-w-2xl flex-col divide-y divide-bordure">
          {toc.map((entry) => (
            <li
              key={entry.chapter_position}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
            >
              <span>
                <span className="text-texte-doux">{entry.chapter_position}.</span> {entry.title}
              </span>
              <span className="flex items-baseline gap-3 text-sm text-texte-doux">
                {entry.is_preview && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-texte">
                    {t.catalog.book.freeExcerpt}
                  </span>
                )}
                {interpolate(t.catalog.book.words, {
                  count: NUMBER_FORMAT.format(entry.word_count),
                })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Informations bibliographiques (n'affiche que les valeurs renseignées). */
function BookDetails({ book }: { book: BookDetail }) {
  const rows: [string, ReactNode][] = [];
  if (book.edition) rows.push([t.catalog.book.edition, book.edition]);
  if (book.category) {
    rows.push([
      t.catalog.book.category,
      <Link key="cat" href={`/categories/${book.category.slug}`} className="text-principale">
        {book.category.name}
      </Link>,
    ]);
  }
  rows.push([t.catalog.book.language, t.catalog.languages[book.language]]);
  if (book.page_count) rows.push([t.catalog.book.pages, book.page_count]);
  if (book.chapter_count) rows.push([t.catalog.book.chapters, book.chapter_count]);
  if (book.publication_year) rows.push([t.catalog.book.year, book.publication_year]);

  return (
    <section aria-labelledby="titre-infos" className="flex flex-col gap-3">
      <h2 id="titre-infos" className="font-serif text-2xl font-semibold">
        {t.catalog.book.details}
      </h2>
      <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-texte-doux">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Squelette affiché pendant le chargement de la fiche. */
function BookSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-8 sm:grid-cols-[16rem_1fr]">
      <div className="mx-auto aspect-[2/3] w-48 rounded-md bg-bordure sm:w-full" />
      <div className="flex flex-col gap-4">
        <div className="h-10 w-3/4 rounded bg-bordure" />
        <div className="h-6 w-1/2 rounded bg-bordure" />
        <div className="h-8 w-24 rounded bg-bordure" />
      </div>
    </div>
  );
}
