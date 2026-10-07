/**
 * =============================================================
 *  Fichier    : layout.tsx (admin/(espace))
 *  Projet     : Kalami
 *  Description: Cadre commun des pages d'administration : navigation entre les modules.
 *               Aucun contrôle d'accès ici (un layout ne se ré-exécute pas à chaque
 *               navigation) : chaque page appelle requireAdmin() elle-même.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = {
  title: { default: t.admin.title, template: `%s · ${t.admin.title}` },
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: "/admin", label: t.admin.nav.dashboard },
  { href: "/admin/livres", label: t.admin.nav.books },
  { href: "/admin/auteurs", label: t.admin.nav.authors },
  { href: "/admin/categories", label: t.admin.nav.categories },
  { href: "/", label: t.admin.nav.site },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <nav aria-label={t.admin.title} className="border-b border-bordure pb-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="inline-flex min-h-11 items-center hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
