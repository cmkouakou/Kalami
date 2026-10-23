/**
 * =============================================================
 *  Fichier    : vitest.config.mts
 *  Projet     : Kalami
 *  Description: Configuration des tests (Vitest) : unitaires et intégration (RLS sur la base
 *               de développement Supabase, ignorés si les clés sont absentes de .env.local).
 *  Auteur     : Claude Marcel
 *               v1.2 : deux projets ; l'intégration passe un fichier à la fois.
 *  Version    : 1.2
 *  Date       : 2026-10-22
 *  Dépendances: vitest, @vitejs/plugin-react
 * =============================================================
 */

import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    // Charge .env.local (toutes les variables, pas seulement VITE_*)
    env: loadEnv(mode, process.cwd(), ""),
    testTimeout: 20000,
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          // Un fichier à la fois : en parallèle, la base de développement atteint la limite
          // de connexions (« rate limit ») et les fichiers se gênent
          fileParallelism: false,
        },
      },
    ],
  },
}));
