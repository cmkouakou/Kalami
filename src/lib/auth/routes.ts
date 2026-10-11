/**
 * =============================================================
 *  Fichier    : routes.ts
 *  Projet     : Kalami
 *  Description: Chemins privés, validation des redirections après connexion, pages de
 *               connexion propres à Kalami Stratégie et filet de sécurité pour un code de
 *               connexion arrivé sur l'accueil.
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-09
 * =============================================================
 */

/** Préfixes de chemins réservés aux utilisateurs connectés. */
export const PROTECTED_PREFIXES = [
  "/compte",
  "/admin",
  "/strategie/etudes",
  "/strategie/nouvelle",
] as const;

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

/** Accueil de Kalami Stratégie : ses pages de connexion vivent sous ce préfixe. */
export const STRATEGY_HOME = "/strategie";

/** Pages de connexion, présentes sur le site et dans Kalami Stratégie. */
export type AuthPage =
  | "connexion"
  | "inscription"
  | "mot-de-passe-oublie"
  | "reinitialiser-mot-de-passe";

/** Vrai si le chemin appartient à Kalami Stratégie. */
export function isStrategyPath(path: string | null | undefined): boolean {
  return !!path && (path === STRATEGY_HOME || /^\/strategie[/?#]/.test(path));
}

/**
 * Adresse d'une page de connexion qui garde l'utilisateur dans son espace : un chemin
 * de Kalami Stratégie mène aux pages /strategie/…, tout autre chemin à celles du site.
 * @param page - Page de connexion voulue
 * @param next - Page à rouvrir ensuite (vide = aucune)
 * @returns Ex. « /strategie/connexion?suivant=%2Fstrategie%2Fnouvelle »
 */
export function authPath(page: AuthPage, next?: string | null): string {
  const base = isStrategyPath(next) ? STRATEGY_HOME : "";
  const query = next ? `?suivant=${encodeURIComponent(next)}` : "";
  return `${base}/${page}${query}`;
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
