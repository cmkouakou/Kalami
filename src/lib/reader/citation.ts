/**
 * =============================================================
 *  Fichier    : citation.ts
 *  Projet     : Kalami
 *  Description: Références bibliographiques d'un passage (fonctions pures) aux formats
 *               APA (7e éd.), MLA (9e éd.) et Chicago (notes-bibliographie) : auteur,
 *               chapitre, titre, édition, année, plateforme Kalami et adresse du chapitre.
 *               Le titre du livre est rendu séparément pour être affiché en italique.
 *  Auteur     : Claude Marcel
 *               v1.1 : extrait cité entre guillemets, suivi de son appel de citation.
 *  Version    : 1.1
 *  Date       : 2026-10-23
 *  Dépendances: aucune
 * =============================================================
 */

export const CITATION_STYLES = ["apa", "mla", "chicago"] as const;
export type CitationStyle = (typeof CITATION_STYLES)[number];

/** Données d'une citation. */
export type CitationSource = {
  author: string;
  title: string;
  chapterTitle: string;
  /** Numéro du chapitre (appel de citation « chap. 7 ») */
  chapter: number;
  edition: string | null;
  year: number | null;
  /** Nom de la plateforme (ex. « Kalami ») */
  platform: string;
  /** Adresse du chapitre dans la liseuse */
  url: string;
};

/** Référence en trois parties : le titre du livre s'affiche en italique. */
export type Citation = { before: string; title: string; after: string };

/** Mention « sans date » quand l'année de publication est inconnue. */
const NO_DATE = "s. d.";

// ==================== OUTILS ====================

/** Retire les espaces superflus. */
function tidy(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Ajoute un point final, sauf si la phrase se termine déjà par une ponctuation. */
function period(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/**
 * Nom inversé « Nom, Prénom » ; un nom d'un seul mot (pseudonyme, organisme) est gardé.
 * @example invertName("Claude Marcel Kouakou") → "Kouakou, Claude Marcel"
 */
export function invertName(name: string): string {
  const words = tidy(name).split(" ");
  if (words.length < 2) return words[0] ?? "";
  const last = words.pop() as string;
  return `${last}, ${words.join(" ")}`;
}

/** Nom de famille seul (appel de citation dans le texte). */
function lastName(name: string): string {
  return tidy(name).split(" ").pop() ?? "";
}

/**
 * Nom au format APA « Nom, P. M. » (initiales des prénoms, traits d'union conservés).
 * @example apaName("Jean-Paul Diallo") → "Diallo, J.-P."
 */
export function apaName(name: string): string {
  const words = tidy(name).split(" ");
  if (words.length < 2) return words[0] ?? "";
  const last = words.pop() as string;
  const initials = words.map((word) =>
    word
      .split("-")
      .map((part) => `${part.charAt(0).toUpperCase()}.`)
      .join("-"),
  );
  return `${last}, ${initials.join(" ")}`;
}

// ==================== FORMATS ====================

/**
 * Référence d'un chapitre au style demandé.
 * @param style  - apa, mla ou chicago
 * @param source - Auteur, titres, édition, année, plateforme, adresse
 * @returns Référence en trois parties (titre du livre à part, en italique)
 *
 * Exemple (APA) : Kouakou, C. M. (2024). Le diagnostic. Dans *Stratégie d'entreprise*
 *                 (2e éd.). Kalami. https://kalami-livres.com/livres/x/lire?chapitre=2
 */
export function formatCitation(style: CitationStyle, source: CitationSource): Citation {
  const author = tidy(source.author);
  const chapter = period(tidy(source.chapterTitle));
  const edition = source.edition ? tidy(source.edition) : null;
  const year = source.year ? String(source.year) : null;
  const { title, platform, url } = source;

  if (style === "apa") {
    return {
      before: `${period(apaName(author))} (${year ?? NO_DATE}). ${chapter} Dans `,
      title,
      after: `${edition ? ` (${edition})` : ""}. ${platform}. ${url}`,
    };
  }
  if (style === "mla") {
    const details = [edition, platform, year, url].filter(Boolean).join(", ");
    return {
      before: `${period(invertName(author))} « ${chapter} » `,
      title,
      after: `, ${details}.`,
    };
  }
  return {
    before: `${period(invertName(author))} « ${chapter} » Dans `,
    title,
    after: `.${edition ? ` ${period(edition)}` : ""} ${platform}, ${year ?? NO_DATE}. ${url}.`,
  };
}

/** Texte brut d'une référence (copie dans le presse-papiers). */
export function citationText(citation: Citation): string {
  return `${citation.before}${citation.title}${citation.after}`;
}

/**
 * Appel de citation à placer après l'extrait, dans le texte.
 * Chicago (notes-bibliographie) n'en a pas : la référence sert de note.
 * @example inTextCitation("apa", source) → "(Kouakou, 2026, chap. 7)"
 */
export function inTextCitation(style: CitationStyle, source: CitationSource): string | null {
  const author = lastName(source.author);
  const chapter = `chap. ${source.chapter}`;
  if (style === "apa") return `(${author}, ${source.year ?? NO_DATE}, ${chapter})`;
  if (style === "mla") return `(${author}, ${chapter})`;
  return null;
}

/**
 * Texte copié : l'extrait entre guillemets et son appel, puis la référence complète.
 * @param quote - Extrait déjà raccourci par l'appelant
 * @example « La stratégie… » (Kouakou, 2026, chap. 7)\n\nKouakou, C. M. (2026). …
 */
export function quotedCitationText(
  style: CitationStyle,
  source: CitationSource,
  quote: string,
): string {
  const call = inTextCitation(style, source);
  const reference = citationText(formatCitation(style, source));
  return `« ${tidy(quote)} »${call ? ` ${call}` : ""}\n\n${reference}`;
}
