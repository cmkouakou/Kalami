/**
 * Fichier    : purchases-display.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires de la v0.25.4 : commandes par carte non terminées masquées
 *              dans « Mes achats » (article payé ailleurs, session expirée) et choix de
 *              l'avis Mobile Money montré dans l'application (une seule fois).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-11-18
 */

import { describe, expect, it } from "vitest";

import { pickMobileMoneyNotice } from "@/lib/payments/mm-notice";
import { isPendingCard, itemKey, visibleOrders } from "@/lib/payments/order-display";
import type { OrderItemLink, OrderSummary } from "@/lib/payments/queries";

const NOW = new Date("2026-11-18T12:00:00Z");

/** Article « livre » de test. */
const BOOK = {
  label: "La stratégie d'entreprise",
  kind: "book",
  study_id: null,
  credits: null,
  practice_case: null,
  book: { slug: "la-strategie-d-entreprise", grants_study_credit: false },
};

/** Commande de test (par défaut : carte en attente créée il y a 10 minutes). */
function order(overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: "o1",
    status: "pending",
    currency: "XOF",
    total_minor: 5000,
    receipt_url: null,
    paid_at: null,
    refunded_at: null,
    created_at: "2026-11-18T11:50:00Z",
    items: [BOOK],
    provider: "stripe",
    mm_operator: null,
    mm_merchant_number: null,
    mm_reference: null,
    mm_expires_at: null,
    mm_transaction_id: null,
    mm_declared_at: null,
    mm_rejection_reason: null,
    ...overrides,
  };
}

/** Lien de test : un livre s'ouvre dans la liseuse. */
const linkOf = (): OrderItemLink => ({ href: "/livres/la-strategie-d-entreprise/lire", kind: "read" });

describe("visibleOrders", () => {
  it("masque la carte non terminée quand le même livre est payé par Mobile Money", () => {
    const paid = order({ id: "mm", provider: "mobile_money", status: "paid" });
    const card = order({ id: "carte" });
    expect(visibleOrders([paid, card], NOW).map((o) => o.id)).toEqual(["mm"]);
  });

  it("garde une carte récente sans autre achat du même article", () => {
    expect(visibleOrders([order()], NOW)).toHaveLength(1);
  });

  it("masque une carte dont la session a expiré (plus d'une heure)", () => {
    const old = order({ created_at: "2026-11-18T10:59:00Z" });
    expect(visibleOrders([old], NOW)).toHaveLength(0);
  });

  it("ne masque jamais un paiement Mobile Money en attente", () => {
    const mm = order({ provider: "mobile_money", created_at: "2026-11-17T08:00:00Z" });
    const paid = order({ id: "p", status: "paid" });
    expect(visibleOrders([paid, mm], NOW)).toHaveLength(2);
  });

  it("distingue deux articles différents", () => {
    const paid = order({ id: "p", status: "paid" });
    const other = order({ id: "x", items: [{ ...BOOK, book: { ...BOOK.book, slug: "autre" } }] });
    expect(visibleOrders([paid, other], NOW)).toHaveLength(2);
    expect(itemKey(paid.items[0])).not.toBe(itemKey(other.items[0]));
  });

  it("reconnaît une carte en attente", () => {
    expect(isPendingCard(order())).toBe(true);
    expect(isPendingCard(order({ provider: "mobile_money" }))).toBe(false);
    expect(isPendingCard(order({ status: "paid" }))).toBe(false);
  });
});

describe("pickMobileMoneyNotice", () => {
  const paid = order({ id: "mm1", provider: "mobile_money", status: "paid" });

  it("annonce un paiement validé avec le lien vers la lecture", () => {
    expect(pickMobileMoneyNotice(paid, undefined, linkOf)).toEqual({
      orderId: "mm1",
      outcome: "paid",
      label: "La stratégie d'entreprise",
      href: "/livres/la-strategie-d-entreprise/lire",
    });
  });

  it("ne répète pas un avis déjà vu", () => {
    expect(pickMobileMoneyNotice(paid, "mm1", linkOf)).toBeNull();
  });

  it("annonce un refus avec le lien vers la commande (motif)", () => {
    const failed = order({ id: "mm2", provider: "mobile_money", status: "failed" });
    expect(pickMobileMoneyNotice(failed, "mm1", linkOf)).toMatchObject({
      outcome: "rejected",
      href: "/compte/achats/mm2",
    });
  });

  it("ne dit rien sans décision ni pour une commande par carte", () => {
    expect(pickMobileMoneyNotice(null, undefined, linkOf)).toBeNull();
    expect(pickMobileMoneyNotice(order({ status: "paid" }), undefined, linkOf)).toBeNull();
  });
});
