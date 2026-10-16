/**
 * =============================================================
 *  Fichier    : layout.tsx (site)
 *  Projet     : Kalami
 *  Description: Gabarit de la plateforme de lecture : en-tête (logo, recherche, devise,
 *               compte) et pied de page sombre (avec « Installer l'application »).
 *               Kalami Stratégie a son propre gabarit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
 *  Dépendances: i18n, components/catalog, components/layout, components/ui
 * =============================================================
 */

import Link from "next/link";
import { Suspense } from "react";

import { CurrencySelector } from "@/components/catalog/currency-selector";
import { Logo } from "@/components/layout/logo";
import { LegalLinks } from "@/components/legal/legal-links";
import { SignInLink, UserMenu } from "@/components/layout/user-menu";
import { InstallButton } from "@/components/pwa/install-button";
import { IconSearch } from "@/components/ui/icons";
import { CONTROL, PAGE } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { APP_NAME } from "@/lib/config";

const t = getDictionary();

// ==================== GABARIT ====================

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {/* Cible du lien « Aller au contenu » (gabarit racine) */}
      <div id="contenu" tabIndex={-1} className="flex-1">
        {children}
      </div>
      <SiteFooter />
    </>
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
      <div className={`${PAGE} grid gap-8 py-12 sm:grid-cols-3`}>
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
          <InstallButton className="self-start text-small hover:text-encre" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-caption text-ink-muted uppercase">{t.footer.legal}</p>
          <LegalLinks space="site" linkClassName="text-small hover:text-encre" />
        </div>
      </div>
      <p className={`${PAGE} border-t border-line py-6 text-small text-ink-muted`}>
        © {APP_NAME}. {t.footer.rights}
      </p>
    </footer>
  );
}
