/**
 * Fichier    : content-convert.test.ts
 * Projet     : Kalami
 * Description: Tests de la conversion des manuscrits : nettoyage HTML (liste blanche),
 *              découpage DOCX par « Titre 1 », EPUB par la table des matières, fichiers
 *              invalides. Les fichiers d'essai sont construits en mémoire avec JSZip.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-08
 */

import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

import { convertDocx } from "@/lib/content/convert-docx";
import { convertEpub } from "@/lib/content/convert-epub";
import { assertLimits, countWords, sanitizeBlock } from "@/lib/content/sanitize";
import { ConversionError } from "@/lib/content/types";

vi.mock("server-only", () => ({}));

const DOCX_TITLES = { book: "Mon livre", opening: "Début de l'ouvrage" };
const EPUB_TITLES = { chapter: (n: number) => `Chapitre ${n}` };

// ==================== FICHIERS D'ESSAI ====================

/** Construit une archive à partir d'un dictionnaire chemin → contenu. */
async function zip(files: Record<string, string>): Promise<Uint8Array> {
  const archive = new JSZip();
  for (const [path, content] of Object.entries(files)) archive.file(path, content);
  return archive.generateAsync({ type: "uint8array" });
}

/** Paragraphe Word, avec style facultatif (ex. « Heading1 »). */
function para(text: string, style?: string): string {
  const props = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${props}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

/** DOCX minimal : types, relations, styles « heading 1 » et corps du document. */
function docx(paragraphs: string[]): Promise<Uint8Array> {
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  return zip({
    "[Content_Types].xml":
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ' +
      'ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/' +
      'vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>",
    "_rels/.rels":
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      `<Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/>` +
      "</Relationships>",
    "word/_rels/document.xml.rels":
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      `<Relationship Id="rId1" Type="${REL}/styles" Target="styles.xml"/>` +
      "</Relationships>",
    "word/styles.xml":
      `<?xml version="1.0" encoding="UTF-8"?><w:styles ${W}>` +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>' +
      "</w:styles>",
    "word/document.xml":
      `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body>` +
      paragraphs.join("") +
      "</w:body></w:document>",
  });
}

/** Page XHTML d'un EPUB. */
function xhtml(body: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title>' +
    `<style>p{}</style></head><body>${body}</body></html>`
  );
}

/** EPUB 3 minimal : deux chapitres titrés par le document de navigation. */
function epub(extra: Record<string, string> = {}): Promise<Uint8Array> {
  return zip({
    mimetype: "application/epub+zip",
    "META-INF/container.xml":
      '<?xml version="1.0"?><container version="1.0" ' +
      'xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles>' +
      '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
      "</rootfiles></container>",
    "OEBPS/content.opf":
      '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0">' +
      "<manifest>" +
      '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>' +
      '<item id="c1" href="text/c1.xhtml" media-type="application/xhtml+xml"/>' +
      '<item id="c2" href="text/c2.xhtml" media-type="application/xhtml+xml"/>' +
      "</manifest>" +
      '<spine><itemref idref="nav" linear="no"/><itemref idref="c1"/><itemref idref="c2"/>' +
      "</spine></package>",
    "OEBPS/nav.xhtml": xhtml(
      '<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol>' +
        '<li><a href="text/c1.xhtml">Premier pas</a></li>' +
        '<li><a href="text/c2.xhtml#debut">Deuxième étape</a></li>' +
        "</ol></nav>",
    ),
    "OEBPS/text/c1.xhtml": xhtml(
      "<h1>Titre dans le texte</h1><p>Il était une fois.</p><script>alert(1)</script>",
    ),
    "OEBPS/text/c2.xhtml": xhtml(
      '<div><p onclick="x()">Suite <a href="http://exemple.com">du récit</a>.</p>' +
        '<img src="i.png" alt=""/></div>',
    ),
    ...extra,
  });
}

// ==================== NETTOYAGE ====================

describe("sanitizeBlock", () => {
  it("retire scripts, attributs d'événement, liens et images", () => {
    const html = sanitizeBlock(
      '<p onclick="x()">A <a href="javascript:x">lien</a><img src="x"><script>y</script></p>',
    );
    expect(html).toBe("<p>A lien</p>");
  });

  it("convertit h1 en h2 et garde la mise en forme autorisée", () => {
    expect(sanitizeBlock("<h1>Titre</h1>")).toBe("<h2>Titre</h2>");
    expect(sanitizeBlock("<p><strong>gras</strong> <em>it</em></p>")).toBe(
      "<p><strong>gras</strong> <em>it</em></p>",
    );
  });

  it("compte les mots du texte, balises exclues", () => {
    expect(countWords(["<p>Un deux</p>", "<ul><li>trois</li><li>quatre</li></ul>"])).toBe(4);
  });
});

describe("assertLimits", () => {
  it("refuse un livre vide", () => {
    expect(() => assertLimits([])).toThrow(ConversionError);
  });
});

// ==================== DOCX ====================

describe("convertDocx", () => {
  it("ouvre un chapitre à chaque « Titre 1 » et garde le texte d'ouverture", async () => {
    const data = await docx([
      para("Avant-propos de l'auteur."),
      para("Chapitre un", "Heading1"),
      para("Premier paragraphe."),
      para("Deuxième paragraphe."),
      para("Chapitre deux", "Heading1"),
      para("Fin."),
    ]);
    const chapters = await convertDocx(data, DOCX_TITLES);

    expect(chapters.map((c) => c.title)).toEqual([
      "Début de l'ouvrage",
      "Chapitre un",
      "Chapitre deux",
    ]);
    expect(chapters[1].blocks).toEqual([
      "<p>Premier paragraphe.</p>",
      "<p>Deuxième paragraphe.</p>",
    ]);
    expect(chapters[1].word_count).toBe(4);
  });

  it("fait un seul chapitre au titre du livre sans aucun titre", async () => {
    const chapters = await convertDocx(await docx([para("Texte seul.")]), DOCX_TITLES);
    expect(chapters).toEqual([
      { title: "Mon livre", blocks: ["<p>Texte seul.</p>"], word_count: 2 },
    ]);
  });

  it("refuse un fichier qui n'est pas une archive, ou un document vide", async () => {
    const garbage = new TextEncoder().encode("pas un docx");
    await expect(convertDocx(garbage, DOCX_TITLES)).rejects.toMatchObject({
      code: "invalid_file",
    });
    await expect(convertDocx(await docx([]), DOCX_TITLES)).rejects.toMatchObject({
      code: "empty",
    });
  });
});

// ==================== EPUB ====================

describe("convertEpub", () => {
  it("suit le spine, titre par la table des matières et nettoie le contenu", async () => {
    const chapters = await convertEpub(await epub(), EPUB_TITLES);

    expect(chapters.map((c) => c.title)).toEqual(["Premier pas", "Deuxième étape"]);
    // Le titre en tête de page est retiré (affiché à part), le script supprimé
    expect(chapters[0].blocks).toEqual(["<p>Il était une fois.</p>"]);
    expect(chapters[1].blocks).toEqual(["<p>Suite du récit.</p>"]);
  });

  it("refuse une archive sans container.xml", async () => {
    const data = await zip({ mimetype: "application/epub+zip" });
    await expect(convertEpub(data, EPUB_TITLES)).rejects.toMatchObject({
      code: "invalid_file",
    });
  });
});
