/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/equipe)
 *  Projet     : Kalami Stratégie
 *  Description: Page Équipe d'une étude (S9a, cahier §6) : rôles, membres, invitation et
 *               invitations en attente (propriétaire), responsables des étapes et nom
 *               affiché de l'utilisateur. Ouverte à tous les membres ; les actions de
 *               gestion sont réservées au propriétaire. Étude de classe (S10a) : badge
 *               « Enseignant », sans retrait ni changement de rôle.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/queries.ts, lib/strategy/team-queries.ts,
 *               lib/strategy/class-queries.ts,
 *               components/strategy/team
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DisplayNameForm } from "@/components/strategy/team/display-name-form";
import { InviteForm } from "@/components/strategy/team/invite-form";
import { MemberList } from "@/components/strategy/team/member-list";
import { PendingInvitations } from "@/components/strategy/team/pending-invitations";
import { StepAssignments } from "@/components/strategy/team/step-assignments";
import { CARD } from "@/components/ui/styles";
import { requireUser } from "@/lib/auth/dal";
import { getStudyClass } from "@/lib/strategy/class-queries";
import { getStudy } from "@/lib/strategy/queries";
import { STEPS, type StepNo } from "@/lib/strategy/steps";
import {
  getMyDisplayName,
  getPendingInvitations,
  getStudyMembers,
} from "@/lib/strategy/team-queries";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const tm = s.team;

export const metadata: Metadata = { title: tm.title };

export default function StudyTeamPage({ params }: PageProps<"/strategie/etudes/[id]/equipe">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StudyTeam params={params} />
    </Suspense>
  );
}

/** Charge l'étude, ses membres et, pour le propriétaire, les invitations en attente. */
async function StudyTeam({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/strategie/etudes/${id}/equipe`);
  const study = await getStudy(id, user.id);
  if (!study) notFound();

  const isOwner = study.role === "owner";
  const [members, invitations, displayName, studyClass] = await Promise.all([
    getStudyMembers(study.id),
    isOwner ? getPendingInvitations(study.id) : Promise.resolve([]),
    getMyDisplayName(user.id),
    getStudyClass(study.id),
  ]);
  const assignees = {} as Record<StepNo, string | null>;
  for (const step of STEPS) assignees[step.no] = study.steps[step.no]?.assignee_id ?? null;

  return (
    <main className="flex flex-col gap-6">
      <Link href={`/strategie/etudes/${study.id}`} className="w-fit text-sm text-encre
        hover:underline"
      >
        ← {tm.back}
      </Link>

      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{study.company_name}</p>
        <h1 className="font-serif text-h1 font-semibold">{tm.title}</h1>
        <p className="max-w-2xl text-ink-muted">{tm.intro}</p>
        <dl className="grid gap-2 text-small sm:grid-cols-3">
          {(["owner", "contributor", "observer"] as const).map((role) => (
            <div key={role} className="flex flex-col">
              <dt className="font-semibold">{s.studies.roles[role]}</dt>
              <dd className="text-ink-muted">{tm.roleHelp[role]}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ==================== MEMBRES ==================== */}
      <section aria-labelledby="membres" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="membres" className="font-serif text-h3 font-semibold">{tm.members.title}</h2>
        <MemberList
          studyId={study.id}
          members={members}
          userId={user.id}
          role={study.role}
          teacherId={studyClass?.teacher_id ?? null}
        />
      </section>

      {/* ==================== INVITATIONS ==================== */}
      {isOwner ? (
        <>
          <section aria-labelledby="inviter" className={`${CARD} flex flex-col gap-3 p-4`}>
            <h2 id="inviter" className="font-serif text-h3 font-semibold">
              {tm.invite.title}
            </h2>
            <InviteForm studyId={study.id} />
          </section>
          <section aria-labelledby="en-attente" className={`${CARD} flex flex-col gap-3 p-4`}>
            <h2 id="en-attente" className="font-serif text-h3 font-semibold">
              {tm.pending.title}
            </h2>
            <PendingInvitations studyId={study.id} invitations={invitations} />
          </section>
        </>
      ) : (
        <p className="text-small text-ink-muted">{tm.invite.ownerOnly}</p>
      )}

      {/* ==================== RESPONSABLES DES ÉTAPES ==================== */}
      <section aria-labelledby="responsables" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="responsables" className="font-serif text-h3 font-semibold">
          {tm.assign.title}
        </h2>
        <p className="text-small text-ink-muted">{tm.assign.intro}</p>
        <StepAssignments
          studyId={study.id}
          members={members}
          assignees={assignees}
          editable={isOwner}
        />
      </section>

      {/* ==================== NOM AFFICHÉ ==================== */}
      <section aria-labelledby="mon-nom" className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 id="mon-nom" className="font-serif text-h3 font-semibold">{tm.name.title}</h2>
        <DisplayNameForm studyId={study.id} displayName={displayName} />
      </section>
    </main>
  );
}
