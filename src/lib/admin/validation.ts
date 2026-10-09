/**
 * =============================================================
 *  Fichier    : validation.ts
 *  Projet     : Kalami
 *  Description: Validation des formulaires d'administration du catalogue (catégories,
 *               auteurs, livres, prix, extrait gratuit et droits de lecture). Fonctions
 *               pures : la base applique en plus ses propres contraintes (CHECK, RLS).
 *               Les briques de lecture des champs servent aussi à l'espace auteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-07
 *  Dépendances: lib/slug.ts, lib/currency.ts, i18n
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import {
  BOOK_LANGUAGES,
  BOOK_STATUSES,
  CURRENCIES,
  type BookLanguage,
  type BookStatus,
  type Currency,
} from "@/lib/catalog/types";
import { toMinorUnits } from "@/lib/currency";
import { isValidSlug, slugify } from "@/lib/slug";

const t = getDictionary();
const e = t.admin.errors;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ==================== TYPES ====================

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type CategoryInput = {
  slug: string;
  name: string;
  description: string | null;
  position: number;
};

export type AuthorInput = { slug: string; display_name: string; bio: string | null };

export type BookInput = {
  slug: string;
  title: string;
  subtitle: string | null;
  edition: string | null;
  summary: string | null;
  keywords: string | null;
  language: BookLanguage;
  author_id: string;
  category_id: string | null;
  page_count: number | null;
  chapter_count: number | null;
  publication_year: number | null;
  is_featured: boolean;
  pdf_enabled: boolean;
  status: BookStatus;
  rejection_reason: string | null;
};

/** Prix saisis : null = livre non vendu dans cette devise. */
export type PriceInput = Record<Currency, number | null>;

/** Vrai si la valeur est un identifiant UUID (arguments d'actions serveur non fiables). */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Erreur de validation transportant le message à afficher. */
export class InvalidField extends Error {}

// ==================== LECTURE DES CHAMPS ====================

/** Texte nettoyé ; null si vide. Lève InvalidField si trop long. */
export function optionalText(
  fd: FormData,
  name: string,
  label: string,
  max: number,
): string | null {
  const value = String(fd.get(name) ?? "").trim();
  if (value.length > max) throw new InvalidField(interpolate(e.tooLong, { field: label }));
  return value || null;
}

/** Texte obligatoire. */
export function requiredText(fd: FormData, name: string, label: string, max: number): string {
  const value = optionalText(fd, name, label, max);
  if (!value) throw new InvalidField(interpolate(e.required, { field: label }));
  return value;
}

/** Entier facultatif compris entre min et max. */
export function optionalInt(
  fd: FormData,
  name: string,
  label: string,
  min: number,
  max: number,
): number | null {
  const raw = String(fd.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new InvalidField(interpolate(e.invalidNumber, { field: label }));
  }
  return value;
}

/** Slug saisi, ou généré depuis le libellé s'il est vide. */
export function slugFrom(fd: FormData, fallbackText: string): string {
  const raw = String(fd.get("slug") ?? "").trim();
  const slug = raw ? raw.toLowerCase() : slugify(fallbackText);
  if (!isValidSlug(slug)) throw new InvalidField(e.invalidSlug);
  return slug;
}

/** Valeur choisie dans une liste fermée. */
export function choice<T extends string>(
  fd: FormData,
  name: string,
  label: string,
  allowed: readonly T[],
): T {
  const value = String(fd.get(name) ?? "");
  if (!(allowed as readonly string[]).includes(value)) {
    throw new InvalidField(interpolate(e.invalidChoice, { field: label }));
  }
  return value as T;
}

/** Identifiant UUID facultatif (liste déroulante avec option « Aucune »). */
export function optionalUuid(fd: FormData, name: string, label: string): string | null {
  const value = String(fd.get(name) ?? "").trim();
  if (!value) return null;
  if (!isUuid(value)) {
    throw new InvalidField(interpolate(e.invalidChoice, { field: label }));
  }
  return value;
}

/** Exécute une lecture de formulaire et convertit les erreurs en résultat. */
export function attempt<T>(read: () => T): ParseResult<T> {
  try {
    return { ok: true, value: read() };
  } catch (error) {
    if (error instanceof InvalidField) return { ok: false, error: error.message };
    throw error;
  }
}

// ==================== FORMULAIRES ====================

/**
 * Valide le formulaire d'une catégorie.
 * @param fd - Champs name, slug, description, position
 * @returns Données prêtes à enregistrer, ou message d'erreur
 */
export function parseCategory(fd: FormData): ParseResult<CategoryInput> {
  const l = t.admin.categories;
  return attempt(() => {
    const name = requiredText(fd, "name", l.name, 80);
    return {
      name,
      slug: slugFrom(fd, name),
      description: optionalText(fd, "description", l.description, 500),
      position: optionalInt(fd, "position", l.position, 0, 10_000) ?? 0,
    };
  });
}

/**
 * Valide le formulaire d'un auteur.
 * @param fd - Champs display_name, slug, bio
 * @returns Données prêtes à enregistrer, ou message d'erreur
 */
export function parseAuthor(fd: FormData): ParseResult<AuthorInput> {
  const l = t.admin.authors;
  return attempt(() => {
    const displayName = requiredText(fd, "display_name", l.name, 120);
    return {
      display_name: displayName,
      slug: slugFrom(fd, displayName),
      bio: optionalText(fd, "bio", l.bio, 5000),
    };
  });
}

/**
 * Valide le formulaire d'un livre et ses prix (champs price_XOF, price_EUR, price_CAD).
 * @param fd - Champs du formulaire de livre
 * @returns Livre et prix prêts à enregistrer, ou message d'erreur
 */
export function parseBook(fd: FormData): ParseResult<{ book: BookInput; prices: PriceInput }> {
  const l = t.admin.books;
  return attempt(() => {
    const title = requiredText(fd, "title", l.bookTitle, 200);
    const status = choice(fd, "status", l.status, BOOK_STATUSES);
    const rejectionReason = optionalText(fd, "rejection_reason", l.rejectionReason, 2000);
    if (status === "rejected" && !rejectionReason) throw new InvalidField(e.rejectionReason);

    const authorId = optionalUuid(fd, "author_id", l.author);
    if (!authorId) throw new InvalidField(interpolate(e.required, { field: l.author }));

    const book: BookInput = {
      title,
      slug: slugFrom(fd, title),
      subtitle: optionalText(fd, "subtitle", l.subtitle, 200),
      edition: optionalText(fd, "edition", l.edition, 60),
      summary: optionalText(fd, "summary", l.summary, 10_000),
      keywords: optionalText(fd, "keywords", l.keywords, 500),
      language: choice(fd, "language", l.language, BOOK_LANGUAGES),
      author_id: authorId,
      category_id: optionalUuid(fd, "category_id", l.category),
      page_count: optionalInt(fd, "page_count", l.pageCount, 1, 100_000),
      chapter_count: optionalInt(fd, "chapter_count", l.chapterCount, 1, 10_000),
      publication_year: optionalInt(fd, "publication_year", l.year, 1900, 2200),
      is_featured: fd.get("is_featured") === "on",
      pdf_enabled: fd.get("pdf_enabled") === "on",
      status,
      rejection_reason: status === "rejected" ? rejectionReason : null,
    };
    return { book, prices: parsePrices(fd) };
  });
}

/** Lit les trois champs de prix ; lève InvalidField si une saisie est incorrecte. */
export function parsePrices(fd: FormData): PriceInput {
  const prices = {} as PriceInput;
  for (const currency of CURRENCIES) {
    const raw = String(fd.get(`price_${currency}`) ?? "").trim();
    if (!raw) {
      prices[currency] = null;
      continue;
    }
    const minor = toMinorUnits(raw, currency);
    if (minor === null) throw new InvalidField(interpolate(e.invalidPrice, { currency }));
    prices[currency] = minor;
  }
  return prices;
}

// ==================== CONTENU DU LIVRE ====================

/** Règles de l'extrait gratuit (colonnes de books). */
export type PreviewRuleInput = { preview_chapters: number; preview_cut_block: number | null };

/** Droit de lecture accordé manuellement. */
export type GrantInput = { email: string; note: string | null };

/** Chapitre du sommaire, tel qu'utile à la validation de la coupure. */
type TocBlocks = { chapter_position: number; block_count: number };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide les règles de l'extrait.
 * @param fd  - Champs preview_chapters, preview_cut_block
 * @param toc - Sommaire converti (vide si aucun manuscrit : seules les bornes sont vérifiées)
 * @returns Règles prêtes à enregistrer, ou message d'erreur
 *
 * La coupure n'a de sens que dans le dernier chapitre de l'extrait, et doit laisser au
 * moins un bloc payant dans ce chapitre.
 */
export function parsePreviewRule(fd: FormData, toc: TocBlocks[]): ParseResult<PreviewRuleInput> {
  const l = t.admin.content;
  return attempt(() => {
    const chapters = optionalInt(fd, "preview_chapters", l.previewChapters, 0, 1000);
    if (chapters === null) {
      throw new InvalidField(interpolate(e.required, { field: l.previewChapters }));
    }
    if (toc.length && chapters > toc.length) {
      throw new InvalidField(interpolate(e.invalidNumber, { field: l.previewChapters }));
    }

    const cut =
      chapters === 0 ? null : optionalInt(fd, "preview_cut_block", l.previewCut, 1, 20_000);
    const last = toc.find((entry) => entry.chapter_position === chapters);
    if (cut !== null && last && cut >= last.block_count) {
      throw new InvalidField(l.errors.previewCutTooHigh);
    }
    return { preview_chapters: chapters, preview_cut_block: cut };
  });
}

/**
 * Valide l'octroi manuel d'un droit de lecture.
 * @param fd - Champs email, note
 */
export function parseGrant(fd: FormData): ParseResult<GrantInput> {
  const l = t.admin.content;
  return attempt(() => {
    const email = requiredText(fd, "email", l.grantEmail, 320).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new InvalidField(t.auth.errors.invalidEmail);
    return { email, note: optionalText(fd, "note", l.grantNote, 500) };
  });
}
