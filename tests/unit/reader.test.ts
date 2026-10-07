/**
 * Fichier    : reader.test.ts
 * Projet     : Kalami
 * Description: Tests des fonctions pures de la liseuse : pagination (mesure simulée par
 *              nombre de caractères), position ↔ page, avancement, position de départ,
 *              validation, recherche (accents, extrait de contexte, limite) et parties
 *              autorisées à la recherche.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-09
 */

import { describe, expect, it } from "vitest";

import type { TocEntry } from "@/lib/catalog/types";
import { authorizedChapters } from "@/lib/content/access";
import { pageIndexOf, pageStart, paginate, wordBreaks } from "@/lib/reader/paginate";
import {
  bookProgress,
  chapterFraction,
  isChapterReadable,
  nextChapter,
  parsePosition,
  previousChapter,
  resolveStartPosition,
} from "@/lib/reader/position";
import { parseSearchQuery, searchChapters } from "@/lib/reader/search";
import type { BlockInfo, Page } from "@/lib/reader/types";

// ==================== OUTILS ====================

/** Mesure simulée : une page contient au plus « capacity » caractères. */
const fitsWithin = (capacity: number) => (page: Page) =>
  page.reduce((sum, fragment) => sum + fragment.end - fragment.start, 0) <= capacity;

/** Bloc de texte décrit à partir d'une chaîne. */
const block = (text: string, heading = false): BlockInfo => ({
  length: text.length,
  breaks: wordBreaks(text),
  heading,
});

const TOC = [
  { chapter_position: 1, title: "Un", word_count: 100, is_preview: true },
  { chapter_position: 2, title: "Deux", word_count: 300, is_preview: false },
  { chapter_position: 3, title: "Trois", word_count: 600, is_preview: false },
] as TocEntry[];

// ==================== PAGINATION ====================

describe("paginate", () => {
  it("garde tout sur une page quand tout tient", () => {
    expect(paginate([block("abc def"), block("ghi")], fitsWithin(100))).toEqual([
      [
        { block: 0, start: 0, end: 7 },
        { block: 1, start: 0, end: 3 },
      ],
    ]);
  });

  it("coupe un paragraphe au dernier mot qui tient", () => {
    const pages = paginate([block("aaaa bbbb cccc dddd")], fitsWithin(10));
    expect(pages).toEqual([
      [{ block: 0, start: 0, end: 10 }],
      [{ block: 0, start: 10, end: 19 }],
    ]);
  });

  it("ne laisse jamais un intertitre seul en bas de page", () => {
    const pages = paginate([block("aaaa"), block("Titre", true), block("bbbbbbb")], fitsWithin(10));
    expect(pages[0]).toEqual([{ block: 0, start: 0, end: 4 }]);
    expect(pages[1][0]).toEqual({ block: 1, start: 0, end: 5 });
  });

  it("place un bloc trop grand plutôt que de boucler", () => {
    const pages = paginate([block("abcdefghijklmnop")], fitsWithin(5));
    expect(pages).toEqual([[{ block: 0, start: 0, end: 16 }]]);
  });

  it("renvoie une page vide pour un chapitre vide", () => {
    expect(paginate([], fitsWithin(10))).toEqual([[]]);
  });
});

describe("pageIndexOf / pageStart", () => {
  const pages = paginate([block("aaaa bbbb cccc dddd"), block("eeee")], fitsWithin(10));

  it("retrouve la page d'une position", () => {
    expect(pageIndexOf(pages, 0, 0)).toBe(0);
    expect(pageIndexOf(pages, 0, 12)).toBe(1);
    expect(pageIndexOf(pages, 1, 0)).toBe(pages.length - 1);
  });

  it("renvoie la dernière page pour une position au-delà de la fin", () => {
    expect(pageIndexOf(pages, 100000, 0)).toBe(pages.length - 1);
  });

  it("donne le début d'une page", () => {
    expect(pageStart(pages, 1)).toEqual({ block: 0, offset: 10 });
    expect(pageStart([[]], 0)).toEqual({ block: 0, offset: 0 });
  });
});

// ==================== POSITION ====================

describe("avancement", () => {
  it("calcule la part lue d'un chapitre", () => {
    expect(chapterFraction([10, 30], 0, 0)).toBe(0);
    expect(chapterFraction([10, 30], 1, 10)).toBe(0.5);
    expect(chapterFraction([], 0, 0)).toBe(0);
  });

  it("pondère l'avancement dans le livre par le nombre de mots", () => {
    expect(bookProgress(TOC, 1, 0)).toBe(0);
    expect(bookProgress(TOC, 2, 0.5)).toBe(0.25);
    expect(bookProgress(TOC, 3, 1)).toBe(1);
  });
});

describe("navigation entre chapitres", () => {
  it("indique les chapitres lisibles selon l'accès", () => {
    expect(isChapterReadable(TOC, 1, "preview")).toBe(true);
    expect(isChapterReadable(TOC, 2, "preview")).toBe(false);
    expect(isChapterReadable(TOC, 2, "full")).toBe(true);
    expect(isChapterReadable(TOC, 9, "full")).toBe(false);
  });

  it("trouve les chapitres voisins", () => {
    expect(nextChapter(TOC, 1)).toBe(2);
    expect(nextChapter(TOC, 3)).toBeNull();
    expect(previousChapter(TOC, 2)).toBe(1);
    expect(previousChapter(TOC, 1)).toBeNull();
  });
});

describe("resolveStartPosition", () => {
  const saved = (chapter: number, updatedAt: string) => ({
    chapter,
    block: 4,
    offset: 2,
    progress: 0.5,
    updatedAt,
  });

  it("donne priorité au chapitre demandé dans l'URL", () => {
    const server = saved(3, "2026-10-09T10:00:00Z");
    expect(resolveStartPosition(TOC, 2, server, null)).toEqual({ chapter: 2, block: 0, offset: 0 });
  });

  it("reprend la position la plus récente entre le serveur et l'appareil", () => {
    const server = saved(2, "2026-10-09T10:00:00Z");
    const local = saved(3, "2026-10-09T11:00:00Z");
    expect(resolveStartPosition(TOC, null, server, local)).toEqual({
      chapter: 3,
      block: 4,
      offset: 2,
    });
  });

  it("ignore une position hors du sommaire et ouvre au début", () => {
    const stale = saved(9, "2026-10-09T10:00:00Z");
    expect(resolveStartPosition(TOC, 9, stale, null)).toEqual({ chapter: 1, block: 0, offset: 0 });
  });
});

describe("parsePosition", () => {
  it("accepte une position entière bornée", () => {
    expect(parsePosition({ chapter: 1, block: 0, offset: 0, extra: 1 })).toEqual({
      chapter: 1,
      block: 0,
      offset: 0,
    });
  });

  it("refuse les valeurs invalides", () => {
    for (const value of [
      null,
      "x",
      { chapter: 0, block: 0, offset: 0 },
      { chapter: 1, block: -1, offset: 0 },
      { chapter: 1, block: 0, offset: 0.5 },
      { chapter: "1", block: 0, offset: 0 },
    ]) {
      expect(parsePosition(value)).toBeNull();
    }
  });
});

// ==================== RECHERCHE ====================

describe("recherche", () => {
  it("valide la requête", () => {
    expect(parseSearchQuery("  le   chat ")).toBe("le chat");
    expect(parseSearchQuery("a")).toBeNull();
    expect(parseSearchQuery(null)).toBeNull();
    expect(parseSearchQuery("x".repeat(101))).toBeNull();
  });

  it("ignore accents et majuscules, et situe l'occurrence", () => {
    const hits = searchChapters(
      [{ position: 2, title: "Deux", blocks: ["<p>Un <em>Été</em> chaud</p>"] }],
      "ete",
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ chapter: 2, block: 0, offset: 3, matchLength: 3 });
    const { snippet, matchStart, matchLength } = hits[0];
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("Été");
  });

  it("limite le nombre de résultats", () => {
    const chapters = [{ position: 1, title: "Un", blocks: ["<p>ab ab ab ab ab</p>"] }];
    expect(searchChapters(chapters, "ab", 3)).toHaveLength(3);
  });

  it("ne cherche que dans les parties autorisées de l'extrait", () => {
    const chapters = [
      { position: 1, title: "Un", blocks: ["<p>chat</p>", "<p>chat caché</p>"] },
      { position: 2, title: "Deux", blocks: ["<p>chat payant</p>"] },
    ];
    const rule = { preview_chapters: 1, preview_cut_block: 1 };
    const allowed = authorizedChapters(chapters, rule, false);
    expect(allowed).toEqual([{ position: 1, title: "Un", blocks: ["<p>chat</p>"] }]);
    expect(searchChapters(allowed, "chat")).toHaveLength(1);
    expect(authorizedChapters(chapters, rule, true)).toEqual(chapters);
  });
});
