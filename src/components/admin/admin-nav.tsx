/**
 * =============================================================
 *  Fichier    : admin-nav.tsx
 *  Projet     : Kalami
 *  Description: Menu de l'administration : modules regroupés par thème, page courante
 *               mise en évidence, pastilles « à traiter ». Colonne latérale sur grand
 *               écran, menu repliable sur téléphone.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1 (Lecture et audience, v0.16.1)
 *  Date       : 2026-10-28
 *  Dépendances: i18n, components/ui/icons.tsx
 * =============================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { IconList, IconX } from "@/components/ui/icons";
import { getDictionary, interpolate } from "@/i18n";

const t = getDictionary();
const n = t.admin.nav;

// ==================== TYPES ====================

/** Compteurs « à traiter » affichés à côté des modules. */
export type AdminNavBadges = { submissions?: number; mobileMoney?: number; payouts?: number };

type NavLink = { href: string; label: string; badge?: keyof AdminNavBadges };
type NavGroup = { title: string; links: NavLink[] };

// ==================== MODULES ====================

const GROUPS: NavGroup[] = [
  {
    title: n.groups.overview,
    links: [
      { href: "/admin", label: n.dashboard },
      { href: "/admin/audience", label: n.audience },
    ],
  },
  {
    title: n.groups.catalog,
    links: [
      { href: "/admin/livres", label: n.books },
      { href: "/admin/soumissions", label: n.submissions, badge: "submissions" },
      { href: "/admin/auteurs", label: n.authors },
      { href: "/admin/categories", label: n.categories },
      { href: "/admin/atelier", label: n.workshop },
    ],
  },
  {
    title: n.groups.sales,
    links: [
      { href: "/admin/commandes", label: n.orders, badge: "mobileMoney" },
      { href: "/admin/mobile-money", label: n.mobileMoney },
      { href: "/admin/codes-promo", label: n.promos },
      { href: "/admin/revenus", label: n.revenue },
      { href: "/admin/versements", label: n.payouts, badge: "payouts" },
    ],
  },
  {
    title: n.groups.strategy,
    links: [
      { href: "/admin/strategie", label: n.strategyOverview },
      { href: "/admin/strategie/etapes", label: n.strategySteps },
      { href: "/admin/strategie/coach", label: n.strategyCoach },
    ],
  },
  {
    title: n.groups.legal,
    links: [
      { href: "/admin/contrat", label: n.contract },
      { href: "/admin/textes-legaux", label: n.legal },
      { href: "/admin/journal", label: n.audit },
    ],
  },
];

const ALL_HREFS = GROUPS.flatMap((group) => group.links.map((link) => link.href));

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Module actif : le lien le plus précis qui contient la page courante
 * (/admin/strategie/coach/regles → « Coach IA », pas « Vue d'ensemble »).
 * @param pathname - Chemin de la page courante
 * @returns Adresse du module actif, ou null
 */
export function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const href of ALL_HREFS) {
    const inside = pathname === href || pathname.startsWith(`${href}/`);
    // « /admin » ne vaut que pour le tableau de bord lui-même
    if (href === "/admin" && pathname !== href) continue;
    if (inside && (!best || href.length > best.length)) best = href;
  }
  return best;
}

// ==================== COMPOSANT ====================

/** Menu de l'administration ; les pastilles sont absentes tant qu'elles se chargent. */
export function AdminNav({ badges = {} }: { badges?: AdminNavBadges }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const active = activeHref(pathname);

  // Referme le menu du téléphone après chaque navigation
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <nav aria-label={t.admin.title} className="lg:sticky lg:top-6 lg:self-start">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-admin"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg border border-line
          bg-surface px-4 font-semibold lg:hidden"
      >
        {open ? <IconX aria-hidden="true" /> : <IconList aria-hidden="true" />}
        {n.menu}
      </button>
      <div id="menu-admin" className={`${open ? "flex" : "hidden"} mt-3 flex-col gap-5 lg:mt-0 lg:flex`}>
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <p className="px-3 text-caption text-ink-muted uppercase">{group.title}</p>
            <ul className="flex flex-col">
              {group.links.map((link) => (
                <li key={link.href}>
                  <NavItem link={link} active={link.href === active} badges={badges} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Link href="/" className="px-3 text-sm text-encre underline">
          {n.site}
        </Link>
      </div>
    </nav>
  );
}

/** Lien d'un module, avec sa pastille « à traiter » s'il y en a. */
function NavItem({
  link,
  active,
  badges,
}: {
  link: NavLink;
  active: boolean;
  badges: AdminNavBadges;
}) {
  const count = link.badge ? (badges[link.badge] ?? 0) : 0;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center justify-between gap-2 rounded-md px-3 text-sm ${
        active ? "bg-encre-soft font-semibold text-encre" : "hover:bg-sand"
      }`}
    >
      {link.label}
      {count > 0 && (
        <span className="rounded-full bg-encre px-2 text-caption font-semibold text-on-encre">
          <span aria-hidden="true">{count}</span>
          <span className="sr-only">{interpolate(n.toDo, { count: String(count) })}</span>
        </span>
      )}
    </Link>
  );
}
