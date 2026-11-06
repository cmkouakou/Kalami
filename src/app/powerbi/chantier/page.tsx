/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi/chantier)
 *  Projet     : Kalami Données
 *  Description: Accueil du chantier BRVM Power BI : présentation, repères de lecture
 *               (Pratique, Info, Repère), anneau d'avancement et les 7 sprints avec leurs
 *               cases cochées. Contenu privé lu dans une zone Suspense.
 *               v1.1 (v0.21.0) : cadre du guide powerbi4you (en-tête, sommaire, cartes).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/guide, components/powerbi, lib/auth/dal.ts, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LegendeChantier, Sommaire, Topbar } from "@/components/powerbi/guide-shell";
import { InlineText } from "@/components/powerbi/inline-text";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requirePowerbiAccess } from "@/lib/auth/dal";
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
  await requirePowerbiAccess(CHANTIER_HOME);
  const { coches } = await getProgressionChantier();
  const cochees = new Set(coches);
  const avancements = SPRINTS.map((s) => getAvancementSprint(s, cochees));
  const termines = avancements.filter((a) => a.termine).length;

  return (
    <>
      <Topbar
        surtitre={d.chantier.surtitre}
        titre={d.chantier.titre}
        intro={d.chantier.intro}
        avancement={{ valeur: termines, total: SPRINTS.length, libelle: d.chantier.termines }}
      >
        <LegendeChantier />
      </Topbar>

      <div className="layout">
        <Sommaire
          nom={d.chantier.sommaireNom}
          entrees={SPRINTS.map((s, i) => ({
            href: `${CHANTIER_HOME}/${s.slug}`,
            num: `S${s.numero}`,
            libelle: s.titre,
            fait: avancements[i].termine,
          }))}
        />

        <ol className="stack">
          {SPRINTS.map((sprint, i) => {
            const { cochees: n, total, termine } = avancements[i];
            return (
              <li key={sprint.slug} className="card">
                <div className="sprint-head">
                  <span className="tag">
                    {interpolate(d.chantier.sprint, { n: String(sprint.numero) })}
                  </span>
                  <h2>
                    <Link href={`${CHANTIER_HOME}/${sprint.slug}`}>{sprint.titre}</Link>
                  </h2>
                  {termine && <span className="step-tag recap">{d.chantier.termine}</span>}
                </div>
                <p className="lede">
                  <InlineText texte={sprint.lede} />
                </p>
                <p className="discret">
                  {interpolate(d.chantier.cases, { n: String(n), total: String(total) })}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
