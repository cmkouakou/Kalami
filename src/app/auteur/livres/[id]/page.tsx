/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/livres/[id])
 *  Projet     : Kalami
 *  Description: Gestion d'un livre par son auteur : fiche et couverture (si modifiable),
 *               manuscrit et versions, prévisualisation, demande de validation, historique
 *               des décisions et passages les plus surlignés (livre publié).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, lib/author/actions.ts, components/author
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { ManuscriptUpload } from "@/components/admin/manuscript-upload";
import { AuthorBookForm } from "@/components/author/author-book-form";
import { BookStatusBadge } from "@/components/author/book-status-badge";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { BookVersionSummary } from "@/lib/admin/content-queries";
import { isUuid } from "@/lib/admin/validation";
import {
  convertAuthorManuscript,
  setOwnBookCover,
  submitAuthorBook,
} from "@/lib/author/actions";
import {
  getAuthorBook,
  getTopPassages,
  listCategoryOptions,
  requireAuthor,
  type AuthorBook,
} from "@/lib/author/queries";

const t = getDictionary();
const b = t.author.book;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const NUMBER_FORMAT = new Intl.NumberFormat("fr-FR");

export const metadata: Metadata = { title: b.details };

export default function AuthorBookPage({ params, searchParams }: PageProps<"/auteur/livres/[id]">) {
  return (
    <main className="flex flex-col gap-6">
      <Link href="/auteur" className="w-fit text-sm text-encre hover:underline">
        ← {b.back}
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <BookContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Résumé d'une version (« 12 chapitres, 45 000 mots »). */
function versionLine(template: string, version: BookVersionSummary): string {
  return interpolate(template, {
    chapters: String(version.chapter_count),
    words: NUMBER_FORMAT.format(version.word_count),
  });
}

/** Charge le livre de l'auteur ; 404 s'il n'existe pas ou appartient à un autre auteur. */
async function BookContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { author } = await requireAuthor(`/auteur/livres/${id}`);
  if (!isUuid(id)) notFound();
  const [book, categories, query] = await Promise.all([
    getAuthorBook(id, author.id),
    listCategoryOptions(),
    searchParams,
  ]);
  if (!book) notFound();

  const editable = book.status === "draft" || book.status === "rejected";
  const openSubmission = book.submissions.find((s) => s.status === "submitted");

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-serif text-3xl font-semibold">{book.title}</h1>
          {book.status === "published" && (
            <Link href={`/livres/${book.slug}`} className="text-sm text-encre hover:underline">
              {t.admin.common.view}
            </Link>
          )}
        </div>
        <BookStatusBadge status={book.status} />
      </header>

      {query.cree === "1" && (
        <p role="status" className="rounded-lg bg-success/15 p-4 text-sm">
          {b.created}
        </p>
      )}
      {book.status === "rejected" && book.rejection_reason && (
        <p role="alert" className="rounded-lg bg-danger/15 p-4 text-sm">
          {interpolate(b.rejected, { reason: book.rejection_reason })}
        </p>
      )}

      {/* ==================== FICHE ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <h2 className="text-lg font-semibold">{b.details}</h2>
        {editable ? (
          <div className="grid gap-8 md:grid-cols-[1fr_10rem]">
            <AuthorBookForm book={book} categories={categories} />
            <ImageUpload
              kind="book"
              id={book.id}
              label={t.admin.books.cover}
              currentPath={book.cover_path}
              save={setOwnBookCover}
            />
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{b.locked}</p>
        )}
      </section>

      <ManuscriptSection book={book} locked={Boolean(openSubmission)} />

      {/* ==================== VALIDATION ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <h2 className="text-lg font-semibold">{b.submitTitle}</h2>
        {openSubmission ? (
          <p role="status" className="text-sm">
            {interpolate(b.submissionOpen, {
              date: DATE_FORMAT.format(new Date(openSubmission.submitted_at)),
            })}
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-muted">{b.submitHelp}</p>
            <ActionForm
              action={submitAuthorBook.bind(null, book.id)}
              submitLabel={book.status === "published" ? b.submitUpdate : b.submit}
            >
              {null}
            </ActionForm>
          </>
        )}
        <SubmissionHistory book={book} />
      </section>

      {book.status === "published" && (
        <Suspense fallback={<div aria-hidden="true" className="h-40 animate-pulse" />}>
          <TopPassages bookId={book.id} />
        </Suspense>
      )}
    </>
  );
}

/** Versions publiée et en attente, lien d'aperçu et dépôt d'un nouveau manuscrit. */
function ManuscriptSection({ book, locked }: { book: AuthorBook; locked: boolean }) {
  return (
    <section className={`${CARD} flex flex-col gap-4 p-6`}>
      <h2 className="text-lg font-semibold">{t.admin.content.manuscript}</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {book.current && <li>{versionLine(b.current, book.current)}</li>}
        {book.pending && <li className="font-medium">{versionLine(b.pending, book.pending)}</li>}
        {!book.current && !book.pending && <li className="text-ink-muted">{b.noVersion}</li>}
      </ul>
      {(book.pending || book.current) && (
        <Link href={`/apercu/${book.id}`} className={`${BUTTON_SECONDARY} w-fit`}>
          {b.preview}
        </Link>
      )}
      {locked ? (
        <p className="text-sm text-ink-muted">{t.author.errors.submission_open}</p>
      ) : (
        <ManuscriptUpload
          bookId={book.id}
          convert={convertAuthorManuscript}
          help={b.manuscriptHelp}
        />
      )}
    </section>
  );
}

/** Historique des demandes, la plus récente en premier. */
function SubmissionHistory({ book }: { book: AuthorBook }) {
  if (book.submissions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{b.history}</h3>
      <ul className="flex flex-col gap-2 text-sm">
        {book.submissions.map((s) => (
          <li key={s.id} className="flex flex-col gap-0.5 border-t border-line pt-2">
            <span>
              {DATE_FORMAT.format(new Date(s.submitted_at))} —{" "}
              {s.is_update ? b.kinds.update : b.kinds.first} —{" "}
              <span className="font-medium">{b.submissionStatuses[s.status]}</span>
            </span>
            {s.reason && <span className="text-ink-muted">{s.reason}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Passages surlignés par au moins trois lecteurs, sans les identifier. */
async function TopPassages({ bookId }: { bookId: string }) {
  const passages = await getTopPassages(bookId);
  return (
    <section className={`${CARD} flex flex-col gap-4 p-6`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{b.topPassages}</h2>
        <p className="text-sm text-ink-muted">{b.topPassagesHelp}</p>
      </div>
      {passages.length === 0 ? (
        <p className="text-sm text-ink-muted">{b.noTopPassages}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {passages.map((passage) => (
            <li
              key={`${passage.chapter_position}-${passage.start_block}`}
              className="flex flex-col gap-1"
            >
              <blockquote className="border-l-2 border-encre pl-3 font-serif italic">
                {passage.quote}
              </blockquote>
              <span className="text-xs text-ink-muted">
                {interpolate(b.passage, {
                  chapter: String(passage.chapter_position),
                  readers: String(passage.readers),
                })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
