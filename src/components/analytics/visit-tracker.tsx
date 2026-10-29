/**
 * =============================================================
 *  Fichier    : visit-tracker.tsx
 *  Projet     : Kalami
 *  Description: Statistiques de visite de Kalami (v0.16.1) : signale chaque page vue à
 *               /api/visite. Anonyme, sans témoin ni stockage dans le navigateur ; rien
 *               n'est envoyé si le visiteur demande à ne pas être suivi (GPC, Do Not Track).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: app/api/visite/route.ts
 * =============================================================
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Le visiteur refuse le suivi (Global Privacy Control ou Do Not Track). */
function trackingRefused(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

/** Composant invisible, placé une fois dans le gabarit racine (sous <Suspense>). */
export function VisitTracker() {
  const pathname = usePathname();
  // Première page de ce chargement : seule elle peut être une arrivée sur le site
  const firstView = useRef(true);

  useEffect(() => {
    const entry = firstView.current;
    firstView.current = false;
    if (trackingRefused()) return;

    const body = JSON.stringify({
      path: pathname,
      referrer: entry ? document.referrer : "",
      entry,
    });
    fetch("/api/visite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Statistique perdue : sans conséquence pour le visiteur
    });
  }, [pathname]);

  return null;
}
