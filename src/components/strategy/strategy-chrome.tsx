/**
 * =============================================================
 *  Fichier    : strategy-chrome.tsx
 *  Projet     : Kalami Stratégie
 *  Description: En-tête et pied de page propres à Kalami Stratégie : l'application se
 *               suffit à elle-même (connexion, déconnexion et liens restent dans
 *               /strategie) ; seul un lien discret mène au livre guide, s'il est publié.
 *               La cloche (S9b) mène aux notifications et compte celles non lues.
 *               Pied de page : « Installer l'application » (PWA Kalami Stratégie).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-16
 *  Dépendances: lib/auth/dal.ts, lib/auth/actions.ts, lib/catalog/queries.ts,
 *               lib/strategy/comments-queries.ts, i18n
 * =============================================================
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { LegalLinks } from "@/components/legal/legal-links";
import { InstallButton } from "@/components/pwa/install-button";
import { IconBell } from "@/components/ui/icons";
import { BUTTON_ICON, BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath, STRATEGY_HOME } from "@/lib/auth/routes";
import { getBookBySlug } from "@/lib/catalog/queries";
import { APP_NAME } from "@/lib/config";
import { getUnreadCount } from "@/lib/strategy/comments-queries";
import { GUIDE_BOOK_SLUG } from "@/lib/strategy/steps";

const t = getDictionary();
const s = t.strategy;

const LINKS = [
  { href: STRATEGY_HOME, label: s.nav.home },
  { href: `${STRATEGY_HOME}#mes-etudes`, label: s.nav.studies },
];

// ==================== EN-TÊTE ====================

/** En-tête de l'application : marque, navigation et compte. */
export function StrategyHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <nav
        aria-label={s.title}
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4
          py-3"
      >
        <Link
          href={STRATEGY_HOME}
          className="inline-flex min-h-11 items-center gap-2 font-serif text-h3 font-semibold
            text-encre"
        >
          <Image src="/brand/kalami-mark.svg" alt="" width={28} height={28} />
          {s.title}
        </Link>
        <ul className="flex flex-wrap gap-x-5 text-sm font-medium">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="inline-flex min-h-11 items-center hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto">
          {/* Session lue en flux : l'en-tête reste statique et instantané */}
          <Suspense fallback={<StrategySignInLink />}>
            <StrategyUserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

/** Lien de connexion qui ramène à l'application. */
function StrategySignInLink() {
  return (
    <Link href={authPath("connexion", STRATEGY_HOME)} className={`${BUTTON_SECONDARY} px-4`}>
      {s.nav.signIn}
    </Link>
  );
}

/** Cloche des notifications, nom de l'utilisateur et déconnexion (retour à l'accueil). */
async function StrategyUserMenu() {
  const user = await getCurrentUser();
  if (!user) return <StrategySignInLink />;
  const unread = await getUnreadCount();
  const n = s.notifications;

  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <Link
        href={`${STRATEGY_HOME}/notifications`}
        className={`${BUTTON_ICON} relative`}
        aria-label={unread > 0 ? interpolate(n.bellUnread, { count: String(unread) }) : n.bell}
      >
        <IconBell size={20} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 inline-flex min-w-5 items-center justify-center
              rounded-full bg-encre px-1 text-caption font-semibold text-on-encre"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
      <form action={signOut} data-deconnexion className="flex flex-wrap items-center gap-x-3">
        <input type="hidden" name="suivant" value={STRATEGY_HOME} />
        {user.email && (
          <span className="text-small text-ink-muted">
            {interpolate(s.nav.signedInAs, { name: user.email })}
          </span>
        )}
        <Link href={`${STRATEGY_HOME}/compte`} className={BUTTON_TERTIARY}>
          {t.account.title}
        </Link>
        <button type="submit" className={BUTTON_TERTIARY}>
          {s.nav.signOut}
        </button>
      </form>
    </div>
  );
}

// ==================== PIED DE PAGE ====================

/** Pied de page sobre, avec le lien discret vers le livre guide. */
export function StrategyFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3
          px-4 py-6 text-small text-ink-muted"
      >
        <p>
          © {APP_NAME}. {s.footer.tagline}
        </p>
        <nav aria-label={t.footer.legal} className="flex flex-wrap gap-x-4 gap-y-1">
          <LegalLinks space="strategy" linkClassName="hover:text-encre hover:underline" />
          <Suspense>
            <GuideBookLink />
          </Suspense>
          <InstallButton className="hover:text-encre hover:underline" />
        </nav>
      </div>
    </footer>
  );
}

/** Lien vers la fiche du livre guide, seulement s'il est publié. */
async function GuideBookLink() {
  const book = await getBookBySlug(GUIDE_BOOK_SLUG);
  if (!book) return null;
  return (
    <Link href={`/livres/${GUIDE_BOOK_SLUG}`} className="hover:text-encre hover:underline">
      {s.footer.book}
    </Link>
  );
}
