/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id])
 *  Projet     : Kalami Stratégie
 *  Description: Carte de l'étude (maquette 06) : entreprise, question de départ,
 *               progression, profil, puis les 9 étapes regroupées en quatre phases ; les
 *               étapes verrouillées indiquent ce qui manque pour les ouvrir.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/strategy/queries.ts, components/strategy
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StepCard } from "@/components/strategy/step-card";
import { IconCheck, IconPencil } from "@/components/ui/icons";
import { BADGE, BUTTON_PRIMARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { missingProfileFields } from "@/lib/strategy/profile";
import { getStudy, statusesOf } from "@/lib/strategy/queries";
import { missingPrerequisites, PHASES, STEPS, validatedCount } from "@/lib/strategy/steps";

const t = getDictionary();
const s = t.strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const metadata: Metadata = { title: s.map.kicker };

export default function StudyMapPage({ params }: PageProps<"/strategie/etudes/[id]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StudyMap params={params} />
    </Suspense>
  );
}

/** Charge l'étude du membre connecté ; 404 si elle n'existe pas ou s'il n'en est pas membre. */
async function StudyMap({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/strategie/etudes/${id}`);
  const study = await getStudy(id, user.id);
  if (!study) notFound();

  const statuses = statusesOf(study);
  const count = validatedCount(statuses);
  const missingFields = missingProfileFields(study.strategic_question, study.profile);
  const fieldLabels = s.profile.fields as Record<string, string>;
  const question = study.strategic_question.trim();

  return (
    <main className="flex flex-col gap-8">
      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{s.map.kicker}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-h1 font-semibold">{study.company_name}</h1>
          <span className={BADGE}>{s.studies.roles[study.role]}</span>
        </div>
        <p className="text-ink-muted">
          {question ? interpolate(s.map.questionLabel, { question }) : s.map.noQuestion}
        </p>
        <p className="text-small text-ink-muted">
          {interpolate(s.map.members, {
            count: String(study.member_count),
            date: DATE_FORMAT.format(new Date(study.updated_at)),
          })}
        </p>
      </header>

      {/* ==================== PROGRESSION ==================== */}
      <div className="flex flex-col gap-2">
        <p className="text-label">{interpolate(s.map.progress, { count: String(count) })}</p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={9}
          aria-valuenow={count}
          aria-label={s.map.kicker}
          className="h-2 w-full overflow-hidden rounded-full bg-sand"
        >
          <div className="h-full bg-encre" style={{ width: `${(count / 9) * 100}%` }} />
        </div>
      </div>

      {/* ==================== PROFIL ==================== */}
      <Link
        href={`/strategie/etudes/${study.id}/profil`}
        className={`${CARD} flex flex-col gap-2 p-4 hover:border-encre sm:flex-row
          sm:items-center sm:justify-between`}
      >
        <span className="flex flex-col gap-1">
          <span className="font-semibold">{s.map.profileCard}</span>
          {missingFields.length > 0 && (
            <span className="text-small text-ink-muted">
              {interpolate(s.profile.incomplete, {
                fields: missingFields.map((name) => fieldLabels[name]).join(", "),
              })}
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5 text-small font-semibold">
          {study.profileComplete ? <IconCheck size={16} /> : <IconPencil size={16} />}
          {study.profileComplete ? s.map.profileComplete : s.map.profileIncomplete}
        </span>
      </Link>

      {/* ==================== PHASES ET ÉTAPES ==================== */}
      {PHASES.map((phase) => {
        const steps = STEPS.filter((step) => step.phase === phase);
        return (
          <section key={phase} className="flex flex-col gap-3" aria-labelledby={`phase-${phase}`}>
            <h2 id={`phase-${phase}`} className="font-serif text-h2 font-semibold">
              {s.phases[phase]}
            </h2>
            <p className="text-small text-ink-muted">
              {phase === "understand" ? s.map.parallel : s.phaseIntro[phase]}
            </p>
            <ul className={`grid gap-3 ${steps.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {steps.map((step) => (
                <li key={step.no}>
                  <StepCard
                    studyId={study.id}
                    step={step}
                    status={statuses[step.no]}
                    missing={missingPrerequisites(step.no, statuses, study.profileComplete)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* ==================== PLAN STRATÉGIQUE ==================== */}
      <div className="flex flex-col items-start gap-2">
        <button type="button" className={BUTTON_PRIMARY} disabled>
          {s.map.generate}
        </button>
        <p className="text-small text-ink-muted">{s.map.generateLater}</p>
      </div>
    </main>
  );
}
