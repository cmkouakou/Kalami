/**
 * =============================================================
 *  Fichier    : vitest.config.mts
 *  Projet     : Kalami
 *  Description: Configuration des tests (Vitest) : unitaires et intégration (RLS sur la base
 *               de développement Supabase, ignorés si les clés sont absentes de .env.local).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-06
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
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Charge .env.local (toutes les variables, pas seulement VITE_*)
    env: loadEnv(mode, process.cwd(), ""),
    testTimeout: 20000,
  },
}));
