/**
 * =============================================================
 *  Fichier    : types.ts
 *  Projet     : Kalami
 *  Description: Types de la liseuse (position, réglages, pages, signets, recherche,
 *               données de départ), partagés entre le serveur et le client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/catalog/types.ts
 * =============================================================
 */

import type { BookLanguage, Price, TocEntry } from "@/lib/catalog/types";

// ==================== POSITION ====================

/**
 * Position dans un livre, indépendante de la pagination :
 * chapitre (1 = premier), bloc (0 = premier) et décalage dans le texte du bloc.
 */
export type ReaderPosition = {
  chapter: number;
  block: number;
  offset: number;
};

/** Position enregistrée, avec l'avancement (0 à 1) et sa date (ISO). */
export type SavedPosition = ReaderPosition & {
  progress: number;
  updatedAt: string;
};

// ==================== PAGINATION ====================

/** Morceau d'un bloc affiché sur une page : texte du caractère « start » à « end » exclu. */
export type Fragment = {
  block: number;
  start: number;
  end: number;
};

/** Page = suite de fragments (un bloc peut continuer sur la page suivante). */
export type Page = Fragment[];

/** Description d'un bloc pour la pagination (sans le DOM). */
export type BlockInfo = {
  /** Longueur du texte du bloc, en caractères */
  length: number;
  /** Décalages où une coupure est permise (après une espace), croissants */
  breaks: number[];
  /** Intertitre : jamais coupé, jamais laissé seul en bas de page */
  heading: boolean;
};

// ==================== RÉGLAGES ====================

export const READER_MODES = ["flip", "scroll"] as const;
export type ReaderMode = (typeof READER_MODES)[number];

export const READER_THEMES = ["light", "sepia", "dark"] as const;
export type ReaderTheme = (typeof READER_THEMES)[number];

export const READER_FONTS = ["serif", "sans"] as const;
export type ReaderFont = (typeof READER_FONTS)[number];

/** Tailles de police proposées (px) et interlignes. */
export const FONT_SIZES = [15, 17, 19, 21, 24, 28] as const;
export const LINE_HEIGHTS = [1.4, 1.6, 1.85] as const;

export type ReaderSettings = {
  mode: ReaderMode;
  theme: ReaderTheme;
  font: ReaderFont;
  /** Indice dans FONT_SIZES */
  fontSize: number;
  /** Indice dans LINE_HEIGHTS */
  lineHeight: number;
};

// ==================== SIGNETS ET RECHERCHE ====================

export type Bookmark = ReaderPosition & {
  id: string;
  label: string;
  createdAt: string;
};

/** Résultat de recherche : passage autorisé, jamais au-delà de l'extrait. */
export type SearchHit = ReaderPosition & {
  title: string;
  /** Texte brut autour de l'occurrence */
  snippet: string;
  /** Position de l'occurrence dans « snippet » (mise en évidence) */
  matchStart: number;
  matchLength: number;
};

// ==================== DONNÉES DE DÉPART ====================

/** Accès du lecteur : extrait seulement, ou livre entier (achat, auteur, administrateur). */
export type ReaderAccess = "preview" | "full";

/** Données transmises par le serveur au composant de la liseuse. */
export type ReaderBootstrap = {
  book: {
    id: string;
    slug: string;
    title: string;
    authorName: string;
    language: BookLanguage;
    prices: Price[];
  };
  toc: TocEntry[];
  access: ReaderAccess;
  /** Lecteur connecté (signets, synchronisation), ou null pour un visiteur */
  reader: { email: string | null } | null;
  /** Texte du filigrane (courriel + identifiant du droit), null pour un visiteur */
  watermark: string | null;
  position: SavedPosition | null;
  bookmarks: Bookmark[];
  /** Chapitre demandé dans l'URL (?chapitre=n), prioritaire sur la position */
  requestedChapter: number | null;
};
