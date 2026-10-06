/**
 * =============================================================
 *  Fichier    : routes.ts
 *  Projet     : Kalami
 *  Description: Chemins privés et validation des redirections après connexion.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
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
