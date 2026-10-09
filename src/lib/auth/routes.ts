/**
 * =============================================================
 *  Fichier    : routes.ts
 *  Projet     : Kalami
 *  Description: Chemins privés, validation des redirections après connexion et filet de
 *               sécurité pour un code de connexion arrivé sur l'accueil.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 * =============================================================
 */

/** Préfixes de chemins réservés aux utilisateurs connectés. */
export const PROTECTED_PREFIXES = ["/compte", "/admin"] as const;

/** Vrai si le chemin exige une connexion. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Retourne un chemin de redirection interne sûr (évite les redirections ouvertes
 * vers un autre site, ex. « //malveillant.com » ou « https://… »).
 * @param next     - Valeur brute reçue (paramètre « suivant »)
 * @param fallback - Chemin par défaut
 */
export function safeNextPath(next: string | null | undefined, fallback = "/compte"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

/**
 * Filet de sécurité : si Supabase renvoie le code de connexion sur l'accueil (adresse de
 * retour refusée → « Site URL »), retourne l'adresse de /auth/callback qui l'échangera.
 * @param url - Adresse demandée
 * @returns Adresse de /auth/callback avec les mêmes paramètres, ou null
 */
export function strayAuthCallback(url: URL): URL | null {
  if (url.pathname !== "/" || !url.searchParams.get("code")) return null;
  const target = new URL(url);
  target.pathname = "/auth/callback";
  return target;
}
