/**
 * =============================================================
 *  Fichier    : class-email.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lien et courriel d'inscription à une classe (S10a). Le lien de classe et
 *               les invitations portent un jeton aléatoire de 256 bits (même générateur
 *               que les invitations d'étude), jamais stocké : la base n'en garde que
 *               l'empreinte. Le courriel est produit en HTML échappé et en texte brut.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/config.ts, lib/pdf/render.ts (échappement), lib/strategy/team-email.ts
 * =============================================================
 */

import "server-only";

import { interpolate } from "@/i18n";
import { APP_URL } from "@/lib/config";
import type { EmailMessage } from "@/lib/email/send";
import { escapeHtml } from "@/lib/pdf/render";
import { getStrategyDictionary } from "@/i18n/strategy";

export { newInvitationToken } from "@/lib/strategy/team-email";

const em = getStrategyDictionary().classes.email;

/** Adresse publique de la page d'inscription (lien de classe ou invitation). */
export function classJoinUrl(token: string): string {
  return `${APP_URL}/strategie/classe/${encodeURIComponent(token)}`;
}

export type ClassEmailInput = {
  to: string;
  teacherName: string;
  className: string;
  url: string;
};

/**
 * Courriel d'invitation à une classe : objet, corps HTML (texte saisi échappé) et texte.
 * @param input - Destinataire, enseignant, classe et lien
 */
export function buildClassInvitationEmail(input: ClassEmailInput): EmailMessage {
  const values = { teacher: input.teacherName, name: input.className, email: input.to };
  const body = interpolate(em.body, values);
  const account = interpolate(em.account, values);
  const html = [
    `<p>${escapeHtml(em.greeting)}</p>`,
    `<p>${escapeHtml(body)}</p>`,
    `<p><a href="${escapeHtml(input.url)}" style="display:inline-block;padding:10px 18px;` +
      `background:#1e4d4a;color:#ffffff;border-radius:6px;text-decoration:none">` +
      `${escapeHtml(em.cta)}</a></p>`,
    `<p>${escapeHtml(account)}</p>`,
    `<p style="color:#666666;font-size:13px">${escapeHtml(em.validity)}</p>`,
  ].join("\n");
  const text = [em.greeting, "", body, "", `${em.cta} : ${input.url}`, "", account, "",
    em.validity].join("\n");

  return {
    to: input.to,
    // L'objet n'est pas du HTML : seuls les retours à la ligne sont retirés
    subject: interpolate(em.subject, values).replace(/[\r\n]+/g, " "),
    html,
    text,
  };
}
