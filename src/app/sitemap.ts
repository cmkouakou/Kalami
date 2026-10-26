/**
 * =============================================================
 *  Fichier    : sitemap.ts
 *  Projet     : Kalami
 *  Description: Plan du site pour Google (/sitemap.xml) : catalogue public à jour, mis en
 *               cache avec les lectures du catalogue (étiquette « catalogue »).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-26
 *  Dépendances: lib/catalog/queries.ts, lib/seo/site-map.ts
 * =============================================================
 */

import type { MetadataRoute } from "next";

import { getCategories, getSitemapBooks } from "@/lib/catalog/queries";
import { APP_URL } from "@/lib/config";
import { buildSitemap } from "@/lib/seo/site-map";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, categories] = await Promise.all([getSitemapBooks(), getCategories()]);
  return buildSitemap(APP_URL, { books, categories });
}
