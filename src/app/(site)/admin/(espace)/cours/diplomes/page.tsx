/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/diplomes)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Évaluation et diplômes (v0.38.0) : réglages d'évaluation (seuils, poids
 *               de la note finale, mentions), puis liste des diplômes délivrés avec
 *               correction du nom imprimé, téléchargement du PDF et lien de vérification.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/{admin-queries,admin-actions,acces}.ts,
 *               components/admin/action-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { CoursNav } from "@/components/admin/cours/cours-nav";
import { Field } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { requireAdmin } from "@/lib/auth/dal";
import { reglagesEvaluation } from "@/lib/cours/acces";
import { enregistrerEvaluation, renommerDiplome } from "@/lib/cours/admin-actions";
import { listerDiplomes } from "@/lib/cours/admin-queries";
import { NOM_MAX, NOM_MIN } from "@/lib/cours/note-finale";
import { DATE_TIME_FORMAT } from "@/lib/format/date";

const t = getCourseDictionary();
const d = t.admin.diplomes;

export const metadata: Metadata = { title: d.titre };

export default function AdminCoursDiplomesPage() {
  return (
    <main className="flex flex-col gap-8">
      <CoursNav actif="diplomes" titre={d.titre} />
      <p className="max-w-3xl text-small text-ink-muted">{d.intro}</p>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <Evaluation />
      </Suspense>
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
        <Diplomes />
      </Suspense>
    </main>
  );
}

// ==================== ÉVALUATION ====================

/** Formulaire des réglages d'évaluation, prérempli (administrateur aal2). */
async function Evaluation() {
  await requireAdmin();
  const r = await reglagesEvaluation();
  const champ = (label: string, name: string, valeur: number, hint?: string) => (
    <Field
      label={label}
      name={name}
      type="number"
      min={0}
      max={100}
      step={1}
      required
      inputMode="numeric"
      defaultValue={String(valeur)}
      hint={hint}
    />
  );

  return (
    <section className={`${CARD} flex flex-col gap-4 p-6`}>
      <h2 className="font-serif text-xl font-semibold">{d.evaluation}</h2>
      <ActionForm action={enregistrerEvaluation} submitLabel={d.enregistrer}>
        <div className="grid gap-4 sm:grid-cols-2">
          {champ(d.seuilQuiz, "quiz_threshold", r.seuilQuiz, d.aideSeuil)}
          {champ(d.seuilExamen, "exam_threshold", r.seuilExamen, d.aideSeuil)}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {champ(d.poidsQuiz, "weight_quizzes", r.poidsQuiz, d.aidePoids)}
          {champ(d.poidsExercices, "weight_exercises", r.poidsExercices)}
          {champ(d.poidsExamen, "weight_exam", r.poidsExamen)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {champ(d.mentionBien, "honours_good", r.mentionBien, d.aideMention)}
          {champ(d.mentionTresBien, "honours_very_good", r.mentionTresBien)}
        </div>
      </ActionForm>
    </section>
  );
}

// ==================== DIPLÔMES ====================

/** Diplômes délivrés : nom corrigeable, PDF et vérification. */
async function Diplomes() {
  await requireAdmin();
  const diplomes = await listerDiplomes();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-xl font-semibold">{d.delivres}</h2>
      {diplomes.length === 0 ? (
        <p className="text-small text-ink-muted">{d.aucun}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {diplomes.map((x) => (
            <li key={x.id} className={`${CARD} flex flex-col gap-3 p-5`}>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-small">
                <span className="font-mono">{x.numero}</span>
                <span className="font-semibold">{x.nom}</span>
                <span>
                  {d.mention} : {t.diplome.mentions[x.mention]}
                </span>
                <span>
                  {d.finale} : {x.finale}
                </span>
                <span className="text-ink-muted">
                  {d.date} {DATE_TIME_FORMAT.format(new Date(x.delivreLe))}
                </span>
                {x.corrigeLe && (
                  <span className="text-ink-muted">
                    {interpolate(d.corrige, {
                      date: DATE_TIME_FORMAT.format(new Date(x.corrigeLe)),
                    })}
                  </span>
                )}
              </div>
              <ActionForm action={renommerDiplome.bind(null, x.id)} submitLabel={d.corriger}>
                <Field
                  label={d.nom}
                  name="name"
                  id={`nom-${x.id}`}
                  required
                  minLength={NOM_MIN}
                  maxLength={NOM_MAX}
                  defaultValue={x.nom}
                />
              </ActionForm>
              <div className="flex flex-wrap gap-4 text-small">
                <a
                  href={`/api/strategie/cours/diplome/${x.numero}`}
                  className="text-encre underline"
                  download
                >
                  {d.pdf}
                </a>
                <Link
                  href={`/strategie/cours/diplome/${x.numero}`}
                  className="text-encre underline"
                >
                  {d.verifier}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
