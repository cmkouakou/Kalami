/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi/[module]/[lecon])
 *  Projet     : Kalami Données
 *  Description: Page d'une leçon : son résumé, le lien vers la page officielle Microsoft
 *               Learn dont elle vient, et la navigation vers les leçons voisines. Une
 *               leçon encore sans résumé affiche une explication plutôt qu'une erreur,
 *               pour que la carte du parcours reste parcourable de bout en bout.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/modules.ts, lib/powerbi/lessons, components/powerbi
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonBlocks } from "@/components/powerbi/lesson-blocks";
import { PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requireUser } from "@/lib/auth/dal";
import { POWERBI_HOME } from "@/lib/auth/routes";
import { getResume } from "@/lib/powerbi/lessons";
import { getLesson, getVoisines } from "@/lib/powerbi/modules";

const d = getPowerbiDictionary();

type Params = Promise<{ module: string; lecon: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { module: moduleSlug, lecon: lessonSlug } = await params;
  const trouve = getLesson(moduleSlug, lessonSlug);
  if (!trouve) return {};
  return { title: trouve.lecon.titre, description: trouve.lecon.accroche };
}

export default async function LeconPage({ params }: { params: Params }) {
  await requireUser(POWERBI_HOME);

  const { module: moduleSlug, lecon: lessonSlug } = await params;
  const trouve = getLesson(moduleSlug, lessonSlug);
  if (!trouve) notFound();

  const { module, lecon } = trouve;
  const contenu = await getResume(moduleSlug, lessonSlug);
  const { precedente, suivante } = getVoisines(moduleSlug, lessonSlug);

  return (
    <article className="flex flex-col gap-6">
      <nav aria-label={d.lecon.retour}>
        <Link href={POWERBI_HOME} className="text-small text-ink-muted hover:underline">
          ← {d.lecon.retour}
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <p className="text-small text-ink-muted">
          {module.rang}. {module.titre}
        </p>
        <h1 className="font-serif text-h1 font-semibold text-encre">{lecon.titre}</h1>
        <p className="max-w-prose text-ink-muted">{lecon.accroche}</p>
        <p className="text-caption text-ink-muted">
          {interpolate(d.accueil.minutes, { n: String(lecon.minutes) })}
        </p>
      </header>

      {contenu ? (
        <LessonBlocks contenu={contenu} />
      ) : (
        <div className={`${PANEL_SAND} max-w-prose px-4 py-3`}>
          <p className="font-medium text-encre">{d.lecon.nonRedigee}</p>
          <p className="mt-1 text-small text-ink-muted">{d.lecon.nonRedigeeAide}</p>
        </div>
      )}

      {lecon.microsoftLearn && (
        <p className="text-small">
          <a
            href={lecon.microsoftLearn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-encre underline"
          >
            {d.lecon.source}
          </a>
        </p>
      )}

      <nav
        aria-label={d.lecon.suivante}
        className="mt-4 flex flex-wrap justify-between gap-4 border-t border-line pt-4 text-small"
      >
        {precedente ? (
          <Link
            href={`${POWERBI_HOME}/${precedente.module.slug}/${precedente.lecon.slug}`}
            className="max-w-xs hover:underline"
          >
            <span className="block text-caption text-ink-muted">{d.lecon.precedente}</span>
            <span className="text-encre">{precedente.lecon.titre}</span>
          </Link>
        ) : (
          <span />
        )}
        {suivante && (
          <Link
            href={`${POWERBI_HOME}/${suivante.module.slug}/${suivante.lecon.slug}`}
            className="max-w-xs text-right hover:underline"
          >
            <span className="block text-caption text-ink-muted">{d.lecon.suivante}</span>
            <span className="text-encre">{suivante.lecon.titre}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
