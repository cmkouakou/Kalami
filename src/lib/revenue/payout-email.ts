/**
 * =============================================================
 *  Fichier    : payout-email.ts
 *  Projet     : Kalami
 *  Description: Courriels des versements (Sprint 10b, v0.12.1) : alerte aux administrateurs
 *               à chaque demande, puis avis de paiement ou de refus (avec le motif) à
 *               l'auteur. Corps en HTML échappé et en texte brut.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/config.ts, lib/pdf/render.ts (échappement), lib/currency.ts
 * =============================================================
 */

import "server-only";

import type { Currency } from "@/lib/catalog/types";
import { getDictionary, interpolate } from "@/i18n";
import { APP_URL } from "@/lib/config";
import { formatPrice } from "@/lib/currency";
import type { EmailMessage } from "@/lib/email/send";
import { escapeHtml } from "@/lib/pdf/render";

const em = getDictionary().admin.payouts.email;

/** Style du bouton des courriels (même que les invitations). */
const BUTTON_STYLE =
  "display:inline-block;padding:10px 18px;background:#1e4d4a;color:#ffffff;" +
  "border-radius:6px;text-decoration:none";

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Assemble un courriel : paragraphes, bouton, objet sur une ligne.
 * @param to - Destinataire
 * @param subject - Objet (texte brut)
 * @param paragraphs - Paragraphes (texte brut, échappés ici)
 * @param cta - Libellé et adresse du bouton
 */
function compose(
  to: string,
  subject: string,
  paragraphs: string[],
  cta: { label: string; url: string },
): EmailMessage {
  const html = [
    ...paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    `<p><a href="${escapeHtml(cta.url)}" style="${BUTTON_STYLE}">${escapeHtml(cta.label)}</a></p>`,
  ].join("\n");
  const text = [...paragraphs, `${cta.label} : ${cta.url}`].join("\n\n");
  // L'objet n'est pas du HTML : seuls les retours à la ligne sont retirés
  return { to, subject: subject.replace(/[\r\n]+/g, " "), html, text };
}

// ==================== ALERTE ADMINISTRATEUR ====================

export type PayoutAlertInput = {
  to: string;
  authorName: string;
  reference: string;
  currency: Currency;
  amountMinor: number;
};

/**
 * Alerte d'une nouvelle demande de versement.
 * @param input - Destinataire et demande
 */
export function buildPayoutAlert(input: PayoutAlertInput): EmailMessage {
  const values = {
    author: input.authorName,
    reference: input.reference,
    amount: formatPrice(input.amountMinor, input.currency),
  };
  return compose(
    input.to,
    interpolate(em.adminSubject, values),
    [interpolate(em.adminBody, values)],
    { label: em.adminCta, url: `${APP_URL}/admin/versements` },
  );
}

// ==================== AVIS À L'AUTEUR ====================

export type PayoutDecisionInput = {
  to: string;
  reference: string;
  currency: Currency;
  amountMinor: number;
  /** Référence de la transaction (versement payé) */
  transaction?: string;
  /** Motif du refus ; absent si le versement est payé */
  rejectionReason?: string;
};

/**
 * Avis de paiement, ou de refus avec le motif.
 * @param input - Auteur, demande et motif éventuel
 */
export function buildPayoutDecision(input: PayoutDecisionInput): EmailMessage {
  const values = {
    reference: input.reference,
    amount: formatPrice(input.amountMinor, input.currency),
    transaction: input.transaction ?? "—",
    reason: input.rejectionReason ?? "",
  };
  const cta = { label: em.cta, url: `${APP_URL}/auteur/revenus` };
  if (input.rejectionReason === undefined) {
    return compose(
      input.to,
      interpolate(em.paidSubject, values),
      [em.greeting, interpolate(em.paidBody, values)],
      cta,
    );
  }
  return compose(
    input.to,
    interpolate(em.rejectedSubject, values),
    [em.greeting, interpolate(em.rejectedBody, values), interpolate(em.reason, values)],
    cta,
  );
}
