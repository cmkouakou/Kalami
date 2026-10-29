/**
 * Fichier    : content-docx-layout.test.ts
 * Projet     : Kalami
 * Description: Tests de la mise en page Word conservée : repérage des encadrés dans le XML,
 *              regroupement (début, fin, titre, étiquette « SUR LE TERRAIN »), illustrations
 *              et légendes, liste blanche des images intégrées, recompression WebP,
 *              ouvertures de chapitre (surtitre, chapeau) et table des matières cliquable.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-17
 */

import render from "dom-serializer";
import { parseDocument } from "htmlparser2";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import { createImageConverter } from "@/lib/content/docx-images";
import { linkContents } from "@/lib/content/contents-links";
import { arrangeLayout, markBoxes } from "@/lib/content/docx-layout";
import { assertLimits, nodesToBlocks, sanitizeBlock } from "@/lib/content/sanitize";

vi.mock("server-only", () => ({}));

/** Petite image intégrée valide (un pixel transparent). */
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB" +
  "0C8AAAAASUVORK5CYII=";

/** Applique la mise en page à un fragment HTML et rend les nœuds. */
function arrange(html: string): string {
  return render(arrangeLayout(parseDocument(html).children), { encodeEntities: "utf8" });
}

// ==================== XML ====================

describe("markBoxes", () => {
  const paragraph = (props: string) => `<w:p><w:pPr>${props}</w:pPr><w:r/></w:p>`;

  it("marque un paragraphe ombré et un paragraphe bordé", () => {
    const xml =
      paragraph('<w:shd w:val="clear" w:color="auto" w:fill="FBE4D5"/>') +
      paragraph('<w:pBdr><w:top w:val="single" w:sz="4"/></w:pBdr>');
    const result = markBoxes(xml);
    expect(result).toContain('<w:pPr><w:pStyle w:val="KalamiEncadreFond"/>');
    expect(result).toContain('<w:pPr><w:pStyle w:val="KalamiEncadreTrait"/>');
  });

  it("laisse les fonds blancs, les paragraphes stylés et les listes", () => {
    const xml =
      paragraph('<w:shd w:val="clear" w:fill="FFFFFF"/>') +
      paragraph('<w:shd w:val="clear" w:fill="auto"/>') +
      paragraph('<w:pStyle w:val="Titre1"/><w:shd w:fill="FBE4D5"/>') +
      paragraph('<w:numPr><w:numId w:val="1"/></w:numPr><w:shd w:fill="FBE4D5"/>') +
      paragraph('<w:pBdr><w:top w:val="nil"/></w:pBdr>');
    expect(markBoxes(xml)).toBe(xml);
  });
});

// ==================== ENCADRÉS ====================

describe("arrangeLayout — encadrés", () => {
  it("regroupe un encadré ombré : début, fin, titre et étiquette", () => {
    const html = arrange(
      "<p>Avant.</p>" +
        '<p class="encadre-fond">SUR LE TERRAIN   Une PME de Bouaké</p>' +
        '<p class="encadre-fond">Premier paragraphe.</p>' +
        '<p class="encadre-fond">Dernier paragraphe.</p>' +
        "<p>Après.</p>",
    );
    expect(html).toContain(
      '<p class="encadre encadre-fond encadre-debut encadre-titre">' +
        '<span class="encadre-label">SUR LE TERRAIN</span> Une PME de Bouaké</p>',
    );
    expect(html).toContain('<p class="encadre encadre-fond">Premier paragraphe.</p>');
    expect(html).toContain('<p class="encadre encadre-fond encadre-fin">Dernier paragraphe.</p>');
    expect(html).toContain("<p>Avant.</p>");
  });

  it("n'invente pas de titre pour un encadré d'un seul paragraphe ni pour un encadré bordé", () => {
    const html = arrange(
      '<p class="encadre-fond">À retenir   seul paragraphe.</p>' +
        "<p>Texte.</p>" +
        '<p class="encadre-trait">ÉNONCÉ   Question 1</p>' +
        '<p class="encadre-trait">Question 2</p>',
    );
    expect(html).toContain(
      '<p class="encadre encadre-fond encadre-debut encadre-fin">À retenir',
    );
    expect(html).toContain('<p class="encadre encadre-trait encadre-debut">ÉNONCÉ');
    expect(html).not.toContain("encadre-titre");
    expect(html).not.toContain("encadre-label");
  });
});

// ==================== ILLUSTRATIONS ====================

describe("arrangeLayout — illustrations", () => {
  it("fait d'une image seule une figure, avec sa légende comme texte de remplacement", () => {
    const html = arrange(
      `<p><img src="${PIXEL}" /></p>\n<p>Figure 2.1 – Le cycle de la stratégie</p><p>Suite.</p>`,
    );
    expect(html).toContain('<figure class="illustration">');
    expect(html).toContain('alt="Figure 2.1 – Le cycle de la stratégie"');
    expect(html).toContain("<figcaption>Figure 2.1 – Le cycle de la stratégie</figcaption>");
    expect(html).toContain("<p>Suite.</p>");
  });

  it("garde une figure sans légende quand le paragraphe suivant n'en est pas une", () => {
    const html = arrange(`<p><img src="${PIXEL}" /></p><p>Texte ordinaire.</p>`);
    expect(html).toContain('<figure class="illustration">');
    expect(html).not.toContain("figcaption");
    expect(html).toContain("<p>Texte ordinaire.</p>");
  });

  it("prend comme légende le paragraphe en italique qui suit l'image", () => {
    const html = arrange(
      `<p><img src="${PIXEL}" /></p><p><em>Le bivouac, au pied d’un fromager.</em></p>` +
        "<p>Après le repas, <em>komien</em>.</p>",
    );
    expect(html).toContain("<figcaption><em>Le bivouac, au pied d’un fromager.</em></figcaption>");
    expect(html).toContain('alt="Le bivouac, au pied d’un fromager."');
    expect(html).toContain("<p>Après le repas, <em>komien</em>.</p>");
  });

  it("laisse une image placée dans du texte", () => {
    const html = arrange(`<p>Voir <img src="${PIXEL}" /> ci-contre.</p>`);
    expect(html).not.toContain("<figure");
  });
});

// ==================== LISTE BLANCHE ====================

describe("sanitize — images et classes", () => {
  it("garde une image intégrée, ses dimensions et la figure", () => {
    const clean = sanitizeBlock(
      `<figure class="illustration"><img src="${PIXEL}" alt="Schéma" width="1" height="1">` +
        "<figcaption>Figure 1</figcaption></figure>",
    );
    expect(clean).toContain(`src="${PIXEL}"`);
    expect(clean).toContain('class="illustration"');
    expect(clean).toContain('width="1"');
  });

  it("retire les images externes, SVG ou mal formées", () => {
    expect(sanitizeBlock('<p>a<img src="https://exemple.com/x.png"></p>')).toBe("<p>a</p>");
    expect(sanitizeBlock('<p>a<img src="data:image/svg+xml;base64,PHN2Zz4="></p>')).toBe(
      "<p>a</p>",
    );
    expect(sanitizeBlock('<p>a<img src="data:image/png;base64,abc\'onerror=x"></p>')).toBe(
      "<p>a</p>",
    );
  });

  it("ne garde que les classes de la conversion", () => {
    expect(sanitizeBlock('<p class="encadre encadre-fond pirate">x</p>')).toBe(
      '<p class="encadre encadre-fond">x</p>',
    );
    expect(sanitizeBlock('<span class="encadre-label" style="color:red">x</span>')).toBe(
      '<span class="encadre-label">x</span>',
    );
  });

  it("garde un bloc fait d'une seule image", () => {
    const blocks = nodesToBlocks(
      parseDocument(`<figure class="illustration"><img src="${PIXEL}"></figure>`).children,
    );
    expect(blocks).toHaveLength(1);
  });

  it("ne compte pas les images dans la limite de texte du livre", () => {
    const image = `<p><img src="data:image/webp;base64,${"A".repeat(3_000_000)}"></p>`;
    const chapters = [1, 2].map((n) => ({ title: `C${n}`, blocks: [image], word_count: 0 }));
    expect(() => assertLimits(chapters)).not.toThrow();
  });
});

// ==================== RECOMPRESSION ====================

describe("createImageConverter", () => {
  /** Image PNG d'essai de la taille demandée. */
  const png = (width: number, height: number) =>
    sharp({
      create: { width, height, channels: 3, background: { r: 217, g: 119, b: 43 } },
    })
      .png()
      .toBuffer();

  it("recompresse en WebP et réduit à la largeur de lecture", async () => {
    const data = await png(2400, 1200);
    const convert = createImageConverter();
    const result = await convert({ contentType: "image/png", read: async () => data });
    expect(result.src).toMatch(/^data:image\/webp;base64,/);
    expect(result.width).toBe("1200");
    expect(result.height).toBe("600");
  });

  it("ignore les formats illisibles (EMF) et les images corrompues", async () => {
    const convert = createImageConverter();
    const emf = await convert({ contentType: "image/x-emf", read: async () => Buffer.from("") });
    const broken = await convert({
      contentType: "image/png",
      read: async () => Buffer.from("pas une image"),
    });
    expect(emf.src).toBe("");
    expect(broken.src).toBe("");
  });
});

// ==================== OUVERTURES DE CHAPITRE ====================

describe("arrangeLayout — ouvertures de chapitre", () => {
  it("rattache le surtitre au chapitre qu'il annonce et marque le chapeau", () => {
    const html = arrange(
      "<p>Fin du module précédent.</p><p><strong>MODULE 2</strong></p>" +
        '<h1><a id="_Toc1"></a>Le diagnostic</h1><p><em>Un court résumé.</em></p><p>Texte.</p>',
    );
    expect(html).toBe(
      "<p>Fin du module précédent.</p>" +
        '<h1><a id="_Toc1"></a>Le diagnostic</h1>' +
        '<p class="chapitre-surtitre">MODULE 2</p>' +
        '<p class="chapitre-chapeau"><em>Un court résumé.</em></p><p>Texte.</p>',
    );
  });

  it("fait de « CHAPITRE I » le surtitre et de son sous-titre le titre", () => {
    const html = arrange(
      "<h1>CHAPITRE I</h1><p><strong>Les éclaireurs</strong></p><p>Le soleil.</p>" +
        "<h1>ÉPILOGUE</h1><p>Un peuple qui danse</p><p>Les saisons.</p>",
    );
    expect(html).toBe(
      '<h1>Les éclaireurs</h1><p class="chapitre-surtitre">CHAPITRE I</p><p>Le soleil.</p>' +
        '<h1>Un peuple qui danse</h1><p class="chapitre-surtitre">ÉPILOGUE</p>' +
        "<p>Les saisons.</p>",
    );
  });

  it("garde « CHAPITRE I » comme titre quand le texte commence aussitôt", () => {
    const html = arrange("<h1>CHAPITRE I</h1><p>Il était une fois.</p>");
    expect(html).toBe("<h1>CHAPITRE I</h1><p>Il était une fois.</p>");
  });

  it("laisse un paragraphe ordinaire et un titre sans surtitre", () => {
    const html = arrange("<p>Module de gestion</p><h1>Titre</h1><p>Texte <em>mêlé</em>.</p>");
    expect(html).toBe("<p>Module de gestion</p><h1>Titre</h1><p>Texte <em>mêlé</em>.</p>");
  });
});

// ==================== TABLE DES MATIÈRES ====================

describe("table des matières", () => {
  it("retire le lien Word et le numéro de page", () => {
    const html = arrange('<p class="sommaire-1"><a href="#_Toc1">Préface\t11</a></p>');
    expect(html).toBe('<p class="sommaire-1">Préface</p>');
  });

  it("vise les chapitres et les intertitres, « À vous de jouer » dans son module", () => {
    const chapters = [
      {
        title: "Sommaire",
        blocks: [
          '<p class="sommaire-1">Le diagnostic</p>',
          '<p class="sommaire-2">À vous de jouer</p>',
          '<p class="sommaire-1">La décision</p>',
          '<p class="sommaire-2">À vous de jouer</p>',
          '<p class="sommaire-2">Introuvable</p>',
        ],
        word_count: 0,
      },
      {
        title: "Le diagnostic",
        blocks: ['<p class="chapitre-surtitre">MODULE 1</p>', "<h2>À vous de jouer</h2>"],
        word_count: 0,
      },
      {
        title: "La décision",
        blocks: ["<p>Texte.</p>", "<p>Suite.</p>", "<h2>À vous de jouer</h2>"],
        word_count: 0,
      },
    ];
    linkContents(chapters);
    expect(chapters[0].blocks).toEqual([
      '<p class="sommaire-1" data-vers-chapitre="2" data-vers-bloc="0">' +
        '<span class="sommaire-surtitre">MODULE 1</span> Le diagnostic</p>',
      '<p class="sommaire-2" data-vers-chapitre="2" data-vers-bloc="1">À vous de jouer</p>',
      '<p class="sommaire-1" data-vers-chapitre="3" data-vers-bloc="0">La décision</p>',
      '<p class="sommaire-2" data-vers-chapitre="3" data-vers-bloc="2">À vous de jouer</p>',
      '<p class="sommaire-2">Introuvable</p>',
    ]);
  });

  it("reconnaît un sommaire écrit à la main et relie « Chapitre I  Titre »", () => {
    const html = arrange(
      "<p><strong>SOMMAIRE</strong></p><p><strong>Chapitre I</strong>   Les éclaireurs</p>" +
        "<p><strong>Épilogue</strong>   Un peuple qui danse</p>",
    );
    expect(html).toBe(
      '<p class="sommaire-titre">SOMMAIRE</p>' +
        '<p class="sommaire-1">Chapitre I Les éclaireurs</p>' +
        '<p class="sommaire-1">Épilogue Un peuple qui danse</p>',
    );
    const chapters = [
      { title: "Début", blocks: ["<p>x</p>"], word_count: 0 },
      {
        title: "Les éclaireurs",
        blocks: ['<p class="chapitre-surtitre">CHAPITRE I</p>', "<p>Texte.</p>"],
        word_count: 0,
      },
    ];
    chapters[0].blocks = ['<p class="sommaire-1">Chapitre I Les éclaireurs</p>'];
    linkContents(chapters);
    expect(chapters[0].blocks[0]).toBe(
      '<p class="sommaire-1" data-vers-chapitre="2" data-vers-bloc="0">' +
        '<span class="sommaire-surtitre">CHAPITRE I</span> Les éclaireurs</p>',
    );
  });

  it("ne voit pas de sommaire dans un « Sommaire » suivi du texte", () => {
    const html = arrange("<p>Sommaire</p><p>Un seul paragraphe.</p>");
    expect(html).toBe("<p>Sommaire</p><p>Un seul paragraphe.</p>");
  });

  it("garde les cibles numériques et les classes d'ouverture à la liste blanche", () => {
    expect(sanitizeBlock('<p class="sommaire-2" data-vers-chapitre="3" data-vers-bloc="12">x</p>')).toBe(
      '<p class="sommaire-2" data-vers-chapitre="3" data-vers-bloc="12">x</p>',
    );
    expect(sanitizeBlock('<p data-vers-chapitre="javascript:x" data-vers-bloc="1e3">x</p>')).toBe(
      "<p>x</p>",
    );
    expect(sanitizeBlock('<p class="chapitre-chapeau"><em>x</em></p>')).toBe(
      '<p class="chapitre-chapeau"><em>x</em></p>',
    );
  });
});
