/**
 * Fichier    : annotations.test.ts
 * Projet     : Kalami
 * Description: Tests des fonctions pures des annotations : validation (ancrage, couleur,
 *              passage, note), découpe des surlignages par bloc et par fragment de page,
 *              chevauchements, survie d'un surlignage à une repagination (changement de
 *              police ou de taille d'écran), panneau (tri, filtre, regroupement) et
 *              extrait partageable.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-10
 */

import { describe, expect, it } from "vitest";

import {
  blockSegments,
  cleanNote,
  cleanQuote,
  filterHighlights,
  fragmentSegments,
  groupByChapter,
  isHighlightColor,
  MAX_QUOTE_LENGTH,
  parseAnchor,
  shareExcerpt,
} from "@/lib/reader/annotations";
import { paginate, wordBreaks } from "@/lib/reader/paginate";
import type { BlockInfo, Highlight, Page, TextPoint } from "@/lib/reader/types";

// ==================== OUTILS ====================

/** Mesure simulée : une page contient au plus « capacity » caractères. */
const fitsWithin = (capacity: number) => (page: Page) =>
  page.reduce((sum, fragment) => sum + fragment.end - fragment.start, 0) <= capacity;

/** Bloc de texte décrit à partir d'une chaîne. */
const blockInfo = (text: string): BlockInfo => ({
  length: text.length,
  breaks: wordBreaks(text),
  heading: false,
});

/** Surlignage de test (chapitre 1). */
function highlight(
  id: string,
  start: TextPoint,
  end: TextPoint,
  extra: Partial<Highlight> = {},
): Highlight {
  return {
    id,
    chapter: 1,
    start,
    end,
    color: "jaune",
    quote: "",
    note: null,
    createdAt: "2026-10-10T00:00:00Z",
    ...extra,
  };
}

const BLOCKS = [
  "Le soleil se levait sur Abidjan et la lagune brillait déjà sous la brume du matin.",
  "Awa ouvrit la fenêtre, écouta les pirogues, puis reprit le manuscrit laissé la veille.",
  "Chaque page racontait une ville qui change plus vite que ceux qui l'habitent.",
];

/**
 * Reconstitue le texte surligné à partir des pages, comme le fait la liseuse : chaque
 * fragment de page est découpé, puis on lit les morceaux surlignés dans ce fragment.
 * @param pages - Pagination des blocs (sans titre : élément = bloc)
 */
function highlightedText(pages: Page[], highlights: Highlight[], id: string): string {
  let text = "";
  for (const page of pages) {
    for (const { block, start, end } of page) {
      const segments = fragmentSegments(blockSegments(highlights, block, end), start, end);
      const fragmentText = BLOCKS[block].slice(start, end);
      for (const segment of segments.filter((s) => s.id === id)) {
        text += fragmentText.slice(segment.start, segment.end);
      }
    }
  }
  return text;
}

// ==================== VALIDATION ====================

describe("parseAnchor", () => {
  it("accepte un ancrage valide sur plusieurs blocs", () => {
    const anchor = { chapter: 2, start: { block: 1, offset: 4 }, end: { block: 3, offset: 0 } };
    expect(parseAnchor(anchor)).toEqual(anchor);
  });

  it("refuse une fin avant ou égale au début", () => {
    const at = { block: 1, offset: 4 };
    expect(parseAnchor({ chapter: 1, start: at, end: at })).toBeNull();
    expect(parseAnchor({ chapter: 1, start: at, end: { block: 0, offset: 9 } })).toBeNull();
  });

  it("refuse les formes invalides", () => {
    expect(parseAnchor(null)).toBeNull();
    expect(parseAnchor("1:2:3")).toBeNull();
    expect(parseAnchor({ chapter: 1, start: { block: -1, offset: 0 }, end: {} })).toBeNull();
    expect(
      parseAnchor({ chapter: 0, start: { block: 0, offset: 0 }, end: { block: 0, offset: 2 } }),
    ).toBeNull();
  });
});

describe("validation des champs", () => {
  it("reconnaît les 5 couleurs", () => {
    expect(["jaune", "vert", "bleu", "rose", "orange"].every(isHighlightColor)).toBe(true);
    expect(isHighlightColor("violet")).toBe(false);
  });

  it("nettoie et limite le passage", () => {
    expect(cleanQuote("  un\n\tpassage  ")).toBe("un passage");
    expect(cleanQuote("   ")).toBeNull();
    expect(cleanQuote(42)).toBeNull();
    const long = cleanQuote("a".repeat(5000));
    expect(long).toHaveLength(MAX_QUOTE_LENGTH);
    expect(long?.endsWith("…")).toBe(true);
  });

  it("valide la note (vide = aucune note)", () => {
    expect(cleanNote(null)).toEqual({ valid: true, note: null });
    expect(cleanNote("   ")).toEqual({ valid: true, note: null });
    expect(cleanNote(" À relire ")).toEqual({ valid: true, note: "À relire" });
    expect(cleanNote("x".repeat(2001)).valid).toBe(false);
    expect(cleanNote(3).valid).toBe(false);
  });
});

// ==================== DÉCOUPE ====================

describe("blockSegments", () => {
  it("découpe un surlignage sur plusieurs blocs", () => {
    const list = [highlight("a", { block: 0, offset: 10 }, { block: 2, offset: 5 })];
    expect(blockSegments(list, 0, 30)).toMatchObject([{ id: "a", start: 10, end: 30 }]);
    expect(blockSegments(list, 1, 20)).toMatchObject([{ id: "a", start: 0, end: 20 }]);
    expect(blockSegments(list, 2, 20)).toMatchObject([{ id: "a", start: 0, end: 5 }]);
    expect(blockSegments(list, 3, 20)).toEqual([]);
  });

  it("donne la priorité au surlignage le plus récent en cas de chevauchement", () => {
    const list = [
      highlight("ancien", { block: 0, offset: 0 }, { block: 0, offset: 20 }),
      highlight("recent", { block: 0, offset: 10 }, { block: 0, offset: 30 }, { color: "bleu" }),
    ];
    expect(blockSegments(list, 0, 40)).toMatchObject([
      { id: "ancien", start: 0, end: 10 },
      { id: "recent", color: "bleu", start: 10, end: 30 },
    ]);
  });

  it("garde l'ancien surlignage autour d'un récent inclus dedans", () => {
    const list = [
      highlight("large", { block: 0, offset: 0 }, { block: 0, offset: 30 }),
      highlight("petit", { block: 0, offset: 10 }, { block: 0, offset: 15 }, { note: "!" }),
    ];
    expect(blockSegments(list, 0, 40)).toMatchObject([
      { id: "large", start: 0, end: 10 },
      { id: "petit", start: 10, end: 15, hasNote: true },
      { id: "large", start: 15, end: 30 },
    ]);
  });

  it("borne les décalages à la longueur du bloc", () => {
    const list = [highlight("a", { block: 0, offset: 5 }, { block: 0, offset: 999 })];
    expect(blockSegments(list, 0, 12)).toMatchObject([{ start: 5, end: 12 }]);
  });
});

describe("fragmentSegments", () => {
  it("décale les morceaux au début du fragment et coupe aux bords", () => {
    const segments = blockSegments(
      [highlight("a", { block: 0, offset: 5 }, { block: 0, offset: 25 })],
      0,
      40,
    );
    expect(fragmentSegments(segments, 0, 10)).toMatchObject([{ start: 5, end: 10 }]);
    expect(fragmentSegments(segments, 10, 20)).toMatchObject([{ start: 0, end: 10 }]);
    expect(fragmentSegments(segments, 20, 40)).toMatchObject([{ start: 0, end: 5 }]);
    expect(fragmentSegments(segments, 30, 40)).toEqual([]);
  });
});

// ==================== TEST CRITIQUE : REPAGINATION ====================

describe("surlignage et repagination", () => {
  const blocks = BLOCKS.map(blockInfo);
  // Du milieu du bloc 0 au milieu du bloc 2
  const start = { block: 0, offset: BLOCKS[0].indexOf("lagune") };
  const end = { block: 2, offset: BLOCKS[2].indexOf(" qui change") };
  const expected =
    BLOCKS[0].slice(start.offset) + BLOCKS[1] + BLOCKS[2].slice(0, end.offset);
  const list = [highlight("h", start, end)];

  it.each([25, 40, 60, 200])(
    "retrouve exactement le passage avec des pages de %i caractères",
    (capacity) => {
      const pages = paginate(blocks, fitsWithin(capacity));
      expect(pages.length).toBeGreaterThan(capacity < 200 ? 1 : 0);
      expect(highlightedText(pages, list, "h")).toBe(expected);
    },
  );

  it("donne le même passage avant et après un changement de police", () => {
    const small = paginate(blocks, fitsWithin(35));
    const large = paginate(blocks, fitsWithin(90));
    expect(small.length).not.toBe(large.length);
    expect(highlightedText(small, list, "h")).toBe(highlightedText(large, list, "h"));
  });
});

// ==================== PANNEAU ====================

describe("panneau des annotations", () => {
  const list = [
    highlight("c2", { block: 0, offset: 0 }, { block: 0, offset: 4 }, {
      chapter: 2,
      quote: "Élégie",
      color: "vert",
    }),
    highlight("c1b", { block: 3, offset: 0 }, { block: 3, offset: 4 }, {
      quote: "La lagune",
      note: "Belle image",
    }),
    highlight("c1a", { block: 1, offset: 2 }, { block: 1, offset: 9 }, { quote: "Abidjan" }),
  ];

  it("filtre par texte (sans accents ni majuscules) et par note", () => {
    expect(filterHighlights(list, "elegie", null).map((h) => h.id)).toEqual(["c2"]);
    expect(filterHighlights(list, "IMAGE", null).map((h) => h.id)).toEqual(["c1b"]);
    expect(filterHighlights(list, "  ", null)).toHaveLength(3);
  });

  it("filtre par couleur", () => {
    expect(filterHighlights(list, "", "vert").map((h) => h.id)).toEqual(["c2"]);
    expect(filterHighlights(list, "lagune", "vert")).toEqual([]);
  });

  it("regroupe par chapitre dans l'ordre du livre", () => {
    const groups = groupByChapter(list);
    expect(groups.map((g) => g.chapter)).toEqual([1, 2]);
    expect(groups[0].items.map((h) => h.id)).toEqual(["c1a", "c1b"]);
  });
});

// ==================== PARTAGE ====================

describe("shareExcerpt", () => {
  it("garde un court passage tel quel", () => {
    expect(shareExcerpt("  Un  passage court. ")).toBe("Un passage court.");
  });

  it("coupe à la fin d'un mot sans dépasser la limite", () => {
    const text = "mot ".repeat(200);
    const excerpt = shareExcerpt(text);
    expect(excerpt.length).toBeLessThanOrEqual(280);
    expect(excerpt.endsWith("mot…")).toBe(true);
  });

  it("coupe un mot très long quand il n'y a pas d'espace", () => {
    const excerpt = shareExcerpt("x".repeat(500), 20);
    expect(excerpt).toHaveLength(20);
  });
});
