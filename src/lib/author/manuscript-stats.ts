/**
 * =============================================================
 *  Fichier    : manuscript-stats.ts
 *  Projet     : Kalami
 *  Description: Statistiques gratuites du manuscrit pour l'atelier de l'auteur (v0.15.0) :
 *               mots, temps de lecture, longueur des chapitres, phrases très longues,
 *               mots les plus répétés, répétitions rapprochées et espaces manquantes
 *               avant la ponctuation double (typographie française). Fonctions pures,
 *               sans appel à Claude.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Chapitre lu dans la base (blocs HTML). */
export type ManuscriptChapter = { position: number; title: string; blocks: string[] };

export type ChapterStats = {
  position: number;
  title: string;
  words: number;
  /** Part du livre, en pourcentage arrondi */
  sharePct: number;
  /** Chapitre nettement plus court ou plus long que la médiane */
  flag: "short" | "long" | null;
  longSentences: number;
  closeRepeats: number;
  punctuationIssues: number;
};

export type LongSentence = { position: number; words: number; excerpt: string };

export type ManuscriptStats = {
  words: number;
  chapters: ChapterStats[];
  readingMinutes: number;
  /** Mots par phrase, en moyenne */
  averageSentence: number;
  longSentences: LongSentence[];
  topWords: { word: string; count: number }[];
  closeRepeats: number;
  punctuationIssues: number;
};

// ==================== CONSTANTES ====================

/** Vitesse de lecture moyenne (mots par minute). */
export const WORDS_PER_MINUTE = 230;
/** Au-delà, une phrase est signalée comme très longue. */
export const LONG_SENTENCE_WORDS = 40;
/** Fenêtre (en mots) dans laquelle une répétition est dite rapprochée. */
export const REPEAT_WINDOW = 25;
/** Longueur minimale d'un mot suivi pour les répétitions. */
const MIN_WORD_LENGTH = 5;
/** Exemples de phrases longues gardés pour l'affichage. */
const MAX_EXAMPLES = 5;
const EXCERPT_LENGTH = 160;

/** Mots outils fréquents (français et anglais) ignorés par le décompte des répétitions. */
const STOP_WORDS = new Set([
  "alors", "aussi", "autre", "autres", "avant", "avait", "avoir", "avons", "cette", "celle",
  "celui", "ceux", "comme", "contre", "depuis", "donc", "dont", "elles", "encore", "entre",
  "était", "étaient", "être", "faire", "leurs", "lorsque", "mêmes", "notre", "nous", "parce",
  "pendant", "plus", "pourquoi", "puis", "quand", "quelle", "quelles", "quelque", "quelques",
  "selon", "sans", "sera", "seront", "sont", "sous", "toute", "toutes", "tous", "très",
  "votre", "vous", "about", "after", "again", "being", "their", "there", "these", "those",
  "which", "while", "would", "could", "should", "where", "other",
]);

const WORD = /\p{L}[\p{L}\p{M}'’-]*/gu;
/** Ponctuation double ou guillemet collé à une lettre (espace insécable attendue en français). */
const MISSING_SPACE = /(?<=[\p{L}»])[;:!?]|(?<=\p{L})»|«(?=\p{L})/gu;

// ==================== TEXTE ====================

/**
 * Texte brut d'un bloc HTML (balises retirées, entités courantes décodées).
 * @param html - Bloc HTML d'un chapitre
 */
export function blockText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
}

/** Mots d'un texte. */
export function wordsOf(text: string): string[] {
  return text.match(WORD) ?? [];
}

/** Phrases d'un texte (coupées après . ! ? ou …). */
export function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => wordsOf(sentence).length > 0);
}

/** Mot suivi par les répétitions : minuscules, assez long, pas un mot outil. */
function trackedWord(word: string): string | null {
  const lower = word.toLowerCase().replace(/’/g, "'");
  if (lower.length < MIN_WORD_LENGTH || STOP_WORDS.has(lower)) return null;
  return lower;
}

/**
 * Nombre de mots répétés à moins de REPEAT_WINDOW mots de leur occurrence précédente.
 * @param words - Mots du chapitre, dans l'ordre
 */
export function countCloseRepeats(words: string[]): number {
  const lastSeen = new Map<string, number>();
  let count = 0;
  words.forEach((word, index) => {
    const tracked = trackedWord(word);
    if (!tracked) return;
    const previous = lastSeen.get(tracked);
    if (previous !== undefined && index - previous <= REPEAT_WINDOW) count += 1;
    lastSeen.set(tracked, index);
  });
  return count;
}

/** Nombre d'espaces manquantes avant la ponctuation double. */
export function countPunctuationIssues(text: string): number {
  return (text.match(MISSING_SPACE) ?? []).length;
}

// ==================== ANALYSE ====================

/** Médiane d'une liste de nombres (0 si vide). */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Signal de longueur d'un chapitre par rapport à la médiane du livre. */
function lengthFlag(words: number, mid: number, count: number): ChapterStats["flag"] {
  if (count < 3 || mid === 0) return null;
  if (words < mid / 3) return "short";
  if (words > mid * 3) return "long";
  return null;
}

/**
 * Statistiques complètes d'un manuscrit.
 * @param chapters - Chapitres dans l'ordre de lecture
 * @returns Totaux, détail par chapitre, exemples de phrases longues et mots fréquents
 *
 * Exemple :
 *   analyzeManuscript([{ position: 1, title: "Début", blocks: ["<p>Il était…</p>"] }])
 */
export function analyzeManuscript(chapters: ManuscriptChapter[]): ManuscriptStats {
  const frequency = new Map<string, number>();
  const examples: LongSentence[] = [];
  let sentenceCount = 0;

  const raw = chapters.map((chapter) => {
    const text = chapter.blocks.map(blockText).join("\n");
    const words = wordsOf(text);
    let longSentences = 0;
    for (const sentence of sentencesOf(text)) {
      sentenceCount += 1;
      const length = wordsOf(sentence).length;
      if (length <= LONG_SENTENCE_WORDS) continue;
      longSentences += 1;
      examples.push({
        position: chapter.position,
        words: length,
        excerpt: sentence.length > EXCERPT_LENGTH
          ? `${sentence.slice(0, EXCERPT_LENGTH).trimEnd()}…`
          : sentence,
      });
    }
    for (const word of words) {
      const tracked = trackedWord(word);
      if (tracked) frequency.set(tracked, (frequency.get(tracked) ?? 0) + 1);
    }
    return {
      position: chapter.position,
      title: chapter.title,
      words: words.length,
      longSentences,
      closeRepeats: countCloseRepeats(words),
      punctuationIssues: countPunctuationIssues(text),
    };
  });

  const total = raw.reduce((sum, chapter) => sum + chapter.words, 0);
  const mid = median(raw.map((chapter) => chapter.words));
  return {
    words: total,
    chapters: raw.map((chapter) => ({
      ...chapter,
      sharePct: total === 0 ? 0 : Math.round((chapter.words * 100) / total),
      flag: lengthFlag(chapter.words, mid, raw.length),
    })),
    readingMinutes: Math.ceil(total / WORDS_PER_MINUTE),
    averageSentence: sentenceCount === 0 ? 0 : Math.round(total / sentenceCount),
    longSentences: examples.sort((a, b) => b.words - a.words).slice(0, MAX_EXAMPLES),
    topWords: [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([word, count]) => ({ word, count })),
    closeRepeats: raw.reduce((sum, chapter) => sum + chapter.closeRepeats, 0),
    punctuationIssues: raw.reduce((sum, chapter) => sum + chapter.punctuationIssues, 0),
  };
}
