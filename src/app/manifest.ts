/**
 * =============================================================
 *  Fichier    : manifest.ts
 *  Projet     : Kalami
 *  Description: Manifeste de la librairie, servi à /manifest.webmanifest. Kalami Stratégie
 *               a le sien (strategie/manifest.webmanifest).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/pwa/manifest.ts
 * =============================================================
 */

import type { MetadataRoute } from "next";

import { buildManifest } from "@/lib/pwa/manifest";

export default function manifest(): MetadataRoute.Manifest {
  return buildManifest("site");
}
