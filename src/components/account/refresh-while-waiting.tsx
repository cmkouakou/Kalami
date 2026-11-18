/**
 * =============================================================
 *  Fichier    : refresh-while-waiting.tsx
 *  Projet     : Kalami
 *  Description: Mise à jour automatique d'une page en attente d'une décision (composant
 *               client, v0.25.4) : recharge les données du serveur toutes les 30 secondes
 *               tant que l'onglet est visible, et dès que l'acheteur y revient. La page
 *               serveur cesse de l'afficher quand l'attente est terminée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: next/navigation
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Intervalle entre deux mises à jour (30 s). */
const REFRESH_MS = 30_000;

type RefreshWhileWaitingProps = {
  /** Phrase rassurante affichée sous le statut */
  message: string;
};

/** Recharge la page en arrière-plan pendant l'attente. */
export function RefreshWhileWaiting({ message }: RefreshWhileWaitingProps) {
  const router = useRouter();

  useEffect(() => {
    /** Recharge seulement si l'onglet est affiché (économise les données mobiles). */
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  return (
    <p role="status" aria-live="polite" className="text-small text-ink-muted">
      {message}
    </p>
  );
}
