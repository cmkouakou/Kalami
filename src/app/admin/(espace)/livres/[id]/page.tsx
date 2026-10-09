/**
 * =============================================================
 *  Fichier    : page.tsx (admin/livres/[id])
 *  Projet     : Kalami
 *  Description: Fiche d'un livre en administration : informations, prix, statut de
 *               publication, couverture, puis contenu (manuscrit, extrait, droits de lecture).
 *               Une demande de validation ouverte s'affiche en tête (décision).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, lib/admin/catalog-queries.ts, components/admin
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookContentSection } from "@/components/admin/book-content-section";
import { BookForm } from "@/components/admin/book-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { SubmissionReview } from "@/components/admin/submission-review";
import { getDictionary } from "@/i18n";
import { getBookAdmin, getBookFormOptions } from "@/lib/admin/catalog-queries";
import { getBookContentAdmin } from "@/lib/admin/content-queries";
import { getOpenSubmission } from "@/lib/author/queries";
import { isUuid } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/dal";

const t = getDictionary();

export const metadata: Metadata = { title: t.admin.books.edit };

export default function AdminBookPage({ params }: PageProps<"/admin/livres/[id]">) {
  return (
    <main className="flex flex-col gap-6">
      <Link href="/admin/livres" className="w-fit text-sm text-encre hover:underline">
        ← {t.admin.common.back}
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <BookContent params={params} />
      </Suspense>
    </main>
  );
}

/** Charge le livre demandé ; 404 s'il n'existe pas. */
async function BookContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [book, { authors, categories }, content, submission] = await Promise.all([
    getBookAdmin(id),
    getBookFormOptions(),
    getBookContentAdmin(id),
    getOpenSubmission(id),
  ]);
  if (!book || !content) notFound();

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-3xl font-semibold">{book.title}</h1>
        {book.status === "published" && (
          <Link href={`/livres/${book.slug}`} className="text-sm text-encre hover:underline">
            {t.admin.common.view}
          </Link>
        )}
      </header>
      {submission && <SubmissionReview bookId={book.id} submission={submission} />}
      <div className="grid gap-8 md:grid-cols-[1fr_12rem]">
        <BookForm book={book} authors={authors} categories={categories} />
        <ImageUpload
          kind="book"
          id={book.id}
          label={t.admin.books.cover}
          currentPath={book.cover_path}
        />
      </div>
      <BookContentSection bookId={book.id} content={content} />
    </>
  );
}
