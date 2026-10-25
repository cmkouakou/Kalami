/**
 * =============================================================
 *  Fichier    : account-menu.tsx
 *  Projet     : Kalami
 *  Description: Liens de compte de l'en-tête (composants clients) : « Se connecter » qui
 *               ramène à la page quittée, et menu déroulant de l'utilisateur connecté
 *               (Mon compte, Mes achats, Espace auteur, Administration, déconnexion).
 *               Le menu se referme au choix d'un lien, au clic à l'extérieur et sur Échap.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: lib/auth/routes.ts, lib/auth/actions.ts, components/ui
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";

import { IconUser } from "@/components/ui/icons";
import { BUTTON_SECONDARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { signOut } from "@/lib/auth/actions";
import { siteSignInPath } from "@/lib/auth/routes";

const t = getDictionary();

/** Ligne du menu : cible tactile d'au moins 44 px. */
const MENU_ITEM =
  "flex min-h-11 w-full items-center px-4 text-left text-label text-ink hover:bg-encre-soft";

/** Bouton du menu sans le triangle natif de <details> (Safari compris). */
const SUMMARY_RESET = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

// ==================== SE CONNECTER ====================

/**
 * Lien « Se connecter » : au clic, la page affichée devient la page de retour. Ouvert dans
 * un nouvel onglet (ou sans JavaScript), il mène à /connexion, qui revient à l'accueil.
 */
export function SignInLink() {
  const router = useRouter();

  /** Remplace la navigation simple par la connexion avec page de retour. */
  const openSignIn = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    const { pathname, search } = window.location;
    router.push(siteSignInPath(`${pathname}${search}`));
  };

  return (
    <Link href="/connexion" onClick={openSignIn} className={`${BUTTON_SECONDARY} px-4`}>
      {t.nav.signIn}
    </Link>
  );
}

// ==================== MENU DU COMPTE ====================

/** Espaces auxquels l'utilisateur a accès (lus côté serveur). */
type AccountMenuProps = { isAuthor: boolean; isAdmin: boolean };

/**
 * Menu déroulant « Mon compte » : chacun choisit son espace, sans page intermédiaire.
 * Élément <details> natif : utilisable au clavier et sans JavaScript.
 */
export function AccountMenu({ isAuthor, isAdmin }: AccountMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  // Fermeture au clic à l'extérieur et sur Échap (l'en-tête reste monté entre les pages)
  useEffect(() => {
    const close = () => menuRef.current?.removeAttribute("open");
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        close();
        menuRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  /** Referme le menu après le choix d'un lien. */
  const closeMenu = () => menuRef.current?.removeAttribute("open");

  const links = [
    { href: "/compte", label: t.account.title },
    { href: "/compte/achats", label: t.account.purchasesLink },
    ...(isAuthor ? [{ href: "/auteur", label: t.account.authorLink }] : []),
    ...(isAdmin ? [{ href: "/admin", label: t.account.adminLink }] : []),
  ];

  return (
    <details ref={menuRef} className="relative">
      <summary className={`${BUTTON_TERTIARY} ${SUMMARY_RESET}`}>
        <IconUser />
        {t.account.title}
      </summary>
      <div
        className="absolute right-0 z-20 mt-2 flex w-56 flex-col overflow-hidden rounded-md
          border border-line bg-surface py-1 shadow-lg"
      >
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={closeMenu} className={MENU_ITEM}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOut} data-deconnexion className="border-t border-line pt-1">
          <button type="submit" className={MENU_ITEM}>
            {t.auth.signOut}
          </button>
        </form>
      </div>
    </details>
  );
}
