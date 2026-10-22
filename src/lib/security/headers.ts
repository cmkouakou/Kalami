/**
 * =============================================================
 *  Fichier    : headers.ts
 *  Projet     : Kalami
 *  Description: En-têtes de sécurité HTTP de toutes les pages (Sprint 11s) : politique de
 *               sécurité du contenu (CSP) stricte sans nonce, pour garder le rendu statique
 *               (Cache Components), HSTS, refus de l'affichage en cadre, permissions.
 *               Origines tierces admises : le projet Supabase (API, Storage, Realtime) et
 *               Google pour la connexion (redirection d'un formulaire).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: (aucune) — lu par next.config.ts
 * =============================================================
 */

/** En-tête HTTP au format attendu par next.config.ts. */
export type HttpHeader = { key: string; value: string };

/**
 * Origine (schéma + hôte) d'une URL ; null si elle est absente ou invalide.
 * @param url - URL complète, ex. NEXT_PUBLIC_SUPABASE_URL
 */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Politique de sécurité du contenu.
 * @param supabaseUrl - URL du projet Supabase (absente : toute origine *.supabase.co)
 * @param isDev       - Mode développement (Turbopack a besoin de « unsafe-eval »)
 * @returns Valeur de l'en-tête Content-Security-Policy
 */
export function contentSecurityPolicy(supabaseUrl: string | undefined, isDev: boolean): string {
  const supabase = originOf(supabaseUrl) ?? "https://*.supabase.co";
  const realtime = supabase.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  const directives = [
    "default-src 'self'",
    // Sans nonce : les scripts en ligne de Next.js restent permis, aucune origine tierce
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabase}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${realtime}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    // Connexion Google : le formulaire mène à Supabase puis à Google (redirections suivies)
    `form-action 'self' ${supabase} https://accounts.google.com`,
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * @param supabaseUrl - URL du projet Supabase
 * @param isDev       - Mode développement (pas de HSTS sur localhost)
 */
export function securityHeaders(supabaseUrl: string | undefined, isDev: boolean): HttpHeader[] {
  const headers: HttpHeader[] = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(supabaseUrl, isDev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  ];
  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }
  return headers;
}
