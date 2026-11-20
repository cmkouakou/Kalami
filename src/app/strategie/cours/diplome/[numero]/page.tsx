/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cours/diplome/[numero])
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Vérification publique d'un diplôme (lien imprimé sur le PDF). Affiche
 *               seulement le titulaire, le cours, la date et la mention, jamais la note.
 *               Non indexée. Lecture par la fonction SQL verify_course_diploma (anonyme).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/note-finale.ts, lib/supabase/public.ts, cours.css
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";
import { estMention, lireNumero } from "@/lib/cours/note-finale";
import { createPublicClient } from "@/lib/supabase/public";

import "../../cours.css";

const t = getCourseDictionary();

export const metadata: Metadata = {
  title: t.diplome.verification.titre,
  robots: { index: false, follow: false },
};

/** Ligne renvoyée par verify_course_diploma. */
type LigneVerification = { printed_name: string; issued_at: string; honours: string };

/** Date longue (« 20 novembre 2026 »). */
function dateLongue(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Africa/Abidjan",
  }).format(new Date(iso));
}

// ==================== RÉSULTAT ====================

/** Résultat de la vérification pour le numéro demandé. */
async function Resultat({ params }: { params: Promise<{ numero: string }> }) {
  const numero = lireNumero((await params).numero);
  const v = t.diplome.verification;
  if (!numero) return <p className={`${PANEL_SAND} p-6`}>{v.introuvable}</p>;

  const { data, error } = await createPublicClient().rpc("verify_course_diploma", {
    p_number: numero,
  });
  const ligne = error ? null : ((data as LigneVerification[] | null)?.[0] ?? null);
  if (!ligne || !estMention(ligne.honours)) {
    return <p className={`${PANEL_SAND} p-6`}>{v.introuvable}</p>;
  }

  const lignes = [
    [v.nom, ligne.printed_name],
    [v.cours, t.diplome.pdf.intitule],
    [v.date, dateLongue(ligne.issued_at)],
    [v.mention, t.diplome.mentions[ligne.honours]],
  ] as const;
  return (
    <section className={`${CARD} flex flex-col gap-4 p-6`}>
      <p className="font-semibold text-success">{v.valide}</p>
      <p className="font-mono text-small">{numero}</p>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        {lignes.map(([terme, valeur]) => (
          <div key={terme} className="contents">
            <dt className="text-small text-ink-muted">{terme}</dt>
            <dd className="font-semibold">{valeur}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ==================== PAGE ====================

export default function VerificationPage({
  params,
}: PageProps<"/strategie/cours/diplome/[numero]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="font-serif text-h1 font-semibold">{t.diplome.verification.titre}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-48 animate-pulse" />}>
        <Resultat params={params} />
      </Suspense>
    </main>
  );
}
