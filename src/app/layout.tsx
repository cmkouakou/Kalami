/**
 * =============================================================
 *  Fichier    : layout.tsx
 *  Projet     : Kalami
 *  Description: Gabarit racine : langue, polices de la charte et métadonnées. L'en-tête
 *               et le pied de page sont propres à chaque espace : (site) pour la
 *               plateforme de lecture, strategie pour Kalami Stratégie.
 *  Auteur     : Claude Marcel
 *  Version    : 3.0
 *  Date       : 2026-10-11
 *  Dépendances: lib/config.ts, i18n
 * =============================================================
 */

import type { Metadata } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";

import { getDictionary } from "@/i18n";
import { APP_NAME, APP_URL } from "@/lib/config";

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
};

// ==================== GABARIT ====================

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${policeInterface.variable} ${policeLecture.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
