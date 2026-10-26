/**
 * =============================================================
 *  Fichier    : google-analytics.tsx
 *  Projet     : Kalami
 *  Description: Charge Google Analytics 4 (gtag.js) seulement si le visiteur a cliqué
 *               « Accepter » sur la liste de témoins courante (Loi 25 / RGPD). Un refus
 *               ultérieur coupe la mesure et efface les témoins _ga sans recharger la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-26
 *  Dépendances: @next/third-parties, lib/legal/consent.ts
 * =============================================================
 */

"use client";

import { GoogleAnalytics as GoogleTag } from "@next/third-parties/google";
import { useEffect, useState } from "react";

import {
  CONSENT_CHANGED_EVENT,
  readConsentFromCookies,
  statisticsAllowed,
} from "@/lib/legal/consent";

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Efface les témoins posés par Google Analytics (_ga, _ga_XXXX), sur l'hôte et sur le
 * domaine principal (gtag les pose sur « .kalami-livres.com »).
 */
function clearGoogleCookies() {
  const host = window.location.hostname;
  const domains = ["", `; domain=${host}`, `; domain=.${host.replace(/^www\./, "")}`];
  const names = document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; max-age=0${domain}`;
    }
  }
}

// ==================== COMPOSANT ====================

/**
 * Google Analytics soumis au consentement.
 * @param gaId - Identifiant de mesure G-XXXX
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    /** Relit le témoin de consentement et applique le choix. */
    const apply = () => {
      const ok = statisticsAllowed(readConsentFromCookies(document.cookie));
      // Drapeau officiel de gtag.js : coupe l'envoi si le script est déjà chargé
      (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = !ok;
      if (!ok) clearGoogleCookies();
      setAllowed(ok);
    };
    apply();
    window.addEventListener(CONSENT_CHANGED_EVENT, apply);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, apply);
  }, [gaId]);

  return allowed ? <GoogleTag gaId={gaId} /> : null;
}
