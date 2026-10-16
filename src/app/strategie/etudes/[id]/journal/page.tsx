/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/journal)
 *  Projet     : Kalami Stratégie
 *  Description: Journal d'activité d'une étude (S9a, cahier §6) : invitations, arrivées et
 *               départs, rôles, responsables et changements de statut des étapes, du plus
 *               récent au plus ancien, par pages de 50 (paramètre « avant »). Ouvert à tous
 *               les membres ; aucun courriel n'y figure.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/queries.ts, lib/strategy/team-queries.ts, lib/strategy/team.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { getStudy } from "@/lib/strategy/queries";
import { describeActivity } from "@/lib/strategy/team";
import { ACTIVITY_PAGE, getStudyActivity } from "@/lib/strategy/team-queries";

const tm = getDictionary().strategy.team;
const j = tm.journal;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export const metadata: Metadata = { title: j.title };

export default function StudyJournalPage({
  params,
  searchParams,
}: PageProps<"/strategie/etudes/[id]/journal">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StudyJournal params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Identifiant d'entrée lu dans « ?avant= » (null s'il est absent ou invalide). */
function readBefore(raw: string | string[] | undefined): number | null {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/** Charge l'étude et une page du journal. */
async function StudyJournal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const before = readBefore((await searchParams).avant);
  const user = await requireUser(`/strategie/etudes/${id}/journal`);
  const study = await getStudy(id, user.id);
  if (!study) notFound();

  const entries = await getStudyActivity(study.id, before);
  const base = `/strategie/etudes/${study.id}/journal`;
  const last = entries.at(-1);

  return (
    <main className="flex flex-col gap-6">
      <Link href={`/strategie/etudes/${study.id}`} className="w-fit text-sm text-encre
        hover:underline"
      >
        ← {tm.back}
      </Link>

      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{study.company_name}</p>
        <h1 className="font-serif text-h1 font-semibold">{j.title}</h1>
        <p className="max-w-2xl text-ink-muted">{j.intro}</p>
      </header>

      {/* ==================== ENTRÉES ==================== */}
      {entries.length === 0 ? (
        <p className="text-ink-muted">{j.none}</p>
      ) : (
        <ol className={`${CARD} flex flex-col divide-y divide-line`}>
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
              <time
                dateTime={entry.created_at}
                className="shrink-0 text-small text-ink-muted sm:w-44"
              >
                {DATE_FORMAT.format(new Date(entry.created_at))}
              </time>
              <span>{describeActivity(entry)}</span>
            </li>
          ))}
        </ol>
      )}

      {/* ==================== PAGES ==================== */}
      <nav className="flex flex-wrap gap-2" aria-label={j.title}>
        {before !== null && (
          <Link href={base} className={BUTTON_SECONDARY}>{j.latest}</Link>
        )}
        {entries.length === ACTIVITY_PAGE && last && (
          <Link href={`${base}?avant=${last.id}`} className={BUTTON_SECONDARY}>{j.more}</Link>
        )}
      </nav>
    </main>
  );
}
