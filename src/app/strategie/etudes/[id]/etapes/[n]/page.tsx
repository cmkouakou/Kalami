/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/etapes/[n])
 *  Projet     : Kalami Stratégie
 *  Description: Page d'une étape : statut, ce qui manque si elle est verrouillée, raisons
 *               « à revoir », puis les actions (commencer, valider, modifier). Le gabarit
 *               interactif de chaque étape arrive aux sprints suivants.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: components/strategy, lib/strategy/queries.ts, lib/strategy/steps.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StepActions } from "@/components/strategy/step-actions";
import { StepStatusBadge } from "@/components/strategy/step-status";
import { IconLock } from "@/components/ui/icons";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { getStudy, statusesOf } from "@/lib/strategy/queries";
import {
  downstreamSteps,
  getStep,
  isStepNo,
  missingPrerequisites,
  PLAN_STEP,
  PROFILE_PREREQUISITE,
  type StepNo,
} from "@/lib/strategy/steps";

const t = getDictionary();
const s = t.strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const metadata: Metadata = { title: s.map.kicker };

export default function StudyStepPage({ params }: PageProps<"/strategie/etudes/[id]/etapes/[n]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StudyStep params={params} />
    </Suspense>
  );
}

/** Charge l'étude et l'étape ; 404 si l'une ou l'autre n'existe pas pour ce membre. */
async function StudyStep({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const user = await requireUser(`/strategie/etudes/${id}/etapes/${n}`);
  const no = Number(n);
  if (!isStepNo(no)) notFound();
  const study = await getStudy(id, user.id);
  if (!study) notFound();

  const step = getStep(no);
  const text = s.steps[no];
  const current = study.steps[no];
  const statuses = statusesOf(study);
  const missing = missingPrerequisites(no, statuses, study.profileComplete);
  const affected = downstreamSteps(no).filter((down) => statuses[down] !== "todo");

  return (
    <main className="flex flex-col gap-6">
      <Link href={`/strategie/etudes/${study.id}`} className="w-fit text-sm text-encre
        hover:underline"
      >
        ← {s.step.back}
      </Link>

      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">
          {s.phases[step.phase]} · {interpolate(s.step.module, { module: String(step.module) })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-h1 font-semibold">{text.title}</h1>
          <StepStatusBadge status={current.status} locked={missing.length > 0} />
        </div>
        <p className="text-ink-muted">{text.tools}</p>
      </header>

      {missing.length > 0 ? (
        <LockedPanel
          studyId={study.id}
          missing={missing}
          reason={study.lockReasons[no]}
        />
      ) : (
        <>
          {/* ==================== À REVOIR ==================== */}
          {current.status === "needs_review" && current.review_reasons.length > 0 && (
            <section role="status" className="flex flex-col gap-2 rounded-lg bg-warning/15 p-4">
              <h2 className="font-semibold">{s.step.reviewTitle}</h2>
              <ul className="flex flex-col gap-1 text-small">
                {current.review_reasons.map((reason) => (
                  <li key={`${reason.step}-${reason.at}`}>
                    {interpolate(s.step.reviewBecause, {
                      no: String(reason.step),
                      title: s.steps[reason.step].title,
                      date: DATE_FORMAT.format(new Date(reason.at)),
                    })}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ==================== CONTENU ==================== */}
          <p className={`${PANEL_SAND} p-4 text-small`}>
            {no === PLAN_STEP ? s.step.planSoon : s.step.templateSoon}
          </p>
          {current.status === "validated" && current.validated_at && (
            <p className="text-small text-success">
              {interpolate(s.step.validated, {
                date: DATE_FORMAT.format(new Date(current.validated_at)),
              })}
            </p>
          )}

          {/* ==================== ACTIONS ==================== */}
          <StepActions
            studyId={study.id}
            stepNo={no}
            status={current.status}
            role={study.role}
            isPlan={no === PLAN_STEP}
            affectedTitles={affected.map((down) => s.steps[down].title)}
          />
        </>
      )}
    </main>
  );
}

/** Explique pourquoi l'étape est verrouillée et ce qui manque pour l'ouvrir. */
function LockedPanel({
  studyId,
  missing,
  reason,
}: {
  studyId: string;
  missing: number[];
  reason: string | undefined;
}) {
  return (
    <section className={`${CARD} flex flex-col gap-3 border-dashed p-4 sm:p-6`}>
      <h2 className="flex items-center gap-2 font-semibold">
        <IconLock size={18} />
        {s.step.missingTitle}
      </h2>
      {reason && <p className="text-small text-ink-muted">{reason}</p>}
      <ul className="flex flex-col gap-1 text-small">
        {missing.map((pre) =>
          pre === PROFILE_PREREQUISITE ? (
            <li key={pre}>
              <Link href={`/strategie/etudes/${studyId}/profil`} className="text-encre underline">
                {s.step.missingProfile}
              </Link>
            </li>
          ) : (
            <li key={pre}>
              <Link href={`/strategie/etudes/${studyId}/etapes/${pre}`} className="text-encre
                underline"
              >
                {interpolate(s.step.missingStep, {
                  no: String(pre),
                  title: s.steps[pre as StepNo].title,
                })}
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
