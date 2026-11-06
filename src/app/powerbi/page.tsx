/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi)
 *  Projet     : Kalami Données
 *  Description: Accueil du parcours PL-300 : présentation, avancement de la rédaction,
 *               puis les modules avec leurs leçons. Une leçon non rédigée reste visible
 *               mais grisée, pour que la carte du parcours soit complète dès le départ.
 *               Contenu lu dans une zone Suspense, comme les autres pages privées, pour
 *               que la page ne bloque plus le pré-affichage (v0.17.1).
 *               v1.2 (v0.21.0) : cadre du guide powerbi4you (en-tête, sommaire des
 *               modules, une carte par module).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/modules.ts, components/powerbi, lib/auth/dal.ts, i18n
 * =============================================================
 */

import Link from "next/link";
import { Suspense } from "react";

import { Sommaire, Topbar } from "@/components/powerbi/guide-shell";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requirePowerbiAccess } from "@/lib/auth/dal";
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
  await requirePowerbiAccess(POWERBI_HOME);
  const { pretes, total } = getAvancement();

  return (
    <>
      <Topbar
        surtitre={d.accueil.surtitre}
        titre={d.accueil.titre}
        intro={d.accueil.intro}
        avancement={{ valeur: pretes, total, libelle: d.accueil.redigees }}
      />

      <div className="layout">
        <Sommaire
          nom={d.accueil.sommaireNom}
          entrees={MODULES.map((m) => ({
            href: `#${m.slug}`,
            num: `M${m.rang}`,
            libelle: m.titre,
          }))}
        />

        <div className="stack">
          {MODULES.map((module) => (
            <ModuleCard key={module.slug} module={module} />
          ))}
        </div>
      </div>
    </>
  );
}

/** Un module et la liste de ses leçons. */
function ModuleCard({ module }: { module: Module }) {
  return (
    <section id={module.slug} className="card" aria-labelledby={`titre-${module.slug}`}>
      <div className="sprint-head">
        <span className="tag">{interpolate(d.accueil.module, { n: String(module.rang) })}</span>
        <h2 id={`titre-${module.slug}`}>{module.titre}</h2>
      </div>
      <p className="lede">{module.resume}</p>
      <p className="discret">
        {interpolate(d.accueil.lecons, { n: String(module.lecons.length) })}
      </p>

      <ul className="lecons">
        {module.lecons.map((lecon, i) => {
          const minutes = interpolate(d.accueil.minutes, { n: String(lecon.minutes) });
          const redigee = aUnResume(module.slug, lecon.slug);
          const contenu = (
            <>
              <span className="n">{i + 1}</span>
              <span className="titre">{lecon.titre}</span>
              {!redigee && <span className="step-tag info">{d.accueil.aVenir}</span>}
              <span className="duree">{minutes}</span>
              <span className="accroche">{lecon.accroche}</span>
            </>
          );

          if (!redigee) {
            return (
              <li key={lecon.slug} className="a-venir">
                {contenu}
              </li>
            );
          }
          return (
            <li key={lecon.slug}>
              <Link href={`${POWERBI_HOME}/${module.slug}/${lecon.slug}`}>{contenu}</Link>
            </li>
          );
        })}
      </ul>

      {module.microsoftLearn && (
        <p className="msref">
          <span className="ms">Microsoft Learn</span>
          <a href={module.microsoftLearn} target="_blank" rel="noopener noreferrer">
            {d.lecon.source}
          </a>
        </p>
      )}
    </section>
  );
}
