/**
 * =============================================================
 *  Fichier    : page.tsx (powerbi/chantier/[sprint])
 *  Projet     : Kalami Données
 *  Description: Page d'un sprint du chantier BRVM Power BI : objectif, sections
 *               numérotées, notions dépliables, visuels et cases de fin de sprint
 *               enregistrées sur le compte. Les 7 adresses sont connues à la construction ;
 *               le contenu privé est lu dans une zone Suspense.
 *  Auteur     : Claude Marcel
 *               v1.1 (v0.21.0) : cadre du guide powerbi4you (en-tête, sommaire des
 *               sprints, carte, pied « précédent / prochain »).
 *               v1.2 (v0.21.2) : « Chantier terminé » au pied du dernier sprint.
 *  Version    : 1.2
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/guide, components/powerbi, lib/auth/dal.ts, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Footfoot, LegendeChantier, Sommaire, Topbar } from "@/components/powerbi/guide-shell";
import { InlineText } from "@/components/powerbi/inline-text";
import { LessonBlocks } from "@/components/powerbi/lesson-blocks";
import { interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { requirePowerbiAccess } from "@/lib/auth/dal";
import { CHANTIER_HOME } from "@/lib/auth/routes";
import { texteBrut } from "@/lib/powerbi/inline";
import { getProgressionChantier } from "@/lib/powerbi/guide/progress";
import {
  getAvancementSprint,
  getSprint,
  getSprintsVoisins,
  SPRINTS,
} from "@/lib/powerbi/guide/sprints";

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
  await requirePowerbiAccess(`${CHANTIER_HOME}/${slug}`);

  const sprint = getSprint(slug);
  if (!sprint) notFound();

  const progression = await getProgressionChantier();
  const cochees = new Set(progression.coches);
  const avancements = SPRINTS.map((s) => getAvancementSprint(s, cochees));
  const termines = avancements.filter((a) => a.termine).length;
  const { precedent, suivant } = getSprintsVoisins(slug);
  const etiquette = (n: number) => interpolate(d.chantier.sprint, { n: String(n) });

  return (
    <>
      <Topbar
        surtitre={<Link href={CHANTIER_HOME}>{d.chantier.surtitre}</Link>}
        titre={d.chantier.titre}
        intro={d.chantier.intro}
        avancement={{ valeur: termines, total: SPRINTS.length, libelle: d.chantier.termines }}
      >
        <LegendeChantier />
      </Topbar>

      <div className="layout">
        <Sommaire
          nom={d.chantier.sommaireNom}
          lienTete={CHANTIER_HOME}
          entrees={SPRINTS.map((s, i) => ({
            href: `${CHANTIER_HOME}/${s.slug}`,
            num: `S${s.numero}`,
            libelle: s.titre,
            fait: avancements[i].termine,
            courant: s.slug === slug,
          }))}
        />

        <article className="card stack">
          <div className="sprint-head">
            <span className="tag">{etiquette(sprint.numero)}</span>
            <h2>{sprint.titre}</h2>
          </div>
          <p className="lede">
            <InlineText texte={sprint.lede} />
          </p>

          <LessonBlocks contenu={sprint.contenu} progression={progression} />

          <Footfoot
            nom={d.chantier.navigation}
            position={interpolate(d.chantier.position, {
              n: String(sprint.numero),
              total: String(SPRINTS.length),
              titre: sprint.titre,
            })}
            motPrecedent={d.chantier.precedent}
            motSuivant={d.chantier.suivant}
            fin={d.chantier.fin}
            precedent={
              precedent && {
                href: `${CHANTIER_HOME}/${precedent.slug}`,
                libelle: etiquette(precedent.numero),
              }
            }
            suivant={
              suivant && {
                href: `${CHANTIER_HOME}/${suivant.slug}`,
                libelle: `${etiquette(suivant.numero)} — ${suivant.titre}`,
              }
            }
          />
        </article>
      </div>
    </>
  );
}
