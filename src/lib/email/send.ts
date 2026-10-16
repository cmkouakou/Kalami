/**
 * =============================================================
 *  Fichier    : send.ts
 *  Projet     : Kalami
 *  Description: Envoi d'un courriel transactionnel par l'API REST de Resend (sans
 *               dépendance). Sans RESEND_API_KEY ou EMAIL_FROM, aucun envoi n'est tenté :
 *               l'appelant affiche alors le lien à transmettre lui-même. Ne lève jamais
 *               d'erreur : le résultat dit si le courriel est parti. Un échec est noté dans
 *               les journaux du serveur avec la raison donnée par Resend (v0.11.2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-16
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
 * Note dans les journaux du serveur (Vercel) pourquoi Resend a refusé l'envoi : code HTTP,
 * nom et message de l'erreur. Ni la clé ni le contenu du courriel ne sont écrits.
 * @param response - Réponse en erreur de Resend
 */
async function logRefusal(response: Response): Promise<void> {
  const body = (await response.json().catch(() => null)) as
    | { name?: string; message?: string }
    | null;
  console.error(
    `[courriel] Resend a refusé l'envoi (HTTP ${response.status}) :`,
    body?.name ?? "erreur inconnue",
    "—",
    body?.message ?? "",
  );
}

/**
 * Envoie un courriel par Resend.
 * @param message - Destinataire, objet et corps (HTML déjà échappé et texte brut)
 * @returns « sent », « not_configured » (variables absentes) ou « failed »
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    const missing = [apiKey ? "" : "RESEND_API_KEY", from ? "" : "EMAIL_FROM"].filter(Boolean);
    console.error(`[courriel] Envoi non configuré, variable absente : ${missing.join(", ")}`);
    return "not_configured";
  }

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
    if (response.ok) return "sent";
    await logRefusal(response);
    return "failed";
  } catch (error) {
    const reason = error instanceof Error ? error.name : "erreur inconnue";
    console.error("[courriel] Resend injoignable :", reason);
    return "failed";
  }
}
