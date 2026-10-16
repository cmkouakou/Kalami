/**
 * =============================================================
 *  Fichier    : layout.tsx
 *  Projet     : Kalami
 *  Description: Gabarit racine : langue, polices de la charte, métadonnées (PWA comprise),
 *               lien « Aller au contenu », bandeau hors ligne et service worker. L'en-tête
 *               et le pied de page sont propres à chaque espace : (site) pour la
 *               plateforme de lecture, strategie pour Kalami Stratégie.
 *  Auteur     : Claude Marcel
 *  Version    : 3.1
 *  Date       : 2026-10-16
 *  Dépendances: lib/config.ts, lib/pwa/manifest.ts, components/pwa, i18n
 * =============================================================
 */

import type { Metadata, Viewport } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";

import { ConsentBanner } from "@/components/legal/consent-banner";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { getDictionary } from "@/i18n";
import { APP_NAME, APP_URL } from "@/lib/config";
import { THEME_COLOR } from "@/lib/pwa/manifest";

import "./globals.css";

// ==================== POLICES ====================

// Auto-hébergées par next/font : aucune requête vers Google au chargement des pages
const policeInterface = Source_Sans_3({
  variable: "--police-interface",
  subsets: ["latin"],
  weight: ["400", "600"],
});
const policeLecture = Literata({
  variable: "--police-lecture",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

// ==================== MÉTADONNÉES ====================

const t = getDictionary();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: t.meta.description,
  // Le manifeste (app/manifest.ts) est lié automatiquement ; iOS lit ces balises-ci
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

// ==================== GABARIT ====================

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${policeInterface.variable} ${policeLecture.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* Premier élément atteint au clavier : saute l'en-tête de chaque espace */}
        <a href="#contenu" className="lien-evitement">
          {t.a11y.skipToContent}
        </a>
        <OfflineBanner />
        {children}
        <ConsentBanner />
        <ServiceWorker />
      </body>
    </html>
  );
}
