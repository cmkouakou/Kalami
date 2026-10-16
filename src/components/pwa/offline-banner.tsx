/**
 * =============================================================
 *  Fichier    : offline-banner.tsx
 *  Projet     : Kalami
 *  Description: Bandeau « Vous êtes hors ligne », annoncé aux lecteurs d'écran. Next.js
 *               (experimental.useOffline) suit la connexion et relance seul les navigations
 *               et actions serveur bloquées au retour du réseau.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: next/offline, i18n
 * =============================================================
 */

"use client";

import { useOffline } from "next/offline";

import { getDictionary } from "@/i18n";

const t = getDictionary();

/** Bandeau fixé en haut de l'écran pendant une coupure. */
export function OfflineBanner() {
  const horsLigne = useOffline();

  // Région vivante toujours présente : son contenu est annoncé quand il apparaît
  return (
    <div role="status" className="print:hidden">
      {horsLigne && (
        <p
          className="fixed inset-x-0 top-0 z-50 bg-ink px-4 py-2 text-center text-small
            text-paper"
        >
          {t.pwa.offlineBanner}
        </p>
      )}
    </div>
  );
}
