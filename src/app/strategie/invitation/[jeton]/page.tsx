/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/invitation/[jeton])
 *  Projet     : Kalami Stratégie
 *  Description: Page ouverte par le lien d'invitation (S9a). Après connexion, montre qui
 *               invite, à quelle étude et avec quel rôle, puis « Accepter » ou « Refuser ».
 *               Accepter exige d'être connecté avec le courriel invité, confirmé ; sinon la
 *               page propose de changer de compte. Lien inconnu, échu ou déjà utilisé :
 *               message explicite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-queries.ts, components/strategy/team
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { InvitationResponse } from "@/components/strategy/team/invitation-response";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { authPath, STRATEGY_HOME } from "@/lib/auth/routes";
import { getInvitationByToken, type InvitationPreview } from "@/lib/strategy/team-queries";

const s = getDictionary().strategy;
const inv = s.team.invitation;

export const metadata: Metadata = { title: inv.kicker };

export default function InvitationPage({ params }: PageProps<"/strategie/invitation/[jeton]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
      <Invitation params={params} />
    </Suspense>
  );
}

/** Phrase « X vous invite à rejoindre l'étude Y comme Z ». */
function invitationText(invitation: InvitationPreview): string {
  return interpolate(inv.body, {
    inviter: invitation.inviter_name ?? s.team.journal.someone,
    company: invitation.company_name,
    role: s.studies.roles[invitation.role].toLowerCase(),
  });
}

/** Charge l'invitation désignée par le lien et choisit ce qu'il faut afficher. */
async function Invitation({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const path = `/strategie/invitation/${encodeURIComponent(jeton)}`;
  await requireUser(path);
  const invitation = await getInvitationByToken(jeton);

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{inv.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{inv.title}</h1>
      </header>
      <section className={`${CARD} flex max-w-2xl flex-col gap-4 p-5`}>
        <InvitationBody invitation={invitation} path={path} />
      </section>
    </main>
  );
}

/** Contenu de la carte selon l'état de l'invitation. */
function InvitationBody({
  invitation,
  path,
}: {
  invitation: InvitationPreview | null;
  path: string;
}) {
  const home = <Link href={STRATEGY_HOME} className={BUTTON_SECONDARY}>{inv.home}</Link>;

  if (!invitation) {
    return (
      <>
        <p>{inv.notFound}</p>
        <div>{home}</div>
      </>
    );
  }
  if (invitation.already_member) {
    return (
      <>
        <p>{inv.alreadyMember}</p>
        <div>
          <Link href={`/strategie/etudes/${invitation.study_id}`} className={BUTTON_PRIMARY}>
            {inv.open}
          </Link>
        </div>
      </>
    );
  }
  if (invitation.status !== "pending" || invitation.expired) {
    const text = invitation.status === "pending" || invitation.status === "expired"
      ? interpolate(inv.expired, { inviter: invitation.inviter_name ?? s.team.journal.someone })
      : inv.closed;
    return (
      <>
        <p>{text}</p>
        <div>{home}</div>
      </>
    );
  }
  if (!invitation.email_matches) {
    return (
      <>
        <p>{invitationText(invitation)}</p>
        <p role="alert" className="text-small text-danger">
          {interpolate(inv.mismatch, { email: invitation.email })}
        </p>
        <form action={signOut}>
          <input type="hidden" name="suivant" value={authPath("connexion", path)} />
          <button type="submit" className={BUTTON_SECONDARY}>{inv.signOut}</button>
        </form>
      </>
    );
  }
  return (
    <>
      <p>{invitationText(invitation)}</p>
      <p className="text-small text-ink-muted">{s.team.roleHelp[invitation.role]}</p>
      <InvitationResponse invitationId={invitation.invitation_id} />
    </>
  );
}
