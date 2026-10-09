/**
 * =============================================================
 *  Fichier    : validation.ts
 *  Projet     : Kalami
 *  Description: Validation des formulaires de l'espace auteur (inscription, fiche publique,
 *               coordonnées de versement, fiche d'un livre) et des formulaires
 *               d'administration associés (contrat, décision sur une soumission).
 *               Fonctions pures ; la base applique ses propres contraintes (CHECK, RLS).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/admin/validation.ts, lib/catalog/types.ts, i18n
 * =============================================================
 */

import { getDictionary, interpolate } from "@/i18n";
import {
  attempt,
  choice,
  InvalidField,
  isUuid,
  optionalInt,
  optionalText,
  optionalUuid,
  parsePrices,
  requiredText,
  slugFrom,
  type ParseResult,
  type PriceInput,
} from "@/lib/admin/validation";
import { BOOK_LANGUAGES, type BookLanguage } from "@/lib/catalog/types";

const t = getDictionary();
const a = t.author;
const e = t.admin.errors;

// ==================== TYPES ====================

export type RegistrationInput = {
  display_name: string;
  slug: string;
  bio: string | null;
  contract_id: string;
};

export type AuthorProfileInput = { display_name: string; bio: string | null };

export const PAYOUT_METHODS = ["bank", "mobile_money"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const MOBILE_OPERATORS = ["orange", "mtn", "moov", "wave"] as const;
export type MobileOperator = (typeof MOBILE_OPERATORS)[number];

export type PayoutInput = {
  method: PayoutMethod;
  account_holder: string;
  bank_name: string | null;
  account_number: string | null;
  swift: string | null;
  mobile_operator: MobileOperator | null;
  mobile_number: string | null;
};

/** Fiche d'un livre modifiable par son auteur (ni statut, ni mise en avant, ni slug). */
export type AuthorBookInput = {
  title: string;
  subtitle: string | null;
  edition: string | null;
  summary: string | null;
  keywords: string | null;
  language: BookLanguage;
  category_id: string | null;
  page_count: number | null;
  publication_year: number | null;
  pdf_enabled: boolean;
};

export type ContractInput = { title: string; body: string };

export type ReviewInput = { approve: boolean; reason: string | null };

const MOBILE_NUMBER_PATTERN = /^\+?[0-9 ]{8,20}$/;
const SWIFT_PATTERN = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;

// ==================== ESPACE AUTEUR ====================

/**
 * Valide l'inscription d'un auteur (acceptation du contrat obligatoire).
 * @param fd - Champs display_name, slug, bio, contract_id, accept
 * @returns Données de l'inscription, ou message d'erreur
 */
export function parseRegistration(fd: FormData): ParseResult<RegistrationInput> {
  const r = a.register;
  return attempt(() => {
    const contractId = String(fd.get("contract_id") ?? "");
    if (fd.get("accept") !== "on" || !isUuid(contractId)) {
      throw new InvalidField(r.acceptRequired);
    }
    const displayName = requiredText(fd, "display_name", r.displayName, 120);
    return {
      display_name: displayName,
      slug: slugFrom(fd, displayName),
      bio: optionalText(fd, "bio", r.bio, 5000),
      contract_id: contractId,
    };
  });
}

/**
 * Valide la fiche publique de l'auteur (nom et biographie).
 * @param fd - Champs display_name, bio
 */
export function parseAuthorProfile(fd: FormData): ParseResult<AuthorProfileInput> {
  const r = a.register;
  return attempt(() => ({
    display_name: requiredText(fd, "display_name", r.displayName, 120),
    bio: optionalText(fd, "bio", r.bio, 5000),
  }));
}

/**
 * Valide les coordonnées de versement ; seuls les champs du mode choisi sont conservés.
 * @param fd - Champs method, account_holder, bank_name, account_number, swift,
 *             mobile_operator, mobile_number
 */
export function parsePayout(fd: FormData): ParseResult<PayoutInput> {
  const p = a.profile;
  return attempt(() => {
    const method = choice(fd, "method", p.method, PAYOUT_METHODS);
    const accountHolder = requiredText(fd, "account_holder", p.accountHolder, 120);

    if (method === "bank") {
      const bankName = optionalText(fd, "bank_name", p.bankName, 120);
      const accountNumber = optionalText(fd, "account_number", p.accountNumber, 64);
      if (!bankName || !accountNumber) throw new InvalidField(p.bankFields);
      const swift = optionalText(fd, "swift", p.swift, 11)?.toUpperCase() ?? null;
      if (swift && !SWIFT_PATTERN.test(swift)) {
        throw new InvalidField(interpolate(e.invalidChoice, { field: p.swift }));
      }
      return {
        method,
        account_holder: accountHolder,
        bank_name: bankName,
        account_number: accountNumber.replace(/\s+/g, " "),
        swift,
        mobile_operator: null,
        mobile_number: null,
      };
    }

    const operator = String(fd.get("mobile_operator") ?? "");
    const number = optionalText(fd, "mobile_number", p.mobileNumber, 20);
    if (!number || !(MOBILE_OPERATORS as readonly string[]).includes(operator)) {
      throw new InvalidField(p.mobileFields);
    }
    if (!MOBILE_NUMBER_PATTERN.test(number)) {
      throw new InvalidField(interpolate(e.invalidNumber, { field: p.mobileNumber }));
    }
    return {
      method,
      account_holder: accountHolder,
      bank_name: null,
      account_number: null,
      swift: null,
      mobile_operator: operator as MobileOperator,
      mobile_number: number,
    };
  });
}

/**
 * Valide la fiche d'un livre saisie par son auteur, et ses prix.
 * @param fd - Champs du formulaire de livre (sans statut, auteur ni mise en avant)
 */
export function parseAuthorBook(
  fd: FormData,
): ParseResult<{ book: AuthorBookInput; prices: PriceInput }> {
  const l = t.admin.books;
  return attempt(() => {
    const book: AuthorBookInput = {
      title: requiredText(fd, "title", l.bookTitle, 200),
      subtitle: optionalText(fd, "subtitle", l.subtitle, 200),
      edition: optionalText(fd, "edition", l.edition, 60),
      summary: optionalText(fd, "summary", l.summary, 10_000),
      keywords: optionalText(fd, "keywords", l.keywords, 500),
      language: choice(fd, "language", l.language, BOOK_LANGUAGES),
      category_id: optionalUuid(fd, "category_id", l.category),
      page_count: optionalInt(fd, "page_count", l.pageCount, 1, 100_000),
      publication_year: optionalInt(fd, "publication_year", l.year, 1900, 2200),
      pdf_enabled: fd.get("pdf_enabled") === "on",
    };
    return { book, prices: parsePrices(fd) };
  });
}

// ==================== ADMINISTRATION ====================

/**
 * Valide une nouvelle version du contrat auteur.
 * @param fd - Champs title, body
 */
export function parseContract(fd: FormData): ParseResult<ContractInput> {
  const c = t.admin.contract;
  return attempt(() => ({
    title: requiredText(fd, "title", c.contractTitle, 200),
    body: requiredText(fd, "body", c.body, 100_000),
  }));
}

/**
 * Valide la décision sur une soumission ; un refus exige un motif.
 * @param fd - Champs decision (« approve » ou « reject »), reason
 */
export function parseReview(fd: FormData): ParseResult<ReviewInput> {
  const s = t.admin.submissions;
  return attempt(() => {
    const decision = choice(fd, "decision", s.review, ["approve", "reject"] as const);
    const reason = optionalText(fd, "reason", s.reason, 2000);
    if (decision === "reject" && !reason) throw new InvalidField(e.rejectionReason);
    return { approve: decision === "approve", reason };
  });
}
