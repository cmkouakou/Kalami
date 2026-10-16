/**
 * =============================================================
 *  Fichier    : tracking-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Suivi d'une classe (S10a, enseignant) : pour chaque étude distribuée, les
 *               étudiants, l'avancement (une pastille par étape), la dernière activité et
 *               le signal « en retard » après la date de remise indicative. L'enseignant
 *               ouvre l'étude comme observateur. Composant serveur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/classes.ts
 * =============================================================
 */

import Link from "next/link";

import { BADGE, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { isLate, progressOf, type TrackingRow } from "@/lib/strategy/classes";
import type { StepNo, StepStatus } from "@/lib/strategy/steps";

const s = getDictionary().strategy;
const tr = s.classes.tracking;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

/** Couleur de la pastille d'une étape selon son statut. */
const DOT: Record<StepStatus, string> = {
  todo: "bg-line",
  in_progress: "bg-encre/50",
  submitted: "bg-encre",
  validated: "bg-success",
  needs_review: "bg-warning",
};

type TrackingListProps = {
  rows: TrackingRow[];
  dueDate: string | null;
  /** Date du jour AAAA-MM-JJ (Montréal). */
  today: string;
};

/** Liste de suivi des études de la classe. */
export function TrackingList({ rows, dueDate, today }: TrackingListProps) {
  if (rows.length === 0) return <p className="text-small text-ink-muted">{tr.none}</p>;

  const done = rows.filter((row) => progressOf(row.steps).percent === 100).length;
  const late = rows.filter((row) => isLate(row.steps, dueDate, today)).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-ink-muted">
        {interpolate(tr.summary, {
          studies: String(rows.length),
          done: String(done),
          late: String(late),
        })}
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const progress = progressOf(row.steps);
          const names = row.members.map((member) => member.name ?? s.team.members.noName);
          return (
            <li key={row.study_id} className={`${CARD} flex flex-col gap-3 p-4`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <span className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/strategie/etudes/${row.study_id}`}
                    aria-label={interpolate(tr.openStudy, { company: row.company_name })}
                    className="font-medium text-encre hover:underline"
                  >
                    {row.company_name}
                  </Link>
                  <span className="text-small text-ink-muted">
                    <span className="sr-only">{tr.members} : </span>
                    {names.join(", ")}
                  </span>
                </span>
                {progress.percent === 100 ? (
                  <span className={`${BADGE} w-fit`}>{tr.done}</span>
                ) : isLate(row.steps, dueDate, today) ? (
                  <span className={`${BADGE} w-fit bg-warning/15 text-ink`}>{tr.late}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-small">
                <span className="sr-only">{tr.steps}</span>
                <ol className="flex gap-1" aria-label={tr.steps}>
                  {row.steps.map((status, index) => {
                    const no = (index + 1) as StepNo;
                    return (
                      <li
                        key={no}
                        title={interpolate(tr.stepTitle, {
                          no: String(no),
                          title: s.steps[no].title,
                          status: s.status[status],
                        })}
                        className={`size-3 rounded-full ${DOT[status]}`}
                      >
                        <span className="sr-only">
                          {interpolate(tr.stepTitle, {
                            no: String(no),
                            title: s.steps[no].title,
                            status: s.status[status],
                          })}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <span>
                  {tr.progress} : {interpolate(tr.validated, { count: String(progress.validated) })}
                </span>
                <span className="text-ink-muted">
                  {tr.lastActivity} : {DATE_FORMAT.format(new Date(row.last_activity))}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
