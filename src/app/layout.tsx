/**
 * =============================================================
 *  Fichier    : layout.tsx
 *  Projet     : Kalami
 *  Description: Gabarit racine : langue, polices de la charte, métadonnées, en-tête
 *               (logo, recherche, devise, compte) et pied de page sombre.
 *  Auteur     : Claude Marcel
 *  Version    : 2.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/config.ts, i18n, components/catalog, components/layout, components/ui
 * =============================================================
 */

import type { Metadata } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";

import { CurrencySelector } from "@/components/catalog/currency-selector";
import { Logo } from "@/components/layout/logo";
import { SignInLink, UserMenu } from "@/components/layout/user-menu";
import { IconSearch } from "@/components/ui/icons";
import { CONTROL, PAGE } from "@/components/ui/styles";
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
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

// ==================== EN-TÊTE ====================

/** En-tête : logo, catalogue, recherche, devise et compte. */
function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <nav className={`${PAGE} flex flex-wrap items-center gap-x-6 gap-y-3 py-3`}>
        <Logo />
        <Link href="/recherche" className="text-label text-ink-muted hover:text-encre">
          {t.nav.catalog}
        </Link>

        <form
          action="/recherche"
          role="search"
          className="relative order-last w-full md:order-none md:ml-auto md:w-72"
        >
          <label htmlFor="recherche-entete" className="visuellement-cache">
            {t.nav.search}
          </label>
          <IconSearch className="pointer-events-none absolute top-3 left-3 text-ink-muted" />
          <input
            id="recherche-entete"
            type="search"
            name="q"
            placeholder={t.nav.search}
            className={`${CONTROL} w-full rounded-md pl-10`}
          />
        </form>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {/* Devise lue en flux (cookie, pays) : emplacement réservé pendant le rendu */}
          <Suspense fallback={<span className="inline-block h-11 w-20" />}>
            <CurrencySelector />
          </Suspense>
          {/* Session lue en flux : l'en-tête reste statique et instantané */}
          <Suspense fallback={<SignInLink />}>
            <UserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

// ==================== PIED DE PAGE ====================

/** Pied de page sur fond Nuit (jetons du thème sombre appliqués localement). */
function SiteFooter() {
  return (
    <footer data-theme="dark" className="mt-16 bg-paper text-ink">
      <div className={`${PAGE} grid gap-8 py-12 sm:grid-cols-2`}>
        <div className="flex flex-col gap-3">
          <Logo height={32} />
          <p className="max-w-sm text-small text-ink-muted">{t.footer.tagline}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-caption text-ink-muted uppercase">{t.footer.explore}</p>
          <Link href="/recherche" className="text-small hover:text-encre">
            {t.nav.catalog}
          </Link>
          <Link href="/compte" className="text-small hover:text-encre">
            {t.account.title}
          </Link>
        </div>
      </div>
      <p className={`${PAGE} border-t border-line py-6 text-small text-ink-muted`}>
        © {APP_NAME}. {t.footer.rights}
      </p>
    </footer>
  );
}
