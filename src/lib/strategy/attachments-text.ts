/**
 * =============================================================
 *  Fichier    : attachments-text.ts
 *  Projet     : Kalami Stratégie
 *  Description: Texte brut des pièces jointes que l'API de Claude ne lit pas directement :
 *               DOCX (mammoth) et XLSX (lecture des feuilles en XML). L'archive est contrôlée
 *               avant décompression (zip.ts) ; le texte est tronqué au-delà de TEXT_MAX_CHARS.
 *               Les PDF et les images sont envoyés tels quels au modèle.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: mammoth, fast-xml-parser, jszip, lib/content/zip.ts
 * =============================================================
 */

import "server-only";

import { XMLParser } from "fast-xml-parser";
import type JSZip from "jszip";
import mammoth from "mammoth";

import { openZip } from "@/lib/content/zip";

// ==================== CONSTANTES ====================

/** Texte maximal transmis au modèle (environ 100 000 jetons). */
export const TEXT_MAX_CHARS = 300_000;

/** Feuille XML au-delà de laquelle la lecture est abandonnée (charge du serveur). */
const SHEET_XML_MAX_CHARS = 20_000_000;

/** Marque ajoutée à la fin d'un texte tronqué. */
const TRUNCATED_MARK = "\n[… suite du document non transmise]";

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (name) => ["si", "r", "sheet", "row", "c", "Relationship"].includes(name),
});

// ==================== TYPES ====================

/** Texte extrait, et indicateur de troncature. */
export type ExtractedText = { text: string; truncated: boolean };

/** Nœud texte de fast-xml-parser : chaîne seule, ou objet avec attributs. */
type XmlText = string | { "#text"?: string } | undefined;

/** Texte riche d'un tableur : texte simple (t) ou suite de segments (r). */
type RichText = { t?: XmlText; r?: { t?: XmlText }[] };

type Cell = { r?: string; t?: string; v?: XmlText; is?: RichText };

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Coupe un texte trop long et le signale.
 * @param raw - Texte complet
 */
export function limitText(raw: string): ExtractedText {
  const text = raw.replace(/\n{3,}/g, "\n\n").trim();
  if (text.length <= TEXT_MAX_CHARS) return { text, truncated: false };
  return { text: text.slice(0, TEXT_MAX_CHARS) + TRUNCATED_MARK, truncated: true };
}

/** Valeur d'un nœud texte XML. */
function textOf(node: XmlText): string {
  if (typeof node === "string") return node;
  return node?.["#text"] ?? "";
}

/** Texte d'une chaîne riche (simple ou en segments). */
function richText(node: RichText | undefined): string {
  if (!node) return "";
  if (node.t !== undefined) return textOf(node.t);
  return (node.r ?? []).map((run) => textOf(run.t)).join("");
}

/**
 * Lit une entrée de l'archive ; null si elle manque ou dépasse la taille admise.
 * @param zip  - Archive ouverte
 * @param path - Chemin de l'entrée
 */
async function readEntry(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  const content = await entry.async("string");
  return content.length > SHEET_XML_MAX_CHARS ? null : content;
}

// ==================== DOCX ====================

/**
 * Texte brut d'un document Word.
 * @param data - Contenu binaire du fichier
 * @throws ConversionError si le fichier n'est pas une archive valide ; erreur de mammoth
 */
export async function docxText(data: Uint8Array): Promise<ExtractedText> {
  // Contrôle de l'archive avant que mammoth ne la décompresse
  await openZip(data);
  const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  return limitText(result.value);
}

// ==================== XLSX ====================

/**
 * Chaînes partagées du classeur (cellules de type « s »).
 * @param zip - Archive ouverte
 */
async function sharedStrings(zip: JSZip): Promise<string[]> {
  const content = await readEntry(zip, "xl/sharedStrings.xml");
  if (!content) return [];
  const parsed = xml.parse(content) as { sst?: { si?: RichText[] } };
  return (parsed.sst?.si ?? []).map(richText);
}

/**
 * Feuilles du classeur, dans l'ordre : nom et chemin de l'entrée XML.
 * @param zip - Archive ouverte
 */
async function sheetList(zip: JSZip): Promise<{ name: string; path: string }[]> {
  const [workbook, rels] = await Promise.all([
    readEntry(zip, "xl/workbook.xml"),
    readEntry(zip, "xl/_rels/workbook.xml.rels"),
  ]);
  if (!workbook || !rels) return [];
  const sheets = (xml.parse(workbook) as {
    workbook?: { sheets?: { sheet?: { name?: string; id?: string }[] } };
  }).workbook?.sheets?.sheet ?? [];
  const targets = new Map(
    ((xml.parse(rels) as {
      Relationships?: { Relationship?: { Id?: string; Target?: string }[] };
    }).Relationships?.Relationship ?? []).map((rel) => [rel.Id, rel.Target ?? ""]),
  );
  return sheets.flatMap((sheet) => {
    const target = targets.get(sheet.id);
    if (!target) return [];
    // Cible relative à xl/ (cas courant) ou absolue (/xl/...)
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    return [{ name: sheet.name ?? "", path }];
  });
}

/**
 * Valeur affichable d'une cellule.
 * @param cell    - Cellule lue
 * @param strings - Chaînes partagées
 */
function cellValue(cell: Cell, strings: readonly string[]): string {
  if (cell.t === "inlineStr") return richText(cell.is);
  const raw = textOf(cell.v);
  if (cell.t === "s") return strings[Number(raw)] ?? "";
  if (cell.t === "b") return raw === "1" ? "VRAI" : "FAUX";
  return raw;
}

/**
 * Lignes d'une feuille, cellules séparées par des tabulations (lignes vides omises).
 * @param content - XML de la feuille
 * @param strings - Chaînes partagées
 */
export function sheetRows(content: string, strings: readonly string[]): string[] {
  const parsed = xml.parse(content) as {
    worksheet?: { sheetData?: { row?: { c?: Cell[] }[] } };
  };
  return (parsed.worksheet?.sheetData?.row ?? [])
    .map((row) => (row.c ?? []).map((cell) => cellValue(cell, strings).trim()))
    .filter((cells) => cells.some(Boolean))
    .map((cells) => cells.join("\t").trimEnd());
}

/**
 * Texte brut d'un classeur Excel : chaque feuille sous son nom, une ligne par rangée.
 * Les dates restent sous forme de numéro de série (format non interprété).
 * @param data - Contenu binaire du fichier
 * @throws ConversionError si le fichier n'est pas une archive valide
 */
export async function xlsxText(data: Uint8Array): Promise<ExtractedText> {
  const zip = await openZip(data);
  const [strings, sheets] = await Promise.all([sharedStrings(zip), sheetList(zip)]);
  const parts: string[] = [];
  let length = 0;
  for (const sheet of sheets) {
    // Inutile de lire la suite : le texte sera tronqué
    if (length > TEXT_MAX_CHARS) break;
    const content = await readEntry(zip, sheet.path);
    const rows = content ? sheetRows(content, strings) : ["[feuille trop volumineuse]"];
    const block = [`Feuille « ${sheet.name} »`, ...rows].join("\n");
    parts.push(block);
    length += block.length;
  }
  return limitText(parts.join("\n\n"));
}
