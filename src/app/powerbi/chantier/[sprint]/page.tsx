/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi/chantier/[sprint])
 *  Projet     : Kalami Données
 *  Description: Page d'un sprint du chantier BRVM Power BI : objectif, sections
 *               numérotées, notions dépliables, visuels et cases de fin de sprint
 *               enregistrées sur le compte. Les 7 adresses sont connues à la construction ;
 *               le contenu privé est lu dans une zone Suspense.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/guide, components/powerbi, lib/auth/dal.ts, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { InlineText } from "@/components/powerbi/inline-text";
import { LessonBlocks } from "@/components/powerbi/lesson-blocks";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requireUser } from "@/lib/auth/dal";
import { CHANTIER_HOME } from "@/lib/auth/routes";
import { texteBrut } from "@/lib/powerbi/inline";
import { getProgressionChantier } from "@/lib/powerbi/guide/progress";
import { getSprint, getSprintsVoisins, SPRINTS } from "@/lib/powerbi/guide/sprints";

const d = getPowerbiDictionary();

type Params = Promise<{ sprint: string }>;

/** Les 7 sprints, pré-affichés à la construction. */
export function generateStaticParams(): { sprint: string }[] {
  return SPRINTS.map((s) => ({ sprint: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sprint: slug } = await params;
  const sprint = getSprint(slug);
  if (!sprint) return {};
  return {
    title: `${interpolate(d.chantier.sprint, { n: String(sprint.numero) })} — ${sprint.titre}`,
    description: texteBrut(sprint.lede),
  };
}

export default function SprintPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
      <SprintContenu params={params} />
    </Suspense>
  );
}

/** Contenu privé du sprint : lu dans une zone Suspense (cookies de session). */
async function SprintContenu({ params }: { params: Params }) {
  const { sprint: slug } = await params;
  await requireUser(`${CHANTIER_HOME}/${slug}`);

  const sprint = getSprint(slug);
  if (!sprint) notFound();

  const progression = await getProgressionChantier();
  const { precedent, suivant } = getSprintsVoisins(slug);

  return (
    <article className="flex flex-col gap-6">
      <nav aria-label={d.chantier.retour}>
        <Link href={CHANTIER_HOME} className="text-small text-ink-muted hover:underline">
          ← {d.chantier.retour}
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ocre-text">
          {interpolate(d.chantier.sprint, { n: String(sprint.numero) })}
        </p>
        <h1 className="font-serif text-h1 font-semibold text-encre">{sprint.titre}</h1>
        <p className="max-w-prose text-ink-muted">
          <InlineText texte={sprint.lede} />
        </p>
      </header>

      <LessonBlocks contenu={sprint.contenu} progression={progression} />

      <nav
        aria-label={d.chantier.navigation}
        className="mt-4 flex flex-wrap justify-between gap-4 border-t border-line pt-4 text-small"
      >
        {precedent ? (
          <Link href={`${CHANTIER_HOME}/${precedent.slug}`} className="max-w-xs hover:underline">
            <span className="block text-caption text-ink-muted">
              <span aria-hidden="true">← </span>
              {d.chantier.precedent}
            </span>
            <span className="text-encre">{precedent.titre}</span>
          </Link>
        ) : (
          <span />
        )}
        {suivant && (
          <Link
            href={`${CHANTIER_HOME}/${suivant.slug}`}
            className="max-w-xs text-right hover:underline"
          >
            <span className="block text-caption text-ink-muted">
              {d.chantier.suivant}
              <span aria-hidden="true"> →</span>
            </span>
            <span className="text-encre">{suivant.titre}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
