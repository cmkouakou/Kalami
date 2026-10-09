/**
 * =============================================================
 *  Fichier    : access.ts
 *  Projet     : Kalami
 *  Description: Règles d'accès aux chapitres (fonctions pures, sans base de données) :
 *               extrait gratuit, droit de lecture, coupure de l'extrait, chapitres autorisés,
 *               limites de débit.
 *  Auteur    : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== CONSTANTES ====================

/** Limitation de débit : nombre d'accès autorisés par fenêtre, par lecteur ou par IP. */
export const CONTENT_RATE_LIMIT = 30;
export const CONTENT_RATE_WINDOW_SECONDS = 60;

/** Numéro de chapitre maximal accepté dans l'URL (au-delà : 404 sans requête). */
export const MAX_CHAPTER_POSITION = 1000;

// ==================== TYPES ====================

/** Règles de l'extrait d'un livre (colonnes de la table books). */
export type PreviewRule = {
  preview_chapters: number;
  preview_cut_block: number | null;
};

/**
 * Décision d'accès :
 * - « full »    : droit de lecture (achat, administrateur ou auteur du livre)
 * - « preview » : chapitre compris dans l'extrait gratuit
 * - « denied »  : réponse 403, aucun contenu envoyé
 */
export type AccessDecision = "full" | "preview" | "denied";

// ==================== FONCTIONS ====================

/**
 * Lit le numéro de chapitre de l'URL.
 * @param value - Segment d'URL (ex. « 2 »)
 * @returns Numéro entre 1 et MAX_CHAPTER_POSITION, ou null s'il est invalide
 */
export function parseChapterPosition(value: string): number | null {
  if (!/^[1-9][0-9]{0,3}$/.test(value)) return null;
  const position = Number(value);
  return position <= MAX_CHAPTER_POSITION ? position : null;
}

/**
 * Décide si un chapitre peut être envoyé.
 * @param position - Numéro du chapitre demandé (1 = premier)
 * @param rule     - Règles de l'extrait du livre
 * @param entitled - Le demandeur a un droit de lecture sur le livre
 * @returns Décision d'accès
 *
 * Exemple : decideAccess(2, { preview_chapters: 1, preview_cut_block: null }, false) → "denied"
 */
export function decideAccess(
  position: number,
  rule: PreviewRule,
  entitled: boolean,
): AccessDecision {
  if (entitled) return "full";
  if (position <= rule.preview_chapters) return "preview";
  return "denied";
}

/**
 * Applique la coupure de l'extrait : seul le dernier chapitre de l'extrait peut être coupé.
 * @param blocks   - Blocs du chapitre
 * @param position - Numéro du chapitre
 * @param decision - Décision d'accès déjà prise
 * @param rule     - Règles de l'extrait
 * @returns Blocs à envoyer et indicateur de coupure
 */
export function applyPreviewCut(
  blocks: string[],
  position: number,
  decision: AccessDecision,
  rule: PreviewRule,
): { blocks: string[]; truncated: boolean } {
  if (decision === "denied") return { blocks: [], truncated: true };

  const isCutChapter =
    decision === "preview" &&
    position === rule.preview_chapters &&
    rule.preview_cut_block !== null &&
    rule.preview_cut_block < blocks.length;

  return isCutChapter
    ? { blocks: blocks.slice(0, rule.preview_cut_block!), truncated: true }
    : { blocks, truncated: false };
}

/**
 * Ne garde que la partie autorisée d'une liste de chapitres (recherche dans le texte) :
 * chapitres refusés retirés, dernier chapitre de l'extrait coupé.
 * @param chapters - Chapitres complets lus en base
 * @param rule     - Règles de l'extrait
 * @param entitled - Le demandeur a un droit de lecture sur le livre
 * @returns Chapitres autorisés, blocs éventuellement coupés
 */
export function authorizedChapters<T extends { position: number; blocks: string[] }>(
  chapters: T[],
  rule: PreviewRule,
  entitled: boolean,
): T[] {
  return chapters.flatMap((chapter) => {
    const decision = decideAccess(chapter.position, rule, entitled);
    if (decision === "denied") return [];
    const { blocks } = applyPreviewCut(chapter.blocks, chapter.position, decision, rule);
    return [{ ...chapter, blocks }];
  });
}

/**
 * Identifiant du demandeur pour la limitation de débit.
 * @param userId  - Utilisateur connecté, ou null
 * @param headers - En-têtes de la requête (adresse IP transmise par Vercel)
 * @returns « user:{uuid} » ou « ip:{adresse} »
 */
export function rateLimitSubject(userId: string | null, headers: Headers): string {
  if (userId) return `user:${userId}`;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim() || "inconnue";
  return `ip:${ip.slice(0, 64)}`;
}

// ==================== APERÇU AVANT VALIDATION ====================

/** Valeur du paramètre « version » qui demande la version en attente de validation. */
export const PREVIEW_VERSION_PARAM = "apercu";

/** Versions d'un livre utiles au choix du texte servi. */
export type BookVersions = {
  status: string;
  current_version_id: string | null;
  pending_version_id: string | null;
};

/**
 * Choisit la version servie au demandeur.
 * @param book    - Statut et versions du livre
 * @param staff   - Le demandeur est l'auteur du livre ou un administrateur (aal2)
 * @param preview - Aperçu demandé (?version=apercu)
 * @returns Identifiant de la version, ou null (réponse 404)
 *
 * L'aperçu, réservé à l'équipe, montre la version en attente, sinon la courante. Sans
 * aperçu : version courante, d'un livre publié sauf pour l'équipe.
 */
export function chooseVersion(
  book: BookVersions,
  staff: boolean,
  preview: boolean,
): string | null {
  if (preview) return staff ? (book.pending_version_id ?? book.current_version_id) : null;
  if (book.status !== "published" && !staff) return null;
  return book.current_version_id;
}
