/**
 * =============================================================
 *  Fichier    : suggestions.ts (atelier)
 *  Projet     : Kalami
 *  Description: Suggestions du relecteur et du conseiller de style de l'atelier (v0.15.1) :
 *               schéma de la sortie structurée de Claude, nettoyage, repérage de l'extrait
 *               dans le HTML d'un bloc (texte contigu, espaces insécables et apostrophes
 *               tolérées) et application des suggestions acceptées. Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: zod, lib/author/manuscript-stats.ts
 * =============================================================
 */

import { z } from "zod";

import { blockText } from "@/lib/author/manuscript-stats";

// ==================== TYPES ====================

/** Outils de l'atelier qui travaillent sur un chapitre. */
export type ChapterTool = "proofread" | "style";

export const CHAPTER_TOOLS: readonly ChapterTool[] = ["proofread", "style"];

export const PROOFREAD_KINDS = [
  "spelling", "grammar", "agreement", "punctuation", "typography", "other",
] as const;

export const STYLE_KINDS = [
  "repetition", "long_sentence", "clarity", "rhythm", "word_choice", "other",
] as const;

export type SuggestionKind =
  | (typeof PROOFREAD_KINDS)[number]
  | (typeof STYLE_KINDS)[number];

/** Sortie brute de Claude (validée par le schéma). */
export const chapterOutputSchema = z.object({
  summary: z.string(),
  suggestions: z.array(
    z.object({
      block: z.number().int(),
      original: z.string(),
      replacement: z.string(),
      kind: z.string(),
      explanation: z.string(),
    }),
  ),
});

export type ChapterOutput = z.infer<typeof chapterOutputSchema>;

/** Suggestion nettoyée, telle qu'enregistrée et affichée. */
export type WorkshopSuggestion = {
  block: number;
  original: string;
  replacement: string;
  kind: SuggestionKind;
  explanation: string;
  /** Extrait retrouvé dans le bloc : la correction peut être appliquée automatiquement */
  applicable: boolean;
};

export type ChapterReview = { summary: string; suggestions: WorkshopSuggestion[] };

export type SuggestionDecision = "accepted" | "rejected";

// ==================== CONSTANTES ====================

/** Plus grand nombre de suggestions gardées par demande. */
export const MAX_SUGGESTIONS = 150;
const MAX_SUMMARY = 1_000;
const MAX_EXCERPT = 600;
const MAX_EXPLANATION = 400;

/** Espaces équivalentes : normale, insécable, fine insécable. */
const SPACE_CLASS = "[ \\u00a0\\u202f]+";
const APOSTROPHE_CLASS = "['’]";

// ==================== NETTOYAGE ====================

/** Coupe un texte trop long. */
function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/** Type de suggestion reconnu pour l'outil, sinon « other ». */
function kindFor(tool: ChapterTool, kind: string): SuggestionKind {
  const allowed: readonly string[] = tool === "proofread" ? PROOFREAD_KINDS : STYLE_KINDS;
  return (allowed.includes(kind) ? kind : "other") as SuggestionKind;
}

/**
 * Nettoie la sortie de Claude : blocs inexistants, extraits vides ou inchangés et doublons
 * écartés ; chaque suggestion est marquée applicable si son extrait est retrouvé.
 * @param raw    - Sortie validée par le schéma
 * @param blocks - Blocs HTML du chapitre envoyé
 * @param tool   - Relecteur ou conseiller de style
 */
export function sanitizeChapterOutput(
  raw: ChapterOutput,
  blocks: string[],
  tool: ChapterTool,
): ChapterReview {
  const seen = new Set<string>();
  const suggestions: WorkshopSuggestion[] = [];
  for (const entry of raw.suggestions) {
    if (suggestions.length >= MAX_SUGGESTIONS) break;
    const original = clip(entry.original, MAX_EXCERPT);
    const replacement = clip(entry.replacement, MAX_EXCERPT);
    const { block } = entry;
    if (!Number.isInteger(block) || block < 0 || block >= blocks.length) continue;
    if (!original || original === replacement) continue;
    const key = `${block}\u0000${original}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push({
      block,
      original,
      replacement,
      kind: kindFor(tool, entry.kind),
      explanation: clip(entry.explanation, MAX_EXPLANATION),
      applicable: locate(blocks[block], original) !== null,
    });
  }
  return { summary: clip(raw.summary, MAX_SUMMARY), suggestions };
}

/**
 * Relit une revue enregistrée (sortie jsonb), en écartant ce qui est mal formé.
 * @param value - Colonne output d'une demande terminée
 */
export function readChapterReview(value: unknown): ChapterReview {
  const parsed = z
    .object({
      summary: z.string(),
      suggestions: z.array(
        z.object({
          block: z.number().int(),
          original: z.string(),
          replacement: z.string(),
          kind: z.string(),
          explanation: z.string(),
          applicable: z.boolean(),
        }),
      ),
    })
    .safeParse(value);
  if (!parsed.success) return { summary: "", suggestions: [] };
  return parsed.data as ChapterReview;
}

// ==================== REPÉRAGE ====================

/** Échappe les caractères spéciaux du HTML (le texte des blocs est en UTF-8 littéral). */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Motif tolérant d'un extrait : espaces et apostrophes équivalentes. */
function excerptPattern(excerpt: string): RegExp {
  const source = escapeHtml(excerpt.trim())
    .split(/[ \u00a0\u202f]+/)
    .map((part) =>
      part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/['’]/g, APOSTROPHE_CLASS),
    )
    .join(SPACE_CLASS);
  return new RegExp(source, "u");
}

/**
 * Position de la première occurrence d'un extrait dans le texte d'un bloc HTML, sans
 * traverser de balise (l'extrait doit tenir dans un même nœud de texte).
 * @param html    - Bloc HTML
 * @param excerpt - Texte cherché, tel que montré à Claude
 * @returns Début et fin dans le HTML, ou null si introuvable
 */
export function locate(html: string, excerpt: string): { start: number; end: number } | null {
  if (!excerpt.trim()) return null;
  const pattern = excerptPattern(excerpt);
  let offset = 0;
  for (const part of html.split(/(<[^>]*>)/)) {
    if (!part.startsWith("<")) {
      const match = pattern.exec(part);
      if (match) {
        const start = offset + match.index;
        return { start, end: start + match[0].length };
      }
    }
    offset += part.length;
  }
  return null;
}

/**
 * Remplace la première occurrence d'un extrait dans un bloc.
 * @returns Le bloc modifié, ou null si l'extrait est introuvable
 */
export function replaceInBlock(html: string, original: string, replacement: string): string | null {
  const found = locate(html, original);
  if (!found) return null;
  return html.slice(0, found.start) + escapeHtml(replacement.trim()) + html.slice(found.end);
}

// ==================== APPLICATION ====================

/**
 * Applique des suggestions acceptées aux blocs d'un chapitre, dans l'ordre donné. Une
 * suggestion dont l'extrait n'est plus retrouvé (déjà modifié par une autre) est ignorée.
 * @param blocks      - Blocs HTML d'origine
 * @param suggestions - Suggestions acceptées
 * @returns Nouveaux blocs, indices modifiés et décomptes
 *
 * Exemple :
 *   applySuggestions(["<p>Il sont la.</p>"], [{ block: 0, original: "Il sont", ... }])
 */
export function applySuggestions(
  blocks: string[],
  suggestions: Pick<WorkshopSuggestion, "block" | "original" | "replacement">[],
): { blocks: string[]; changed: Set<number>; applied: number; skipped: number } {
  const next = [...blocks];
  const changed = new Set<number>();
  let applied = 0;
  let skipped = 0;
  for (const suggestion of suggestions) {
    const current = next[suggestion.block];
    const replaced = current === undefined
      ? null
      : replaceInBlock(current, suggestion.original, suggestion.replacement);
    if (replaced === null) {
      skipped += 1;
      continue;
    }
    next[suggestion.block] = replaced;
    changed.add(suggestion.block);
    applied += 1;
  }
  return { blocks: next, changed, applied, skipped };
}

/**
 * Message envoyé à Claude : blocs numérotés en texte brut (les blocs vides sont omis).
 * @param title  - Titre du chapitre
 * @param blocks - Blocs HTML
 */
export function chapterMessage(title: string, blocks: string[]): string {
  const lines = blocks
    .map((block, index) => ({ index, text: blockText(block) }))
    .filter((line) => line.text)
    .map((line) => `[${line.index}] ${line.text}`);
  return `Chapitre : ${title}\n\n${lines.join("\n\n")}`;
}

/** Taille du texte envoyé pour un chapitre, en caractères. */
export function chapterChars(title: string, blocks: string[]): number {
  return chapterMessage(title, blocks).length;
}
