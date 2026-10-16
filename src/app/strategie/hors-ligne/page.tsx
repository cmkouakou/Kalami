/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/hors-ligne)
 *  Projet     : Kalami Stratégie
 *  Description: Page de repli de Kalami Stratégie (son en-tête, jamais celui de la
 *               librairie), servie par le service worker hors ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/pwa/offline-page.tsx
 * =============================================================
 */

import type { Metadata } from "next";

import { OfflinePage } from "@/components/pwa/offline-page";
import { getDictionary } from "@/i18n";
import { STRATEGY_HOME } from "@/lib/auth/routes";

const t = getDictionary();

export const metadata: Metadata = {
  title: t.pwa.offlineTitle,
  robots: { index: false },
};

export default function Page() {
  return <OfflinePage home={STRATEGY_HOME} />;
}
