/**
 * =============================================================
 *  Fichier    : page.tsx (auteur)
 *  Projet     : Kalami
 *  Description: Tableau de bord de l'auteur (/auteur) : rappel du contrat à accepter,
 *               livres avec statut, lecteurs et surlignages, encart « ventes » en attendant
 *               l'ouverture des paiements. Sans fiche auteur : renvoi vers l'inscription.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, components/author
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BookStatusBadge } from "@/components/author/book-status-badge";
import { BUTTON_PRIMARY, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { listAuthorBooks, requireAuthor } from "@/lib/author/queries";

const t = getDictionary();
const d = t.author.dashboard;

export const metadata: Metadata = { title: { absolute: t.author.title } };

export default function AuthorDashboardPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold">{t.author.title}</h1>
        <p className="text-ink-muted">{t.author.intro}</p>
      </header>
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

/** Contenu privé : contrat, livres et statistiques de l'auteur connecté. */
async function Dashboard() {
  const { author, contract, acceptedAt } = await requireAuthor("/auteur");
  const books = await listAuthorBooks(author.id);

  return (
    <>
      {contract && !acceptedAt && (
        <p role="status" className="rounded-lg bg-warning/15 p-4 text-sm">
          {t.author.contract.newVersion}{" "}
          <Link href="/auteur/contrat" className="font-medium text-encre underline">
            {t.author.nav.contract}
          </Link>
        </p>
      )}

      {/* ==================== LIVRES ==================== */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{d.books}</h2>
          <Link href="/auteur/livres/nouveau" className={BUTTON_PRIMARY}>
            {d.newBook}
          </Link>
        </div>
        {books.length === 0 ? (
          <p className="text-ink-muted">{d.noBooks}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {books.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/auteur/livres/${book.id}`}
                  className={`${CARD} flex flex-col gap-2 p-4 hover:border-encre sm:flex-row
                    sm:items-center sm:justify-between`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-medium">{book.title}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <BookStatusBadge status={book.status} />
                      {book.has_pending_version && (
                        <span className="text-xs text-ink-muted">{d.pendingVersion}</span>
                      )}
                    </span>
                  </span>
                  <span className="flex gap-4 text-sm text-ink-muted">
                    <span>{interpolate(d.readers, { count: String(book.readers) })}</span>
                    <span>{interpolate(d.highlights, { count: String(book.highlights) })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ==================== VENTES (BIENTÔT) ==================== */}
      <section className={`${PANEL_SAND} flex flex-col gap-1 p-6`}>
        <h2 className="text-lg font-semibold">{d.salesTitle}</h2>
        <p className="text-sm text-ink-muted">{d.salesSoon}</p>
      </section>
    </>
  );
}
