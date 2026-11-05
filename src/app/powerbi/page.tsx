/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi)
 *  Projet     : Kalami Données
 *  Description: Accueil du parcours PL-300 : présentation, avancement de la rédaction,
 *               puis les modules avec leurs leçons. Une leçon non rédigée reste visible
 *               mais grisée, pour que la carte du parcours soit complète dès le départ.
 *               Contenu lu dans une zone Suspense, comme les autres pages privées, pour
 *               que la page ne bloque plus le pré-affichage (v0.17.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/modules.ts, lib/auth/dal.ts, i18n
 * =============================================================
 */

import Link from "next/link";
import { Suspense } from "react";

import { BADGE, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { POWERBI_HOME } from "@/lib/auth/routes";
import { aUnResume } from "@/lib/powerbi/lessons";
import { getAvancement, MODULES, type Module } from "@/lib/powerbi/modules";

const d = getPowerbiDictionary();

export default function PowerbiHomePage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
      <PowerbiHome />
    </Suspense>
  );
}

/** Contenu privé : lu dans une zone Suspense (cookies de session). */
async function PowerbiHome() {
  await requireUser(POWERBI_HOME);
  const { pretes, total } = getAvancement();

  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-h1 font-semibold text-encre">{d.accueil.titre}</h1>
        <p className="max-w-prose text-ink-muted">{d.accueil.intro}</p>
        <p className="text-small text-ink-muted">
          {interpolate(d.accueil.avancement, { pretes: String(pretes), total: String(total) })}
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="modules">
        <h2 id="modules" className="font-serif text-h2 font-semibold text-encre">
          {d.accueil.modulesTitre}
        </h2>
        {MODULES.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </section>
    </>
  );
}

/** Un module et la liste de ses leçons. */
function ModuleCard({ module }: { module: Module }) {
  return (
    <article className={`${CARD} p-5`}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-serif text-h3 font-semibold text-encre">
            {module.rang}. {module.titre}
          </h3>
          <span className="text-small text-ink-muted">
            {interpolate(d.accueil.lecons, { n: String(module.lecons.length) })}
          </span>
        </div>
        <p className="max-w-prose text-small text-ink-muted">{module.resume}</p>
      </header>

      <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
        {module.lecons.map((lecon) => {
          const minutes = interpolate(d.accueil.minutes, { n: String(lecon.minutes) });

          if (!aUnResume(module.slug, lecon.slug)) {
            return (
              <li
                key={lecon.slug}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 text-ink-muted"
              >
                <span className="font-medium">{lecon.titre}</span>
                <span className={BADGE}>{d.accueil.aVenir}</span>
                <span className="ml-auto text-caption">{minutes}</span>
              </li>
            );
          }

          return (
            <li key={lecon.slug} className="py-3">
              <Link
                href={`${POWERBI_HOME}/${module.slug}/${lecon.slug}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 hover:underline"
              >
                <span className="font-medium text-encre">{lecon.titre}</span>
                <span className="text-small text-ink-muted">{lecon.accroche}</span>
                <span className="ml-auto text-caption text-ink-muted">{minutes}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {module.microsoftLearn && (
        <p className={`${PANEL_SAND} mt-4 px-4 py-2 text-caption text-ink-muted`}>
          <a
            href={module.microsoftLearn}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-encre hover:underline"
          >
            {d.lecon.source}
          </a>
        </p>
      )}
    </article>
  );
}
