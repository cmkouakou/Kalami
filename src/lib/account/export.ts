/**
 * =============================================================
 *  Fichier    : export.ts (lib/account)
 *  Projet     : Kalami
 *  Description: Export des renseignements personnels (Loi 25, droit à la portabilité) :
 *               liste des tables lues, colonne qui désigne l'utilisateur, et assemblage du
 *               document JSON téléchargé depuis le compte.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Une section de l'export : une table et la colonne qui porte l'identifiant. */
export type ExportSection = { key: string; table: string; column: string };

/** Tables exportées, lues avec la session de l'utilisateur (la RLS reste appliquée). */
export const EXPORT_SECTIONS: readonly ExportSection[] = [
  { key: "profil", table: "profiles", column: "id" },
  { key: "acces_livres", table: "entitlements", column: "user_id" },
  { key: "achats_pdf", table: "pdf_purchases", column: "user_id" },
  { key: "positions_lecture", table: "reading_positions", column: "user_id" },
  { key: "signets", table: "bookmarks", column: "user_id" },
  { key: "surlignages", table: "highlights", column: "user_id" },
  { key: "fiche_auteur", table: "authors", column: "user_id" },
  { key: "contrats_acceptes", table: "author_contract_acceptances", column: "user_id" },
  { key: "etudes_possedees", table: "studies", column: "owner_id" },
  { key: "participations_etudes", table: "study_members", column: "user_id" },
  { key: "credits_etudes", table: "study_credits", column: "user_id" },
  { key: "commentaires", table: "study_comments", column: "author_id" },
  { key: "notifications", table: "notifications", column: "user_id" },
  { key: "classes_suivies", table: "class_members", column: "user_id" },
  { key: "consentements", table: "consent_records", column: "user_id" },
  { key: "demande_suppression", table: "account_deletion_requests", column: "user_id" },
];

export type PersonalDataExport = {
  format: "kalami-donnees-personnelles";
  version: 1;
  exporte_le: string;
  compte: { id: string; courriel: string | null };
  donnees: Record<string, unknown[]>;
};

/**
 * Assemble le document d'export.
 *
 * @param user     - Identifiant et courriel du compte
 * @param sections - Lignes lues, par clé de section (une section absente devient [])
 * @param now      - Date de l'export (injectée pour les tests)
 * @returns Document JSON prêt à sérialiser
 */
export function buildPersonalDataExport(
  user: { id: string; email: string | null },
  sections: Record<string, unknown[] | null | undefined>,
  now: Date = new Date(),
): PersonalDataExport {
  const donnees: Record<string, unknown[]> = {};
  for (const { key } of EXPORT_SECTIONS) donnees[key] = sections[key] ?? [];
  return {
    format: "kalami-donnees-personnelles",
    version: 1,
    exporte_le: now.toISOString(),
    compte: { id: user.id, courriel: user.email },
    donnees,
  };
}

/** Nom du fichier téléchargé : kalami-donnees-AAAA-MM-JJ.json */
export function exportFileName(now: Date = new Date()): string {
  return `kalami-donnees-${now.toISOString().slice(0, 10)}.json`;
}
