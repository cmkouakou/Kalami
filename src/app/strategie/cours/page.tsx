/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Accueil du cours : présentation, programme (13 modules), et pour
 *               l'apprenant connecté sa progression (leçons terminées, pourcentage,
 *               temps de formation), le lien « Reprendre » et l'état de chaque leçon.
 *               Le programme est public ; la partie personnelle est chargée à part.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/*, lib/auth/dal.ts, components/cours/sans-acces.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SansAcces } from "@/components/cours/sans-acces";
import {
  BADGE,
  BUTTON_PRIMARY,
  CARD,
  PANEL_SAND,
} from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { aAccesAuCours, progressionApprenant } from "@/lib/cours/acces";
import { estRedigee } from "@/lib/cours/lecons";
import { LECONS, MODULES, adresseLecon, leconParId } from "@/lib/cours/modules";
import {
  dureeLisible,
  synthese,
  type LigneProgression,
} from "@/lib/cours/notation";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath } from "@/lib/auth/routes";

const t = getCourseDictionary();

/** Adresse de cette page (retour après connexion). */
const ACCUEIL = "/strategie/cours";

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
};

/** État d'une leçon pour l'apprenant. */
type Etat = "terminee" | "enCours";

// ==================== PROGRAMME ====================

/** Programme complet ; avec les états de l'apprenant quand ils sont connus. */
function Programme({ etats }: { etats?: Map<string, Etat> }) {
  return (
    <ol className="flex flex-col gap-4">
      {MODULES.map((m) => (
        <li key={m.id} className={`${CARD} flex flex-col gap-3 p-5`}>
          <div className="flex flex-col gap-1">
            <p className="text-caption uppercase text-ink-muted">
              {interpolate(t.accueil.module, { n: String(m.numero) })}
              {" · "}
              {interpolate(t.accueil.chapitre, { n: String(m.chapitreLivre) })}
            </p>
            <h2 className="font-serif text-h3">{m.titre}</h2>
          </div>
          <ol className="flex flex-col divide-y divide-line">
            {m.lecons.map((l) => {
              const etat = etats?.get(l.id);
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  {estRedigee(l.id) ? (
                    <Link
                      href={adresseLecon(m, l)}
                      className="text-encre underline-offset-4 hover:underline"
                    >
                      {l.numero}. {l.titre}
                    </Link>
                  ) : (
                    <span className="text-ink-muted">
                      {l.numero}. {l.titre}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-small text-ink-muted">
                    {etat && <span className={BADGE}>{t.accueil[etat]}</span>}
                    {!estRedigee(l.id) && <span>{t.accueil.bientot}</span>}
                    {interpolate(t.accueil.minutes, { n: String(l.minutes) })}
                  </span>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}

// ==================== PROGRESSION ====================

/** Leçon à reprendre : première commencée non terminée, sinon première non terminée. */
function aReprendre(lignes: LigneProgression[]) {
  const terminees = new Set(
    lignes.filter((l) => l.completed_at).map((l) => l.lesson_id),
  );
  const commencees = new Set(lignes.map((l) => l.lesson_id));
  const restantes = LECONS.filter(
    (l) => !terminees.has(l.id) && estRedigee(l.id),
  );
  const lecon = restantes.find((l) => commencees.has(l.id)) ?? restantes[0];
  return lecon ? leconParId(lecon.id) : null;
}

/** Panneau de progression de l'apprenant. */
function Progression({ lignes }: { lignes: LigneProgression[] }) {
  const s = synthese(lignes);
  const reprise = aReprendre(lignes);
  return (
    <section className={`${PANEL_SAND} flex flex-col gap-4 p-6`}>
      <h2 className="font-serif text-h2">{t.accueil.progression}</h2>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s.pourcentage}
        aria-label={t.accueil.progression}
        className="h-3 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full bg-encre"
          style={{ width: `${s.pourcentage}%` }}
        />
      </div>
      <p>
        <span className="font-semibold">{s.pourcentage} %</span>
        {" · "}
        {interpolate(t.accueil.terminees, {
          n: String(s.terminees),
          total: String(s.total),
        })}
        {" · "}
        {interpolate(t.accueil.temps, { duree: dureeLisible(s.secondes) })}
      </p>
      {reprise && (
        <Link
          href={adresseLecon(reprise.module, reprise.lecon)}
          className={`${BUTTON_PRIMARY} self-start`}
        >
          {lignes.length === 0
            ? t.accueil.commencer
            : interpolate(t.accueil.reprendre, { titre: reprise.lecon.titre })}
        </Link>
      )}
    </section>
  );
}

/** Partie personnelle : connexion, accès, progression et programme annoté. */
async function EspaceApprenant() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Link
          href={authPath("connexion", ACCUEIL)}
          className={`${BUTTON_PRIMARY} self-start`}
        >
          {t.erreurs.connexion}
        </Link>
        <Programme />
      </>
    );
  }
  if (!(await aAccesAuCours())) {
    return (
      <>
        <SansAcces email={user.email} />
        <Programme />
      </>
    );
  }

  const lignes = await progressionApprenant();
  const etats = new Map<string, Etat>(
    lignes.map((l) => [l.lesson_id, l.completed_at ? "terminee" : "enCours"]),
  );
  return (
    <>
      <Progression lignes={lignes} />
      <Programme etats={etats} />
    </>
  );
}

// ==================== PAGE ====================

export default function CoursPage() {
  return (
    <main className="flex flex-col gap-10">
      {/* ==================== PRÉSENTATION ==================== */}
      <header className="flex flex-col gap-3">
        <p className="text-caption uppercase text-ink-muted">
          {t.accueil.eyebrow}
        </p>
        <h1 className="font-serif text-h1 font-semibold">{t.title}</h1>
        <p className="max-w-2xl text-ink-muted">{t.description}</p>
      </header>

      {/* ==================== PROGRESSION ET PROGRAMME ==================== */}
      <Suspense fallback={<Programme />}>
        <EspaceApprenant />
      </Suspense>

      <p className="max-w-2xl text-small text-ink-muted">{t.privacy}</p>
    </main>
  );
}
