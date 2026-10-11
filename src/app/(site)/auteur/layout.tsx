/**
 * =============================================================
 *  Fichier    : layout.tsx (auteur)
 *  Projet     : Kalami
 *  Description: Cadre commun de l'espace auteur : titre et navigation entre ses pages.
 *               Aucun contrôle d'accès ici : chaque page appelle requireAuthor() elle-même.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getDictionary } from "@/i18n";

const t = getDictionary();

export const metadata: Metadata = {
  title: { default: t.author.title, template: `%s · ${t.author.title}` },
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: "/auteur", label: t.author.nav.dashboard },
  { href: "/auteur/profil", label: t.author.nav.profile },
  { href: "/auteur/contrat", label: t.author.nav.contract },
];

export default function AuthorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <nav aria-label={t.author.title} className="border-b border-line pb-3">
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
