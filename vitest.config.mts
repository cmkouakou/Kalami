/**
 * =============================================================
 *  Fichier    : vitest.config.mts
 *  Projet     : Kalami
 *  Description: Configuration des tests unitaires (Vitest).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: vitest, @vitejs/plugin-react
 * =============================================================
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
