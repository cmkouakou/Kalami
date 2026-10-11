/**
 * =============================================================
 *  Fichier    : page.tsx (admin/livres)
 *  Projet     : Kalami
 *  Description: Liste de tous les livres (tous statuts), du plus récemment modifié au plus
 *               ancien, avec accès à la création.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getDictionary } from "@/i18n";
import { listBooksAdmin } from "@/lib/admin/catalog-queries";
import { requireAdmin } from "@/lib/auth/dal";
import type { BookStatus } from "@/lib/catalog/types";

const t = getDictionary();
const l = t.admin.books;

export const metadata: Metadata = { title: l.title };

/** Couleur de pastille par statut. */
const STATUS_CLASS: Record<BookStatus, string> = {
  draft: "bg-sand text-ink",
  submitted: "bg-warning/15 text-ink",
  published: "bg-success/15 text-ink",
  rejected: "bg-danger/15 text-ink",
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default function AdminBooksPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold">{l.title}</h1>
        <Link
          href="/admin/livres/nouveau"
          className="inline-flex min-h-11 items-center rounded-md bg-encre px-4 font-medium
            text-on-encre hover:opacity-90"
        >
          {l.new}
        </Link>
      </header>
      <Suspense fallback={<div aria-hidden="true" className="h-60 animate-pulse" />}>
        <BooksTable />
      </Suspense>
    </main>
  );
}

/** Tableau des livres. */
async function BooksTable() {
  await requireAdmin();
  const books = await listBooksAdmin();
  if (books.length === 0) return <p className="text-ink-muted">{t.admin.common.empty}</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-ink-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">{l.bookTitle}</th>
            <th scope="col" className="px-4 py-3 font-medium">{l.author}</th>
            <th scope="col" className="px-4 py-3 font-medium">{l.category}</th>
            <th scope="col" className="px-4 py-3 font-medium">{l.status}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t.admin.common.updatedAt}</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id} className="border-b border-line last:border-0">
              <td className="px-4 py-2">
                <Link
                  href={`/admin/livres/${book.id}`}
                  className="inline-flex min-h-11 items-center font-medium text-encre
                    hover:underline"
                >
                  {book.title}
                </Link>
                {book.is_featured && (
                  <span className="ml-2 text-xs text-ink-muted">★ {l.featuredBadge}</span>
                )}
              </td>
              <td className="px-4 py-2">{book.author.display_name}</td>
              <td className="px-4 py-2">{book.category?.name ?? "—"}</td>
              <td className="px-4 py-2">
                <span className={`rounded-full px-2 py-1 text-xs ${STATUS_CLASS[book.status]}`}>
                  {l.statuses[book.status]}
                </span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {DATE_FORMAT.format(new Date(book.updated_at))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
