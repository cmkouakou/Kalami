/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/classes)
 *  Projet     : Kalami Stratégie
 *  Description: Mode enseignant (S10a) : crédits d'étude, création d'une classe et liste des
 *               classes en cours puis archivées. Réservée aux comptes enseignants ; les
 *               autres voient comment demander l'activation.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-queries.ts, lib/strategy/queries.ts,
 *               components/strategy/classes
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ClassInfoForm } from "@/components/strategy/classes/class-info-form";
import { BADGE, CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { STRATEGY_HOME } from "@/lib/auth/routes";
import { type ClassSummary, isTeacher, listMyClasses } from "@/lib/strategy/class-queries";
import { countAvailableCredits } from "@/lib/strategy/queries";
import { DATE_FORMAT } from "@/lib/format/date";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const cl = s.classes;

export const metadata: Metadata = { title: cl.title };

export default function ClassesPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <Classes />
    </Suspense>
  );
}

/** Charge le statut enseignant, les crédits et les classes. */
async function Classes() {
  const user = await requireUser("/strategie/classes");
  const teacher = await isTeacher();

  return (
    <main className="flex flex-col gap-6">
      <Link href={STRATEGY_HOME} className="w-fit text-sm text-encre hover:underline">
        ← {s.classes.join.home}
      </Link>
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{cl.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{cl.title}</h1>
        <p className="max-w-2xl text-ink-muted">{cl.intro}</p>
      </header>
      {teacher ? <TeacherSpace userId={user.id} /> : (
        <p className={`${CARD} max-w-2xl p-5`}>{cl.notTeacher}</p>
      )}
    </main>
  );
}

/** Espace de l'enseignant : crédits, création, classes. */
async function TeacherSpace({ userId }: { userId: string }) {
  const [credits, classes] = await Promise.all([
    countAvailableCredits(userId),
    listMyClasses(userId),
  ]);
  const active = classes.filter((row) => row.status === "active");
  const archived = classes.filter((row) => row.status === "archived");

  return (
    <>
      <p className="text-small text-ink-muted">
        {interpolate(cl.credits, { count: String(credits) })}
      </p>

      {/* ==================== CLASSES ==================== */}
      <section aria-labelledby="en-cours" className="flex flex-col gap-3">
        <h2 id="en-cours" className="font-serif text-h2 font-semibold">{cl.active}</h2>
        {active.length === 0 ? <p className="text-ink-muted">{cl.none}</p> : (
          <ClassCards classes={active} />
        )}
      </section>

      {/* ==================== CRÉATION ==================== */}
      <section aria-labelledby="nouvelle" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="nouvelle" className="font-serif text-h3 font-semibold">{cl.create.title}</h2>
        <ClassInfoForm />
      </section>

      {archived.length > 0 && (
        <section aria-labelledby="archivees" className="flex flex-col gap-3">
          <h2 id="archivees" className="font-serif text-h2 font-semibold">{cl.archived}</h2>
          <ClassCards classes={archived} />
        </section>
      )}
    </>
  );
}

/** Cartes cliquables des classes. */
function ClassCards({ classes }: { classes: ClassSummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {classes.map((row) => (
        <li key={row.id}>
          <Link
            href={`/strategie/classes/${row.id}`}
            className={`${CARD} flex flex-col gap-2 p-4 hover:border-encre sm:flex-row
              sm:items-center sm:justify-between`}
          >
            <span className="flex flex-col gap-1">
              <span className="font-medium">{row.name}</span>
              <span className="text-small text-ink-muted">
                {[row.institution, row.term].filter(Boolean).join(" · ")}
              </span>
              <span className="text-small text-ink-muted">
                {interpolate(cl.counts, {
                  students: String(row.students),
                  studies: String(row.studies),
                })}
                {row.due_date && ` · ${interpolate(cl.due, {
                  date: DATE_FORMAT.format(new Date(row.due_date)),
                })}`}
              </span>
            </span>
            {row.status === "archived" && <span className={BADGE}>{cl.archivedBadge}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
