/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/livres/[id]/atelier/fiche)
 *  Projet     : Kalami
 *  Description: Fiche du livre rédigée par Claude dans l'atelier (v0.15.2) : solde, bouton
 *               de rédaction et dernière proposition (résumé, accroche, mots-clés,
 *               biographie, titres) avec reprise d'un clic. Ce segment statique passe
 *               avant [chapitre]. 404 si le livre appartient à un autre auteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/queries.ts, lib/author/workshop/balance.ts,
 *               components/author/workshop-run.tsx, components/author/workshop-listing.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { WorkshopListing } from "@/components/author/workshop-listing";
import { WorkshopRun } from "@/components/author/workshop-run";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireAuthor } from "@/lib/author/queries";
import { balanceMessage, canRunTools } from "@/lib/author/workshop/balance";
import {
  getLatestListingRequest,
  getManuscript,
  getWorkshopBalance,
} from "@/lib/author/workshop/queries";

const w = getDictionary().workshop;

export const metadata: Metadata = { title: w.listing.run };

/** Une rédaction de Claude peut durer jusqu'à deux minutes. */
export const maxDuration = 300;

type PageProps = { params: Promise<{ id: string }> };

export default function ListingWorkshopPage({ params }: PageProps) {
  return (
    <main className="flex flex-col gap-6">
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ListingWorkshop params={params} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Charge le livre, le solde et la dernière fiche proposée ; 404 sinon. */
async function ListingWorkshop({ params }: PageProps) {
  const { id } = await params;
  const { author } = await requireAuthor(`/auteur/livres/${id}/atelier/fiche`);
  if (!isUuid(id)) notFound();
  const manuscript = await getManuscript(id, author.id);
  if (!manuscript?.versionId || manuscript.chapters.length === 0) notFound();

  const { book } = manuscript;
  const [balance, request] = await Promise.all([
    getWorkshopBalance(),
    getLatestListingRequest(book.id),
  ]);

  return (
    <>
      <Link
        href={`/auteur/livres/${id}/atelier`}
        className="w-fit text-sm text-encre hover:underline"
      >
        ← {w.tools.back}
      </Link>
      <h1 className="font-serif text-3xl font-semibold">
        {interpolate(w.listing.title, { title: book.title })}
      </h1>
      <p className="text-sm text-ink-muted">
        {manuscript.source === "pending" ? w.book.sourcePending : w.book.sourceCurrent}
      </p>

      {/* ==================== SOLDE ==================== */}
      <section className={`${PANEL_SAND} flex flex-col gap-2 p-4 text-sm`}>
        <p>{balanceMessage(balance)}</p>
        <p className="text-ink-muted">{w.tools.cost}</p>
        <Link href="/auteur/atelier" className="w-fit text-encre hover:underline">
          {w.tools.credits}
        </Link>
      </section>

      {/* ==================== PROPOSITION ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <p className="text-sm text-ink-muted">{w.listing.intro}</p>
        <WorkshopRun
          bookId={book.id}
          chapterId={null}
          tool="listing"
          done={Boolean(request)}
          disabled={!canRunTools(balance)}
        />
        {request ? (
          <WorkshopListing
            key={request.id}
            requestId={request.id}
            listing={request.listing}
            decisions={request.decisions}
            current={{
              title: book.title,
              subtitle: book.subtitle,
              summary: book.summary,
              keywords: book.keywords,
              bio: author.bio,
            }}
            locked={book.status !== "draft" && book.status !== "rejected"}
          />
        ) : (
          <p className="text-sm text-ink-muted">{w.listing.none}</p>
        )}
      </section>
    </>
  );
}
