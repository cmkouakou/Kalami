/**
 * =============================================================
 *  Fichier    : page.tsx (strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Accueil de l'assistant stratégie (/strategie) : présentation publique de la
 *               démarche en quatre temps (entreprise entière ou division, le livre servant
 *               de guide), puis, pour un utilisateur connecté, ses études et ses crédits
 *               d'étude disponibles, et les invitations reçues (S9a).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/queries.ts, lib/strategy/team-queries.ts, lib/auth/dal.ts
 * =============================================================
 */

import Link from "next/link";
import { Suspense } from "react";

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
import { countAvailableCredits, listMyStudies } from "@/lib/strategy/queries";
import { PHASES } from "@/lib/strategy/steps";
import { getMyInvitations, type ReceivedInvitation } from "@/lib/strategy/team-queries";

const t = getDictionary();
const s = t.strategy;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

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

  const [studies, credits, invitations] = await Promise.all([
    listMyStudies(user.id),
    countAvailableCredits(user.id),
    getMyInvitations(),
  ]);

  return (
    <>
      <ReceivedInvitations invitations={invitations} />
      <section id="mes-etudes" className="flex flex-col gap-4" aria-labelledby="titre-etudes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titre-etudes" className="font-serif text-h2 font-semibold">
            {s.studies.title}
          </h2>
          {credits > 0 && (
            <Link href="/strategie/nouvelle" className={BUTTON_PRIMARY}>
              {s.studies.newStudy}
            </Link>
          )}
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
    </>
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
