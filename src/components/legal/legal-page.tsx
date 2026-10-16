/**
 * =============================================================
 *  Fichier    : legal-page.tsx
 *  Projet     : Kalami
 *  Description: Gabarit des pages légales publiques (/confidentialite, /conditions,
 *               /conditions-de-vente et leurs équivalents sous /strategie).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/legal/legal-text.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { getDictionary } from "@/i18n";
import type { LegalKind } from "@/lib/legal/kinds";

import { LegalText } from "./legal-text";

const t = getDictionary();

/** Métadonnées d'une page légale. */
export function legalMetadata(kind: LegalKind): Metadata {
  return { title: t.legal.kinds[kind] };
}

/** Contenu d'une page légale, en largeur de lecture. */
export function LegalPage({ kind }: { kind: LegalKind }) {
  return (
    <main id="contenu" className="mx-auto flex w-full max-w-prose flex-col gap-6 px-4 py-10">
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <LegalText kind={kind} />
      </Suspense>
    </main>
  );
}
