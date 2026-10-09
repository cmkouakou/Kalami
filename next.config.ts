/**
 * =============================================================
 *  Fichier    : next.config.ts
 *  Projet     : Kalami
 *  Description: Configuration Next.js : Cache Components, préchargement partiel, images du
 *               catalogue servies par Supabase Storage, Tailwind via Turbopack, polices des PDF.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-09
 * =============================================================
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Polices Literata lues à l'exécution par la génération des PDF filigranés
  outputFileTracingIncludes: {
    "/api/livres/\\[id\\]/pdf": ["./src/lib/pdf/fonts/**/*"],
  },
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
