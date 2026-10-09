/**
 * =============================================================
 *  Fichier    : book-card.tsx
 *  Projet     : Kalami
 *  Description: Carte d'un livre (couverture, titre, auteur, prix) et grille de cartes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: book-cover.tsx, price-tag.tsx
 * =============================================================
 */

import Link from "next/link";

import { getDictionary } from "@/i18n";
import type { BookCard as BookCardData } from "@/lib/catalog/types";

import { BookCover } from "./book-cover";
import { PriceTag } from "./price-tag";

const t = getDictionary();

/** Largeurs d'une carte selon la grille (2, 3 puis 4 colonnes). */
const CARD_SIZES = "(min-width: 1024px) 14rem, (min-width: 640px) 33vw, 50vw";

/** Carte cliquable vers la fiche du livre. */
export function BookCard({ book }: { book: BookCardData }) {
  return (
    <article className="group flex flex-col gap-1">
      <Link href={`/livres/${book.slug}`} className="flex flex-col gap-3">
        <BookCover title={book.title} coverPath={book.cover_path} sizes={CARD_SIZES} />
        <h3 className="font-serif text-book-title group-hover:text-encre">{book.title}</h3>
      </Link>
      <p className="text-small text-ink-muted">
        {t.catalog.by}{" "}
        <Link href={`/auteurs/${book.author.slug}`} className="hover:text-encre">
          {book.author.display_name}
        </Link>
      </p>
      <PriceTag prices={book.book_prices} className="text-small text-ocre-text" />
    </article>
  );
}

/** Grille responsive de cartes, avec message si la liste est vide. */
export function BookGrid({ books, emptyText }: { books: BookCardData[]; emptyText?: string }) {
  if (books.length === 0) {
    return <p className="text-ink-muted">{emptyText ?? t.catalog.empty}</p>;
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-6 gap-y-10
      sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
