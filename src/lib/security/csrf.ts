/**
 * =============================================================
 *  Fichier    : csrf.ts
 *  Projet     : Kalami
 *  Description: Protection CSRF des requêtes qui modifient des données (Sprint 11s), appliquée
 *               par le proxy avant Next.js. Next.js refuse déjà une action serveur dont
 *               l'en-tête Origin désigne un autre site, mais laisse passer celle qui n'en a
 *               pas : on la refuse ici. Toute requête marquée « cross-site » par le
 *               navigateur (Sec-Fetch-Site) est aussi refusée. Le webhook Stripe, appelé de
 *               serveur à serveur et protégé par sa signature, est exclu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Méthodes sans effet : jamais contrôlées. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Chemins appelés par des services externes, protégés autrement (signature, secret). */
const EXEMPT_PATHS = ["/api/stripe/webhook"];

/**
 * Vrai si la requête doit être refusée comme tentative de CSRF.
 * @param method   - Méthode HTTP
 * @param pathname - Chemin demandé
 * @param headers  - En-têtes de la requête
 */
export function isCrossSiteMutation(method: string, pathname: string, headers: Headers): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  if (EXEMPT_PATHS.includes(pathname)) return false;

  // Navigateurs récents : la requête vient d'un autre site
  if (headers.get("sec-fetch-site") === "cross-site") return true;

  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (origin) {
    try {
      return new URL(origin).host !== host;
    } catch {
      return true;
    }
  }
  // Action serveur sans Origin : un navigateur l'envoie toujours, un outil forgé non
  return headers.has("next-action");
}
