/**
 * Fichier    : content-layout.test.ts
 * Projet     : Kalami
 * Description: Tests de la mise en forme des manuscrits : typographie française et anglaise,
 *              séparateurs de scène, poèmes, repérage des titres sans styles (DOCX) et
 *              conversion PDF (page de titre, en-têtes, titres par taille, mots coupés,
 *              notes de bas de page, PDF numérisé, signature, texte non justifié, répliques
 *              à tiret, lettrine). Les PDF d'essai sont construits avec
 *              pdf-lib.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-22
 */

import render from "dom-serializer";
import { parseDocument } from "htmlparser2";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";

import { convertPdf } from "@/lib/content/convert-pdf";
import { isChapterMarker, promoteHeadings } from "@/lib/content/headings";
import { ConversionError } from "@/lib/content/types";
import { polishBlock, polishChapters } from "@/lib/content/typography";

vi.mock("server-only", () => ({}));

const NNBSP = " ";
const TITLES = { book: "Mon livre", opening: "Ouverture" };

// ==================== FICHIERS D'ESSAI ====================

/** Ligne à dessiner : texte, taille, abscisse, ordonnée. */
type Draw = [text: string, size: number, x: number, y: number];

/** Construit un PDF : une liste de lignes par page (A4, police Times). */
async function pdf(pages: Draw[][]): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.TimesRoman);
  for (const lines of pages) {
    const page = document.addPage([595, 842]);
    for (const [text, size, x, y] of lines) page.drawText(text, { x, y, size, font });
  }
  return document.save();
}

/** Lignes de texte courant pleine largeur (corps 12). */
const L1 = "Le vent soufflait sur la colline et les arbres pliaient sous la force des rafales";
const L2 = "qui balayaient la route du village, et chacun se hâtait de rentrer avant la conti-";
const L3 = "Le marché fermait ses portes et les marchandes repliaient leurs étals de pagnes et";

/** Petit roman : page de titre, deux chapitres, en-tête courant, note de bas de page. */
function novel(): Promise<Uint8Array> {
  const header: Draw = ["Mon Roman", 9, 260, 790];
  return pdf([
    [["Mon Roman", 30, 200, 500]],
    [
      header,
      ["Chapitre 1", 20, 72, 700],
      [L1, 12, 90, 660],
      [L2, 12, 72, 644],
      ["nue tombée de la nuit.", 12, 72, 628],
      ["2", 9, 290, 40],
    ],
    [
      header,
      [L3, 12, 90, 740],
      ["de bassines en fer blanc.", 12, 72, 724],
      ["1", 6, 72, 92],
      ["Une note de bas de page qui explique un détail du récit", 9, 76, 88],
      ["sur deux lignes.", 9, 72, 78],
      ["3", 9, 290, 40],
    ],
    [
      header,
      ["Chapitre 2", 20, 72, 700],
      [L1, 12, 90, 660],
      ["et la nuit tomba.", 12, 72, 644],
      ["4", 9, 290, 40],
    ],
  ]);
}

/** Code d'erreur levé par une promesse, ou null. */
async function errorCode(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof ConversionError ? error.code : "autre";
  }
}

// ==================== TYPOGRAPHIE ====================

describe("polishBlock", () => {
  it("applique la typographie française", () => {
    const html = polishBlock('<p>Il dit : "Bonjour ! Ça va ?" C\'est fini... Mot .</p>', "fr");
    expect(html).toContain(`Il dit&nbsp;: «&nbsp;Bonjour${NNBSP}! Ça va${NNBSP}?&nbsp;»`);
    expect(html).toContain("C’est fini… Mot.");
  });

  it("transforme le tiret de dialogue et retire le retrait saisi au clavier", () => {
    expect(polishBlock("<p>   -- Viens ici, dit-il.</p>", "fr")).toBe(
      "<p>—&nbsp;Viens ici, dit-il.</p>",
    );
  });

  it("applique la typographie anglaise sans espaces insécables", () => {
    expect(polishBlock('<p>"Hello," she said. It\'s late!</p>', "en")).toBe(
      "<p>“Hello,” she said. It’s late!</p>",
    );
  });

  it("change un séparateur de scène en ornement et repère les poèmes", () => {
    expect(polishBlock("<p>* * *</p>", "fr")).toBe("<hr />");
    expect(polishBlock("<p>Un vers<br>Un autre vers<br>Le dernier vers</p>", "fr")).toContain(
      '<p class="vers">',
    );
    // Deux longues lignes ne font pas un poème
    expect(polishBlock(`<p>${L1}<br>${L1}<br>${L1}</p>`, "fr")).not.toContain("vers");
  });

  it("ne touche pas au code", () => {
    expect(polishBlock('<pre>a = "b" ; c...</pre>', "fr")).toBe('<pre>a = "b" ; c...</pre>');
  });
});

describe("polishChapters", () => {
  it("retire titre répété, séparateurs en bord ou doublés et blocs vides", () => {
    const [chapter] = polishChapters(
      [
        {
          title: "Le Départ",
          blocks: ["<h2>LE DÉPART</h2>", "<p>***</p>", "<p>Un.</p>", "<hr />", "<p>~~~</p>",
            "<p>Deux.</p>", "<p>  </p>", "<p>***</p>"],
          word_count: 0,
        },
      ],
      "fr",
    );
    expect(chapter.blocks).toEqual(["<p>Un.</p>", "<hr />", "<p>Deux.</p>"]);
    expect(chapter.word_count).toBe(2);
  });
});

// ==================== TITRES ====================

describe("isChapterMarker", () => {
  it("reconnaît les marqueurs de chapitre", () => {
    for (const text of ["Chapitre 3", "CHAPITRE PREMIER", "Partie II : Le retour", "Prologue",
      "Épilogue — Dix ans plus tard", "IV", "12.", "Chapter One"]) {
      expect(isChapterMarker(text), text).toBe(true);
    }
  });

  it("écarte le texte courant qui commence par un mot-clé", () => {
    for (const text of ["partie du domaine communal", "Livre ouvert sur la table", "civil",
      "Chapitre ci-dessous", "Introduction de la loi en 2010"]) {
      expect(isChapterMarker(text), text).toBe(false);
    }
    expect(isChapterMarker("12", false)).toBe(false);
  });
});

describe("promoteHeadings", () => {
  /** Applique le repérage à un fragment et renvoie le HTML obtenu. */
  const promote = (html: string) =>
    render(promoteHeadings(parseDocument(html).children), { encodeEntities: "utf8" });

  it("fait des marqueurs des chapitres et des lignes en relief des intertitres", () => {
    const html = promote(
      "<p>Chapitre 1</p><p><strong>Le départ</strong></p><p>Texte du chapitre.</p>" +
        "<p>Chapitre 2</p><p>Suite du texte, assez longue pour un vrai paragraphe.</p>" +
        "<p>Encore du texte.</p><p>Et encore.</p><p>Fin.</p>",
    );
    expect(html).toContain("<h1>Chapitre 1</h1>");
    expect(html).toContain("<h2><strong>Le départ</strong></h2>");
    expect(html).toContain("<h1>Chapitre 2</h1>");
  });

  it("laisse un poème tout en capitales tel quel", () => {
    const html = promote("<p>FACE AU SOLEIL</p><p>Dos à la colline,</p>".repeat(3));
    expect(html).not.toContain("<h");
  });
});

// ==================== PDF ====================

describe("convertPdf", () => {
  it("retrouve chapitres, paragraphes, mots coupés et notes", async () => {
    const chapters = polishChapters(await convertPdf(await novel(), TITLES), "fr");
    expect(chapters.map((chapter) => chapter.title)).toEqual(["Chapitre 1", "Chapitre 2"]);

    const first = chapters[0].blocks.join("\n");
    // Page de titre et en-tête courant retirés, numéros de page aussi
    expect(first).not.toContain("Mon Roman");
    expect(first).not.toMatch(/>\s*[234]\s*</);
    // Mot coupé en fin de ligne recollé, paragraphe sur deux pages conservé
    expect(first).toContain("avant la continue tombée de la nuit.</p>");
    expect(chapters[0].blocks.filter((block) => block.startsWith("<p>Le "))).toHaveLength(2);
    // Note placée après le paragraphe, numérotée
    expect(first).toContain(
      "<p><small>1. Une note de bas de page qui explique un détail du récit sur deux lignes." +
        "</small></p>",
    );
  });

  it("fait un seul chapitre au titre du livre sans titres", async () => {
    const data = await pdf([[[L1, 12, 90, 700], ["Fin du texte.", 12, 72, 684]]]);
    const chapters = await convertPdf(data, TITLES);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe("Mon livre");
  });

  it("retire signature et titre répété, et garde un texte non justifié en paragraphes",
    async () => {
      const data = await pdf([
        [
          ["Par Awa Koné", 8, 480, 790],
          ["Mon livre", 16, 72, 760],
          [L1, 12, 72, 720],
          [L1, 12, 72, 706],
          // Fin de phrase loin de la marge, mais le mot suivant n'aurait pas tenu
          ["Le marché fermait ses portes et les marchandes repliaient leurs étals.", 12, 72, 692],
          ["accompagnées de leurs enfants et la nuit tomba.", 12, 72, 678],
          [L1, 12, 72, 664],
          ["et le jour revint.", 12, 72, 650],
        ],
      ]);
      const [chapter] = polishChapters(await convertPdf(data, TITLES), "fr");
      expect(chapter.title).toBe("Mon livre");
      expect(chapter.blocks).toHaveLength(2);
      expect(chapter.blocks.join("\n")).not.toContain("Awa");
      expect(chapter.blocks[0]).toContain("étals. accompagnées");
      expect(chapter.blocks[1]).toMatch(/^<p>Le vent.*revint\.<\/p>$/);
    });

  it("garde une réplique à tiret entière malgré son retrait suspendu", async () => {
    const data = await pdf([
      [
        [L1, 12, 72, 720],
        ["et il demanda :", 12, 72, 706],
        ["-", 12, 90, 692],
        ["Pourquoi le vent souffle-t-il si fort sur la colline ce soir", 12, 110, 692],
        ["et pourquoi les arbres plient-ils ainsi ?", 12, 108, 678],
        ["-", 12, 90, 664],
        ["Parce que.", 12, 110, 664],
        ["Puis le silence revint.", 12, 90, 650],
      ],
    ]);
    const [chapter] = await convertPdf(data, TITLES);
    expect(chapter.blocks).toHaveLength(4);
    expect(chapter.blocks[1]).toMatch(/^<p>- Pourquoi .* ainsi \?<\/p>$/);
    expect(chapter.blocks[3]).toBe("<p>Puis le silence revint.</p>");
  });

  it("recolle une lettrine à son paragraphe", async () => {
    const data = await pdf([
      [
        [L1, 12, 72, 720],
        ["et la nuit tomba.", 12, 72, 706],
        ["F", 48, 72, 664],
        ["ermement, le vieux chasseur prit son fusil et sortit", 12, 100, 692],
        ["dans la cour sans dire un mot à personne, puis il", 12, 100, 678],
        ["marcha longtemps vers la forêt.", 12, 100, 664],
        ["Le soir venu, il revint.", 12, 72, 650],
      ],
    ]);
    const [chapter] = await convertPdf(data, TITLES);
    expect(chapter.blocks).toEqual([
      `<p>${L1} et la nuit tomba.</p>`,
      "<p>Fermement, le vieux chasseur prit son fusil et sortit dans la cour sans dire un " +
        "mot à personne, puis il marcha longtemps vers la forêt.</p>",
      "<p>Le soir venu, il revint.</p>",
    ]);
  });

  it("refuse un fichier invalide ou un PDF sans texte (numérisé)", async () => {
    expect(await errorCode(convertPdf(new TextEncoder().encode("pas un pdf"), TITLES))).toBe(
      "invalid_file",
    );
    expect(await errorCode(convertPdf(await pdf([[], []]), TITLES))).toBe("scanned");
  });
});
