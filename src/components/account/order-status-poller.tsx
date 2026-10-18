/**
 * =============================================================
 *  Fichier    : order-status-poller.tsx
 *  Projet     : Kalami
 *  Description: Attente de la confirmation du paiement (composant client) : recharge les
 *               données de la page toutes les 2 secondes tant que la commande est en attente,
 *               puis affiche un message rassurant si la confirmation tarde.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: i18n
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getDictionary } from "@/i18n";

const t = getDictionary();

const INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30;

/** Message d'attente ; la page serveur le remplace dès que la commande est payée. */
export function OrderStatusPoller() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) return;
    const timer = window.setTimeout(() => {
      router.refresh();
      setAttempts((count) => count + 1);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [attempts, router]);

  const slow = attempts >= MAX_ATTEMPTS;
  return (
    <p role="status" aria-live="polite" className="text-body text-ink-muted">
      {slow ? t.account.purchases.thanks.slow : t.account.purchases.thanks.waiting}
    </p>
  );
}
