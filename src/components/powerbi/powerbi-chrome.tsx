/**
 * =============================================================
 *  Fichier    : powerbi-chrome.tsx
 *  Projet     : Kalami Données
 *  Description: En-tête et pied de page propres à Kalami Données : l'espace se suffit à
 *               lui-même, connexion et déconnexion ramènent à /powerbi. Une pastille
 *               rappelle que la section est privée pendant sa construction, et le pied
 *               de page porte la mention d'absence d'affiliation avec Microsoft.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/auth/dal.ts, lib/auth/actions.ts, lib/auth/routes.ts, i18n
 * =============================================================
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { LegalLinks } from "@/components/legal/legal-links";
import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath, POWERBI_HOME } from "@/lib/auth/routes";
import { APP_NAME } from "@/lib/config";

const t = getDictionary();
const d = getPowerbiDictionary();

// ==================== EN-TÊTE ====================

/** En-tête de l'espace : marque, pastille « privé » et compte. */
export function PowerbiHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <nav
        aria-label={d.title}
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4
          py-3"
      >
        <Link
          href={POWERBI_HOME}
          className="inline-flex min-h-11 items-center gap-2 font-serif text-h3 font-semibold
            text-encre"
        >
          <Image src="/brand/kalami-mark.svg" alt="" width={28} height={28} />
          {d.title}
        </Link>
        <span className={BADGE} title={d.prive.explication}>
          {d.prive.badge}
        </span>
        <div className="ml-auto">
          {/* Session lue en flux : l'en-tête reste statique et instantané */}
          <Suspense fallback={<PowerbiSignInLink />}>
            <PowerbiUserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

/** Lien de connexion qui ramène à l'espace. */
function PowerbiSignInLink() {
  return (
    <Link href={authPath("connexion", POWERBI_HOME)} className={`${BUTTON_SECONDARY} px-4`}>
      {d.nav.signIn}
    </Link>
  );
}

/** Nom de l'utilisateur et déconnexion (retour à l'accueil de l'espace). */
async function PowerbiUserMenu() {
  const user = await getCurrentUser();
  if (!user) return <PowerbiSignInLink />;

  return (
    <form action={signOut} className="flex flex-wrap items-center gap-x-3">
      <input type="hidden" name="suivant" value={POWERBI_HOME} />
      {user.email && (
        <span className="text-small text-ink-muted">
          {interpolate(d.nav.signedInAs, { name: user.email })}
        </span>
      )}
      <Link href="/compte" className={BUTTON_TERTIARY}>
        {t.account.title}
      </Link>
      <button type="submit" className={BUTTON_TERTIARY}>
        {d.nav.signOut}
      </button>
    </form>
  );
}

// ==================== PIED DE PAGE ====================

/** Pied de page sobre, avec la mention d'absence d'affiliation. */
export function PowerbiFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div
        className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-small
          text-ink-muted"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            © {APP_NAME}. {d.footer.tagline}
          </p>
          <nav aria-label={t.footer.legal} className="flex flex-wrap gap-x-4 gap-y-1">
            <LegalLinks space="site" linkClassName="hover:text-encre hover:underline" />
          </nav>
        </div>
        <p className="text-caption">{d.footer.avertissement}</p>
      </div>
    </footer>
  );
}
