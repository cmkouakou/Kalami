/**
 * =============================================================
 *  Fichier    : mobile-money-email.ts
 *  Projet     : Kalami
 *  Description: Courriels du Mobile Money (Sprint 6, v0.11.0) : alerte aux administrateurs
 *               à chaque déclaration, puis confirmation ou refus (avec le motif) à
 *               l'acheteur. Corps en HTML échappé et en texte brut.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/config.ts, lib/pdf/render.ts (échappement), lib/currency.ts
 * =============================================================
 */

import "server-only";

import { getDictionary, interpolate } from "@/i18n";
import { APP_URL } from "@/lib/config";
import { formatPrice } from "@/lib/currency";
import type { EmailMessage } from "@/lib/email/send";
import { escapeHtml } from "@/lib/pdf/render";

const em = getDictionary().mobileMoney.email;

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

export type DeclarationAlertInput = {
  to: string;
  buyerEmail: string;
  operatorName: string;
  totalMinor: number;
  labels: string;
  reference: string;
  transactionId: string;
  payerNumber: string;
};

/**
 * Alerte d'une nouvelle déclaration, avec de quoi rapprocher le relevé.
 * @param input - Destinataire et détails de la transaction
 */
export function buildDeclarationAlert(input: DeclarationAlertInput): EmailMessage {
  const values = {
    buyer: input.buyerEmail,
    operator: input.operatorName,
    amount: formatPrice(input.totalMinor, "XOF"),
    labels: input.labels,
    reference: input.reference,
    transaction: input.transactionId,
    payer: input.payerNumber,
  };
  return compose(
    input.to,
    interpolate(em.adminSubject, values),
    [interpolate(em.adminBody, values), interpolate(em.adminDetails, values)],
    { label: em.adminCta, url: `${APP_URL}/admin/commandes?statut=to_review` },
  );
}

// ==================== DÉCISION POUR L'ACHETEUR ====================

export type DecisionEmailInput = {
  to: string;
  totalMinor: number;
  labels: string;
  reference: string;
  /** Motif du refus ; absent si le paiement est validé */
  rejectionReason?: string;
};

/**
 * Confirmation (paiement validé) ou refus avec le motif.
 * @param input - Acheteur, commande et motif éventuel
 */
export function buildDecisionEmail(input: DecisionEmailInput): EmailMessage {
  const values = {
    amount: formatPrice(input.totalMinor, "XOF"),
    labels: input.labels,
    reference: input.reference,
    reason: input.rejectionReason ?? "",
  };
  const cta = { label: em.cta, url: `${APP_URL}/compte/achats` };
  if (input.rejectionReason === undefined) {
    return compose(
      input.to,
      interpolate(em.validatedSubject, values),
      [em.greeting, interpolate(em.validatedBody, values)],
      cta,
    );
  }
  return compose(
    input.to,
    interpolate(em.rejectedSubject, values),
    [
      em.greeting,
      interpolate(em.rejectedBody, values),
      interpolate(em.reason, values),
      em.rejectedHelp,
    ],
    cta,
  );
}
