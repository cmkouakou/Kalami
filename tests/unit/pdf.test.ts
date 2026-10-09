/**
 * Fichier    : pdf.test.ts
 * Projet     : Kalami
 * Description: Tests du PDF filigrané : échappement HTML et CSS, présence de l'identité de
 *              l'acheteur (pied de page, filigrane, page de titre), nettoyage des chapitres,
 *              et lecture de l'option « pdf_enabled » dans les formulaires de livre.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-09
 */

import { describe, expect, it, vi } from "vitest";

import { parseBook } from "@/lib/admin/validation";
import { parseAuthorBook } from "@/lib/author/validation";
import {
  buildPdfHtml,
  escapeCssString,
  escapeHtml,
  stampText,
  type PdfBook,
  type PdfStamp,
} from "@/lib/pdf/render";

// Le nettoyage HTML est réservé au serveur : la garde est neutralisée pour les tests
vi.mock("server-only", () => ({}));

const LABELS = { copyOf: "Exemplaire de", contents: "Sommaire", by: "par" };
const STAMP: PdfStamp = { name: "Awa Koné", email: "awa@example.com", reference: "KAL-0A1B2C3D" };
const BOOK: PdfBook = {
  title: "Le <fleuve>",
  subtitle: null,
  author: "Amadou",
  language: "fr",
  chapters: [
    { position: 1, title: "Départ", blocks: ["<p>Il était une fois.</p>"] },
    { position: 2, title: "Retour", blocks: ['<p onclick="x()">Fin<script>alert(1)</script></p>'] },
  ],
};

/** Construit un FormData à partir d'un objet simple. */
function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

// ==================== ÉCHAPPEMENT ====================

describe("escapeHtml", () => {
  it("neutralise les caractères spéciaux", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });
});

describe("escapeCssString", () => {
  it("garde lettres accentuées et ponctuation sûre", () => {
    expect(escapeCssString("Awa Koné · a@b.c")).toBe("Awa Koné \\b7  a@b.c");
  });

  it("empêche de sortir de la chaîne CSS", () => {
    const escaped = escapeCssString('x"; } body { display:none } "\\');
    expect(escaped).not.toMatch(/["{};\\](?![0-9a-f])/);
    expect(escaped).toContain("\\22 ");
  });
});

// ==================== GABARIT ====================

describe("buildPdfHtml", () => {
  const html = buildPdfHtml(BOOK, STAMP, LABELS, null);
  const stamp = stampText(STAMP, LABELS.copyOf);

  it("imprime l'acheteur en filigrane, en page de titre et en pied de page", () => {
    expect(html).toContain(`<div class="filigrane" aria-hidden="true">${escapeHtml(stamp)}</div>`);
    expect(html).toContain(`<p class="exemplaire">${escapeHtml(stamp)}</p>`);
    expect(html).toContain(`content: "${escapeCssString(stamp)}`);
    expect(html).toContain('counter(page) " / " counter(pages)');
  });

  it("échappe le titre et renettoie les chapitres", () => {
    expect(html).toContain("<h1>Le &lt;fleuve&gt;</h1>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("<p>Fin</p>");
  });

  it("relie le sommaire aux chapitres", () => {
    expect(html).toContain('<a href="#chapitre-2">Retour</a>');
    expect(html).toContain('id="chapitre-2"');
  });

  it("n'intègre aucune ressource externe", () => {
    expect(html).not.toMatch(/(src|href)="https?:/);
    expect(html).not.toContain("@font-face");
  });

  it("intègre les polices fournies en données", () => {
    const withFonts = buildPdfHtml(BOOK, STAMP, LABELS, { normal: "AAAA", italic: "BBBB" });
    expect(withFonts).toContain("url(data:font/woff2;base64,AAAA)");
    expect(withFonts).toContain("font-style: italic");
  });
});

// ==================== OPTION PDF DES LIVRES ====================

describe("pdf_enabled", () => {
  it("est lu par le formulaire auteur", () => {
    const on = parseAuthorBook(form({ title: "Livre", language: "fr", pdf_enabled: "on" }));
    const off = parseAuthorBook(form({ title: "Livre", language: "fr" }));
    expect(on.ok && on.value.book.pdf_enabled).toBe(true);
    expect(off.ok && off.value.book.pdf_enabled).toBe(false);
  });

  it("est lu par le formulaire d'administration", () => {
    const result = parseBook(
      form({
        title: "Livre",
        language: "fr",
        status: "draft",
        author_id: "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b",
        pdf_enabled: "on",
      }),
    );
    expect(result.ok && result.value.book.pdf_enabled).toBe(true);
  });
});
