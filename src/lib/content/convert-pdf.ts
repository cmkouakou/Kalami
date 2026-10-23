/**
 * =============================================================
 *  Fichier    : convert-pdf.ts
 *  Projet     : Kalami
 *  Description: Conversion d'un manuscrit PDF en chapitres HTML nettoyés. Le PDF ne
 *               contient que du texte positionné : les lignes sont reconstituées (position
 *               verticale), les en-têtes, pieds de page et numéros de page répétés sont
 *               retirés, les titres sont reconnus à leur taille de police (ou à un marqueur
 *               « Chapitre 2 »), les paragraphes à l'interligne, au retrait de première
 *               ligne et aux lignes courtes ; les mots coupés en fin de ligne sont recollés.
 *               Un PDF numérisé (images sans texte) est refusé.
 *               v1.1 : marge droite habituelle (texte non justifié), fin de paragraphe
 *               seulement si le mot suivant aurait tenu sur la ligne, répliques à tiret
 *               avec retrait suspendu, lettrines recollées, signature « Par… » retirée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: unpdf (pdf.js), htmlparser2, headings.ts, sanitize.ts
 * =============================================================
 */

import "server-only";

import { parseDocument } from "htmlparser2";
import { extractTextItems, getDocumentProxy, type StructuredTextItem } from "unpdf";

import { isChapterMarker } from "./headings";
import { assertLimits, flattenNodes, isHeading, splitByHeading } from "./sanitize";
import { ConversionError, type ConvertedChapter } from "./types";

/** Titres par défaut, fournis par l'appelant (dictionnaire de langue). */
export type PdfTitles = {
  /** Titre du livre : utilisé quand le document n'a aucun titre de chapitre. */
  book: string;
  /** Titre du texte placé avant le premier chapitre. */
  opening: string;
};

/** Ligne de texte reconstituée. */
type Line = {
  text: string;
  page: number;
  x: number;
  y: number;
  right: number;
  size: number;
  /** Ligne placée à côté d'une lettrine : son décalage n'est pas un retrait. */
  beside?: boolean;
};

// ==================== CONSTANTES ====================

/** Rapport minimal à la taille du corps de texte pour reconnaître un titre. */
const HEADING_RATIO = 1.2;
/** Longueur maximale d'un titre. */
const MAX_HEADING_LENGTH = 150;
/** Part des pages où une ligne doit se répéter pour être un en-tête ou un pied de page. */
const RUNNING_SHARE = 0.3;
/** Nombre minimal de caractères pour qu'un PDF ne soit pas considéré comme numérisé. */
const MIN_CHARACTERS = 50;
/** Fin de paragraphe probable quand une ligne courte se termine ainsi. */
const PARAGRAPH_END = /[.!?…:»"”)]$/;
/** Puce ou tiret de dialogue en début de ligne : nouveau paragraphe. */
const LINE_START_BREAK = /^[•▪◦·–—-]\s/;
/** Nombre maximal de pages de titre retirées en tête du document. */
const TITLE_PAGES = 3;
/** Rapport au corps de texte sous lequel une ligne en pied de page est une note. */
const NOTE_RATIO = 0.9;
/** Appel de note seul sur sa ligne (chiffre, astérisque ou croix). */
const FOOTNOTE_CALL = /^[\d*†‡]+$/;
/** Numéro de page seul (« 12 », « - 12 - », « xii »). */
const PAGE_NUMBER = /^[\s\-–—]*(?:\d{1,4}|[ivxlc]{1,7})[\s\-–—]*$/i;
/** Rapport minimal au corps de texte d'une lettrine (grande initiale seule). */
const DROP_CAP_RATIO = 2;
/** Signature de l'auteur en tête du texte (« Par Jeanne Diallo », « By … »). */
const BYLINE = /^(?:par|by)\s+\S/i;
/** Largeur moyenne d'un caractère, en part de la taille de police. */
const CHAR_WIDTH = 0.5;
/** Rang (centile) de la marge droite habituelle parmi les fins de ligne d'une page. */
const RIGHT_PERCENTILE = 0.9;

// ==================== LIGNES ====================

/**
 * Regroupe les éléments de texte d'une page en lignes, de haut en bas.
 * @param items - Éléments de texte extraits par pdf.js
 * @param page  - Indice de la page
 */
function pageLines(items: StructuredTextItem[], page: number): Line[] {
  const lines: Line[] = [];
  let current: Line | null = null;
  let ended = false;

  for (const item of items) {
    if (item.dir === "ttb") continue;
    const size = item.fontSize || item.height;
    const sameLine =
      current && !ended && Math.abs(item.y - current.y) <= Math.max(2, current.size * 0.4);
    if (!sameLine) {
      if (current?.text.trim()) lines.push(current);
      current = { text: "", page, x: item.x, y: item.y, right: item.x, size: 0 };
    }
    const line = current as Line;
    if (item.str) {
      // Espace manquant entre deux morceaux éloignés de la même ligne
      const gap = item.x - line.right;
      if (line.text && gap > size * 0.15 && !/\s$/.test(line.text) && !/^\s/.test(item.str)) {
        line.text += " ";
      }
      line.text += item.str;
      line.x = Math.min(line.x, item.x);
      line.right = Math.max(line.right, item.x + item.width);
      if (item.str.trim()) line.size = Math.max(line.size, size);
    }
    ended = item.hasEOL;
  }
  if (current?.text.trim()) lines.push(current);

  return lines
    .map((line) => ({ ...line, text: line.text.replace(/\s+/g, " ").trim() }))
    .sort((a, b) => b.y - a.y);
}

/** Forme comparable d'une ligne répétée (chiffres neutralisés : « Page 3 » = « Page 4 »). */
function runningKey(text: string): string {
  return text.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ");
}

/**
 * Retire en-têtes, pieds de page et numéros de page : lignes en tête ou en pied de page
 * qui se répètent sur une bonne part des pages, ou qui ne contiennent qu'un numéro.
 * @param pages - Lignes de chaque page
 */
function removeRunningLines(pages: Line[][]): Line[][] {
  const edges = (lines: Line[]) => [...lines.slice(0, 2), ...lines.slice(-2)];
  const counts = new Map<string, number>();
  for (const lines of pages) {
    for (const key of new Set(edges(lines).map((line) => runningKey(line.text)))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * RUNNING_SHARE));

  return pages.map((lines) => {
    const edge = new Set(edges(lines));
    return lines.filter((line) => {
      if (!edge.has(line)) return true;
      if (PAGE_NUMBER.test(line.text)) return false;
      return (counts.get(runningKey(line.text)) ?? 0) < threshold;
    });
  });
}

// ==================== MESURES ====================

/** Taille du corps de texte : la plus fréquente, pondérée par le nombre de caractères. */
function bodySize(lines: Line[]): number {
  const weights = new Map<number, number>();
  for (const line of lines) {
    const size = Math.round(line.size * 2) / 2;
    weights.set(size, (weights.get(size) ?? 0) + line.text.length);
  }
  let best = 0;
  let bestWeight = -1;
  for (const [size, weight] of weights) {
    if (weight > bestWeight) [best, bestWeight] = [size, weight];
  }
  return best || 12;
}

/** Interligne habituel du corps de texte (médiane des écarts entre lignes voisines). */
function lineSpacing(pages: Line[][], body: number): number {
  const gaps: number[] = [];
  for (const lines of pages) {
    for (let i = 1; i < lines.length; i++) {
      const gap = lines[i - 1].y - lines[i].y;
      if (gap > 0 && gap <= body * 3) gaps.push(gap);
    }
  }
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] ?? body * 1.4;
}

/**
 * Marges gauche et droite du texte de chaque page (pages paires et impaires diffèrent).
 * La marge droite est la fin de ligne habituelle (centile), pas la plus lointaine : une
 * signature ou une ligne qui déborde ne la décale pas.
 */
function pageBounds(pages: Line[][]): { left: number; right: number }[] {
  return pages.map((lines) => {
    const rights = lines.map((line) => line.right).sort((a, b) => a - b);
    const right =
      rights.length < 5
        ? (rights[rights.length - 1] ?? 0)
        : rights[Math.floor((rights.length - 1) * RIGHT_PERCENTILE)];
    return { left: Math.min(...lines.map((line) => line.x), Infinity), right };
  });
}

/** Hauteur habituelle de la première ligne d'une page (médiane). */
function usualTop(pages: Line[][]): number {
  const tops = pages.filter((lines) => lines.length).map((lines) => lines[0].y);
  tops.sort((a, b) => a - b);
  return tops[Math.floor(tops.length / 2)] ?? 0;
}

/**
 * Vide les pages de titre en tête du document : parmi les premières pages, celles faites
 * de gros caractères avec au plus quelques lignes de texte courant (titre et auteur
 * figurent déjà sur la fiche du livre). Les indices de page sont conservés.
 * @param pages - Lignes de chaque page
 * @param body  - Taille du corps de texte
 */
function withoutTitlePages(pages: Line[][], body: number): Line[][] {
  let start = 0;
  while (start < Math.min(TITLE_PAGES, pages.length - 1)) {
    const lines = pages[start];
    const bodyLines = lines.filter((line) => line.size < body * HEADING_RATIO).length;
    const display = lines.filter((line) => line.size >= body * 1.5);
    // Un chapitre qui s'ouvre sur peu de texte n'est pas une page de titre
    const opensChapter = display.some((line) => isChapterMarker(line.text, false));
    if (lines.length > 0 && !(display.length > 0 && bodyLines <= 3 && !opensChapter)) break;
    start++;
  }
  return pages.map((lines, index) => (index < start ? [] : lines));
}

/**
 * Sépare les notes de bas de page : lignes en petits caractères sous la dernière ligne de
 * texte courant. Chaque appel de note (« 1 » en tout petit) ouvre une nouvelle note.
 * @param pages - Lignes de chaque page
 * @param body  - Taille du corps de texte
 * @returns Pages sans leurs notes, et notes de chaque page (« 1. Texte de la note »)
 */
function splitFootnotes(pages: Line[][], body: number): { pages: Line[][]; notes: string[][] } {
  const notes: string[][] = [];
  const kept = pages.map((lines, page) => {
    notes[page] = [];
    let cut = lines.length;
    while (cut > 0 && lines[cut - 1].size < body * NOTE_RATIO) cut--;
    if (cut === 0 || cut === lines.length) return lines;

    // Une note se poursuit sur les lignes de sa taille ; le reste (encadré en petits
    // caractères, texte sans appel de note) demeure dans le texte courant
    const list: string[] = [];
    const text: Line[] = lines.slice(0, cut);
    let noteSize: number | null = null;
    let open = false;
    for (const line of lines.slice(cut)) {
      if (FOOTNOTE_CALL.test(line.text)) {
        list.push(`${line.text}.`);
        [open, noteSize] = [true, null];
      } else if (open && (noteSize === null || Math.abs(line.size - noteSize) < 0.6)) {
        list[list.length - 1] += ` ${line.text}`;
        noteSize = line.size;
      } else {
        text.push(line);
        open = false;
      }
    }
    // Tiret placé après le numéro (« 1. - Auteur ») retiré ; appel sans texte ignoré
    notes[page] = list
      .map((note) => note.replace(/^(\d+\.)\s*[-–—]\s*/, "$1 "))
      .filter((note) => !/^[\d*†‡]+\.$/.test(note));
    return text;
  });
  return { pages: kept, notes };
}

/**
 * Recolle les lettrines : une grande initiale seule (« F ») rejoint la première ligne
 * placée à sa droite (« ermement » devient « Fermement ») ; les autres lignes à côté
 * d'elle sont marquées pour que leur décalage ne passe pas pour un retrait.
 * @param lines - Lignes d'une page, de haut en bas
 * @param body  - Taille du corps de texte
 */
function mergeDropCaps(lines: Line[], body: number): Line[] {
  let result = lines;
  for (const drop of lines) {
    if (drop.size < body * DROP_CAP_RATIO || !/^\p{Lu}$/u.test(drop.text)) continue;
    const beside = result.filter(
      (line) =>
        line !== drop &&
        line.x >= drop.right - 1 &&
        line.y >= drop.y - 2 &&
        line.y <= drop.y + drop.size * 0.8,
    );
    if (beside.length === 0) continue;
    const first = beside.reduce((top, line) => (line.y > top.y ? line : top));
    result = result
      .filter((line) => line !== drop)
      .map((line) => {
        if (line === first) return { ...line, text: drop.text + line.text, x: drop.x };
        return beside.includes(line) ? { ...line, beside: true } : line;
      });
  }
  return result;
}

/**
 * Vrai si le premier mot d'une ligne aurait tenu au bout de la ligne précédente : celle-ci
 * s'est donc arrêtée volontairement (fin de paragraphe).
 * @param previous - Ligne précédente
 * @param line     - Ligne examinée
 * @param right    - Marge droite habituelle de la page de la ligne précédente
 */
function nextWordFits(previous: Line, line: Line, right: number): boolean {
  const word = line.text.split(" ")[0];
  return right - previous.right > (word.length + 1) * line.size * CHAR_WIDTH;
}

// ==================== STRUCTURE ====================

/**
 * Marqueur de chapitre à la taille du corps de texte (« Chapitre 2 », « IV ») : ligne
 * courte (une ligne de texte courant occupe toute la largeur). Un nombre seul n'en est pas
 * un dans un PDF : il vient le plus souvent d'un tableau ou d'une figure.
 * @param line  - Ligne examinée
 * @param bound - Marges de sa page
 */
function isMarker(line: Line, bound: { left: number; right: number }): boolean {
  const short = line.right - line.x < (bound.right - bound.left) * 0.6;
  return short && isChapterMarker(line.text, false);
}

/** Échappe un texte pour l'insérer dans du HTML. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Niveau de titre de chaque taille de police plus grande que le corps de texte. Le
 * niveau 1 (chapitre) revient à la plus grande taille utilisée sur au moins deux pages :
 * une taille plus grande encore, vue sur une seule page, devient un intertitre (niveau 2).
 * @param lines - Lignes du document
 * @param body  - Taille du corps de texte
 */
function headingLevels(lines: Line[], body: number): Map<number, number> {
  // Pages où chaque taille apparaît : un titre sur deux lignes ne compte qu'une fois
  const pagesOf = new Map<number, Set<number>>();
  for (const line of lines) {
    if (line.size < body * HEADING_RATIO || line.text.length > MAX_HEADING_LENGTH) continue;
    const size = Math.round(line.size);
    pagesOf.set(size, (pagesOf.get(size) ?? new Set()).add(line.page));
  }
  const sizes = [...pagesOf.keys()].sort((a, b) => b - a);
  const chapterIndex = sizes.findIndex((size) => (pagesOf.get(size)?.size ?? 0) >= 2);
  const levels = new Map<number, number>();
  sizes.forEach((size, index) => {
    // Aucune taille répétée : pas de chapitres, les titres restent des intertitres
    if (chapterIndex < 0) levels.set(size, Math.min(3, 2 + index));
    else if (index === chapterIndex) levels.set(size, 1);
    // Plus grand que les chapitres : page de titre, gardée comme intertitre
    else if (index < chapterIndex) levels.set(size, 2);
    else levels.set(size, Math.min(3, 1 + index - chapterIndex));
  });
  return levels;
}

/**
 * Reconstitue le document en HTML : titres et paragraphes.
 * @param pages - Lignes de chaque page, en-têtes et pieds de page retirés
 */
function toHtml(source: Line[][]): string {
  const body = bodySize(source.flat());
  const merged = source.map((lines) => mergeDropCaps(lines, body));
  const { pages, notes } = splitFootnotes(withoutTitlePages(merged, body), body);
  // Appels de note en petits caractères (« 2 », « * ») : retirés du texte
  const all = pages
    .flat()
    .filter((line) => !(line.size < body * 0.75 && FOOTNOTE_CALL.test(line.text)));
  const spacing = lineSpacing(pages, body);
  const bounds = pageBounds(pages);
  const levels = headingLevels(all, body);
  const top = usualTop(pages);

  const html: string[] = [];
  let paragraph = "";
  let heading: { level: number; text: string; line: Line } | null = null;
  let previous: Line | null = null;
  let lastPage = -1;
  // Décalage (depuis la marge) du tiret de la réplique en cours ; null hors réplique
  let itemOffset: number | null = null;
  // Notes des pages déjà lues : placées après le paragraphe en cours, sans le couper
  let pendingNotes: string[] = [];

  const flushParagraph = () => {
    if (paragraph) html.push(`<p>${escapeHtml(paragraph)}</p>`);
    paragraph = "";
    for (const note of pendingNotes) html.push(`<p><small>${escapeHtml(note)}</small></p>`);
    pendingNotes = [];
  };
  const flushHeading = () => {
    if (heading) html.push(`<h${heading.level}>${escapeHtml(heading.text)}</h${heading.level}>`);
    heading = null;
  };

  let notedUpTo = 0;
  for (const line of all) {
    while (notedUpTo < line.page) pendingNotes.push(...notes[notedUpTo++]);
    const large = line.size >= body * HEADING_RATIO && line.text.length <= MAX_HEADING_LENGTH;
    const level = large
      ? levels.get(Math.round(line.size))
      : isMarker(line, bounds[line.page])
        ? 1
        : undefined;

    if (level) {
      flushParagraph();
      // Titre sur plusieurs lignes : même taille, lignes rapprochées sur la même page
      const current = heading as { level: number; text: string; line: Line } | null;
      if (
        current &&
        current.level === level &&
        current.line.page === line.page &&
        current.line.y - line.y <= line.size * 2
      ) {
        current.text += ` ${line.text}`;
        current.line = line;
      } else {
        flushHeading();
        heading = { level, text: line.text, line };
      }
      previous = null;
      lastPage = line.page;
      continue;
    }
    flushHeading();

    // Signature en tête du texte : l'auteur figure déjà sur la fiche du livre
    const opening = html.length === 0 && !paragraph;
    const byline =
      BYLINE.test(line.text) && line.text.length <= 80 && !PARAGRAPH_END.test(line.text);
    if (opening && byline) continue;

    // Nouvelle partie sans titre : pages blanches sautées ou texte commencé plus bas
    if (lastPage >= 0 && line.page !== lastPage && (!paragraph || PARAGRAPH_END.test(paragraph))) {
      if (line.page - lastPage > 1 || line.y < top - spacing * 4) {
        flushParagraph();
        html.push("<hr />");
        previous = null;
      }
    }
    lastPage = line.page;

    const bound = bounds[line.page];
    const width = bound.right - bound.left;
    const dash = LINE_START_BREAK.test(line.text);
    // Suite d'une réplique à tiret : ligne alignée sous le texte, après le tiret
    const continuesItem = itemOffset !== null && line.x - bound.left > itemOffset + body * 0.5;
    const indented =
      line.x > bound.left + body * 0.8 && line.x < bound.left + width * 0.3 && !line.beside;
    const startsParagraph =
      !previous ||
      (previous.page === line.page && previous.y - line.y > spacing * 1.4) ||
      (indented && !continuesItem) ||
      (PARAGRAPH_END.test(previous.text) &&
        nextWordFits(previous, line, bounds[previous.page].right)) ||
      dash;

    if (startsParagraph) {
      flushParagraph();
      paragraph = line.text;
      itemOffset = dash ? line.x - bound.left : null;
    } else if (/\p{L}[-­]$/u.test(paragraph) && /^\p{Ll}/u.test(line.text)) {
      // Mot coupé en fin de ligne : on retire le trait d'union
      paragraph = paragraph.slice(0, -1) + line.text;
    } else {
      paragraph += ` ${line.text}`;
    }
    previous = line;
  }
  flushHeading();
  while (notedUpTo < notes.length) pendingNotes.push(...notes[notedUpTo++]);
  flushParagraph();
  return html.join("\n");
}

// ==================== CONVERSION ====================

/**
 * Convertit un fichier PDF en chapitres.
 * @param data   - Contenu binaire du fichier
 * @param titles - Titres par défaut
 * @returns Chapitres nettoyés, dans l'ordre du document
 * @throws ConversionError si le fichier est invalide, numérisé, vide ou hors limites
 *
 * Exemple : const chapitres = await convertPdf(buffer, { book: "Mon livre", opening: "Début" });
 */
export async function convertPdf(
  data: Uint8Array,
  titles: PdfTitles,
): Promise<ConvertedChapter[]> {
  let items: StructuredTextItem[][];
  try {
    // Copie : pdf.js transfère (et vide) le tampon reçu
    const pdf = await getDocumentProxy(new Uint8Array(data));
    items = (await extractTextItems(pdf)).items;
  } catch {
    throw new ConversionError("invalid_file");
  }

  const characters = items.flat().reduce((total, item) => total + item.str.trim().length, 0);
  if (characters < MIN_CHARACTERS) throw new ConversionError("scanned");

  const pages = removeRunningLines(items.map((page, index) => pageLines(page, index)));
  const nodes = flattenNodes(parseDocument(toHtml(pages)).children);
  const chapters = nodes.some((node) => isHeading(node, 1))
    ? splitByHeading(nodes, 1, titles.opening)
    : splitByHeading(nodes, 1, titles.book);

  assertLimits(chapters);
  return chapters;
}
