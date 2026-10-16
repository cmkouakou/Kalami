/**
 * =============================================================
 *  Fichier    : route.ts (strategie/manifest.webmanifest)
 *  Projet     : Kalami Stratégie
 *  Description: Manifeste de l'application installable Kalami Stratégie (portée /strategie).
 *               La convention « manifest » de Next.js n'existe qu'à la racine : d'où ce
 *               gestionnaire de route, référencé par le gabarit de /strategie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/pwa/manifest.ts
 * =============================================================
 */

import { buildManifest } from "@/lib/pwa/manifest";

export function GET(): Response {
  return new Response(JSON.stringify(buildManifest("strategy")), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
