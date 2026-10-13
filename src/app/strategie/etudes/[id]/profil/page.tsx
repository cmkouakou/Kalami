/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/profil)
 *  Projet     : Kalami Stratégie
 *  Description: Profil de l'organisation étudiée : questionnaire modifiable pour le
 *               propriétaire et les contributeurs, résumé en lecture seule pour les
 *               observateurs. Indique les champs indispensables encore vides.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-13
 *  Dépendances: components/strategy/profile-form.tsx, lib/strategy/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProfileForm } from "@/components/strategy/profile-form";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { missingProfileFields, type ProfileData } from "@/lib/strategy/profile";
import { getStudy } from "@/lib/strategy/queries";
import { canEdit } from "@/lib/strategy/steps";

const t = getDictionary();
const p = t.strategy.profile;
const f = p.fields as Record<string, string>;

export const metadata: Metadata = { title: p.title };

export default function StudyProfilePage({ params }: PageProps<"/strategie/etudes/[id]/profil">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StudyProfile params={params} />
    </Suspense>
  );
}

/** Valeur lisible d'une réponse du profil (liste, équipes, nombre ou texte). */
function display(key: keyof ProfileData, data: ProfileData): string {
  if (key === "scope") return t.strategy.profile.scopes[data.scope];
  if (key === "teams") {
    return data.teams
      .map((team) => (team.headcount === null ? team.role : `${team.role} (${team.headcount})`))
      .join(", ");
  }
  const value = data[key];
  if (Array.isArray(value)) return value.join(", ");
  return value === null ? "" : String(value);
}

/** Charge l'étude ; formulaire pour les éditeurs, résumé pour les observateurs. */
async function StudyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/strategie/etudes/${id}/profil`);
  const study = await getStudy(id, user.id);
  if (!study) notFound();

  const missing = missingProfileFields(study.strategic_question, study.profile);

  return (
    <main className="flex flex-col gap-6">
      <Link href={`/strategie/etudes/${study.id}`} className="w-fit text-sm text-encre
        hover:underline"
      >
        ← {p.back}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-h1 font-semibold">{p.title}</h1>
        <p className="text-ink-muted">{p.intro}</p>
      </header>
      <p role="status" className={`${PANEL_SAND} p-4 text-small`}>
        {missing.length === 0
          ? p.complete
          : interpolate(p.incomplete, { fields: missing.map((name) => f[name]).join(", ") })}
      </p>

      {canEdit(study.role) ? (
        <ProfileForm
          studyId={study.id}
          companyName={study.company_name}
          strategicQuestion={study.strategic_question}
          data={study.profile}
        />
      ) : (
        <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-6`}>
          <p className="text-small text-ink-muted">{p.readOnly}</p>
          <dl className="grid gap-3 sm:grid-cols-[14rem_1fr]">
            <dt className="text-label">{f.companyName}</dt>
            <dd>{study.company_name}</dd>
            <dt className="text-label">{f.strategicQuestion}</dt>
            <dd>{study.strategic_question || "—"}</dd>
            {(Object.keys(study.profile) as (keyof ProfileData)[]).map((key) => (
              <div key={key} className="contents">
                <dt className="text-label">{f[key]}</dt>
                <dd>{display(key, study.profile) || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </main>
  );
}
