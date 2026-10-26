/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/livres/[id]/atelier)
 *  Projet     : Kalami
 *  Description: Atelier d'un livre (v0.15.0) : statistiques gratuites du manuscrit (version
 *               en attente, sinon publiée), liste de vérification avant soumission, outils
 *               IA par chapitre (relecture, style) et création d'une nouvelle version avec
 *               les suggestions acceptées (v0.15.1), lien vers la fiche rédigée par Claude
 *               (v0.15.2). 404 si le livre appartient à un autre auteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/queries.ts, lib/author/manuscript-stats.ts,
 *               lib/author/checklist.ts, lib/author/workshop/actions.ts,
 *               components/admin/action-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { CARD, PANEL_SAND, PILL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { bookChecklist } from "@/lib/author/checklist";
import { analyzeManuscript, type ManuscriptStats } from "@/lib/author/manuscript-stats";
import { requireAuthor } from "@/lib/author/queries";
import { createCorrectedVersion } from "@/lib/author/workshop/actions";
import {
  getManuscript,
  listLatestChapterRequests,
  type ChapterRequest,
  type WorkshopChapter,
} from "@/lib/author/workshop/queries";
import { CHAPTER_TOOLS } from "@/lib/author/workshop/suggestions";

const w = getDictionary().workshop;
const NUMBER_FORMAT = new Intl.NumberFormat("fr-FR");

export const metadata: Metadata = { title: w.title };

type PageProps = { params: Promise<{ id: string }> };

export default function BookWorkshopPage({ params }: PageProps) {
  return (
    <main className="flex flex-col gap-6">
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <BookWorkshop params={params} />
      </Suspense>
    </main>
  );
}

// ==================== STATISTIQUES ====================

/** Chiffre clé (libellé, valeur, aide facultative). */
function Figure({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
      {help && <dd className="text-small text-ink-muted">{help}</dd>}
    </div>
  );
}

/** Totaux, tableau par chapitre, phrases longues et mots fréquents. */
function StatsSection({ stats }: { stats: ManuscriptStats }) {
  const s = w.stats;
  return (
    <section className={`${CARD} flex flex-col gap-6 p-6`}>
      <h2 className="text-lg font-semibold">{s.title}</h2>
      <dl className="grid gap-4 sm:grid-cols-3">
        <Figure label={s.words} value={NUMBER_FORMAT.format(stats.words)} />
        <Figure label={s.chapters} value={String(stats.chapters.length)} />
        <Figure
          label={s.reading}
          value={interpolate(s.readingValue, { minutes: String(stats.readingMinutes) })}
        />
        <Figure label={s.averageSentence} value={String(stats.averageSentence)} />
        <Figure
          label={s.closeRepeats}
          value={String(stats.closeRepeats)}
          help={s.closeRepeatsHelp}
        />
        <Figure
          label={s.punctuation}
          value={String(stats.punctuationIssues)}
          help={s.punctuationHelp}
        />
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{s.chapterTable}</caption>
          <thead className="text-ink-muted">
            <tr>
              <th scope="col" className="py-2 pr-3">{s.chapter}</th>
              <th scope="col" className="py-2 pr-3">{s.words}</th>
              <th scope="col" className="py-2 pr-3">{s.share}</th>
              <th scope="col" className="py-2 pr-3">{s.long}</th>
              <th scope="col" className="py-2 pr-3">{s.repeats}</th>
              <th scope="col" className="py-2">{s.spacing}</th>
            </tr>
          </thead>
          <tbody>
            {stats.chapters.map((chapter) => (
              <tr key={chapter.position} className="border-t border-line">
                <th scope="row" className="py-2 pr-3 font-normal">
                  {chapter.position}. {chapter.title}
                  {chapter.flag && (
                    <span className="ml-2 rounded bg-warning/15 px-2 text-small">
                      {chapter.flag === "short" ? s.flagShort : s.flagLong}
                    </span>
                  )}
                </th>
                <td className="py-2 pr-3">{NUMBER_FORMAT.format(chapter.words)}</td>
                <td className="py-2 pr-3">{chapter.sharePct} %</td>
                <td className="py-2 pr-3">{chapter.longSentences}</td>
                <td className="py-2 pr-3">{chapter.closeRepeats}</td>
                <td className="py-2">{chapter.punctuationIssues}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{s.longSentences}</h3>
        {stats.longSentences.length === 0 ? (
          <p className="text-sm text-ink-muted">{s.noLongSentences}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.longSentences.map((sentence, index) => (
              <li key={index} className="flex flex-col gap-1 text-sm">
                <span className="text-small text-ink-muted">
                  {interpolate(s.longSentence, {
                    position: String(sentence.position),
                    words: String(sentence.words),
                  })}
                </span>
                <q>{sentence.excerpt}</q>
              </li>
            ))}
          </ul>
        )}
      </div>

      {stats.topWords.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">{s.topWords}</h3>
          <ul className="flex flex-wrap gap-2 text-sm">
            {stats.topWords.map((entry) => (
              <li key={entry.word} className="rounded bg-sand px-2 py-1">
                {interpolate(s.topWord, { word: entry.word, count: String(entry.count) })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ==================== OUTILS IA ====================

/** Nombre de suggestions acceptées d'une demande. */
function acceptedCount(request: ChapterRequest | undefined): number {
  if (!request) return 0;
  return Object.values(request.decisions).filter((value) => value === "accepted").length;
}

/** Chapitres avec liens vers leur relecture, puis création d'une nouvelle version. */
function ToolsSection({
  bookId,
  chapters,
  requests,
}: {
  bookId: string;
  chapters: WorkshopChapter[];
  requests: Map<string, ChapterRequest>;
}) {
  const t = w.tools;
  const accepted = chapters.reduce(
    (sum, chapter) => sum + CHAPTER_TOOLS.reduce(
      (count, tool) => count + acceptedCount(requests.get(`${chapter.id}:${tool}`)),
      0,
    ),
    0,
  );
  return (
    <>
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-ink-muted">{t.intro}</p>
        </div>
        <ul className="flex flex-col divide-y divide-line text-sm">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="flex flex-wrap items-center gap-3 py-2">
              <Link
                href={`/auteur/livres/${bookId}/atelier/${chapter.id}`}
                className="min-h-8 flex-1 content-center text-encre hover:underline"
              >
                {chapter.position}. {chapter.title}
              </Link>
              {CHAPTER_TOOLS.map((tool) => {
                const request = requests.get(`${chapter.id}:${tool}`);
                return request ? (
                  <span key={tool} className="text-small text-ink-muted">
                    {t.names[tool]} ✓ {acceptedCount(request)}/
                    {request.review.suggestions.length}
                  </span>
                ) : null;
              })}
              <Link href={`/auteur/livres/${bookId}/atelier/${chapter.id}`} className={PILL}>
                {t.open}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.listingTitle}</h2>
          <p className="text-sm text-ink-muted">{t.listingIntro}</p>
        </div>
        <Link href={`/auteur/livres/${bookId}/atelier/fiche`} className={PILL}>
          {t.listingOpen}
        </Link>
      </section>

      <section className={`${PANEL_SAND} flex flex-col gap-3 p-6`}>
        <h2 className="text-lg font-semibold">{w.version.title}</h2>
        <p className="text-sm">{w.version.intro}</p>
        <p className="text-sm font-semibold">
          {accepted > 0
            ? interpolate(w.version.ready, { count: String(accepted) })
            : w.version.empty}
        </p>
        {accepted > 0 && (
          <ActionForm
            action={createCorrectedVersion.bind(null, bookId)}
            submitLabel={w.version.submit}
          >
            {null}
          </ActionForm>
        )}
      </section>
    </>
  );
}

// ==================== CONTENU ====================

/** Charge le manuscrit du livre de l'auteur ; 404 sinon. */
async function BookWorkshop({ params }: PageProps) {
  const { id } = await params;
  const { author } = await requireAuthor(`/auteur/livres/${id}/atelier`);
  if (!isUuid(id)) notFound();
  const manuscript = await getManuscript(id, author.id);
  if (!manuscript) notFound();

  const { book, source, chapters, versionId } = manuscript;
  const requests = versionId ? await listLatestChapterRequests(versionId) : new Map();
  const checklist = bookChecklist(book);
  const ready = checklist.every((item) => item.done);

  return (
    <>
      <Link href={`/auteur/livres/${book.id}`} className="w-fit text-sm text-encre hover:underline">
        ← {w.book.back}
      </Link>
      <h1 className="font-serif text-3xl font-semibold">
        {interpolate(w.book.title, { title: book.title })}
      </h1>

      {/* ==================== VÉRIFICATION ==================== */}
      <section className={`${CARD} flex flex-col gap-3 p-6`}>
        <h2 className="text-lg font-semibold">{w.checklist.title}</h2>
        <p className="text-sm text-ink-muted">{ready ? w.checklist.ready : w.checklist.intro}</p>
        <ul className="flex flex-col gap-1 text-sm">
          {checklist.map((item) => (
            <li key={item.key} className="flex min-h-8 items-center gap-2">
              <span
                className={item.done ? "text-success" : "text-warning"}
                aria-label={item.done ? w.checklist.done : w.checklist.todo}
              >
                {item.done ? "✓" : "○"}
              </span>
              {w.checklist.items[item.key]}
            </li>
          ))}
        </ul>
      </section>

      {/* ==================== MANUSCRIT ==================== */}
      {chapters.length === 0 ? (
        <p className={`${PANEL_SAND} p-4 text-sm`}>{w.book.noManuscript}</p>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {source === "pending" ? w.book.sourcePending : w.book.sourceCurrent}
          </p>
          <StatsSection stats={analyzeManuscript(chapters)} />
        </>
      )}

      {/* ==================== OUTILS IA ==================== */}
      {chapters.length > 0 && (
        <ToolsSection bookId={book.id} chapters={chapters} requests={requests} />
      )}
    </>
  );
}
