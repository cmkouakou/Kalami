/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id])
 *  Projet     : Kalami Stratégie
 *  Description: Carte de l'étude (maquette 06) : entreprise, question de départ,
 *               progression, profil, puis les 9 étapes regroupées en quatre phases ; les
 *               étapes verrouillées indiquent ce qui manque pour les ouvrir. Liens Équipe et
 *               Journal, responsable de chaque étape et accès au plan stratégique (S9a).
 *               Présence (S9c) : membres connectés et avatars sur les cartes d'étape.
 *               Étude de classe (S10a) : nom de la classe et date de remise indicative.
 *               Lien vers la page du coach : forfait et consommation (v0.11.1).
 *               Étude d'un cas d'entraînement : lien vers le dossier et le corrigé (v0.14.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/queries.ts, lib/strategy/team-queries.ts,
 *               lib/strategy/class-queries.ts, components/strategy
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PresenceBar, StepPeers } from "@/components/strategy/presence/presence-bar";
import { PresenceProvider } from "@/components/strategy/presence/presence-context";
import { StepCard } from "@/components/strategy/step-card";
import { IconCheck, IconPencil } from "@/components/ui/icons";
import { BADGE, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { getStudyClass } from "@/lib/strategy/class-queries";
import { isLate, todayIso } from "@/lib/strategy/classes";
import { missingProfileFields } from "@/lib/strategy/profile";
import { getStudy, statusesOf } from "@/lib/strategy/queries";
import {
  missingPrerequisites,
  PHASES,
  PLAN_STEP,
  STEPS,
  validatedCount,
} from "@/lib/strategy/steps";
import { memberLabel } from "@/lib/strategy/team";
import { getStudyMembers } from "@/lib/strategy/team-queries";

const t = getDictionary();
const s = t.strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
/** Dates AAAA-MM-JJ (sans heure) : lues en UTC pour ne pas reculer d'un jour. */
const DUE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" });

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
  const [members, studyClass] = await Promise.all([
    getStudyMembers(study.id),
    getStudyClass(study.id),
  ]);
  const names = new Map(members.map((member) => [member.user_id, memberLabel(member)]));
  const selfName = names.get(user.id) ?? "";
  const planOpen = missingPrerequisites(PLAN_STEP, statuses, study.profileComplete).length === 0;

  return (
    <PresenceProvider
      studyId={study.id}
      self={{ id: user.id, name: selfName }}
      stepNo={null}
      canEdit={study.role === "owner" || study.role === "contributor"}
    >
      <main className="flex flex-col gap-8">
        {/* ==================== EN-TÊTE ==================== */}
        <header className="flex flex-col gap-2">
          <p className="text-caption uppercase text-ink-muted">{s.map.kicker}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-h1 font-semibold">{study.company_name}</h1>
            <span className={BADGE}>{s.studies.roles[study.role]}</span>
            {studyClass && (
              <span className={BADGE}>
                {interpolate(s.classes.study.badge, { name: studyClass.name })}
              </span>
            )}
          </div>
          {studyClass?.due_date && (
            <p className="text-small text-ink-muted">
              {interpolate(s.classes.study.due, {
                date: DUE_FORMAT.format(new Date(studyClass.due_date)),
              })}
              {isLate(STEPS.map((step) => statuses[step.no]), studyClass.due_date, todayIso()) && (
                <span className="text-warning"> · {s.classes.study.late}</span>
              )}
            </p>
          )}
          <p className="text-ink-muted">
            {question ? interpolate(s.map.questionLabel, { question }) : s.map.noQuestion}
          </p>
          <p className="text-small text-ink-muted">
            {interpolate(s.map.members, {
              count: String(study.member_count),
              date: DATE_FORMAT.format(new Date(study.updated_at)),
            })}
          </p>
          <nav className="flex flex-wrap gap-2" aria-label={s.team.title}>
            <Link href={`/strategie/etudes/${study.id}/equipe`} className={BUTTON_SECONDARY}>
              {s.team.navTeam}
            </Link>
            <Link href={`/strategie/etudes/${study.id}/journal`} className={BUTTON_SECONDARY}>
              {s.team.navJournal}
            </Link>
            <Link href={`/strategie/etudes/${study.id}/coach`} className={BUTTON_SECONDARY}>
              {s.coach.pageLink}
            </Link>
          </nav>
        </header>

        {study.practice_case && (
          <p className={`${PANEL_SAND} p-4 text-small`}>
            {s.cases.studyBanner}{" "}
            <Link
              href={`/strategie/cas/${study.practice_case}`}
              className="text-encre underline"
            >
              {s.cases.studyBannerLink}
            </Link>
          </p>
        )}

        <PresenceBar />

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
                      assignee={names.get(study.steps[step.no]?.assignee_id ?? "")}
                      presence={<StepPeers stepNo={step.no} />}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* ==================== PLAN STRATÉGIQUE ==================== */}
        <div className="flex flex-col items-start gap-2">
          {planOpen ? (
            <Link
              href={`/strategie/etudes/${study.id}/etapes/${PLAN_STEP}`}
              className={BUTTON_PRIMARY}
            >
              {s.map.generate}
            </Link>
          ) : (
            <>
              <button type="button" className={BUTTON_PRIMARY} disabled>
                {s.map.generate}
              </button>
              <p className="text-small text-ink-muted">{s.map.generateLater}</p>
            </>
          )}
        </div>
      </main>
    </PresenceProvider>
  );
}
