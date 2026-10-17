/**
 * Fichier    : content-docx-layout.test.ts
 * Projet     : Kalami
 * Description: Tests de la mise en page Word conservée : repérage des encadrés dans le XML,
 *              regroupement (début, fin, titre, étiquette « SUR LE TERRAIN »), illustrations
 *              et légendes, liste blanche des images intégrées, recompression WebP.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-17
 */

import render from "dom-serializer";
import { parseDocument } from "htmlparser2";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import { createImageConverter } from "@/lib/content/docx-images";
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
