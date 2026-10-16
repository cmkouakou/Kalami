/**
 * =============================================================
 *  Fichier    : page.tsx (hors-ligne)
 *  Projet     : Kalami
 *  Description: Page de repli de la librairie, gardée par le service worker dès son
 *               installation et servie quand une page n'est pas disponible hors ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/pwa/offline-page.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { OfflinePage } from "@/components/pwa/offline-page";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = {
  title: t.pwa.offlineTitle,
  robots: { index: false },
};

export default function Page() {
  return <OfflinePage home="/" />;
}
