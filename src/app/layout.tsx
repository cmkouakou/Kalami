/**
 * =============================================================
 *  Fichier    : layout.tsx
 *  Projet     : Kalami
 *  Description: Gabarit racine : langue, polices, métadonnées, en-tête et pied de page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-06
 *  Dépendances: lib/config.ts, i18n, components/catalog, components/layout
 * =============================================================
 */

import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";

import { CurrencySelector } from "@/components/catalog/currency-selector";
import { SignInLink, UserMenu } from "@/components/layout/user-menu";
import { getDictionary } from "@/i18n";
import { APP_NAME, APP_URL } from "@/lib/config";

import "./globals.css";

// ==================== POLICES ====================

const policeInterface = Inter({ variable: "--police-interface", subsets: ["latin"] });
const policeLecture = Literata({ variable: "--police-lecture", subsets: ["latin"] });

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
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-bordure">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-serif text-xl font-semibold text-principale">
              {APP_NAME}
            </Link>
            <ul className="flex items-center gap-4 text-sm text-texte-doux">
              <li>
                <Link href="/recherche" className="hover:text-principale">
                  {t.nav.catalog}
                </Link>
              </li>
              <li>
                {/* Devise lue en flux (cookie, pays) : emplacement réservé pendant le rendu */}
                <Suspense fallback={<span className="inline-block h-11 w-20" />}>
                  <CurrencySelector />
                </Suspense>
              </li>
              <li>
                {/* Session lue en flux : l'en-tête reste statique et instantané */}
                <Suspense fallback={<SignInLink />}>
                  <UserMenu />
                </Suspense>
              </li>
            </ul>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-bordure px-4 py-6 text-center text-sm text-texte-doux">
          © {APP_NAME}. {t.footer.rights}
        </footer>
      </body>
    </html>
  );
}
