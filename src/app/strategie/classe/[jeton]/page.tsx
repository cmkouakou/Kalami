/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/classe/[jeton])
 *  Projet     : Kalami Stratégie
 *  Description: Page ouverte par un lien de classe ou une invitation de classe (S10a).
 *               Après connexion, montre l'enseignant et la classe, puis « Rejoindre la
 *               classe ». Une invitation exige le courriel invité, confirmé ; sinon la page
 *               propose de changer de compte. Lien inconnu, désactivé, échu ou classe
 *               archivée : message explicite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/strategy/class-queries.ts, components/strategy/classes
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { JoinClassButton } from "@/components/strategy/classes/join-class-button";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { authPath, STRATEGY_HOME } from "@/lib/auth/routes";
import { getClassByToken } from "@/lib/strategy/class-queries";
import type { ClassByToken } from "@/lib/strategy/classes";

const s = getDictionary().strategy;
const j = s.classes.join;

export const metadata: Metadata = { title: j.title };

export default function JoinClassPage({ params }: PageProps<"/strategie/classe/[jeton]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
      <JoinClass params={params} />
    </Suspense>
  );
}

/** Charge la classe désignée par le lien. */
async function JoinClass({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const path = `/strategie/classe/${encodeURIComponent(jeton)}`;
  await requireUser(path);
  const target = await getClassByToken(jeton);

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{j.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{j.title}</h1>
      </header>
      <section className={`${CARD} flex max-w-2xl flex-col gap-4 p-5`}>
        <JoinBody target={target} token={jeton} path={path} />
      </section>
    </main>
  );
}

/** Contenu de la carte selon l'état du lien. */
function JoinBody({
  target,
  token,
  path,
}: {
  target: ClassByToken | null;
  token: string;
  path: string;
}) {
  const home = <Link href={STRATEGY_HOME} className={BUTTON_SECONDARY}>{j.home}</Link>;
  const message = (text: string, action = home) => (
    <>
      <p>{text}</p>
      <div>{action}</div>
    </>
  );

  if (!target) return message(j.notFound);
  if (target.is_teacher) {
    return message(
      j.isTeacher,
      <Link href={`/strategie/classes/${target.class_id}`} className={BUTTON_PRIMARY}>
        {j.openClass}
      </Link>,
    );
  }
  if (target.already_member) return message(j.alreadyMember);
  if (target.class_status === "archived") return message(j.archived);
  if (target.kind === "invitation") {
    if (target.invitation_status !== "pending") return message(j.closed);
    if (target.expired) return message(j.expired);
  }

  const body = interpolate(j.body, {
    teacher: target.teacher_name ?? s.team.journal.someone,
    name: target.name,
  });
  const details = [target.institution, target.term].filter(Boolean).join(" · ");

  if (target.kind === "invitation" && !target.email_matches) {
    return (
      <>
        <p>{body}</p>
        <p role="alert" className="text-small text-danger">
          {interpolate(j.mismatch, { email: target.invitation_email ?? "" })}
        </p>
        <form action={signOut}>
          <input type="hidden" name="suivant" value={authPath("connexion", path)} />
          <button type="submit" className={BUTTON_SECONDARY}>{j.signOut}</button>
        </form>
      </>
    );
  }
  return (
    <>
      <p>{body}</p>
      {details && <p className="text-small text-ink-muted">{details}</p>}
      <JoinClassButton token={token} />
    </>
  );
}
