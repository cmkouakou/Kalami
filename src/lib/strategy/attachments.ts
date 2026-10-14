/**
 * =============================================================
 *  Fichier    : attachments.ts
 *  Projet     : Kalami Stratégie
 *  Description: Pièces jointes du profil (S5b) : seau, limites (10 Mo par fichier, 10 fichiers
 *               par étude, 5 Mo par image pour l'API), formats admis, type MIME déduit de
 *               l'extension et chemin de stockage. Miroir des contrôles SQL de la migration
 *               20261020120000. Fonctions pures, utilisables côté navigateur et serveur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== LIMITES ====================

/** Seau privé des pièces jointes (politiques : membres de l'étude). */
export const ATTACHMENTS_BUCKET = "study-attachments";

/** Taille maximale d'un fichier (limite du seau). */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Nombre maximal de pièces par étude (contrôlé aussi en SQL). */
export const ATTACHMENTS_MAX = 10;

/** Taille maximale d'une image acceptée par l'API de Claude. */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Longueur maximale du nom de fichier conservé. */
export const FILE_NAME_MAX = 200;

// ==================== FORMATS ====================

/** Type MIME de chaque extension admise (le seau n'accepte que ceux-ci). */
export const ATTACHMENT_FORMATS = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
} as const;

export type AttachmentExtension = keyof typeof ATTACHMENT_FORMATS;
export type AttachmentMime = (typeof ATTACHMENT_FORMATS)[AttachmentExtension];

/** Valeur de l'attribut accept du sélecteur de fichiers. */
export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_FORMATS).map((ext) => `.${ext}`).join(",");

/** Nature d'une pièce, qui décide de la façon de l'envoyer au modèle. */
export type AttachmentKind = "pdf" | "image" | "docx" | "xlsx";

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Extension admise d'un nom de fichier, ou null. Sous Windows, le navigateur fournit
 * souvent un type MIME vide : l'extension fait foi.
 * @param name - Nom du fichier
 */
export function extensionOf(name: string): AttachmentExtension | null {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return Object.hasOwn(ATTACHMENT_FORMATS, extension)
    ? (extension as AttachmentExtension)
    : null;
}

/**
 * Nature d'une pièce d'après son type MIME ; null si le type n'est pas admis.
 * @param mime - Type MIME enregistré
 */
export function kindOf(mime: string): AttachmentKind | null {
  if (mime === ATTACHMENT_FORMATS.pdf) return "pdf";
  if (mime === ATTACHMENT_FORMATS.docx) return "docx";
  if (mime === ATTACHMENT_FORMATS.xlsx) return "xlsx";
  if ((Object.values(ATTACHMENT_FORMATS) as string[]).includes(mime)) return "image";
  return null;
}

/**
 * Chemin de stockage d'une nouvelle pièce : etudes/<étude>/<uuid>.<extension>. Le nom
 * d'origine n'entre pas dans le chemin (il est conservé à part).
 * @param studyId   - Identifiant de l'étude
 * @param extension - Extension admise
 */
export function attachmentPath(studyId: string, extension: AttachmentExtension): string {
  return `etudes/${studyId}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Vérifie un fichier avant l'envoi ; renvoie la cause du refus, ou null s'il est admis.
 * @param file - Nom et taille du fichier choisi
 */
export function checkAttachment(file: {
  name: string;
  size: number;
}): "format" | "too_large" | "image_too_large" | null {
  const extension = extensionOf(file.name);
  if (!extension) return "format";
  if (file.size > ATTACHMENT_MAX_BYTES) return "too_large";
  const isImage = ATTACHMENT_FORMATS[extension].startsWith("image/");
  if (isImage && file.size > IMAGE_MAX_BYTES) return "image_too_large";
  return null;
}

/**
 * Taille lisible d'un fichier (Ko ou Mo, notation française).
 * @param bytes - Taille en octets
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
