/**
 * =============================================================
 *  Fichier    : headers.ts
 *  Projet     : Kalami
 *  Description: En-têtes de sécurité HTTP de toutes les pages (Sprint 11s) : politique de
 *               sécurité du contenu (CSP) stricte sans nonce, pour garder le rendu statique
 *               (Cache Components), HSTS, refus de l'affichage en cadre, permissions.
 *               Origines tierces admises : le projet Supabase (API, Storage, Realtime) et
 *               Google pour la connexion (redirection d'un formulaire). v1.1 : domaines de
 *               Google Analytics 4 admis seulement si un identifiant de mesure est défini
 *               (Vercel Analytics est servi par le site lui-même : rien à ouvrir).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-26
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

/** Origines de Google Analytics 4 (recommandation CSP de Google pour gtag.js). */
const GOOGLE_TAG = "https://*.googletagmanager.com";
const GOOGLE_ANALYTICS = "https://*.google-analytics.com https://*.analytics.google.com";

/**
 * Politique de sécurité du contenu.
 * @param supabaseUrl     - URL du projet Supabase (absente : toute origine *.supabase.co)
 * @param isDev           - Mode développement (Turbopack a besoin de « unsafe-eval »)
 * @param googleAnalytics - Vrai si Google Analytics 4 est configuré (NEXT_PUBLIC_GA_ID)
 * @returns Valeur de l'en-tête Content-Security-Policy
 */
export function contentSecurityPolicy(
  supabaseUrl: string | undefined,
  isDev: boolean,
  googleAnalytics = false,
): string {
  const supabase = originOf(supabaseUrl) ?? "https://*.supabase.co";
  const realtime = supabase.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  const ga = googleAnalytics ? ` ${GOOGLE_TAG}` : "";
  const gaData = googleAnalytics ? ` ${GOOGLE_ANALYTICS} ${GOOGLE_TAG}` : "";
  const directives = [
    "default-src 'self'",
    // Sans nonce : les scripts en ligne de Next.js restent permis ; seul tiers : gtag.js
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${ga}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabase}${gaData}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${realtime}${gaData}`,
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
 * @param googleAnalytics - Vrai si Google Analytics 4 est configuré
 */
export function securityHeaders(
  supabaseUrl: string | undefined,
  isDev: boolean,
  googleAnalytics = false,
): HttpHeader[] {
  const csp = contentSecurityPolicy(supabaseUrl, isDev, googleAnalytics);
  const headers: HttpHeader[] = [
    { key: "Content-Security-Policy", value: csp },
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
