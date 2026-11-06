/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi/chantier)
 *  Projet     : Kalami Données
 *  Description: Accueil du chantier BRVM Power BI : présentation, repères de lecture
 *               (Pratique, Info, Repère), anneau d'avancement et les 7 sprints avec leurs
 *               cases cochées. Contenu privé lu dans une zone Suspense.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/guide, components/powerbi, lib/auth/dal.ts, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { InlineText } from "@/components/powerbi/inline-text";
import { Etiquette } from "@/components/powerbi/lesson-blocks";
import { ProgressRing } from "@/components/powerbi/progress-ring";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requireUser } from "@/lib/auth/dal";
import { CHANTIER_HOME } from "@/lib/auth/routes";
import { getProgressionChantier } from "@/lib/powerbi/guide/progress";
import { getAvancementSprint, SPRINTS } from "@/lib/powerbi/guide/sprints";

const d = getPowerbiDictionary();

export const metadata: Metadata = {
  title: d.chantier.titre,
  description: d.chantier.intro,
};

export default function ChantierPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
      <Chantier />
    </Suspense>
  );
}

/** Contenu privé : lu dans une zone Suspense (cookies de session). */
async function Chantier() {
  await requireUser(CHANTIER_HOME);
  const { coches } = await getProgressionChantier();
  const cochees = new Set(coches);
  const avancements = SPRINTS.map((s) => getAvancementSprint(s, cochees));
  const termines = avancements.filter((a) => a.termine).length;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-caption uppercase text-ocre-text">{d.chantier.surtitre}</p>
          <h1 className="font-serif text-h1 font-semibold text-encre">{d.chantier.titre}</h1>
          <p className="max-w-prose text-ink-muted">{d.chantier.intro}</p>
        </div>
        <div className={`${CARD} flex items-center gap-3 rounded-full py-2 pl-2 pr-4`}>
          <ProgressRing valeur={termines} total={SPRINTS.length} />
          <span className="text-small text-ink-muted">
            {interpolate(d.chantier.avancement, {
              n: String(termines),
              total: String(SPRINTS.length),
            })}
          </span>
        </div>
      </header>

      <section aria-labelledby="reperes" className="flex flex-col gap-2">
        <h2 id="reperes" className="sr-only">
          {d.chantier.legendeTitre}
        </h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small text-ink-muted">
          {(["pratique", "info", "repere"] as const).map((tag) => (
            <li key={tag} className="flex items-center gap-2">
              <Etiquette tag={tag} />
              {d.chantier.legende[tag]}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sprints" className="flex flex-col gap-4">
        <h2 id="sprints" className="font-serif text-h2 font-semibold text-encre">
          {d.chantier.sprintsTitre}
        </h2>
        <ol className="flex flex-col gap-3">
          {SPRINTS.map((sprint, i) => {
            const { cochees: n, total, termine } = avancements[i];
            return (
              <li key={sprint.slug}>
                <Link
                  href={`${CHANTIER_HOME}/${sprint.slug}`}
                  className={`${CARD} flex flex-col gap-2 p-4 transition-colors
                    hover:border-encre sm:flex-row sm:items-start sm:gap-4`}
                >
                  <span
                    className={
                      termine
                        ? "inline-flex size-9 shrink-0 items-center justify-center rounded-full " +
                          "bg-success text-small font-semibold text-on-encre"
                        : "inline-flex size-9 shrink-0 items-center justify-center rounded-full " +
                          "bg-sand text-small font-semibold text-ink-muted"
                    }
                    aria-hidden="true"
                  >
                    {termine ? "✓" : sprint.numero}
                  </span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="text-caption uppercase text-ink-muted">
                      {interpolate(d.chantier.sprint, { n: String(sprint.numero) })}
                      {termine && ` · ${d.chantier.termine}`}
                    </span>
                    <span className="font-serif text-h3 font-semibold text-encre">
                      {sprint.titre}
                    </span>
                    <span className="max-w-prose text-small text-ink-muted">
                      <InlineText texte={sprint.lede} />
                    </span>
                  </span>
                  <span className="shrink-0 text-caption text-ink-muted">
                    {interpolate(d.chantier.cases, { n: String(n), total: String(total) })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
