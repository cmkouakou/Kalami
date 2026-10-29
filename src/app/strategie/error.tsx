/**
 * =============================================================
 *  Fichier    : error.tsx (strategie)
 *  Projet     : Kalami Stratégie
 *  Description: Page d'erreur de Kalami Stratégie : reste dans l'application (son en-tête,
 *               retour à /strategie), jamais vers la librairie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: components/ui/error-panel.tsx, lib/auth/routes.ts
 * =============================================================
 */

"use client";

import { ErrorPanel } from "@/components/ui/error-panel";
import { STRATEGY_HOME } from "@/lib/auth/routes";

export default function StrategyError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel error={error} retry={retry} homeHref={STRATEGY_HOME} />;
}
