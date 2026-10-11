/**
 * =============================================================
 *  Fichier    : layout.tsx (strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'assistant stratégie : sous-barre propre au module sous
 *               l'en-tête du site (même compte, parcours distinct). Aucun contrôle
 *               d'accès ici : chaque page privée appelle requireUser.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 *  Dépendances: i18n
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getDictionary } from "@/i18n";

const t = getDictionary();
const s = t.strategy;

export const metadata: Metadata = {
  title: { default: s.title, template: `%s · ${s.title}` },
  description: s.description,
};

const LINKS = [
  { href: "/strategie", label: s.nav.home },
  { href: "/strategie#mes-etudes", label: s.nav.studies },
];

export default function StrategyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <nav
        aria-label={s.title}
        className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3"
      >
        <Link href="/strategie" className="font-serif text-h3 font-semibold text-encre">
          {s.title}
        </Link>
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
