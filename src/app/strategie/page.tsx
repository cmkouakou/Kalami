/**
 * =============================================================
 *  Fichier    : page.tsx (strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Accueil de l'assistant stratégie (/strategie) : présentation publique de la
 *               démarche en quatre temps (entreprise entière ou division, le livre servant
 *               de guide), puis, pour un utilisateur connecté, ses études et ses crédits
 *               d'étude disponibles, et les invitations reçues (S9a). Mode enseignant
 *               (S10a) : classes suivies par l'étudiant avec leurs études, et lien « Mes
 *               classes » pour l'enseignant. Achat des études et des lots (v0.10.2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-19
 *  Dépendances: lib/strategy/queries.ts, lib/strategy/team-queries.ts,
 *               lib/strategy/class-queries.ts, lib/auth/dal.ts
 * =============================================================
 */

import Link from "next/link";
import { Suspense } from "react";

import { LeaveClassButton } from "@/components/strategy/classes/leave-class-button";
import { StudyOffers } from "@/components/strategy/study-offers";
import { InvitationResponse } from "@/components/strategy/team/invitation-response";
import {
  BADGE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath, STRATEGY_HOME } from "@/lib/auth/routes";
import {
  type ClassStudy,
  getStudentClasses,
  isTeacher,
  listMyClassStudies,
} from "@/lib/strategy/class-queries";
import type { StudentClass } from "@/lib/strategy/classes";
import { countAvailableCredits, listMyStudies } from "@/lib/strategy/queries";
import { PHASES } from "@/lib/strategy/steps";
import { getMyInvitations, type ReceivedInvitation } from "@/lib/strategy/team-queries";

const t = getDictionary();
const s = t.strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
/** Dates AAAA-MM-JJ (sans heure) : lues en UTC pour ne pas reculer d'un jour. */
const DUE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" });

export default function StrategyHomePage() {
  return (
    <main className="flex flex-col gap-10">
      {/* ==================== PRÉSENTATION ==================== */}
      <header className="flex flex-col gap-3">
        <p className="text-caption uppercase text-ink-muted">{s.landing.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{s.landing.title}</h1>
        <p className="max-w-2xl text-ink-muted">{s.landing.subtitle}</p>
        <p className="max-w-2xl text-small text-ink-muted">{s.landing.bookNote}</p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="demarche">
        <h2 id="demarche" className="font-serif text-h2 font-semibold">
          {s.landing.phasesTitle}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {PHASES.map((phase) => (
            <li key={phase} className={`${CARD} flex flex-col gap-1 p-4`}>
              <span className="font-semibold">{s.phases[phase]}</span>
              <span className="text-small text-ink-muted">{s.phaseIntro[phase]}</span>
            </li>
          ))}
        </ol>
        <p className={`${PANEL_SAND} p-4 text-small`}>{s.landing.coachNote}</p>
      </section>

      {/* ==================== MES ÉTUDES ==================== */}
      <Suspense fallback={<div aria-hidden="true" className="h-40 animate-pulse" />}>
        <MyStudies />
      </Suspense>
    </main>
  );
}

/** Études et crédits de l'utilisateur connecté ; invitation à se connecter sinon. */
async function MyStudies() {
  const user = await getCurrentUser();
  if (!user) {
    // Nouveau visiteur ou lecteur du livre : inscription et connexion restent dans l'application
    return (
      <div className="flex flex-wrap gap-3">
        <Link href={authPath("inscription", STRATEGY_HOME)} className={BUTTON_PRIMARY}>
          {s.landing.signUp}
        </Link>
        <Link href={authPath("connexion", STRATEGY_HOME)} className={BUTTON_SECONDARY}>
          {s.landing.signIn}
        </Link>
      </div>
    );
  }

  const [studies, credits, invitations, classes, classStudies, teacher] = await Promise.all([
    listMyStudies(user.id),
    countAvailableCredits(user.id),
    getMyInvitations(),
    getStudentClasses(),
    listMyClassStudies(user.id),
    isTeacher(),
  ]);

  return (
    <>
      <ReceivedInvitations invitations={invitations} />
      <section id="mes-etudes" className="flex flex-col gap-4" aria-labelledby="titre-etudes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titre-etudes" className="font-serif text-h2 font-semibold">
            {s.studies.title}
          </h2>
          <span className="flex flex-wrap gap-3">
            {teacher && (
              <Link href="/strategie/classes" className={BUTTON_SECONDARY}>
                {s.classes.nav}
              </Link>
            )}
            {credits > 0 && (
              <Link href="/strategie/nouvelle" className={BUTTON_PRIMARY}>
                {s.studies.newStudy}
              </Link>
            )}
          </span>
        </div>
        <p className="text-small text-ink-muted">
          {credits > 0
            ? interpolate(s.studies.credits, { count: String(credits) })
            : s.studies.noCredit}
        </p>

        {studies.length === 0 ? (
          <p className="text-ink-muted">{s.studies.none}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {studies.map((study) => (
              <li key={study.id}>
                <Link
                  href={`/strategie/etudes/${study.id}`}
                  className={`${CARD} flex flex-col gap-2 p-4 hover:border-encre sm:flex-row
                    sm:items-center sm:justify-between`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-medium">{study.company_name}</span>
                    <span className="text-small text-ink-muted">
                      {interpolate(s.studies.progress, { count: String(study.validated) })}
                      {" · "}
                      {interpolate(s.studies.updated, {
                        date: DATE_FORMAT.format(new Date(study.updated_at)),
                      })}
                    </span>
                  </span>
                  <span className={BADGE}>{s.studies.roles[study.role]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <MyClasses classes={classes} studies={classStudies} />
      <StudyOffers />
    </>
  );
}

/**
 * Classes suivies par l'étudiant (S10a) : enseignant, date de remise, études distribuées et
 * « Quitter la classe ».
 * @param classes - Classes lues par strategy_student_classes
 * @param studies - Études de classe dont l'utilisateur est membre
 */
function MyClasses({ classes, studies }: { classes: StudentClass[]; studies: ClassStudy[] }) {
  if (classes.length === 0) return null;
  const st = s.classes.student;
  return (
    <section className="flex flex-col gap-4" aria-labelledby="titre-classes">
      <h2 id="titre-classes" className="font-serif text-h2 font-semibold">{st.title}</h2>
      <ul className="flex flex-col gap-3">
        {classes.map((row) => {
          const own = studies.filter((study) => study.class_id === row.class_id);
          return (
            <li key={row.class_id} className={`${CARD} flex flex-col gap-3 p-4`}>
              <div className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {row.name}
                  {row.status === "archived" && (
                    <span className={BADGE}>{s.classes.archivedBadge}</span>
                  )}
                </span>
                <span className="text-small text-ink-muted">
                  {interpolate(st.teacher, {
                    name: row.teacher_name ?? s.team.journal.someone,
                  })}
                  {row.due_date && ` · ${interpolate(st.due, {
                    date: DUE_FORMAT.format(new Date(row.due_date)),
                  })}`}
                </span>
              </div>
              {own.length === 0 ? (
                <p className="text-small text-ink-muted">{st.waiting}</p>
              ) : (
                <ul className="flex flex-col gap-1" aria-label={st.studiesTitle}>
                  {own.map((study) => (
                    <li key={study.id}>
                      <Link
                        href={`/strategie/etudes/${study.id}`}
                        className="text-encre hover:underline"
                      >
                        {study.company_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <LeaveClassButton classId={row.class_id} name={row.name} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Invitations en attente adressées au courriel de l'utilisateur (S9a) : qui invite, à quelle
 * étude, avec quel rôle et jusqu'à quand, puis « Accepter » ou « Refuser ».
 * @param invitations - Invitations lues par strategy_my_invitations
 */
function ReceivedInvitations({ invitations }: { invitations: ReceivedInvitation[] }) {
  if (invitations.length === 0) return null;
  const r = s.team.received;
  return (
    <section className="flex flex-col gap-4" aria-labelledby="titre-invitations">
      <h2 id="titre-invitations" className="font-serif text-h2 font-semibold">{r.title}</h2>
      <ul className="flex flex-col gap-3">
        {invitations.map((invitation) => (
          <li key={invitation.invitation_id} className={`${CARD} flex flex-col gap-3 p-4`}>
            <p>
              {interpolate(r.body, {
                inviter: invitation.inviter_name ?? s.team.journal.someone,
                company: invitation.company_name,
                role: s.studies.roles[invitation.role].toLowerCase(),
              })}
            </p>
            <p className="text-small text-ink-muted">
              {interpolate(r.expires, {
                date: DATE_FORMAT.format(new Date(invitation.expires_at)),
              })}
            </p>
            <InvitationResponse invitationId={invitation.invitation_id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
