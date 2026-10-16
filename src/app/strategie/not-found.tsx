/**
 * =============================================================
 *  Fichier    : not-found.tsx (strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Page 404 de Kalami Stratégie : reste dans l'application (son en-tête, retour
 *               à /strategie), jamais vers la librairie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/ui/styles.ts, lib/auth/routes.ts, i18n
 * =============================================================
 */

import Link from "next/link";

import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { STRATEGY_HOME } from "@/lib/auth/routes";

const t = getDictionary();

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-16">
      <h1 className="font-serif text-h1">{t.notFound.title}</h1>
      <p className="text-body text-ink-muted">{t.notFound.text}</p>
      <Link href={STRATEGY_HOME} className={`${BUTTON_PRIMARY} self-start`}>
        {t.pwa.backHome}
      </Link>
    </main>
  );
}
