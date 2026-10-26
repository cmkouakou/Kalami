/**
 * =============================================================
 *  Fichier    : config.ts
 *  Projet     : Kalami
 *  Description: Configuration centrale de l'application (nom, URL, domaines secondaires,
 *               identifiants Google Analytics et Search Console).
 *               Aucune valeur de marque ne doit être écrite en dur ailleurs dans le code.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-26
 * =============================================================
 */

// ==================== VALEURS PAR DÉFAUT ====================

const DEFAULT_APP_NAME = "Kalami";
const DEFAULT_APP_URL = "https://kalami-livres.com";

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Normalise une URL : retire les barres obliques finales.
 * @param url - URL brute issue d'une variable d'environnement
 * @returns URL sans « / » final
 */
export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Transforme une liste « a.com, b.com » en tableau de noms d'hôte en minuscules.
 * @param raw - Valeur brute (peut être vide ou indéfinie)
 * @returns Liste des domaines, sans doublons ni entrées vides
 */
export function parseDomainList(raw: string | undefined): string[] {
  if (!raw) return [];
  const domains = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
  return [...new Set(domains)];
}

// ==================== CONFIGURATION EXPORTÉE ====================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || DEFAULT_APP_NAME;

export const APP_URL = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL);

/** Domaines secondaires redirigés en 301 vers APP_URL (ex. kalami-books.com). */
export const REDIRECT_DOMAINS = parseDomainList(process.env.REDIRECT_DOMAINS);

/** Identifiant de mesure Google Analytics 4 (G-XXXX) ; vide = Google Analytics désactivé. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || null;

/** Jeton Google Search Console (balise meta) ; inutile si le domaine est validé par DNS. */
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || null;
