/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi/[module]/[lecon])
 *  Projet     : Kalami Données
 *  Description: Page d'une leçon : son résumé, le lien vers la page officielle Microsoft
 *               Learn dont elle vient, et la navigation vers les leçons voisines. Une
 *               leçon encore sans résumé affiche une explication plutôt qu'une erreur,
 *               pour que la carte du parcours reste parcourable de bout en bout.
 *               v0.17.1 : les 25 adresses sont connues à la construction, et le contenu
 *               privé est lu dans une zone Suspense ; la navigation ne mène plus qu'aux
 *               leçons rédigées, avec flèches comme le guide d'origine.
 *  Auteur     : Claude Marcel
 *               v1.2 (v0.21.0) : cadre du guide powerbi4you (en-tête du module,
 *               sommaire des leçons, carte, pied « précédente / suivante »).
 *  Version    : 1.2
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/modules.ts, lib/powerbi/lessons, components/powerbi
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Footfoot, Sommaire, Topbar } from "@/components/powerbi/guide-shell";
import { LessonBlocks } from "@/components/powerbi/lesson-blocks";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requirePowerbiAccess } from "@/lib/auth/dal";
import { POWERBI_HOME } from "@/lib/auth/routes";
import { getResume } from "@/lib/powerbi/lessons";
import { getLesson, getToutesLesLecons, getVoisines } from "@/lib/powerbi/modules";

const d = getPowerbiDictionary();

type Params = Promise<{ module: string; lecon: string }>;

/** Les 25 leçons du parcours, pré-affichées à la construction. */
export function generateStaticParams(): { module: string; lecon: string }[] {
  return getToutesLesLecons().map((e) => ({ module: e.module.slug, lecon: e.lecon.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { module: moduleSlug, lecon: lessonSlug } = await params;
  const trouve = getLesson(moduleSlug, lessonSlug);
  if (!trouve) return {};
  return { title: trouve.lecon.titre, description: trouve.lecon.accroche };
}

export default function LeconPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
      <Lecon params={params} />
    </Suspense>
  );
}

/** Contenu privé de la leçon : lu dans une zone Suspense (cookies de session). */
async function Lecon({ params }: { params: Params }) {
  await requirePowerbiAccess(POWERBI_HOME);

  const { module: moduleSlug, lecon: lessonSlug } = await params;
  const trouve = getLesson(moduleSlug, lessonSlug);
  if (!trouve) notFound();

  const { module, lecon } = trouve;
  const contenu = await getResume(moduleSlug, lessonSlug);
  const { precedente, suivante } = getVoisines(moduleSlug, lessonSlug);
  const rangLecon = module.lecons.findIndex((l) => l.slug === lessonSlug) + 1;
  const adresse = (m: string, l: string) => `${POWERBI_HOME}/${m}/${l}`;

  return (
    <>
      <Topbar
        surtitre={
          <Link href={POWERBI_HOME}>
            {interpolate(d.lecon.surtitre, { n: String(module.rang) })}
          </Link>
        }
        titre={module.titre}
        intro={module.resume}
      />

      <div className="layout">
        <Sommaire
          nom={d.lecon.sommaireNom}
          lienTete={`${POWERBI_HOME}#${module.slug}`}
          entrees={module.lecons.map((l, i) => ({
            href: adresse(module.slug, l.slug),
            num: `L${i + 1}`,
            libelle: l.titre,
            courant: l.slug === lessonSlug,
          }))}
        />

        <article className="card stack">
          <div className="sprint-head">
            <span className="tag">
              {interpolate(d.lecon.numero, {
                n: String(rangLecon),
                minutes: interpolate(d.accueil.minutes, { n: String(lecon.minutes) }),
              })}
            </span>
            <h2>{lecon.titre}</h2>
          </div>
          <p className="lede">{lecon.accroche}</p>

          {contenu ? (
            <LessonBlocks contenu={contenu} />
          ) : (
            <aside className="callout info">
              <p>
                <b>{d.lecon.nonRedigee}</b> {d.lecon.nonRedigeeAide}
              </p>
            </aside>
          )}

          {lecon.microsoftLearn && (
            <p className="msref">
              <span className="ms">Microsoft Learn</span>
              <a href={lecon.microsoftLearn} target="_blank" rel="noopener noreferrer">
                {d.lecon.source}
              </a>
            </p>
          )}

          <Footfoot
            nom={d.lecon.navigation}
            position={interpolate(d.lecon.position, {
              n: String(rangLecon),
              total: String(module.lecons.length),
              module: module.titre,
            })}
            motPrecedent={d.lecon.precedente}
            motSuivant={d.lecon.suivante}
            precedent={
              precedente && {
                href: adresse(precedente.module.slug, precedente.lecon.slug),
                libelle: precedente.lecon.titre,
              }
            }
            suivant={
              suivante && {
                href: adresse(suivante.module.slug, suivante.lecon.slug),
                libelle: suivante.lecon.titre,
              }
            }
          />
        </article>
      </div>
    </>
  );
}
