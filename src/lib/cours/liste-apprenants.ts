/**
 * =============================================================
 *  Fichier    : liste-apprenants.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Liste des inscrits de l'administration (v0.42.0), fonctions pures :
 *               recherche sur le courriel et le nom (sans tenir compte des accents ni
 *               des majuscules), filtres par cohorte (ou « sans cohorte ») et par
 *               origine, libellé court d'un module ou d'une leçon.
 *               v0.45.0 : total des tentatives de chaque inscrit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Ligne de la liste, telle que transmise au navigateur. */
export type LigneInscrit = {
  accessId: string;
  userId: string;
  email: string | null;
  nom: string | null;
  source: "purchase" | "admin_grant";
  /** Date d'inscription déjà mise en forme (même texte serveur et navigateur). */
  depuis: string;
  cohorteId: string | null;
  cohorteNom: string | null;
  /** Tentatives aux exercices et aux quiz (null : inconnu, migration v0.45.0). */
  tentatives: number | null;
};

/** Date individuelle d'un apprenant sur un module ou une leçon. */
export type DateIndividuelle = {
  item: string;
  /** Jours AAAA-MM-JJ dans le fuseau de saisie, null si sans date. */
  ouvre: string | null;
  ferme: string | null;
  fuseau: string;
};

/** Valeur du filtre de cohorte : toutes, sans cohorte, ou l'identifiant d'une cohorte. */
export const TOUTES = "";
export const SANS_COHORTE = "aucune";

export type Filtres = {
  recherche: string;
  cohorte: string;
  origine: "" | LigneInscrit["source"];
};

// ==================== RECHERCHE ====================

/**
 * Texte comparable : minuscules, sans accents ni espaces superflus.
 * @param texte - Texte saisi ou lu
 */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Inscrits correspondant aux filtres. Chaque mot recherché doit figurer dans le
 * courriel ou le nom.
 *
 * @param lignes  - Tous les inscrits
 * @param filtres - Recherche, cohorte et origine
 * @returns Inscrits retenus, dans l'ordre d'origine
 *
 * Exemple : filtrerInscrits(lignes, { recherche: "kone", cohorte: SANS_COHORTE, origine: "" })
 */
export function filtrerInscrits(
  lignes: readonly LigneInscrit[],
  filtres: Filtres,
): LigneInscrit[] {
  const mots = normaliser(filtres.recherche).split(/\s+/).filter(Boolean);
  return lignes.filter((l) => {
    if (filtres.origine && l.source !== filtres.origine) return false;
    if (filtres.cohorte === SANS_COHORTE && l.cohorteId !== null) return false;
    if (
      filtres.cohorte !== TOUTES &&
      filtres.cohorte !== SANS_COHORTE &&
      l.cohorteId !== filtres.cohorte
    ) {
      return false;
    }
    if (mots.length === 0) return true;
    const texte = normaliser(`${l.email ?? ""} ${l.nom ?? ""}`);
    return mots.every((m) => texte.includes(m));
  });
}

// ==================== LIBELLÉS ====================

/**
 * Numéros d'un module ou d'une leçon : « m05 » → { m: 5 }, « m05-l02 » → { m: 5, l: 2 }.
 * @param id - Identifiant stable
 * @returns Numéros, ou null si l'identifiant est inattendu
 */
export function numerosElement(id: string): { m: number; l: number | null } | null {
  const trouve = /^m(\d{2})(?:-l(\d{2}))?$/.exec(id);
  if (!trouve) return null;
  return { m: Number(trouve[1]), l: trouve[2] ? Number(trouve[2]) : null };
}
