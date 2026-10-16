/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/classes/[id])
 *  Projet     : Kalami Stratégie
 *  Description: Page d'une classe pour son enseignant (S10a), en quatre onglets choisis par
 *               ?onglet= : Suivi (avancement des études), Étudiants (inscrits, lien de
 *               classe, invitations), Distribuer (création des études) et Réglages
 *               (description, coach, archivage). Classe inconnue ou d'un autre : 404.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-queries.ts, lib/strategy/queries.ts,
 *               components/strategy/classes
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ClassArchive } from "@/components/strategy/classes/class-archive";
import { ClassCoachForm } from "@/components/strategy/classes/class-coach-form";
import { ClassInfoForm } from "@/components/strategy/classes/class-info-form";
import { ClassLink } from "@/components/strategy/classes/class-link";
import { ClassPending } from "@/components/strategy/classes/class-pending";
import { DistributeForm } from "@/components/strategy/classes/distribute-form";
import { InviteStudentsForm } from "@/components/strategy/classes/invite-students-form";
import { StudentList } from "@/components/strategy/classes/student-list";
import { TrackingList } from "@/components/strategy/classes/tracking-list";
import { BADGE, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import {
  getClass,
  getClassInvitations,
  getClassStudents,
  getClassTracking,
} from "@/lib/strategy/class-queries";
import { type ClassRow, todayIso } from "@/lib/strategy/classes";
import { countAvailableCredits } from "@/lib/strategy/queries";

const s = getDictionary().strategy;
const cl = s.classes;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" });

/** Onglets : valeur d'URL → libellé. */
const TABS = {
  suivi: cl.tabs.tracking,
  etudiants: cl.tabs.students,
  distribuer: cl.tabs.distribute,
  reglages: cl.tabs.settings,
} as const;
type Tab = keyof typeof TABS;

export const metadata: Metadata = { title: cl.title };

export default function ClassPage({ params, searchParams }: PageProps<"/strategie/classes/[id]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <ClassView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Onglet demandé, « suivi » par défaut. */
function tabOf(value: string | string[] | undefined): Tab {
  return typeof value === "string" && value in TABS ? (value as Tab) : "suivi";
}

/** Charge la classe et affiche l'onglet demandé. */
async function ClassView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/strategie/classes/${id}`);
  const current = await getClass(id);
  if (!current) notFound();
  const tab = tabOf(query.onglet);
  const archived = current.status === "archived";

  return (
    <main className="flex flex-col gap-6">
      <Link href="/strategie/classes" className="w-fit text-sm text-encre hover:underline">
        ← {cl.back}
      </Link>

      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">
          {[current.institution, current.term].filter(Boolean).join(" · ") || cl.kicker}
        </p>
        <h1 className="flex flex-wrap items-center gap-3 font-serif text-h1 font-semibold">
          {current.name}
          {archived && <span className={`${BADGE} font-sans`}>{cl.archivedBadge}</span>}
        </h1>
        {current.due_date && (
          <p className="text-small text-ink-muted">
            {interpolate(cl.due, { date: DATE_FORMAT.format(new Date(current.due_date)) })}
          </p>
        )}
      </header>

      {/* ==================== ONGLETS ==================== */}
      <nav aria-label={cl.title} className="flex flex-wrap gap-1 border-b border-line">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Link
            key={key}
            href={`/strategie/classes/${current.id}?onglet=${key}`}
            aria-current={key === tab ? "page" : undefined}
            className={`-mb-px min-h-11 border-b-2 px-3 py-2 text-small ${
              key === tab
                ? "border-encre font-semibold text-encre"
                : "border-transparent text-ink-muted hover:text-encre"
            }`}
          >
            {TABS[key]}
          </Link>
        ))}
      </nav>

      {tab === "suivi" && <TrackingTab current={current} />}
      {tab === "etudiants" && <StudentsTab current={current} />}
      {tab === "distribuer" && <DistributeTab current={current} userId={user.id} />}
      {tab === "reglages" && <SettingsTab current={current} />}
    </main>
  );
}

/** Onglet Suivi. */
async function TrackingTab({ current }: { current: ClassRow }) {
  const rows = await getClassTracking(current.id);
  return (
    <section aria-labelledby="suivi" className="flex flex-col gap-3">
      <h2 id="suivi" className="font-serif text-h2 font-semibold">{cl.tracking.title}</h2>
      <TrackingList rows={rows} dueDate={current.due_date} today={todayIso()} />
    </section>
  );
}

/** Onglet Étudiants : inscrits, lien de classe, invitations. */
async function StudentsTab({ current }: { current: ClassRow }) {
  const archived = current.status === "archived";
  const [students, invitations] = await Promise.all([
    getClassStudents(current.id),
    getClassInvitations(current.id),
  ]);
  return (
    <>
      <section aria-labelledby="inscrits" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="inscrits" className="font-serif text-h3 font-semibold">{cl.students.title}</h2>
        <StudentList classId={current.id} students={students} />
      </section>
      <section aria-labelledby="lien" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="lien" className="font-serif text-h3 font-semibold">{cl.link.title}</h2>
        <ClassLink
          classId={current.id}
          active={current.join_token_hash !== null}
          archived={archived}
        />
      </section>
      {!archived && (
        <section aria-labelledby="inviter" className={`${CARD} flex flex-col gap-3 p-4`}>
          <h2 id="inviter" className="font-serif text-h3 font-semibold">{cl.invite.title}</h2>
          <InviteStudentsForm classId={current.id} />
        </section>
      )}
      <section aria-labelledby="en-attente" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="en-attente" className="font-serif text-h3 font-semibold">{cl.pending.title}</h2>
        <ClassPending classId={current.id} invitations={invitations} />
      </section>
    </>
  );
}

/** Onglet Distribuer. */
async function DistributeTab({ current, userId }: { current: ClassRow; userId: string }) {
  const [students, credits] = await Promise.all([
    getClassStudents(current.id),
    countAvailableCredits(userId),
  ]);
  return (
    <section aria-labelledby="distribuer" className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 id="distribuer" className="font-serif text-h3 font-semibold">{cl.distribute.title}</h2>
      {current.status === "archived" ? (
        <p className="text-small text-ink-muted">{cl.distribute.archived}</p>
      ) : (
        <>
          <p className="text-small text-ink-muted">{cl.distribute.intro}</p>
          <DistributeForm classId={current.id} students={students} credits={credits} />
        </>
      )}
    </section>
  );
}

/** Onglet Réglages : description, coach, archivage. */
function SettingsTab({ current }: { current: ClassRow }) {
  return (
    <>
      <section aria-labelledby="description" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="description" className="font-serif text-h3 font-semibold">
          {cl.settings.infoTitle}
        </h2>
        <ClassInfoForm current={current} />
      </section>
      <section aria-labelledby="coach" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="coach" className="font-serif text-h3 font-semibold">{cl.settings.coachTitle}</h2>
        <ClassCoachForm current={current} />
      </section>
      <section aria-labelledby="archivage" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="archivage" className="font-serif text-h3 font-semibold">
          {cl.settings.statusTitle}
        </h2>
        <ClassArchive classId={current.id} archived={current.status === "archived"} />
      </section>
    </>
  );
}
