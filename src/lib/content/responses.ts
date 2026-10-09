/**
 * =============================================================
 *  Fichier    : responses.ts
 *  Projet     : Kalami
 *  Description: Réponses JSON des API de contenu (chapitres, recherche, position) :
 *               en-têtes privés (jamais mis en cache ni indexés) et erreurs sans aucun
 *               contenu du livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: i18n, access.ts
 * =============================================================
 */

import { getDictionary } from "@/i18n";

import { CONTENT_RATE_WINDOW_SECONDS } from "./access";

const t = getDictionary();

/** En-têtes communs : contenu personnel, jamais mis en cache ni indexé. */
export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

export type ErrorStatus = 400 | 401 | 403 | 404 | 429;

/** Code et message renvoyés pour chaque statut d'erreur. */
const ERRORS: Record<ErrorStatus, { error: string; message: string }> = {
  400: { error: "bad_request", message: t.content.api.badRequest },
  401: { error: "unauthorized", message: t.content.api.unauthorized },
  403: { error: "locked", message: t.content.api.locked },
  404: { error: "not_found", message: t.content.api.notFound },
  429: { error: "rate_limited", message: t.content.api.tooManyRequests },
};

/**
 * Réponse d'erreur JSON sans aucun contenu du livre.
 * @param status - Statut HTTP ; 429 ajoute l'en-tête Retry-After
 */
export function errorResponse(status: ErrorStatus): Response {
  const headers: Record<string, string> = { ...PRIVATE_HEADERS };
  if (status === 429) headers["Retry-After"] = String(CONTENT_RATE_WINDOW_SECONDS);
  return Response.json(ERRORS[status], { status, headers });
}

/**
 * Refuse les requêtes venues d'un autre site (protection CSRF) : l'en-tête Origin, envoyé
 * par les navigateurs pour toute requête POST ou PUT, doit désigner ce site.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
