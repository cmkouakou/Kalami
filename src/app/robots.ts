/**
 * =============================================================
 *  Fichier    : robots.ts
 *  Projet     : Kalami
 *  Description: Consignes aux robots d'indexation (/robots.txt) : catalogue public ouvert,
 *               espaces privés et liseuse fermés, lien vers le plan du site.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-26
 *  Dépendances: lib/seo/site-map.ts
 * =============================================================
 */

import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/config";
import { buildRobots } from "@/lib/seo/site-map";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(APP_URL);
}
