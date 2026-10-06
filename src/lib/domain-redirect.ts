/**
 * =============================================================
 *  Fichier    : domain-redirect.ts
 *  Projet     : Kalami
 *  Description: Calcule la redirection 301 d'un domaine secondaire vers le domaine principal.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: (aucune)
 * =============================================================
 */

/**
 * Retourne l'URL de redirection si l'hôte de la requête est un domaine secondaire.
 *
 * Le chemin et la chaîne de requête sont conservés pour ne pas casser les liens partagés.
 *
 * @param requestUrl      - URL complète de la requête entrante
 * @param host            - En-tête Host (peut contenir un port)
 * @param appUrl          - URL du domaine principal (ex. https://kalami-livres.com)
 * @param redirectDomains - Domaines secondaires à rediriger
 * @returns L'URL cible, ou null si aucune redirection n'est nécessaire
 *
 * Exemple :
 *   getDomainRedirect("https://kalami-books.com/livres/x?a=1", "kalami-books.com",
 *     "https://kalami-livres.com", ["kalami-books.com"])
 *   // → "https://kalami-livres.com/livres/x?a=1"
 */
export function getDomainRedirect(
  requestUrl: string,
  host: string | null,
  appUrl: string,
  redirectDomains: string[],
): string | null {
  if (!host || redirectDomains.length === 0) return null;

  const hostname = host.split(":")[0].toLowerCase();
  if (!redirectDomains.includes(hostname)) return null;

  const source = new URL(requestUrl);
  const target = new URL(source.pathname + source.search, appUrl);
  return target.toString();
}
