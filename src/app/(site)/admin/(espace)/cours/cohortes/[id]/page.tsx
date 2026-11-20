/**
 * =============================================================
 *  Fichier    : page.tsx (admin/cours/cohortes/[id])
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Calendrier de diffusion d'une cohorte (v0.33.0) : activation, lecture
 *               en avance, fuseau et dates d'ouverture des modules et des leçons, avec
 *               un générateur. Réservé à l'administrateur (aal2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/admin-queries.ts, components/admin/cours/calendrier-cohorte.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CalendrierCohorte } from "@/components/admin/cours/calendrier-cohorte";
import { getCourseDictionary } from "@/i18n/course";
import { isUuid } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/dal";
import { lireCalendrierCohorte } from "@/lib/cours/admin-queries";

const c = getCourseDictionary().admin.calendrier;

export const metadata: Metadata = { title: c.titre };

type Props = PageProps<"/admin/cours/cohortes/[id]">;

export default function AdminCoursCalendrierPage(props: Props) {
  return (
    <main className="flex flex-col gap-8">
      <Link href="/admin/cours/cohortes" className="text-sm text-encre underline">
        ← {c.retour}
      </Link>
      <Suspense
        fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}
      >
        <Contenu {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** En-tête de la cohorte et formulaire du calendrier. */
async function Contenu({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const cal = isUuid(id) ? await lireCalendrierCohorte(id) : null;
  if (!cal) {
    return (
      <>
        <h1 className="font-serif text-3xl font-semibold">{c.titre}</h1>
        <p className="text-ink-muted">{c.introuvable}</p>
      </>
    );
  }
  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{c.titre}</p>
        <h1 className="font-serif text-3xl font-semibold">{cal.cohorte.name}</h1>
        <p className="max-w-2xl text-small text-ink-muted">{c.intro}</p>
      </header>
      <CalendrierCohorte
        cohorteId={cal.cohorte.id}
        active={cal.active}
        lectureAvance={cal.lectureAvance}
        fuseau={cal.fuseau}
        jours={cal.jours}
      />
    </>
  );
}
