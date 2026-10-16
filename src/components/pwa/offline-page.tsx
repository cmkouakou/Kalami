/**
 * =============================================================
 *  Fichier    : offline-page.tsx
 *  Projet     : Kalami
 *  Description: Contenu des pages « hors ligne » (/hors-ligne et /strategie/hors-ligne),
 *               servies par le service worker à la place d'une page jamais visitée. L'adresse
 *               demandée reste dans la barre : le message s'adapte (liseuse, étude).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: components/ui, i18n
 * =============================================================
 */

"use client";

import { useSyncExternalStore } from "react";

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";

const t = getDictionary();
const p = t.pwa;

/** L'adresse ne change pas pendant l'affichage : aucun abonnement nécessaire. */
const sansAbonnement = () => () => undefined;

/**
 * Message complémentaire selon la page demandée.
 * @param chemin - Chemin affiché dans la barre d'adresse
 * @returns Explication propre à la liseuse ou aux études, sinon null
 */
function messageContextuel(chemin: string): string | null {
  if (/^\/livres\/[^/]+\/lire|^\/apercu\//.test(chemin)) return p.offlineReader;
  if (chemin.startsWith("/strategie/")) return p.offlineStrategy;
  return null;
}

/** Page de repli : titre, explication, « Réessayer » et retour à l'accueil de l'espace. */
export function OfflinePage({ home }: { home: string }) {
  const chemin = useSyncExternalStore(
    sansAbonnement,
    () => window.location.pathname,
    () => "",
  );
  const complement = messageContextuel(chemin);

  return (
    <main className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-16">
      <h1 className="font-serif text-h1">{p.offlineTitle}</h1>
      <p className="text-body text-ink-muted">{p.offlineText}</p>
      {complement && <p className="text-body text-ink-muted">{complement}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={BUTTON_PRIMARY} onClick={() => location.reload()}>
          {p.retry}
        </button>
        {/* Lien natif : la navigation complète passe par le service worker */}
        <a href={home} className={BUTTON_SECONDARY}>
          {p.backHome}
        </a>
      </div>
    </main>
  );
}
