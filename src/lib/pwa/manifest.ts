/**
 * =============================================================
 *  Fichier    : manifest.ts
 *  Projet     : Kalami
 *  Description: Manifestes des deux applications installables : la librairie (« Kalami »,
 *               portée /) et l'assistant (« Kalami Stratégie », portée /strategie), pour
 *               qu'un utilisateur de Stratégie n'ouvre jamais la librairie au démarrage.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: i18n, lib/config.ts, lib/auth/routes.ts
 * =============================================================
 */

import type { MetadataRoute } from "next";

import { getDictionary } from "@/i18n";
import { STRATEGY_HOME } from "@/lib/auth/routes";
import { APP_NAME } from "@/lib/config";
import { getStrategyDictionary } from "@/i18n/strategy";

const t = getDictionary();
const tStrategy = getStrategyDictionary();

// ==================== CONSTANTES ====================

/** Couleur Encre de la charte : barre d'état et écran de démarrage. */
export const THEME_COLOR = "#1e4d4a";
/** Couleur Papier de la charte : fond de l'écran de démarrage. */
const BACKGROUND_COLOR = "#faf6ef";

/** Chemin public du manifeste de Kalami Stratégie. */
export const STRATEGY_MANIFEST_PATH = `${STRATEGY_HOME}/manifest.webmanifest`;

/** Icônes générées par scripts/generer-icones.mjs. */
const ICONS: MetadataRoute.Manifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  {
    src: "/icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

// ==================== MANIFESTES ====================

/**
 * Construit le manifeste d'un espace.
 * @param space - « site » (librairie) ou « strategy » (Kalami Stratégie)
 * @returns Manifeste Web conforme à la spécification
 *
 * Exemple : buildManifest("strategy").start_url === "/strategie"
 */
export function buildManifest(space: "site" | "strategy"): MetadataRoute.Manifest {
  const common = {
    display: "standalone" as const,
    lang: "fr",
    dir: "ltr" as const,
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: ICONS,
  };

  if (space === "strategy") {
    return {
      ...common,
      id: STRATEGY_HOME,
      name: tStrategy.title,
      short_name: t.pwa.strategyShortName,
      description: tStrategy.description,
      // Sans barre oblique finale : « /strategie » doit rester dans la portée
      start_url: STRATEGY_HOME,
      scope: STRATEGY_HOME,
    };
  }

  return {
    ...common,
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    description: t.meta.description,
    start_url: "/",
    scope: "/",
    categories: ["books", "education"],
  };
}
