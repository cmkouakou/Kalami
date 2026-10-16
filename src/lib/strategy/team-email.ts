/**
 * =============================================================
 *  Fichier    : team-email.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lien et courriel d'invitation (S9a). Le lien porte un jeton aléatoire de
 *               256 bits, jamais stocké (la base n'en garde que l'empreinte SHA-256). Le
 *               courriel est produit en HTML échappé et en texte brut.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/config.ts, lib/pdf/render.ts (échappement), lib/strategy/team.ts
 * =============================================================
 */

import "server-only";

import { randomBytes } from "node:crypto";

import { getDictionary, interpolate } from "@/i18n";
import { APP_URL } from "@/lib/config";
import type { EmailMessage } from "@/lib/email/send";
import { escapeHtml } from "@/lib/pdf/render";
import type { InviteRole } from "@/lib/strategy/team";

const s = getDictionary().strategy;
const em = s.team.email;

/** Jeton d'invitation : 32 octets aléatoires en base64url (43 caractères). */
export function newInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Adresse publique de la page d'invitation. */
export function invitationUrl(token: string): string {
  return `${APP_URL}/strategie/invitation/${encodeURIComponent(token)}`;
}

export type InvitationEmailInput = {
  to: string;
  inviterName: string;
  companyName: string;
  role: InviteRole;
  url: string;
};

/**
 * Courriel d'invitation : objet, corps HTML (texte saisi échappé) et corps texte.
 * @param input - Destinataire, invitant, entreprise, rôle et lien
 */
export function buildInvitationEmail(input: InvitationEmailInput): EmailMessage {
  const values = {
    inviter: input.inviterName,
    company: input.companyName,
    role: s.studies.roles[input.role].toLowerCase(),
    email: input.to,
  };
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
