/**
 * =============================================================
 *  Fichier    : not-found.tsx
 *  Projet     : Kalami
 *  Description: Page 404 de la librairie (adresse inconnue ou notFound()), dans un repère
 *               <main> pour les lecteurs d'écran.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/ui/styles.ts, i18n
 * =============================================================
 */

import Link from "next/link";

import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";

const t = getDictionary();

export default function NotFound() {
  return (
    <main
      id="contenu"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-16"
    >
      <h1 className="font-serif text-h1">{t.notFound.title}</h1>
      <p className="text-body text-ink-muted">{t.notFound.text}</p>
      <Link href="/" className={`${BUTTON_PRIMARY} self-start`}>
        {t.pwa.backHome}
      </Link>
    </main>
  );
}
