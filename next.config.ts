/**
 * =============================================================
 *  Fichier    : next.config.ts
 *  Projet     : Kalami
 *  Description: Configuration Next.js : Cache Components, préchargement partiel, images du
 *               catalogue servies par Supabase Storage, Tailwind via Turbopack.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-07
 * =============================================================
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Couvertures et photos d'auteurs : seau public « covers » de Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
