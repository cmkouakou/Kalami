/**
 * Fichier    : strategy-attachments.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests unitaires des pièces jointes du profil (S5b) : contrôle des fichiers
 *              (format, taille, images), chemin de stockage, nettoyage de la sortie du coach
 *              (nombres, doublons, effectifs), relecture, propositions déjà présentes dans
 *              le profil, fusion avec le profil et conversion d'un classeur Excel en texte.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-14
 */

import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

import {
  ATTACHMENT_MAX_BYTES,
  attachmentPath,
  checkAttachment,
  extensionOf,
  formatSize,
  IMAGE_MAX_BYTES,
  kindOf,
} from "@/lib/strategy/attachments";
import { limitText, sheetRows, TEXT_MAX_CHARS, xlsxText } from "@/lib/strategy/attachments-text";
import {
  isAlreadyInProfile,
  MAX_PROPOSALS,
  mergeProposals,
  readExtract,
  sanitizeExtract,
  type ExtractOutput,
  type Proposal,
} from "@/lib/strategy/prefill";
import { EMPTY_PROFILE, LIST_MAX, type ProfileData } from "@/lib/strategy/profile";

vi.mock("server-only", () => ({}));

const STUDY_ID = "11111111-2222-4333-8444-555555555555";

/** Profil de départ des tests de fusion. */
const PROFILE: ProfileData = {
  ...EMPTY_PROFILE,
  sector: "Distribution",
  employees: 120,
  cities: ["Montréal"],
  teams: [{ role: "Ventes", headcount: 12 }],
};

/** Proposition sans effectif. */
function proposal(field: Proposal["field"], value: string): Proposal {
  return { field, value, headcount: null };
}

// ==================== CONTRÔLE DES FICHIERS ====================

describe("contrôle des fichiers joints", () => {
  it("reconnaît les extensions admises sans tenir compte de la casse", () => {
    expect(extensionOf("Rapport.PDF")).toBe("pdf");
    expect(extensionOf("budget.xlsx")).toBe("xlsx");
    expect(extensionOf("photo.jpeg")).toBe("jpeg");
    expect(extensionOf("script.exe")).toBeNull();
    expect(extensionOf("sans-extension")).toBeNull();
    expect(extensionOf("constructor")).toBeNull();
  });

  it("refuse un format inconnu ou un fichier trop gros", () => {
    expect(checkAttachment({ name: "a.pdf", size: 1000 })).toBeNull();
    expect(checkAttachment({ name: "a.zip", size: 1000 })).toBe("format");
    expect(checkAttachment({ name: "a.pdf", size: ATTACHMENT_MAX_BYTES + 1 })).toBe("too_large");
  });

  it("limite les images à 5 Mo", () => {
    expect(checkAttachment({ name: "a.png", size: IMAGE_MAX_BYTES })).toBeNull();
    expect(checkAttachment({ name: "a.png", size: IMAGE_MAX_BYTES + 1 }))
      .toBe("image_too_large");
    expect(checkAttachment({ name: "a.docx", size: IMAGE_MAX_BYTES + 1 })).toBeNull();
  });

  it("déduit la nature de la pièce de son type MIME", () => {
    expect(kindOf("application/pdf")).toBe("pdf");
    expect(kindOf("image/webp")).toBe("image");
    expect(kindOf("text/html")).toBeNull();
  });

  it("construit un chemin sans le nom d'origine", () => {
    const path = attachmentPath(STUDY_ID, "pdf");
    expect(path).toMatch(new RegExp(`^etudes/${STUDY_ID}/[0-9a-f-]{36}\\.pdf$`));
  });

  it("affiche une taille lisible", () => {
    expect(formatSize(200)).toBe("1 Ko");
    expect(formatSize(2.5 * 1024 * 1024)).toBe("2,5 Mo");
  });
});

// ==================== NETTOYAGE DE LA SORTIE ====================

describe("sanitizeExtract", () => {
  it("convertit l'effectif et vérifie l'année", () => {
    const raw: ExtractOutput = {
      summary: "  Rapport  annuel ",
      proposals: [
        { field: "employees", value: "12 500", headcount: null },
        { field: "foundedYear", value: "1987", headcount: null },
        { field: "foundedYear", value: "3020", headcount: null },
        { field: "employees", value: "beaucoup", headcount: null },
      ],
    };
    const result = sanitizeExtract(raw);
    expect(result.summary).toBe("Rapport annuel");
    expect(result.proposals).toEqual([
      proposal("employees", "12500"),
      proposal("foundedYear", "1987"),
    ]);
  });

  it("écarte les doublons et les valeurs vides", () => {
    const result = sanitizeExtract({
      summary: "",
      proposals: [
        { field: "cities", value: "Laval", headcount: null },
        { field: "cities", value: " laval ", headcount: null },
        { field: "offers", value: "   ", headcount: null },
      ],
    });
    expect(result.proposals).toEqual([proposal("cities", "Laval")]);
  });

  it("garde l'effectif pour les équipes seulement", () => {
    const result = sanitizeExtract({
      summary: "",
      proposals: [
        { field: "teams", value: "Achats", headcount: 8 },
        { field: "teams", value: "Logistique", headcount: -3 },
        { field: "markets", value: "Québec", headcount: 5 },
      ],
    });
    expect(result.proposals).toEqual([
      { field: "teams", value: "Achats", headcount: 8 },
      { field: "teams", value: "Logistique", headcount: null },
      proposal("markets", "Québec"),
    ]);
  });

  it("borne le nombre de propositions", () => {
    const proposals = Array.from({ length: MAX_PROPOSALS + 5 }, (_, index) => ({
      field: "clients" as const,
      value: `Client ${index}`,
      headcount: null,
    }));
    expect(sanitizeExtract({ summary: "", proposals }).proposals).toHaveLength(MAX_PROPOSALS);
  });

  it("relit une extraction enregistrée, ou renvoie null", () => {
    const stored = { summary: "Résumé", proposals: [proposal("cities", "Laval")] };
    expect(readExtract(stored)).toEqual(stored);
    expect(readExtract({ summary: "x", proposals: [{ field: "inconnu", value: "y" }] }))
      .toBeNull();
    expect(readExtract(null)).toBeNull();
  });
});

// ==================== PROFIL ====================

describe("propositions et profil", () => {
  it("signale ce que le profil contient déjà", () => {
    expect(isAlreadyInProfile(PROFILE, proposal("cities", " montréal"))).toBe(true);
    expect(isAlreadyInProfile(PROFILE, proposal("cities", "Laval"))).toBe(false);
    expect(isAlreadyInProfile(PROFILE, proposal("employees", "120"))).toBe(true);
    expect(isAlreadyInProfile(PROFILE, proposal("sector", "distribution"))).toBe(true);
    expect(isAlreadyInProfile(PROFILE, proposal("teams", "ventes"))).toBe(true);
    expect(isAlreadyInProfile(PROFILE, proposal("foundedYear", "1990"))).toBe(false);
  });

  it("complète les listes sans doublon et remplace les champs simples", () => {
    const next = mergeProposals(PROFILE, [
      proposal("cities", "Laval"),
      proposal("cities", "MONTRÉAL"),
      proposal("employees", "150"),
      proposal("sector", "Commerce de détail"),
      { field: "teams", value: "Achats", headcount: 4 },
      { field: "teams", value: "ventes", headcount: 99 },
    ]);
    expect(next.cities).toEqual(["Montréal", "Laval"]);
    expect(next.employees).toBe(150);
    expect(next.sector).toBe("Commerce de détail");
    expect(next.teams).toEqual([
      { role: "Ventes", headcount: 12 },
      { role: "Achats", headcount: 4 },
    ]);
  });

  it("ne modifie pas le profil d'origine et respecte LIST_MAX", () => {
    const full = { ...PROFILE, clients: Array.from({ length: LIST_MAX }, (_, i) => `C${i}`) };
    const next = mergeProposals(full, [proposal("clients", "Nouveau"), proposal("cities", "X")]);
    expect(next.clients).toHaveLength(LIST_MAX);
    expect(PROFILE.cities).toEqual(["Montréal"]);
    expect(next.cities).toEqual(["Montréal", "X"]);
  });
});

// ==================== TEXTE DES DOCUMENTS ====================

describe("texte des documents", () => {
  it("lit les lignes d'une feuille (chaînes partagées, texte en ligne, booléens)", () => {
    const sheet = `<?xml version="1.0"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>42</v></c></row>
          <row r="2"><c r="A2" t="s"><v>1</v></c></row>
          <row r="3">
            <c r="A3" t="inlineStr"><is><t>Libre</t></is></c><c r="B3" t="b"><v>1</v></c>
          </row>
        </sheetData>
      </worksheet>`;
    expect(sheetRows(sheet, ["Effectif", ""])).toEqual(["Effectif\t42", "Libre\tVRAI"]);
  });

  it("convertit un classeur Excel en texte, feuille par feuille", async () => {
    const zip = new JSZip();
    zip.file("xl/workbook.xml", `<?xml version="1.0"?>
      <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets><sheet name="Résumé" sheetId="1" r:id="rId1"/></sheets>
      </workbook>`);
    zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Target="worksheets/sheet1.xml"/>
      </Relationships>`);
    zip.file("xl/sharedStrings.xml", `<?xml version="1.0"?>
      <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <si><t>Pays</t></si><si><r><t>Can</t></r><r><t>ada</t></r></si>
      </sst>`);
    zip.file("xl/worksheets/sheet1.xml", `<?xml version="1.0"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData><row r="1"><c t="s"><v>0</v></c><c t="s"><v>1</v></c></row></sheetData>
      </worksheet>`);
    const data = await zip.generateAsync({ type: "uint8array" });

    const result = await xlsxText(data);
    expect(result.truncated).toBe(false);
    expect(result.text).toBe("Feuille « Résumé »\nPays\tCanada");
  });

  it("refuse un fichier qui n'est pas une archive", async () => {
    await expect(xlsxText(new TextEncoder().encode("pas un zip"))).rejects.toThrow();
  });

  it("tronque un texte trop long", () => {
    const result = limitText("a".repeat(TEXT_MAX_CHARS + 10));
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(TEXT_MAX_CHARS + 200);
    expect(limitText("court")).toEqual({ text: "court", truncated: false });
  });
});
