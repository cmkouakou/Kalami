/**
 * =============================================================
 *  Fichier    : page.tsx
 *  Projet     : Kalami
 *  Description: Page d'accueil provisoire (le catalogue arrive au Sprint 2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: i18n
 * =============================================================
 */

import { getDictionary } from "@/i18n";

export default function HomePage() {
  const t = getDictionary();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-20 sm:py-28">
      <h1 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
        {t.home.title}
      </h1>
      <p className="text-lg text-texte-doux">{t.home.subtitle}</p>
      <p className="w-fit rounded-full border border-bordure bg-surface px-4 py-2 text-sm">
        {t.home.comingSoon}
      </p>
    </main>
  );
}
