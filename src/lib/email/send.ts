/**
 * =============================================================
 *  Fichier    : send.ts
 *  Projet     : Kalami
 *  Description: Envoi d'un courriel transactionnel par l'API REST de Resend (sans
 *               dépendance). Sans RESEND_API_KEY ou EMAIL_FROM, aucun envoi n'est tenté :
 *               l'appelant affiche alors le lien à transmettre lui-même. Ne lève jamais
 *               d'erreur : le résultat dit si le courriel est parti.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: Resend (https://resend.com/docs/api-reference/emails/send-email)
 * =============================================================
 */

import "server-only";

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailResult = "sent" | "not_configured" | "failed";

/** Vrai si les variables d'envoi sont renseignées. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/**
 * Envoie un courriel par Resend.
 * @param message - Destinataire, objet et corps (HTML déjà échappé et texte brut)
 * @returns « sent », « not_configured » (variables absentes) ou « failed »
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return "not_configured";

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...message, to: [message.to] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
