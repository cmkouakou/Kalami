/**
 * =============================================================
 *  Fichier    : voices.ts (reader)
 *  Projet     : Kalami
 *  Description: Choix des voix de la lecture à voix haute : voix de la langue du livre,
 *               classées de la plus naturelle (neuronales « Natural », « Premium »,
 *               « Google ») à la plus synthétique, et découpage du texte en phrases
 *               (Chrome coupe les voix en ligne au-delà d'une quinzaine de secondes).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Ce que la liseuse lit d'une voix (sous-ensemble de SpeechSynthesisVoice). */
export type VoiceInfo = {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
};

/** Région préférée selon la langue du livre. */
const PREFERRED_REGIONS: Record<string, string> = { fr: "fr-FR", en: "en-US" };

/** Vitesses proposées (1 = normale). */
export const SPEECH_RATES = [0.85, 1, 1.15, 1.3] as const;

/** Longueur maximale d'un énoncé, en caractères (environ 12 secondes de lecture). */
export const MAX_CHUNK_LENGTH = 200;

// Voix neuronales et voix « améliorées » des systèmes : les plus humaines
const NATURAL_PATTERN = /natural|neural|premium|enhanced|améliorée|wavenet|online/i;
// Voix Google de Chrome : correctes, nettement meilleures que les voix système de base
const GOOGLE_PATTERN = /google/i;
// Voix fantaisie ou très synthétiques (macOS, eSpeak sous Linux, voix compactes)
const POOR_VOICES = [
  "espeak", "compact", "eloquence", "novelty", "bad news", "bells", "boing", "bubbles",
  "cellos", "jester", "organ", "trinoids", "whisper", "zarvox", "superstar", "wobble",
  "albert", "bahh",
];
const POOR_PATTERN = new RegExp(POOR_VOICES.join("|"), "i");

/** Langue normalisée d'une voix (« fr_FR » sous Android → « fr-FR »). */
function normalizeLang(lang: string): string {
  return lang.replace("_", "-");
}

/** Vrai pour une voix neuronale ou « améliorée » (proche de la voix humaine). */
export function isNaturalVoice(voice: VoiceInfo): boolean {
  return NATURAL_PATTERN.test(voice.name);
}

/**
 * Note de qualité d'une voix : plus elle est haute, plus la voix est naturelle.
 * @param voice    - Voix à noter
 * @param language - Langue du livre (« fr », « en »)
 * @returns Note (les voix d'une autre région de la langue passent après)
 */
export function voiceScore(voice: VoiceInfo, language: string): number {
  let score = 0;
  if (NATURAL_PATTERN.test(voice.name)) score += 40;
  else if (GOOGLE_PATTERN.test(voice.name)) score += 20;
  if (POOR_PATTERN.test(voice.name)) score -= 50;
  const preferred = PREFERRED_REGIONS[language];
  if (preferred && normalizeLang(voice.lang).toLowerCase() === preferred.toLowerCase())
    score += 5;
  return score;
}

/**
 * Voix de la langue du livre, de la plus naturelle à la plus synthétique.
 * @param voices   - Voix disponibles dans le navigateur
 * @param language - Langue du livre (« fr », « en »)
 * @returns Voix triées (vide si aucune voix ne parle la langue)
 */
export function rankVoices<T extends VoiceInfo>(voices: readonly T[], language: string): T[] {
  const prefix = language.toLowerCase();
  return voices
    .filter((voice) => {
      const lang = normalizeLang(voice.lang).toLowerCase();
      return lang === prefix || lang.startsWith(`${prefix}-`);
    })
    .map((voice) => ({ voice, score: voiceScore(voice, language) }))
    .sort((a, b) => b.score - a.score || a.voice.name.localeCompare(b.voice.name))
    .map(({ voice }) => voice);
}

/**
 * Libellé lisible d'une voix.
 * Exemple : « Microsoft Denise Online (Natural) - French (France) » → « Denise (fr-FR) »
 */
export function voiceLabel(voice: VoiceInfo): string {
  const name = voice.name
    .replace(/^(Microsoft|Apple)\s+/i, "")
    .replace(/\s+-\s+.*$/, "")
    .replace(/\s*\((Natural|Online|Enhanced|Premium)\)/gi, "")
    .replace(/\s+Online\b/i, "")
    .trim();
  return `${name || voice.name} (${normalizeLang(voice.lang)})`;
}

/**
 * Coupe un passage trop long sur les virgules, puis sur les espaces.
 * @param sentence - Phrase de plus de MAX_CHUNK_LENGTH caractères
 * @returns Morceaux d'au plus MAX_CHUNK_LENGTH caractères (un mot isolé plus long reste entier)
 */
function splitLong(sentence: string): string[] {
  const pieces = sentence.split(/(?<=[,;:])\s+/);
  const words = pieces.length > 1 ? pieces : sentence.split(/\s+/);
  return packChunks(words);
}

/** Regroupe des morceaux consécutifs tant qu'ils tiennent dans MAX_CHUNK_LENGTH. */
function packChunks(parts: string[]): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (!current) current = part;
    else if (current.length + 1 + part.length <= MAX_CHUNK_LENGTH) current += ` ${part}`;
    else {
      chunks.push(current);
      current = part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Découpe le texte d'un bloc en énoncés courts, à la fin des phrases.
 * @param text - Texte brut d'un bloc
 * @returns Énoncés d'au plus MAX_CHUNK_LENGTH caractères (vide si le bloc est vide)
 *
 * Exemple : splitForSpeech("Il pleut. Elle sort.") → ["Il pleut. Elle sort."]
 */
export function splitForSpeech(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean
    .split(/(?<=[.!?…»"])\s+/)
    .flatMap((sentence) =>
      sentence.length > MAX_CHUNK_LENGTH ? splitLong(sentence) : [sentence],
    );
  return packChunks(sentences);
}
