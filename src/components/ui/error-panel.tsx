/**
 * =============================================================
 *  Fichier    : error-panel.tsx
 *  Projet     : Kalami
 *  Description: Contenu des pages d'erreur (error.tsx) : message clair, bouton « Réessayer »
 *               et retour à l'accueil. Aucun détail technique affiché, seulement la
 *               référence (digest) qui permet de retrouver l'erreur dans les journaux Vercel.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: components/ui/styles.ts, i18n
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useEffect } from "react";

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";

const t = getDictionary();

type Props = {
  /** Valeur levée (Error côté serveur, valeur quelconque côté client). */
  error: unknown;
  /** Recharge les données puis réaffiche le segment. */
  retry: () => void;
  /** Accueil de l'espace (librairie ou Stratégie). */
  homeHref: string;
};

/**
 * Lit la référence d'une erreur serveur, si elle existe.
 * @param error - Valeur levée
 * @returns Digest Next.js, ou null
 */
function digestOf(error: unknown): string | null {
  if (error instanceof Error && "digest" in error && typeof error.digest === "string") {
    return error.digest;
  }
  return null;
}

export function ErrorPanel({ error, retry, homeHref }: Props) {
  const digest = digestOf(error);

  // Trace dans la console du navigateur (et dans les journaux Vercel côté serveur)
  useEffect(() => {
    console.error("[kalami] page en erreur :", error);
  }, [error]);

  return (
    <main
      id="contenu"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-16"
    >
      <h1 className="font-serif text-h1">{t.error.title}</h1>
      <p className="text-body text-ink-muted">{t.error.text}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className={BUTTON_PRIMARY}>
          {t.pwa.retry}
        </button>
        <Link href={homeHref} className={BUTTON_SECONDARY}>
          {t.pwa.backHome}
        </Link>
      </div>
      {digest && (
        <p className="text-small text-ink-muted">
          {interpolate(t.error.reference, { digest })}
        </p>
      )}
    </main>
  );
}
