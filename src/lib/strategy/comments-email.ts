/**
 * =============================================================
 *  Fichier    : comments-email.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lien vers un commentaire et courriel de mention (S9b). Le courriel est
 *               produit en HTML échappé et en texte brut ; il cite le début du commentaire
 *               et rappelle comment désactiver ces envois.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/config.ts, lib/pdf/render.ts (échappement)
 * =============================================================
 */

import "server-only";

import { interpolate } from "@/i18n";
import { APP_URL } from "@/lib/config";
import type { EmailMessage } from "@/lib/email/send";
import { escapeHtml } from "@/lib/pdf/render";
import type { StepNo } from "@/lib/strategy/steps";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const em = s.notifications.email;

/** Longueur de l'extrait du commentaire cité dans le courriel. */
const EXCERPT_MAX = 400;

/**
 * Chemin d'un commentaire dans la page de son étape (ancre du fil).
 * @param studyId   - Étude
 * @param stepNo    - Étape
 * @param commentId - Commentaire
 */
export function commentPath(studyId: string, stepNo: StepNo, commentId: string): string {
  return `/strategie/etudes/${studyId}/etapes/${stepNo}#commentaire-${commentId}`;
}

/** Adresse publique d'un commentaire (lien du courriel). */
export function commentUrl(studyId: string, stepNo: StepNo, commentId: string): string {
  return `${APP_URL}${commentPath(studyId, stepNo, commentId)}`;
}

export type MentionEmailInput = {
  to: string;
  actorName: string;
  companyName: string;
  stepNo: StepNo;
  body: string;
  url: string;
};

/**
 * Courriel de mention : objet, corps HTML (texte saisi échappé) et corps texte.
 * @param input - Destinataire, auteur, entreprise, étape, commentaire et lien
 */
export function buildMentionEmail(input: MentionEmailInput): EmailMessage {
  const values = {
    actor: input.actorName,
    company: input.companyName,
    step: `${input.stepNo} — ${s.steps[input.stepNo].title}`,
  };
  const intro = interpolate(em.body, values);
  const excerpt = input.body.length > EXCERPT_MAX
    ? `${input.body.slice(0, EXCERPT_MAX - 1).trimEnd()}…`
    : input.body;
  const footer = interpolate(em.footer, { url: `${APP_URL}/strategie/notifications` });
  const html = [
    `<p>${escapeHtml(em.greeting)}</p>`,
    `<p>${escapeHtml(intro)}</p>`,
    `<blockquote style="margin:0 0 16px;padding:8px 14px;border-left:3px solid #1e4d4a;` +
      `color:#333333;white-space:pre-line">${escapeHtml(excerpt)}</blockquote>`,
    `<p><a href="${escapeHtml(input.url)}" style="display:inline-block;padding:10px 18px;` +
      `background:#1e4d4a;color:#ffffff;border-radius:6px;text-decoration:none">` +
      `${escapeHtml(em.cta)}</a></p>`,
    `<p style="color:#666666;font-size:13px">${escapeHtml(footer)}</p>`,
  ].join("\n");
  const text = [em.greeting, "", intro, "", excerpt, "", `${em.cta} : ${input.url}`, "",
    footer].join("\n");

  return {
    to: input.to,
    // L'objet n'est pas du HTML : seuls les retours à la ligne sont retirés
    subject: interpolate(em.subject, values).replace(/[\r\n]+/g, " "),
    html,
    text,
  };
}
