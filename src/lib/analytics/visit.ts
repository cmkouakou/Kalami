/**
 * =============================================================
 *  Fichier    : visit.ts (lib/analytics)
 *  Projet     : Kalami
 *  Description: Règles des statistiques de visite anonymes (v0.16.1) : pages exclues,
 *               chemin normalisé (sans paramètres, identifiants masqués), site d'origine
 *               réduit à son nom d'hôte, robots écartés, provenance classée par famille.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-28
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== CONSTANTES ====================

/** Espaces jamais comptés : administration, API, retours de connexion. */
const EXCLUDED_PREFIXES = ["/admin", "/api", "/auth"];

const UUID_SEGMENT = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;

const BOT_AGENT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i;

const SEARCH_ENGINES = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yahoo.",
  "qwant.",
  "ecosia.",
  "yandex.",
];
const SOCIAL_NETWORKS = [
  "facebook.",
  "fb.",
  "instagram.",
  "linkedin.",
  "lnkd.in",
  "t.co",
  "twitter.",
  "x.com",
  "whatsapp.",
  "tiktok.",
  "youtube.",
  "pinterest.",
  "reddit.",
  "telegram.",
];
const EMAIL_HOSTS = ["mail.", "outlook.", "gmail."];

/** Famille de provenance d'une arrivée sur le site. */
export type SourceKind = "direct" | "search" | "social" | "email" | "website";

// ==================== FONCTIONS ====================

/**
 * Chemin à compter, ou null s'il ne doit pas l'être.
 * @param raw - Chemin envoyé par le navigateur
 * @returns Chemin sans paramètres, identifiants remplacés par « :id », 200 caractères au plus
 */
export function normalizeVisitPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = (raw.split(/[?#]/)[0] ?? "").replace(UUID_SEGMENT, "/:id");
  const excluded = EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (excluded || path.length > 200) return null;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Nom d'hôte du site d'origine (sans « www. »), ou "" pour un accès direct ou interne.
 * @param referrer - document.referrer envoyé par le navigateur
 * @param ownHost  - Hôte du site (en-tête Host)
 */
export function referrerHost(referrer: unknown, ownHost: string | null): string {
  if (typeof referrer !== "string" || !referrer) return "";
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    const own = (ownHost ?? "").toLowerCase().split(":")[0]?.replace(/^www\./, "");
    return host === own ? "" : host.slice(0, 100);
  } catch {
    return "";
  }
}

/**
 * Robot d'indexation ou aperçu de lien : jamais compté.
 * @param userAgent - En-tête User-Agent
 */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_AGENT.test(userAgent);
}

/**
 * Famille de provenance d'un site d'origine.
 * @param host - Nom d'hôte, "" = accès direct
 */
export function sourceKind(host: string): SourceKind {
  if (!host) return "direct";
  const matches = (list: string[]) =>
    list.some((part) => host.startsWith(part) || host.includes(`.${part}`) || host === part);
  // Messageries d'abord : mail.google.com n'est pas une recherche Google
  if (matches(EMAIL_HOSTS)) return "email";
  if (matches(SEARCH_ENGINES)) return "search";
  if (matches(SOCIAL_NETWORKS)) return "social";
  return "website";
}

/**
 * Code pays à 2 lettres fourni par l'hébergeur, ou "" s'il est absent ou invalide.
 * @param header - En-tête x-vercel-ip-country
 */
export function countryCode(header: string | null): string {
  return header && /^[A-Z]{2}$/.test(header) ? header : "";
}
