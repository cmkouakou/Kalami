/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/etapes/[n])
 *  Projet     : Kalami Stratégie
 *  Description: Page d'une étape : statut, guide de l'auteur (explication, chapitre,
 *               exemple), ce qui manque si elle est verrouillée, raisons « à revoir », puis
 *               le gabarit interactif (étapes 1 à 8 : PESTEL, cinq forces, analyse interne,
 *               parties prenantes, synthèse SWOT-TOWS nourrie des étapes 1 à 3, cap et
 *               choix liés aux enjeux de l'étape 5, action liée aux options retenues et aux
 *               objectifs) avec le panneau du coach IA ou, pour l'étape 9, l'éditeur du plan
 *               stratégique (sections, coach de rédaction, annexe de traçabilité). Sous le
 *               gabarit : la discussion de l'équipe (S9b), pastilles sur chaque élément.
 *  Auteur     : Claude Marcel
 *  Version    : 1.8
 *  Date       : 2026-10-15
 *  Dépendances: components/strategy, lib/strategy/queries.ts, lib/strategy/steps.ts,
 *               lib/strategy/plan-inputs.ts, lib/strategy/plan-trace.ts,
 *               lib/strategy/comments-queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { ActionEditor } from "@/components/strategy/action/action-editor";
import { CommentsPanel } from "@/components/strategy/comments/comments-panel";
import { CommentsProvider } from "@/components/strategy/comments/comments-context";
import { ChoiceEditor } from "@/components/strategy/choice/choice-editor";
import { DirectionEditor } from "@/components/strategy/direction/direction-editor";
import { ForcesEditor } from "@/components/strategy/forces/forces-editor";
import { InternalEditor } from "@/components/strategy/internal/internal-editor";
import { PestelEditor } from "@/components/strategy/pestel/pestel-editor";
import { PlanEditor } from "@/components/strategy/plan/plan-editor";
import { StakeholdersEditor } from "@/components/strategy/stakeholders/stakeholders-editor";
import { SynthesisEditor } from "@/components/strategy/synthesis/synthesis-editor";
import { StepGuide } from "@/components/strategy/step-guide";
import { StepStatusBadge } from "@/components/strategy/step-status";
import type { LinkOption } from "@/components/strategy/synthesis/link-picker";
import type { TemplateFrameProps } from "@/components/strategy/template-frame";
import { IconLock } from "@/components/ui/icons";
import { CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { getCoachState, getPlanCoachState } from "@/lib/strategy/coach/queries";
import { commentTargets, countByTarget } from "@/lib/strategy/comments";
import { getStepComments } from "@/lib/strategy/comments-queries";
import { getPlanInputs } from "@/lib/strategy/plan-inputs";
import { sourceCatalog } from "@/lib/strategy/plan-trace";
import {
  getSourcePayloads,
  getStepContent,
  getStepGuide,
  getStudy,
  statusesOf,
  type StepContent,
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
import { readAction } from "@/lib/strategy/templates/action";
import { readChoice } from "@/lib/strategy/templates/choice";
import { readDirection } from "@/lib/strategy/templates/direction";
import { readForces } from "@/lib/strategy/templates/forces";
import { hasTemplate } from "@/lib/strategy/templates";
import { readInternal } from "@/lib/strategy/templates/internal";
import { readPestel } from "@/lib/strategy/templates/pestel";
import { readPlan } from "@/lib/strategy/templates/plan";
import { readStakeholders } from "@/lib/strategy/templates/stakeholders";
import { readSynthesis } from "@/lib/strategy/templates/synthesis";
import { memberLabel } from "@/lib/strategy/team";
import { getStudyMembers } from "@/lib/strategy/team-queries";

const t = getDictionary();
const s = t.strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const metadata: Metadata = { title: s.map.kicker };

/** Durée maximale des actions serveur de la page (secondes) : une relecture du coach
 *  peut prendre plusieurs minutes. */
export const maxDuration = 300;

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

          {/* ==================== CONTENU ET DISCUSSION ==================== */}
          <StepDiscussion study={study} no={no} userId={user.id}>
            {hasTemplate(no) ? (
              <Template
                study={study}
                no={no}
                affectedTitles={affected.map((down) => s.steps[down].title)}
              />
            ) : (
              <Plan study={study} />
            )}
          </StepDiscussion>
        </>
      )}
    </main>
  );
}

/**
 * Discussion de l'étape (S9b) : fournit aux gabarits les pastilles de commentaire et
 * ajoute la section des fils. Si la discussion ne peut pas être chargée (migration absente,
 * accès retiré), le gabarit s'affiche seul.
 */
async function StepDiscussion({
  study,
  no,
  userId,
  children,
}: {
  study: StudyDetail;
  no: StepNo;
  userId: string;
  children: ReactNode;
}) {
  let loaded;
  try {
    const [comments, members, content] = await Promise.all([
      getStepComments(study.id, no),
      getStudyMembers(study.id),
      getStepContent(study.id, no),
    ]);
    loaded = { comments, members, content };
  } catch {
    return children;
  }

  const { comments, members, content } = loaded;
  const people = members.map((m) => ({ id: m.user_id, label: memberLabel(m) }));
  const labels = Object.fromEntries(
    commentTargets(no, content.payload).map((target) => [target.id, target.label]),
  );

  return (
    <CommentsProvider counts={countByTarget(comments)} labels={labels}>
      {children}
      <CommentsPanel
        comments={comments}
        context={{
          studyId: study.id,
          stepNo: no,
          userId,
          isOwner: study.role === "owner",
          members: people,
          mentionable: people.filter((person) => person.id !== userId),
        }}
      />
    </CommentsProvider>
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
  const [content, coach] = await Promise.all([
    getStepContent(study.id, no),
    getCoachState(study.id, no),
  ]);
  const frame: TemplateFrameProps = {
    studyId: study.id,
    stepNo: no,
    role: study.role,
    status: study.steps[no].status,
    affectedTitles,
    versions: content.versions,
    coach,
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
        initial={readInternal(content.payload)}
        revision={content.revision}
      />
    );
  }
  if (no === 4) {
    return (
      <StakeholdersEditor
        key={content.revision}
        {...frame}
        initial={readStakeholders(content.payload)}
        revision={content.revision}
      />
    );
  }
  if (no === 5) return <Synthesis study={study} frame={frame} content={content} />;
  if (no === 6 || no === 7) return <Strategy study={study} frame={frame} content={content} />;
  if (no === 8) return <Action frame={frame} content={content} />;
  return null;
}

/**
 * Gabarit d'action (étape 8) : charge aussi les objectifs de l'étape 6 et les options
 * retenues à l'étape 7, auxquels les chantiers et les indicateurs se rattachent.
 */
async function Action({ frame, content }: { frame: TemplateFrameProps; content: StepContent }) {
  const sources = await getSourcePayloads(frame.studyId, [6, 7]);
  const objectives: LinkOption[] = readDirection(sources[6]).objectives
    .filter((objective) => objective.text.trim())
    .map((objective) => ({ id: objective.id, text: objective.text }));
  const options: LinkOption[] = readChoice(sources[7]).options
    .filter((option) => option.decision === "retained" && option.text.trim())
    .map((option) => ({ id: option.id, text: option.text }));
  return (
    <ActionEditor
      key={content.revision}
      {...frame}
      initial={readAction(content.payload)}
      revision={content.revision}
      options={options}
      objectives={objectives}
    />
  );
}

/**
 * Gabarits de cap et de choix (étapes 6 et 7) : charge aussi les enjeux de l'étape 5,
 * auxquels les objectifs et les options se rattachent.
 */
async function Strategy({
  study,
  frame,
  content,
}: {
  study: StudyDetail;
  frame: TemplateFrameProps;
  content: StepContent;
}) {
  const sources = await getSourcePayloads(study.id, [5]);
  const issues: LinkOption[] = readSynthesis(sources[5]).issues.map((issue, index) => ({
    id: issue.id,
    text: issue.title.trim() || `${s.synthesis.issueTitle} ${index + 1}`,
  }));
  if (frame.stepNo === 6) {
    return (
      <DirectionEditor
        key={content.revision}
        {...frame}
        initial={readDirection(content.payload)}
        revision={content.revision}
        companyName={study.company_name}
        competitors={study.profile.competitors}
        issues={issues}
      />
    );
  }
  return (
    <ChoiceEditor
      key={content.revision}
      {...frame}
      initial={readChoice(content.payload)}
      revision={content.revision}
      issues={issues}
    />
  );
}

/**
 * Gabarit de synthèse (étape 5) : charge aussi les étapes 1 à 3, sources de la reprise vers
 * la SWOT.
 */
async function Synthesis({
  study,
  frame,
  content,
}: {
  study: StudyDetail;
  frame: TemplateFrameProps;
  content: StepContent;
}) {
  const sources = await getSourcePayloads(study.id, [1, 2, 3]);
  return (
    <SynthesisEditor
      key={content.revision}
      {...frame}
      initial={readSynthesis(content.payload)}
      revision={content.revision}
      sources={{
        pestel: readPestel(sources[1]),
        forces: readForces(sources[2], study.company_name, study.profile.competitors),
        internal: readInternal(sources[3]),
      }}
    />
  );
}

/**
 * Plan stratégique (étape 9) : charge le plan enregistré, la matière des étapes (catalogue
 * des éléments citables de l'annexe) et l'état du coach du plan.
 */
async function Plan({ study }: { study: StudyDetail }) {
  const [content, inputs, coach] = await Promise.all([
    getStepContent(study.id, PLAN_STEP),
    getPlanInputs(study.id),
    getPlanCoachState(study.id),
  ]);
  if (!inputs) notFound();
  return (
    <PlanEditor
      key={content.revision}
      studyId={study.id}
      role={study.role}
      initial={readPlan(content.payload)}
      revision={content.revision}
      versions={content.versions}
      catalog={sourceCatalog(inputs)}
      coach={coach}
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
