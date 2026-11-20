/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/suivi/[id])
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Fiche d'un apprenant (v0.29.0) : compte, cohorte et origine de l'accès,
 *               synthèse (achèvement, temps, moyenne), progression module par module
 *               avec l'état, le temps et les notes de chaque leçon, puis le temps de
 *               formation jour par jour (90 derniers jours).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, lib/cours/suivi.ts, lib/cours/notation.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BADGE, CARD, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { isUuid } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/dal";
import {
  type FicheApprenant,
  lireFicheApprenant,
} from "@/lib/cours/admin-queries";
import { LECONS } from "@/lib/cours/modules";
import { dureeLisible } from "@/lib/cours/notation";
import { ficheParModule, type ModuleFiche } from "@/lib/cours/suivi";
import { DATE_FORMAT } from "@/lib/format/date";

const a = getCourseDictionary().admin;
const f = a.fiche;
const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const metadata: Metadata = { title: f.titre };

type Props = PageProps<"/admin/cours/suivi/[id]">;

export default function AdminCoursFichePage(props: Props) {
  return (
    <main className="flex flex-col gap-8">
      <Link href="/admin/cours/suivi" className="text-sm text-encre underline">
        ← {f.retour}
      </Link>
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <Fiche {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Fiche complète (administrateur aal2). */
async function Fiche({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const fiche = isUuid(id) ? await lireFicheApprenant(id) : null;
  if (!fiche) {
    return (
      <>
        <h1 className="font-serif text-3xl font-semibold">{f.titre}</h1>
        <p className="text-ink-muted">{f.introuvable}</p>
      </>
    );
  }
  const modules = ficheParModule(fiche.progression, fiche.tentatives);
  return (
    <>
      <Identite fiche={fiche} />
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">{f.modules}</h2>
        <ul className="flex flex-col gap-3">
          {modules.map((mod) => (
            <BlocModule key={mod.id} mod={mod} />
          ))}
        </ul>
      </section>
      <Jours jours={fiche.jours} />
    </>
  );
}

/** Compte, cohorte, origine et synthèse chiffrée. */
function Identite({ fiche }: { fiche: FicheApprenant }) {
  const ap = fiche.apprenant;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="break-all font-serif text-3xl font-semibold">
          {ap.email ?? ap.user_id}
        </h1>
        {ap.display_name && <p className="text-ink-muted">{ap.display_name}</p>}
        <p className="text-small text-ink-muted">
          {interpolate(f.cohorte, { nom: ap.cohort_name ?? a.sansCohorte })}
          {" · "}
          {interpolate(f.depuis, {
            date: DATE_FORMAT.format(new Date(ap.granted_at)),
            origine: a.source[ap.source],
          })}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        <li className={`${PANEL_SAND} p-4`}>
          {interpolate(f.progression, {
            terminees: String(ap.terminees),
            total: String(LECONS.length),
            pourcentage: String(ap.pourcentage),
          })}
        </li>
        <li className={`${PANEL_SAND} p-4`}>
          {interpolate(f.temps, { duree: dureeLisible(ap.seconds ?? 0) })}
        </li>
        <li className={`${PANEL_SAND} p-4`}>
          {ap.moyenne === null
            ? f.sansNote
            : interpolate(f.moyenne, {
                moyenne: NOMBRE.format(ap.moyenne),
                n: String(ap.exercises ?? 0),
              })}
        </li>
      </ul>
    </section>
  );
}

/** Un module : résumé et leçons (replié tant que rien n'y est commencé). */
function BlocModule({ mod }: { mod: ModuleFiche }) {
  const commence = mod.lecons.some((l) => l.etat !== "aFaire");
  return (
    <li className={CARD}>
      <details open={commence}>
        <summary
          className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between
          gap-2 p-4"
        >
          <span className="font-semibold">
            {interpolate(f.module, { n: String(mod.numero), titre: mod.titre })}
          </span>
          <span className="text-small text-ink-muted">
            {interpolate(f.moduleResume, {
              terminees: String(mod.terminees),
              total: String(mod.total),
              duree: dureeLisible(mod.secondes),
            })}
          </span>
        </summary>
        <ul className="flex flex-col gap-2 border-t border-line p-4">
          {mod.lecons.map((l) => (
            <li key={l.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  {l.numero}. {l.titre}
                </span>
                <span className={BADGE}>{f.etat[l.etat]}</span>
                {l.secondes > 0 && (
                  <span className="text-small text-ink-muted">
                    {dureeLisible(l.secondes)}
                  </span>
                )}
              </div>
              {l.notes.map((n) => (
                <p key={n.exercice} className="pl-4 text-small text-ink-muted">
                  {interpolate(f.note, {
                    n: n.exercice.split("-e")[1] ?? n.exercice,
                    score: NOMBRE.format(n.meilleure),
                    essais: String(n.essais),
                  })}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

/** Temps de formation jour par jour. */
function Jours({ jours }: { jours: FicheApprenant["jours"] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl font-semibold">{f.jours}</h2>
      {jours.length === 0 ? (
        <p className="text-ink-muted">{f.aucunJour}</p>
      ) : (
        <ul className="grid gap-x-6 gap-y-1 text-small sm:grid-cols-2 lg:grid-cols-3">
          {jours.map((j) => (
            <li
              key={j.day}
              className="flex justify-between gap-4 border-b border-line py-1"
            >
              <span>{DATE_FORMAT.format(new Date(`${j.day}T12:00:00Z`))}</span>
              <span>{dureeLisible(j.seconds)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
