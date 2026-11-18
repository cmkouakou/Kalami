/**
 * =============================================================
 *  Fichier    : mobile-money-notice-banner.tsx
 *  Projet     : Kalami
 *  Description: Avis dans l'application d'une décision Mobile Money (composant client,
 *               v0.25.4) : « paiement confirmé — Ouvrir maintenant » ou « paiement refusé —
 *               Voir le motif ». L'avis n'est montré qu'une fois : fermer, suivre le lien ou
 *               ouvrir la page de la commande l'enregistre comme vu (témoin du navigateur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: lib/payments/mm-notice.ts, i18n
 * =============================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getDictionary, interpolate } from "@/i18n";
import { MM_NOTICE_COOKIE, MM_NOTICE_MAX_AGE_S } from "@/lib/payments/mm-notice";

const notice = getDictionary().mobileMoney.notice;

type MobileMoneyNoticeBannerProps = {
  /** Commande décidée */
  orderId: string;
  /** Décision : validée ou refusée */
  outcome: "paid" | "rejected";
  /** Article acheté */
  label: string;
  /** Destination du lien (achat débloqué ou page de la commande) */
  href: string;
};

/**
 * Enregistre l'avis comme vu dans un témoin du navigateur.
 * @param orderId - Commande décidée
 */
function markSeen(orderId: string) {
  document.cookie =
    `${MM_NOTICE_COOKIE}=${orderId}; path=/; max-age=${MM_NOTICE_MAX_AGE_S}; samesite=lax`;
}

/** Bandeau d'avis ; disparaît une fois vu. */
export function MobileMoneyNoticeBanner(props: MobileMoneyNoticeBannerProps) {
  const { orderId, outcome, label, href } = props;
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  // La page de la commande montre déjà la décision : inutile de la répéter
  const onOrderPage = pathname === `/compte/achats/${orderId}`;

  useEffect(() => {
    if (onOrderPage) markSeen(orderId);
  }, [onOrderPage, orderId]);

  if (hidden || onOrderPage) return null;

  /** Ferme l'avis et s'en souvient. */
  const dismiss = () => {
    markSeen(orderId);
    setHidden(true);
  };

  const paid = outcome === "paid";
  return (
    <div
      role="status"
      className={`border-b border-line ${paid ? "bg-sand" : "bg-surface"}`}
    >
      <div className="mx-auto flex w-full max-w-content flex-wrap items-center gap-3 px-4 py-3
        sm:px-6">
        <p className={`flex-1 text-body ${paid ? "" : "text-danger"}`}>
          {interpolate(paid ? notice.paid : notice.rejected, { label })}
        </p>
        <Link
          href={href}
          onClick={dismiss}
          className="flex min-h-11 items-center font-semibold text-encre underline"
        >
          {paid ? notice.paidCta : notice.rejectedCta}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label={notice.close}
          className="flex size-11 items-center justify-center rounded-md text-ink-muted
            hover:text-encre"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
