/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/etapes/[n])
 *  Projet     : Kalami Stratégie
 *  Description: Page d'une étape : statut, guide de l'auteur (explication, chapitre,
 *               exemple), ce qui manque si elle est verrouillée, raisons « à revoir », puis
 *               le gabarit interactif (étapes 1 à 4 : PESTEL, cinq forces, analyse interne,
 *               parties prenantes) ou, pour les autres étapes, les actions (commencer,
 *               valider, modifier) en attendant leur gabarit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-11
 *  Dépendances: components/strategy, lib/strategy/queries.ts, lib/strategy/steps.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ForcesEditor } from "@/components/strategy/forces/forces-editor";
import { InternalEditor } from "@/components/strategy/internal/internal-editor";
import { PestelEditor } from "@/components/strategy/pestel/pestel-editor";
import { StakeholdersEditor } from "@/components/strategy/stakeholders/stakeholders-editor";
import { StepActions } from "@/components/strategy/step-actions";
import { StepGuide } from "@/components/strategy/step-guide";
import { StepStatusBadge } from "@/components/strategy/step-status";
import type { TemplateFrameProps } from "@/components/strategy/template-frame";
import { IconLock } from "@/components/ui/icons";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import {
  getStepContent,
  getStepGuide,
  getStudy,
  statusesOf,
  type StudyDetail,
} from "@/lib/strategy/queries";
import {
  downstreamSteps,
  getStep,
  isStepNo,
  missingPrerequisites,
  PLAN_STEP,
  PROFILE_PREREQUISITE,
  type StepNo,
} from "@/lib/strategy/steps";
import { readForces } from "@/lib/strategy/templates/forces";
import { hasTemplate } from "@/lib/strategy/templates";
import { readInternal } from "@/lib/strategy/templates/internal";
import { readPestel } from "@/lib/strategy/templates/pestel";
import { readStakeholders } from "@/lib/strategy/templates/stakeholders";

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
  const [study, guide] = await Promise.all([getStudy(id, user.id), getStepGuide(no)]);
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

      <StepGuide guide={guide} />

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

          {current.status === "validated" && current.validated_at && (
            <p className="text-small text-success">
              {interpolate(s.step.validated, {
                date: DATE_FORMAT.format(new Date(current.validated_at)),
              })}
            </p>
          )}

          {/* ==================== CONTENU ==================== */}
          {hasTemplate(no) ? (
            <Template
              study={study}
              no={no}
              affectedTitles={affected.map((down) => s.steps[down].title)}
            />
          ) : (
            <>
              <p className={`${PANEL_SAND} p-4 text-small`}>
                {no === PLAN_STEP ? s.step.planSoon : s.step.templateSoon}
              </p>
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
        </>
      )}
    </main>
  );
}

/**
 * Gabarit interactif de l'étape. La clé `revision` remonte l'éditeur quand le contenu
 * change côté serveur (restauration, validation, réouverture), sans le remonter pendant
 * la saisie : la sauvegarde automatique ne recharge pas la page.
 */
async function Template({
  study,
  no,
  affectedTitles,
}: {
  study: StudyDetail;
  no: StepNo;
  affectedTitles: string[];
}) {
  const content = await getStepContent(study.id, no);
  const frame: TemplateFrameProps = {
    studyId: study.id,
    stepNo: no,
    role: study.role,
    status: study.steps[no].status,
    affectedTitles,
    versions: content.versions,
  };

  if (no === 1) {
    return (
      <PestelEditor
        key={content.revision}
        {...frame}
        initial={readPestel(content.payload)}
        revision={content.revision}
      />
    );
  }
  if (no === 2) {
    return (
      <ForcesEditor
        key={content.revision}
        {...frame}
        initial={readForces(content.payload, study.company_name, study.profile.competitors)}
        revision={content.revision}
      />
    );
  }
  if (no === 3) {
    return (
      <InternalEditor
        key={content.revision}
        {...frame}
        initial={readInternal(content.payload, s.internal.porter)}
        revision={content.revision}
      />
    );
  }
  return (
    <StakeholdersEditor
      key={content.revision}
      {...frame}
      initial={readStakeholders(content.payload)}
      revision={content.revision}
    />
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
