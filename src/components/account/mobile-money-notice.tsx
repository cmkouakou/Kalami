/**
 * =============================================================
 *  Fichier    : mobile-money-notice.tsx
 *  Projet     : Kalami
 *  Description: Avis Mobile Money placé sous l'en-tête (composant serveur, v0.25.4) : lit
 *               la dernière décision de l'administration sur un paiement de l'acheteur
 *               connecté et le témoin du dernier avis vu, puis affiche le bandeau.
 *               À placer sous Suspense (lit la session et les témoins).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: lib/payments/queries.ts, lib/payments/mm-notice.ts,
 *               components/account/mobile-money-notice-banner.tsx
 * =============================================================
 */

import { cookies } from "next/headers";

import { MobileMoneyNoticeBanner } from "@/components/account/mobile-money-notice-banner";
import { getCurrentUser } from "@/lib/auth/dal";
import { MM_NOTICE_COOKIE, pickMobileMoneyNotice } from "@/lib/payments/mm-notice";
import { getLatestMobileMoneyDecision, orderItemLink } from "@/lib/payments/queries";

/** Bandeau d'avis, ou rien (visiteur, aucune décision, avis déjà vu). */
export async function MobileMoneyNotice() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [order, cookieStore] = await Promise.all([getLatestMobileMoneyDecision(), cookies()]);
  const notice = pickMobileMoneyNotice(
    order,
    cookieStore.get(MM_NOTICE_COOKIE)?.value,
    orderItemLink,
  );
  if (!notice) return null;
  return <MobileMoneyNoticeBanner {...notice} />;
}
