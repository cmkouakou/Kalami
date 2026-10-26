/**
 * =============================================================
 *  Fichier    : consent.ts
 *  Projet     : Kalami
 *  Description: Témoin de consentement « kalami_consent » : format, lecture et écriture.
 *               Partagé entre le navigateur (bandeau) et le serveur (action).
 *               Format : « {choix}.{version}.{identifiant du visiteur} ».
 *               v1.1 : liste version 2 (Google Analytics), événement de choix fait.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-26
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Nom du témoin qui mémorise le choix du visiteur. */
export const CONSENT_COOKIE = "kalami_consent";

/**
 * Version de la liste des témoins. À augmenter dès qu'un témoin non nécessaire
 * (statistiques, publicité) est ajouté : le bandeau réapparaît alors pour tous.
 * Version 2 (v0.15.3) : témoins de statistiques de Google Analytics.
 */
export const CONSENT_VERSION = 2;

/** Durée de conservation du choix : 6 mois (recommandation CNIL / Loi 25). */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/** Événement qui rouvre le bandeau (lien « Gérer les témoins »). */
export const OPEN_CONSENT_EVENT = "kalami:gerer-temoins";

/** Événement émis par le bandeau une fois le choix enregistré (charge ou coupe les statistiques). */
export const CONSENT_CHANGED_EVENT = "kalami:temoins-choisis";

export type ConsentChoice = "accepted" | "refused";

/** Choix mémorisé dans le témoin. */
export type ConsentState = {
  choice: ConsentChoice;
  version: number;
  visitorId: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vrai si la valeur est un choix valide. */
export function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === "accepted" || value === "refused";
}

/**
 * Lit la valeur du témoin.
 * @param raw - Valeur brute du témoin (peut être absente)
 * @returns Le choix, ou null si le témoin est absent ou mal formé
 *
 * Exemple : parseConsent("refused.1.6f1c…") → { choice: "refused", version: 1, … }
 */
export function parseConsent(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null;
  const [choice, version, visitorId] = raw.split(".");
  const parsedVersion = Number(version);
  if (!isConsentChoice(choice) || !Number.isInteger(parsedVersion) || parsedVersion < 1) {
    return null;
  }
  if (!visitorId || !UUID_PATTERN.test(visitorId)) return null;
  return { choice, version: parsedVersion, visitorId: visitorId.toLowerCase() };
}

/** Valeur du témoin pour un choix. */
export function serializeConsent(state: ConsentState): string {
  return `${state.choice}.${state.version}.${state.visitorId}`;
}

/**
 * Vrai si le bandeau doit s'afficher : aucun choix, ou choix fait sur une ancienne
 * liste de témoins.
 */
export function needsConsent(state: ConsentState | null): boolean {
  return !state || state.version < CONSENT_VERSION;
}

/** Vrai si les témoins de statistiques sont permis : « Accepter » sur la liste courante. */
export function statisticsAllowed(state: ConsentState | null): boolean {
  return state !== null && !needsConsent(state) && state.choice === "accepted";
}

/**
 * Lit le témoin dans une chaîne « document.cookie ».
 * @param cookieHeader - Tous les témoins du document
 */
export function readConsentFromCookies(cookieHeader: string): ConsentState | null {
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(entry ? decodeURIComponent(entry.slice(CONSENT_COOKIE.length + 1)) : null);
}
