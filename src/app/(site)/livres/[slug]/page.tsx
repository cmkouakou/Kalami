/**
 * =============================================================
 *  Fichier    : page.tsx (livres/[slug])
 *  Projet     : Kalami
 *  Description: Fiche publique d'un livre : couverture, auteur, carte de prix, repères,
 *               résumé, sommaire (extrait gratuit) et auteur. Bouton « Lire » ou
 *               « Reprendre » selon le lecteur, bloc PDF pour qui a l'option.
 *               v2.2 : encart Kalami Stratégie sur la fiche du livre guide.
 *               v2.3 : achat par carte (Stripe Checkout).
 *               v2.4 : sommaire sans cadenas, tout cliquable, pour qui possède le livre.
 *               v2.5 : référencement (aperçu Open Graph avec la couverture, JSON-LD Book).
 *               v2.6 : bouton « Partager ce livre » (avec la couverture), sans ouvrir la
 *               liseuse.
 *  Auteur     : Claude Marcel
 *  Version    : 2.6
 *  Date       : 2026-10-28
 *  Dépendances: lib/catalog/queries.ts, lib/seo, components/catalog, components/ui
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookCover } from "@/components/catalog/book-cover";
import { BuySection } from "@/components/catalog/buy-section";
import { PdfDownload } from "@/components/catalog/pdf-download";
import { PriceTag } from "@/components/catalog/price-tag";
import { ShareBookButton } from "@/components/catalog/share-book-button";
import { StrategyPromo } from "@/components/reader/strategy-promo";
import { IconLock } from "@/components/ui/icons";
import {
  BADGE,
  BUTTON_SECONDARY,
  CARD,
  PAGE,
  PANEL_SAND,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { publicImageUrl } from "@/lib/catalog/images";
import { getBookBySlug, getBookToc } from "@/lib/catalog/queries";
import type { Author, BookDetail, TocEntry } from "@/lib/catalog/types";
import { APP_URL } from "@/lib/config";
import { getPdfStatus } from "@/lib/pdf/exports";
import { hasStrategyPromo } from "@/lib/reader/promo";
import { getReadingStatus } from "@/lib/reader/queries";
import { bookJsonLd, serializeJsonLd } from "@/lib/seo/book-json-ld";

const t = getDictionary();
const NUMBER_FORMAT = new Intl.NumberFormat("fr-FR");

/** Longueur maximale de la description pour les moteurs de recherche. */
const META_DESCRIPTION_LENGTH = 160;

/** Titres de section de la fiche. */
const SECTION_TITLE = "font-serif text-h2";

// ==================== MÉTADONNÉES ====================

export async function generateMetadata({
  params,
}: PageProps<"/livres/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};

  const description = (book.summary ?? book.subtitle ?? "").slice(0, META_DESCRIPTION_LENGTH);
  const title = `${book.title} — ${book.author.display_name}`;
  const cover = publicImageUrl(book.cover_path);
  return {
    title,
    description: description || undefined,
    alternates: { canonical: `/livres/${book.slug}` },
    // Aperçu des liens partagés : la couverture remplace l'image générique de Kalami
    openGraph: {
      type: "book",
      title,
      description: description || undefined,
      url: `/livres/${book.slug}`,
      ...(cover && { images: [{ url: cover, alt: book.title }] }),
    },
  };
}

// ==================== PAGE ====================

export default function BookPage({ params }: PageProps<"/livres/[slug]">) {
  return (
    <main className={`${PAGE} py-8 sm:py-12`}>
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
  const jsonLd = bookJsonLd(book, APP_URL, publicImageUrl(book.cover_path));

  return (
    <article className="flex flex-col gap-12">
      {/* Données structurées « Book » pour Google (JSON-LD, « < » échappé) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Breadcrumb book={book} />

      <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className={`${PANEL_SAND} flex justify-center p-8 sm:p-10`}>
          <div className="w-48 sm:w-56">
            <BookCover
              title={book.title}
              coverPath={book.cover_path}
              sizes="(min-width: 640px) 14rem, 12rem"
              priority
            />
          </div>
        </div>
        <BookHeader book={book} />
      </div>

      <BookStats book={book} />

      <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-12">
          {book.summary && (
            <section aria-labelledby="titre-resume" className="flex flex-col gap-3">
              <h2 id="titre-resume" className={SECTION_TITLE}>
                {t.catalog.book.summary}
              </h2>
              <p className="max-w-measure font-serif text-reading-small whitespace-pre-line">
                {book.summary}
              </p>
            </section>
          )}
          <Suspense fallback={<BookToc toc={toc} slug={book.slug} full={false} />}>
            <OwnedToc bookId={book.id} toc={toc} slug={book.slug} />
          </Suspense>
        </div>
        <div className="flex flex-col gap-6">
          {book.author.bio && <AuthorCard author={book.author} />}
          {hasStrategyPromo(book.slug) && <StrategyPromo />}
        </div>
      </div>
    </article>
  );
}

// ==================== SOUS-COMPOSANTS ====================

/** Fil d'Ariane : accueil, catégorie, livre. */
function Breadcrumb({ book }: { book: BookDetail }) {
  return (
    <nav aria-label={t.catalog.book.breadcrumb}>
      <ol className="flex flex-wrap gap-2 text-small text-ink-muted">
        <li>
          <Link href="/" className="hover:text-encre">
            {t.catalog.book.home}
          </Link>
        </li>
        {book.category && (
          <li className="before:mr-2 before:content-['/']">
            <Link href={`/categories/${book.category.slug}`} className="hover:text-encre">
              {book.category.name}
            </Link>
          </li>
        )}
        <li aria-current="page" className="text-ink before:mr-2 before:content-['/']">
          {book.title}
        </li>
      </ol>
    </nav>
  );
}

/** Catégorie, titre, auteur, puis carte de prix avec les actions. */
function BookHeader({ book }: { book: BookDetail }) {
  return (
    <header className="flex flex-col gap-5">
      {book.category && (
        <Link href={`/categories/${book.category.slug}`} className={`${BADGE} w-fit`}>
          {book.category.name}
        </Link>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-h1 sm:text-[40px] sm:leading-[48px]">{book.title}</h1>
        {book.subtitle && <p className="text-h3 font-normal text-ink-muted">{book.subtitle}</p>}
      </div>
      <p className="text-body">
        {t.catalog.by}{" "}
        <Link href={`/auteurs/${book.author.slug}`} className="font-semibold text-encre">
          {book.author.display_name}
        </Link>
      </p>

      <div className={`${CARD} flex max-w-md flex-col gap-4 p-6`}>
        <PriceTag prices={book.book_prices} className="text-[30px] leading-9 text-ocre-text" />
        <div className="flex flex-col gap-3">
          <BuySection
            bookId={book.id}
            prices={book.book_prices}
            returnPath={`/livres/${book.slug}`}
          />
          <Suspense
            fallback={<ReadLink slug={book.slug} label={t.catalog.book.readExcerpt} />}
          >
            <ReadButton bookId={book.id} slug={book.slug} />
          </Suspense>
          <ShareBookButton
            slug={book.slug}
            title={book.title}
            authorName={book.author.display_name}
            coverUrl={publicImageUrl(book.cover_path)}
          />
        </div>
        <Suspense fallback={null}>
          <PdfSection bookId={book.id} />
        </Suspense>
        <p className="text-small text-ink-muted">{t.catalog.purchase.secure}</p>
      </div>
    </header>
  );
}

/** Lien vers la liseuse. */
function ReadLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link href={`/livres/${slug}/lire`} className={`${BUTTON_SECONDARY} w-full`}>
      {label}
    </Link>
  );
}

/** Bouton de lecture selon le lecteur : extrait, livre entier ou reprise à l'avancement. */
async function ReadButton({ bookId, slug }: { bookId: string; slug: string }) {
  const { full, progress } = await getReadingStatus(bookId);
  let label = full ? t.reader.readBook : t.catalog.book.readExcerpt;
  if (progress !== null && progress > 0) {
    label = interpolate(t.reader.resume, { percent: String(Math.round(progress * 100)) });
  }
  return <ReadLink slug={slug} label={label} />;
}

/** Bloc PDF, affiché seulement au lecteur connecté qui a l'option PDF de ce livre. */
async function PdfSection({ bookId }: { bookId: string }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const status = await getPdfStatus(user.id, bookId);
  if (!status) return null;
  return (
    <PdfDownload
      bookId={bookId}
      reference={status.purchase.reference}
      remaining={status.purchase.downloads_remaining}
      initialExport={status.export}
    />
  );
}

/** Repères bibliographiques en tuiles (n'affiche que les valeurs renseignées). */
function BookStats({ book }: { book: BookDetail }) {
  const stats: [string, string | number][] = [];
  if (book.page_count) stats.push([t.catalog.book.pages, book.page_count]);
  if (book.chapter_count) stats.push([t.catalog.book.chapters, book.chapter_count]);
  stats.push([t.catalog.book.language, t.catalog.languages[book.language]]);
  if (book.publication_year) stats.push([t.catalog.book.year, book.publication_year]);
  if (book.edition) stats.push([t.catalog.book.edition, book.edition]);

  return (
    <section aria-labelledby="titre-infos">
      <h2 id="titre-infos" className="visuellement-cache">
        {t.catalog.book.details}
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {stats.map(([label, value]) => (
          <div key={label} className={`${PANEL_SAND} flex flex-col-reverse gap-1 p-4`}>
            <dt className="text-caption text-ink-muted uppercase">{label}</dt>
            <dd className="text-h3">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Sommaire selon le lecteur : complet et sans cadenas s'il possède le livre. */
async function OwnedToc({ bookId, toc, slug }: { bookId: string; toc: TocEntry[]; slug: string }) {
  const { full } = await getReadingStatus(bookId);
  return <BookToc toc={toc} slug={slug} full={full} />;
}

/**
 * Sommaire : titres, longueur et accès. Sans le livre, seuls les chapitres de l'extrait
 * gratuit sont des liens ; avec le livre (full), tous le sont et aucun cadenas n'apparaît.
 */
function BookToc({ toc, slug, full }: { toc: TocEntry[]; slug: string; full: boolean }) {
  return (
    <section aria-labelledby="titre-sommaire" className="flex flex-col gap-3">
      <h2 id="titre-sommaire" className={SECTION_TITLE}>
        {t.catalog.book.toc}
      </h2>
      {toc.length === 0 ? (
        <p className="text-ink-muted">{t.catalog.book.tocSoon}</p>
      ) : (
        <ol className={`${CARD} flex flex-col divide-y divide-line`}>
          {toc.map((entry) => (
            <TocRow key={entry.chapter_position} entry={entry} slug={slug} full={full} />
          ))}
        </ol>
      )}
    </section>
  );
}

/** Ligne du sommaire : numéro, titre (lien si lisible), mots et mention d'accès. */
function TocRow({ entry, slug, full }: { entry: TocEntry; slug: string; full: boolean }) {
  const readable = full || entry.is_preview;
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
      <span className="flex items-baseline gap-3">
        <span className="w-6 text-small text-ink-muted tabular-nums">
          {entry.chapter_position}
        </span>
        {readable ? (
          <Link
            href={`/livres/${slug}/lire?chapitre=${entry.chapter_position}`}
            className="text-encre underline-offset-4 hover:underline"
          >
            {entry.title}
          </Link>
        ) : (
          <span>{entry.title}</span>
        )}
      </span>
      <span className="flex items-center gap-3 text-small text-ink-muted">
        {interpolate(t.catalog.book.words, { count: NUMBER_FORMAT.format(entry.word_count) })}
        {full ? null : entry.is_preview ? (
          <span className="font-semibold text-success">{t.catalog.book.free}</span>
        ) : (
          <span className="flex items-center gap-1">
            <IconLock size={16} />
            {t.catalog.book.included}
          </span>
        )}
      </span>
    </li>
  );
}

/** Carte « À propos de l'auteur » avec initiales. */
function AuthorCard({ author }: { author: Author }) {
  const initials = author.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <section aria-labelledby="titre-auteur" className={`${CARD} flex h-fit flex-col gap-4 p-6`}>
      <h2 id="titre-auteur" className="text-caption text-ink-muted uppercase">
        {t.catalog.book.aboutAuthor}
      </h2>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-encre-soft
            text-label text-encre"
        >
          {initials}
        </span>
        <Link href={`/auteurs/${author.slug}`} className="text-h3 hover:text-encre">
          {author.display_name}
        </Link>
      </div>
      <p className="text-small whitespace-pre-line text-ink-muted">{author.bio}</p>
    </section>
  );
}

/** Squelette affiché pendant le chargement de la fiche. */
function BookSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-10 md:grid-cols-[22rem_1fr]">
      <div className="aspect-[3/4] rounded-lg bg-sand" />
      <div className="flex flex-col gap-4">
        <div className="h-10 w-3/4 rounded-sm bg-sand" />
        <div className="h-6 w-1/2 rounded-sm bg-sand" />
        <div className="h-48 max-w-md rounded-lg bg-sand" />
      </div>
    </div>
  );
}
