/**
 * =============================================================
 *  Fichier    : service-worker.tsx
 *  Projet     : Kalami
 *  Description: Enregistre le service worker (production seulement : en développement, il
 *               gênerait le rechargement à chaud), écoute l'invitation d'installation et
 *               efface les pages gardées hors ligne à la déconnexion (formulaires marqués
 *               data-deconnexion).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: public/sw.js, components/pwa/install-store.ts
 * =============================================================
 */

"use client";

import { useEffect } from "react";

import { listenForInstallPrompt } from "./install-store";

/** Composant sans rendu, placé une fois dans le gabarit racine. */
export function ServiceWorker() {
  useEffect(() => {
    const arreterEcoute = listenForInstallPrompt();
    if (!("serviceWorker" in navigator)) return arreterEcoute;

    if (process.env.NODE_ENV !== "production") {
      // Un service worker resté d'un essai en production fausserait le développement
      navigator.serviceWorker
        .getRegistrations()
        .then((liste) => liste.forEach((inscription) => inscription.unregister()))
        .catch(() => undefined);
      return arreterEcoute;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => undefined); // Sans service worker, le site fonctionne en ligne comme avant

    /** Vide les pages gardées quand l'utilisateur se déconnecte. */
    const surEnvoi = (event: SubmitEvent) => {
      const formulaire = event.target;
      if (!(formulaire instanceof HTMLFormElement)) return;
      if (!formulaire.hasAttribute("data-deconnexion")) return;
      navigator.serviceWorker.controller?.postMessage({ type: "vider-pages" });
    };
    document.addEventListener("submit", surEnvoi);

    return () => {
      arreterEcoute();
      document.removeEventListener("submit", surEnvoi);
    };
  }, []);

  return null;
}
