/**
 * =============================================================
 *  Fichier    : kinds.ts
 *  Projet     : Kalami
 *  Description: Types de textes légaux et leurs adresses publiques, dans la librairie et
 *               dans Kalami Stratégie (qui garde son propre habillage).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Types de textes légaux, dans l'ordre d'affichage. */
export const LEGAL_KINDS = ["privacy", "terms", "sales"] as const;
export type LegalKind = (typeof LEGAL_KINDS)[number];

/** Chemin de chaque texte (sans préfixe d'espace). */
const LEGAL_SLUGS: Record<LegalKind, string> = {
  privacy: "/confidentialite",
  terms: "/conditions",
  sales: "/conditions-de-vente",
};

/** Espace d'affichage : librairie ou Kalami Stratégie. */
export type LegalSpace = "site" | "strategy";

/**
 * Adresse publique d'un texte légal.
 * @param kind  - Type de texte
 * @param space - Espace d'origine du lien
 * @returns Par exemple « /confidentialite » ou « /strategie/confidentialite »
 */
export function legalPath(kind: LegalKind, space: LegalSpace = "site"): string {
  return space === "strategy" ? `/strategie${LEGAL_SLUGS[kind]}` : LEGAL_SLUGS[kind];
}

/** Vrai si la valeur est un type de texte légal connu. */
export function isLegalKind(value: unknown): value is LegalKind {
  return typeof value === "string" && (LEGAL_KINDS as readonly string[]).includes(value);
}
