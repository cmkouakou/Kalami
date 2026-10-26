/**
 * =============================================================
 *  Fichier    : listing.ts (atelier)
 *  Projet     : Kalami
 *  Description: Fiche du livre rédigée par Claude dans l'atelier (v0.15.2) : schéma de la
 *               sortie structurée (résumé, accroche, mots-clés, biographie, titres),
 *               nettoyage, relecture d'une fiche enregistrée et message envoyé (fiche
 *               actuelle, table des chapitres et extrait du manuscrit). Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: zod, lib/author/manuscript-stats.ts, lib/author/checklist.ts
 * =============================================================
 */

import { z } from "zod";

import { splitKeywords } from "@/lib/author/checklist";
import { blockText } from "@/lib/author/manuscript-stats";

// ==================== TYPES ====================

/** Sortie brute de Claude (validée par le schéma). */
export const listingOutputSchema = z.object({
  summary: z.string(),
  hook: z.string(),
  keywords: z.array(z.string()),
  bio: z.string(),
  titles: z.array(z.object({ title: z.string(), subtitle: z.string() })),
});

export type ListingOutput = z.infer<typeof listingOutputSchema>;

/** Titre proposé (sous-titre facultatif). */
export type ListingTitle = { title: string; subtitle: string | null };

/** Fiche nettoyée, telle qu'enregistrée et affichée. */
export type Listing = {
  summary: string;
  hook: string;
  keywords: string[];
  /** Vide si l'auteur n'a fourni aucune biographie (rien n'est inventé) */
  bio: string;
  titles: ListingTitle[];
};

/** Champs que l'auteur peut reprendre d'un clic. */
export type ListingField = "summary" | "keywords" | "bio" | "title";

export const LISTING_FIELDS: readonly ListingField[] = ["summary", "keywords", "bio", "title"];

/** Données envoyées à Claude. */
export type ListingSource = {
  title: string;
  subtitle: string | null;
  summary: string | null;
  keywords: string | null;
  language: "fr" | "en";
  authorName: string;
  bio: string | null;
  chapters: { title: string; blocks: string[] }[];
};

// ==================== CONSTANTES ====================

/** Limites, plus strictes que la validation de la fiche (validation.ts). */
export const SUMMARY_MAX = 3_000;
export const BIO_MAX = 2_000;
export const TITLE_MAX = 200;
export const KEYWORDS_TEXT_MAX = 500;
const HOOK_MAX = 400;
const KEYWORD_MAX = 60;
const MAX_KEYWORDS = 12;
const MAX_TITLES = 5;

/** Taille de l'extrait du manuscrit joint au message, en caractères. */
export const EXCERPT_CHARS = 60_000;

// ==================== NETTOYAGE ====================

/** Coupe un texte trop long. */
function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trimEnd() : trimmed;
}

/**
 * Nettoie la fiche proposée : longueurs bornées, mots-clés sans séparateur ni doublon,
 * titres vides ou répétés écartés.
 * @param raw - Sortie validée par le schéma
 */
export function sanitizeListing(raw: ListingOutput): Listing {
  const seenKeywords = new Set<string>();
  const keywords: string[] = [];
  for (const keyword of raw.keywords) {
    const clean = clip(keyword.replace(/[,;]/g, " ").replace(/\s+/g, " "), KEYWORD_MAX);
    const key = clean.toLowerCase();
    if (!clean || seenKeywords.has(key)) continue;
    seenKeywords.add(key);
    keywords.push(clean);
    if (keywords.length >= MAX_KEYWORDS) break;
  }

  const seenTitles = new Set<string>();
  const titles: ListingTitle[] = [];
  for (const entry of raw.titles) {
    const title = clip(entry.title, TITLE_MAX);
    const subtitle = clip(entry.subtitle, TITLE_MAX) || null;
    const key = `${title}\u0000${subtitle ?? ""}`.toLowerCase();
    if (!title || seenTitles.has(key)) continue;
    seenTitles.add(key);
    titles.push({ title, subtitle });
    if (titles.length >= MAX_TITLES) break;
  }

  return {
    summary: clip(raw.summary, SUMMARY_MAX),
    hook: clip(raw.hook, HOOK_MAX),
    keywords,
    bio: clip(raw.bio, BIO_MAX),
    titles,
  };
}

/**
 * Relit une fiche enregistrée (sortie jsonb) ; null si elle est mal formée.
 * @param value - Colonne output d'une demande terminée
 */
export function readListing(value: unknown): Listing | null {
  const parsed = z
    .object({
      summary: z.string(),
      hook: z.string(),
      keywords: z.array(z.string()),
      bio: z.string(),
      titles: z.array(z.object({ title: z.string(), subtitle: z.string().nullable() })),
    })
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Mots-clés en un texte « a, b, c » qui tient dans la limite de la fiche.
 * @param keywords - Mots-clés nettoyés
 */
export function keywordsText(keywords: string[]): string {
  let text = "";
  for (const keyword of keywords) {
    const next = text ? `${text}, ${keyword}` : keyword;
    if (next.length > KEYWORDS_TEXT_MAX) break;
    text = next;
  }
  return text;
}

// ==================== MESSAGE ====================

/**
 * Extrait du manuscrit, chapitre après chapitre, borné à EXCERPT_CHARS.
 * @returns Le texte et un indicateur de coupe
 */
export function manuscriptExcerpt(
  chapters: ListingSource["chapters"],
): { text: string; truncated: boolean } {
  const parts: string[] = [];
  let length = 0;
  for (const chapter of chapters) {
    const body = chapter.blocks.map(blockText).filter(Boolean).join("\n");
    const part = `## ${chapter.title}\n${body}`;
    if (length + part.length > EXCERPT_CHARS) {
      const room = EXCERPT_CHARS - length;
      if (room > 200) parts.push(part.slice(0, room));
      return { text: parts.join("\n\n"), truncated: true };
    }
    parts.push(part);
    length += part.length + 2;
  }
  return { text: parts.join("\n\n"), truncated: false };
}

/**
 * Message envoyé à Claude : fiche actuelle, table des chapitres et extrait du texte.
 * @param source - Livre, auteur et chapitres de la version lue
 */
export function listingMessage(source: ListingSource): string {
  const excerpt = manuscriptExcerpt(source.chapters);
  const keywords = splitKeywords(source.keywords);
  return [
    `Langue du livre : ${source.language === "en" ? "anglais" : "français"}`,
    `Titre actuel : ${source.title}`,
    `Sous-titre actuel : ${source.subtitle || "(aucun)"}`,
    `Auteur : ${source.authorName}`,
    `Biographie fournie par l'auteur : ${source.bio?.trim() || "(aucune)"}`,
    `Résumé actuel : ${source.summary?.trim() || "(aucun)"}`,
    `Mots-clés actuels : ${keywords.length ? keywords.join(", ") : "(aucun)"}`,
    "",
    "Table des chapitres :",
    ...source.chapters.map((chapter, index) => `${index + 1}. ${chapter.title}`),
    "",
    excerpt.truncated
      ? "Extrait du manuscrit (début du livre seulement) :"
      : "Texte du manuscrit :",
    excerpt.text,
  ].join("\n");
}
