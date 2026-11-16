"use client";

/**
 * =============================================================
 *  Fichier    : payment-watcher.tsx
 *  Projet     : Kalami
 *  Description: Veille des paiements Mobile Money dans l'administration (v0.25.0) : la page
 *               se rafraîchit chaque minute quand l'onglet est visible (et au retour sur
 *               l'onglet), le titre du navigateur affiche le nombre à valider, un encadré
 *               fixe rappelle les paiements en attente, et une notification du navigateur
 *               signale chaque nouvelle déclaration si l'administrateur l'a autorisée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: next/navigation, i18n
 * =============================================================
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { getDictionary, interpolate } from "@/i18n";

const w = getDictionary().admin.mmPayments.watcher;

/** Page des paiements Mobile Money à valider. */
export const MM_PAYMENTS_HREF = "/admin/paiements-mobile-money";
/** Délai entre deux rafraîchissements automatiques. */
const REFRESH_MS = 60_000;
/** Préfixe « (3) » ajouté au titre de l'onglet. */
const TITLE_PREFIX = /^\(\d+\) /;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Titre de l'onglet avec le nombre de paiements à valider en préfixe.
 * @param title - Titre courant (avec ou sans préfixe)
 * @param pending - Paiements à valider
 */
export function titleWithCount(title: string, pending: number): string {
  const base = title.replace(TITLE_PREFIX, "");
  return pending > 0 ? `(${pending}) ${base}` : base;
}

/** Autorisation actuelle, ou « unsupported » si le navigateur n'a pas de notifications. */
function readPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

/** Abonnement vide : l'autorisation n'émet pas d'événement fiable. */
function subscribeNothing(): () => void {
  return () => {};
}

/** Notifications du navigateur disponibles sur cet appareil. */
function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Notification du navigateur ; un clic ramène sur la page des paiements.
 * @param pending - Paiements à valider
 * @param open - Navigation vers la page des paiements
 */
function notify(pending: number, open: () => void) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    const notification = new Notification(w.notifyTitle, {
      body: interpolate(w.notifyBody, { count: String(pending) }),
      tag: "kalami-mobile-money",
    });
    notification.onclick = () => {
      window.focus();
      open();
      notification.close();
    };
  } catch {
    // Certains navigateurs mobiles refusent le constructeur : l'encadré suffit
  }
}

// ==================== COMPOSANTS ====================

/**
 * Veille installée dans le gabarit de l'administration.
 * @param pending - Paiements Mobile Money déclarés, en attente de validation
 */
export function PaymentWatcher({ pending }: { pending: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const previous = useRef(pending);

  // Rafraîchissement régulier, seulement quand l'onglet est visible
  useEffect(() => {
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

  // Nombre dans le titre ; recalculé à chaque page, le titre étant remplacé à la navigation
  useEffect(() => {
    const apply = () => {
      const next = titleWithCount(document.title, pending);
      if (next !== document.title) document.title = next;
    };
    apply();
    const timer = window.setTimeout(apply, 500);
    return () => window.clearTimeout(timer);
  }, [pending, pathname]);

  // Notification à chaque nouvelle déclaration
  useEffect(() => {
    if (pending > previous.current) notify(pending, () => router.push(MM_PAYMENTS_HREF));
    previous.current = pending;
  }, [pending, router]);

  if (pending === 0 || pathname === MM_PAYMENTS_HREF) return null;
  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-40 flex max-w-xs flex-col gap-2 rounded-lg border
        border-ocre bg-surface p-4 text-sm shadow-lg"
    >
      <p className="font-semibold">
        {interpolate(pending > 1 ? w.bannerMany : w.bannerOne, { count: String(pending) })}
      </p>
      <Link
        href={MM_PAYMENTS_HREF}
        className="inline-flex min-h-11 items-center font-semibold text-encre underline"
      >
        {w.open}
      </Link>
    </div>
  );
}

/** Bouton d'autorisation des notifications du navigateur (page des paiements). */
export function NotificationSwitch() {
  // Lue après l'hydratation (null côté serveur), puis remplacée par la réponse du navigateur
  const initial = useSyncExternalStore(subscribeNothing, readPermission, () => null);
  const [answer, setAnswer] = useState<NotificationPermission | null>(null);
  const permission = answer ?? initial;

  /** Demande l'autorisation au navigateur. */
  async function ask() {
    try {
      setAnswer(await Notification.requestPermission());
    } catch {
      setAnswer("denied");
    }
  }

  if (permission === null) return null;
  if (permission === "granted") return <p className="text-small text-ink-muted">{w.on}</p>;
  if (permission === "denied") return <p className="text-small text-ink-muted">{w.denied}</p>;
  if (permission === "unsupported") {
    return <p className="text-small text-ink-muted">{w.unsupported}</p>;
  }
  return (
    <button
      type="button"
      onClick={ask}
      className="inline-flex min-h-11 w-fit items-center rounded-md border border-encre px-4
        text-small font-semibold text-encre hover:bg-encre/10"
    >
      {w.enable}
    </button>
  );
}
