/**
 * =============================================================
 *  Fichier    : page.tsx (compte/achats/merci)
 *  Projet     : Kalami
 *  Description: Page de retour après le paiement Stripe (?commande=…). L'accès n'est jamais
 *               accordé ici : la page attend que le webhook signé ait confirmé la commande,
 *               puis propose de lire le livre (et l'étude offerte pour le livre guide).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: lib/payments/queries.ts, components/account/order-status-poller.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderStatusPoller } from "@/components/account/order-status-poller";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireUser } from "@/lib/auth/dal";
import { getMyOrder } from "@/lib/payments/queries";

const t = getDictionary();
const tt = t.account.purchases.thanks;

export const metadata: Metadata = { title: tt.title, robots: { index: false } };

/** État de la commande (lit la session : rendu à la demande). */
async function ThanksContent({ searchParams }: PageProps<"/compte/achats/merci">) {
  const query = await searchParams;
  const orderId = typeof query.commande === "string" ? query.commande : "";
  await requireUser(`/compte/achats/merci?commande=${encodeURIComponent(orderId)}`);
  const order = isUuid(orderId) ? await getMyOrder(orderId) : null;

  if (!order) return <p className="text-body text-ink-muted">{tt.notFound}</p>;
  if (order.status === "pending") return <OrderStatusPoller />;
  if (order.status !== "paid") return <p className="text-body text-ink-muted">{tt.expired}</p>;

  const item = order.items[0];
  const bonus = order.items.some((i) => i.book?.grants_study_credit);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-body">{interpolate(tt.paid, { label: item?.label ?? "" })}</p>
      {item?.book && (
        <Link href={`/livres/${item.book.slug}/lire`} className={`${BUTTON_PRIMARY} w-fit`}>
          {t.account.purchases.read}
        </Link>
      )}
      {bonus && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
          <p className="text-body">{tt.bonus}</p>
          <Link href="/strategie/nouvelle" className={`${BUTTON_SECONDARY} w-fit`}>
            {tt.bonusLink}
          </Link>
        </div>
      )}
      <Link href="/compte/achats" className="text-encre underline">
        {t.account.purchasesLink}
      </Link>
    </div>
  );
}

export default function ThanksPage(props: PageProps<"/compte/achats/merci">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-semibold">{tt.title}</h1>
      <Suspense>
        <ThanksContent {...props} />
      </Suspense>
    </main>
  );
}
