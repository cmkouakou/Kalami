/**
 * =============================================================
 *  Fichier    : eac-return.ts
 *  Projet     : Kalami Stratégie
 *  Description: Retour du plan stratégique vers Entrepreneur au Combat (v0.26.1) : envoi
 *               de serveur à serveur du PDF et du DOCX du plan au dossier lié (formulaire
 *               multipart, clé partagée en en-tête Bearer, délai limité).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: lib/strategy/eac.ts
 * =============================================================
 */

import "server-only";

import type { EacReturnSettings } from "@/lib/strategy/eac";

/** Délai maximal de réponse d'EAC (stockage des fichiers compris). */
const TIMEOUT_MS = 30_000;

/** Fichier du plan à joindre. */
export type PlanAttachment = { bytes: Uint8Array; contentType: string; fileName: string };

/** Contenu de l'envoi. */
export type EacPlanDelivery = {
  dossierId: string;
  studyId: string;
  title: string;
  sentBy: string;
  pdf: PlanAttachment;
  docx: PlanAttachment | null;
};

export type EacSendResult = { ok: true; version: number } | { ok: false; message: string };

/** Joint un fichier au formulaire. */
function attach(form: FormData, field: string, file: PlanAttachment) {
  const blob = new Blob([Buffer.from(file.bytes)], { type: file.contentType });
  form.append(field, blob, file.fileName);
}

/**
 * Envoie le plan à EAC, qui l'enregistre comme nouvelle version à publier par le mentor.
 *
 * @param settings - Adresse de réception et clé (eacReturnSettings)
 * @param delivery - Dossier, étude, titre, expéditeur et fichiers
 * @returns Version créée, ou message d'erreur lisible (jamais d'exception)
 *
 * Exemple d'utilisation :
 *   const result = await sendPlanToEac(settings, { dossierId, studyId, ... });
 */
export async function sendPlanToEac(
  settings: EacReturnSettings,
  delivery: EacPlanDelivery,
): Promise<EacSendResult> {
  const form = new FormData();
  form.append("dossierId", delivery.dossierId);
  form.append("studyId", delivery.studyId);
  form.append("titre", delivery.title.slice(0, 200));
  form.append("envoyePar", delivery.sentBy.slice(0, 120));
  attach(form, "pdf", delivery.pdf);
  if (delivery.docx) attach(form, "docx", delivery.docx);

  let response: Response;
  try {
    response = await fetch(settings.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.secret}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Entrepreneur au Combat ne répond pas. Réessayez plus tard." };
  }

  const body = (await response.json().catch(() => null)) as
    | { version?: unknown; error?: unknown }
    | null;
  if (response.ok && typeof body?.version === "number") {
    return { ok: true, version: body.version };
  }
  if (response.status === 401) {
    return { ok: false, message: "Clé de liaison refusée par Entrepreneur au Combat." };
  }
  const detail = typeof body?.error === "string" ? body.error : `erreur ${response.status}`;
  return { ok: false, message: `Envoi refusé par Entrepreneur au Combat : ${detail}` };
}
