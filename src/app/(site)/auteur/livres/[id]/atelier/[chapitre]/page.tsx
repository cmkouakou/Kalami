/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/livres/[id]/atelier/[chapitre])
 *  Projet     : Kalami
 *  Description: Relecture d'un chapitre dans l'atelier (v0.15.1) : relecteur (orthographe,
 *               grammaire) et conseiller de style, chacun avec sa dernière analyse et ses
 *               suggestions à accepter ou refuser. 404 si le livre appartient à un autre
 *               auteur ou si le chapitre n'est pas dans la version lue.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/queries.ts, lib/author/workshop/balance.ts,
 *               components/author/workshop-run.tsx, components/author/workshop-review.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { WorkshopReview } from "@/components/author/workshop-review";
import { WorkshopRun } from "@/components/author/workshop-run";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireAuthor } from "@/lib/author/queries";
import { balanceMessage, canRunTools } from "@/lib/author/workshop/balance";
import {
  getManuscript,
  getWorkshopBalance,
  listLatestChapterRequests,
} from "@/lib/author/workshop/queries";
import { CHAPTER_TOOLS } from "@/lib/author/workshop/suggestions";
import { getWorkshopDictionary } from "@/i18n/workshop";

const w = getWorkshopDictionary();

export const metadata: Metadata = { title: w.title };

/** Une analyse de Claude peut durer jusqu'à deux minutes. */
export const maxDuration = 300;

type PageProps = { params: Promise<{ id: string; chapitre: string }> };

export default function ChapterWorkshopPage({ params }: PageProps) {
  return (
    <main className="flex flex-col gap-6">
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ChapterWorkshop params={params} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Charge le chapitre, le solde et les dernières analyses ; 404 sinon. */
async function ChapterWorkshop({ params }: PageProps) {
  const { id, chapitre } = await params;
  const { author } = await requireAuthor(`/auteur/livres/${id}/atelier/${chapitre}`);
  if (!isUuid(id) || !isUuid(chapitre)) notFound();
  const manuscript = await getManuscript(id, author.id);
  const chapter = manuscript?.chapters.find((item) => item.id === chapitre);
  if (!manuscript?.versionId || !chapter) notFound();

  const [balance, requests] = await Promise.all([
    getWorkshopBalance(),
    listLatestChapterRequests(manuscript.versionId),
  ]);
  const allowed = canRunTools(balance);

  return (
    <>
      <Link
        href={`/auteur/livres/${id}/atelier`}
        className="w-fit text-sm text-encre hover:underline"
      >
        ← {w.tools.back}
      </Link>
      <h1 className="font-serif text-3xl font-semibold">
        {interpolate(w.tools.chapterTitle, {
          position: String(chapter.position),
          title: chapter.title,
        })}
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

      {/* ==================== OUTILS ==================== */}
      {CHAPTER_TOOLS.map((tool) => {
        const request = requests.get(`${chapter.id}:${tool}`);
        return (
          <section key={tool} className={`${CARD} flex flex-col gap-4 p-6`}>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{w.tools.names[tool]}</h2>
              <p className="text-sm text-ink-muted">{w.tools.descriptions[tool]}</p>
            </div>
            <WorkshopRun
              bookId={id}
              chapterId={chapter.id}
              tool={tool}
              done={Boolean(request)}
              disabled={!allowed}
            />
            {request ? (
              <WorkshopReview
                key={request.id}
                requestId={request.id}
                review={request.review}
                decisions={request.decisions}
              />
            ) : (
              <p className="text-sm text-ink-muted">{w.tools.none}</p>
            )}
          </section>
        );
      })}
    </>
  );
}
