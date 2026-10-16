/**
 * =============================================================
 *  Fichier    : next.config.ts
 *  Projet     : Kalami
 *  Description: Configuration Next.js : Cache Components, préchargement partiel, images du
 *               catalogue servies par Supabase Storage, Tailwind via Turbopack, polices des PDF,
 *               PWA (useOffline, en-têtes du service worker) et en-têtes de sécurité.
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-16
 * =============================================================
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Bandeau « hors ligne » et relance automatique des navigations et actions serveur
    useOffline: true,
  },
  // Polices Literata lues à l'exécution par la génération des PDF (livres et plan stratégique)
  outputFileTracingIncludes: {
    "/api/livres/\\[id\\]/pdf": ["./src/lib/pdf/fonts/**/*"],
    "/api/strategie/etudes/\\[id\\]/plan/\\[format\\]": ["./src/lib/pdf/fonts/**/*"],
  },
  images: {
    // Couvertures et photos d'auteurs : seau public « covers » de Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    // Service worker toujours relu : une nouvelle version s'installe au chargement suivant
    const serviceWorker = [
      { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
    ];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      { source: "/sw.js", headers: serviceWorker },
      { source: "/sw-routes.js", headers: serviceWorker },
    ];
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
