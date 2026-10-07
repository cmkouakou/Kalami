/**
 * =============================================================
 *  Fichier    : convert-epub.ts
 *  Projet     : Kalami
 *  Description: Conversion d'un manuscrit EPUB (2 ou 3) en chapitres HTML nettoyés.
 *               Ordre de lecture = « spine » du fichier OPF ; titres = table des matières
 *               (nav EPUB 3 ou toc.ncx EPUB 2), à défaut premier titre du fichier.
 *               Un fichier sans titre ni entrée de sommaire prolonge le chapitre précédent
 *               (découpage technique de certains logiciels, ex. Calibre).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: jszip, fast-xml-parser, htmlparser2, domutils, sanitize.ts, zip.ts
 * =============================================================
 */

import "server-only";

import { posix } from "node:path";

import { type ChildNode, isTag } from "domhandler";
import { findAll, findOne, textContent } from "domutils";
import { XMLParser } from "fast-xml-parser";
import { parseDocument } from "htmlparser2";
import type JSZip from "jszip";

import { assertLimits, buildChapter, flattenNodes, headingText } from "./sanitize";
import { ConversionError, type ConvertedChapter } from "./types";
import { openZip } from "./zip";

// ==================== CONSTANTES ====================

/** Types MIME des documents de contenu lus dans la « spine ». */
const CONTENT_TYPES = new Set(["application/xhtml+xml", "text/html"]);

/** Nombre maximal de documents lus dans la « spine ». */
const MAX_SPINE_ITEMS = 2000;

/** Titres de chapitre reconnus en tête de fichier. */
const HEADING_PATTERN = /^h[1-3]$/;

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (name) => ["rootfile", "item", "itemref", "navPoint"].includes(name),
});

// ==================== TYPES ====================

type ManifestItem = { id: string; href: string; "media-type"?: string; properties?: string };
type SpineItemRef = { idref: string; linear?: string };
type NavPoint = {
  navLabel?: { text?: unknown };
  content?: { src?: string };
  navPoint?: NavPoint[];
};

/** Titre de secours, fourni par l'appelant (dictionnaire de langue). */
export type EpubTitles = { chapter: (position: number) => string };

// ==================== LECTURE DE L'ARCHIVE ====================

/** Lit un fichier texte de l'archive ; ConversionError si absent. */
async function readText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new ConversionError("invalid_file", `Fichier absent : ${path}`);
  return file.async("string");
}

/**
 * Résout un lien relatif d'un document de l'archive en chemin absolu, sans ancre.
 * @param baseDir - Dossier du document qui contient le lien
 * @param href    - Lien relatif (ex. « ../Text/ch01.xhtml#debut »)
 */
function resolvePath(baseDir: string, href: string): string {
  const withoutAnchor = href.split("#")[0];
  let decoded = withoutAnchor;
  try {
    decoded = decodeURIComponent(withoutAnchor);
  } catch {
    // Lien mal encodé : utilisé tel quel
  }
  return posix.normalize(posix.join(baseDir, decoded)).replace(/^\/+/, "");
}

/** Chemin du fichier OPF, indiqué par META-INF/container.xml. */
async function findOpfPath(zip: JSZip): Promise<string> {
  const container = xml.parse(await readText(zip, "META-INF/container.xml"));
  const path = container?.container?.rootfiles?.rootfile?.[0]?.["full-path"];
  if (typeof path !== "string" || !path) throw new ConversionError("invalid_file");
  return path;
}

// ==================== TABLE DES MATIÈRES ====================

/**
 * Titres du sommaire EPUB 3 (document « nav »), indexés par chemin de fichier.
 * Seule la première entrée de chaque fichier est retenue.
 */
function readNavTitles(xhtml: string, navDir: string): Map<string, string> {
  const titles = new Map<string, string>();
  const doc = parseDocument(xhtml);
  const navs = findAll((el) => el.name === "nav", doc.children);
  const toc = navs.find((nav) => (nav.attribs["epub:type"] ?? "").includes("toc")) ?? navs[0];
  if (!toc) return titles;

  for (const link of findAll((el) => el.name === "a", toc.children)) {
    const href = link.attribs.href;
    const label = headingText(link);
    if (!href || !label) continue;
    const path = resolvePath(navDir, href);
    if (!titles.has(path)) titles.set(path, label);
  }
  return titles;
}

/** Titres du sommaire EPUB 2 (toc.ncx), parcourus en profondeur. */
function readNcxTitles(ncx: string, ncxDir: string): Map<string, string> {
  const titles = new Map<string, string>();
  const visit = (points: NavPoint[] | undefined) => {
    for (const point of points ?? []) {
      const src = point.content?.src;
      const label = String(point.navLabel?.text ?? "").replace(/\s+/g, " ").trim();
      if (src && label) {
        const path = resolvePath(ncxDir, src);
        if (!titles.has(path)) titles.set(path, label);
      }
      visit(point.navPoint);
    }
  };
  visit(xml.parse(ncx)?.ncx?.navMap?.navPoint);
  return titles;
}

/** Sommaire de l'EPUB (nav puis ncx) ; vide si aucun n'est lisible. */
async function readTocTitles(
  zip: JSZip,
  opfDir: string,
  manifest: ManifestItem[],
  tocId: string | undefined,
): Promise<Map<string, string>> {
  const nav = manifest.find((item) => (item.properties ?? "").split(/\s+/).includes("nav"));
  if (nav) {
    const path = resolvePath(opfDir, nav.href);
    const titles = readNavTitles(await readText(zip, path), posix.dirname(path));
    if (titles.size) return titles;
  }

  const ncx =
    manifest.find((item) => item.id === tocId) ??
    manifest.find((item) => item["media-type"] === "application/x-dtbncx+xml");
  if (!ncx) return new Map();
  const path = resolvePath(opfDir, ncx.href);
  return readNcxTitles(await readText(zip, path), posix.dirname(path));
}

// ==================== CHAPITRES ====================

/**
 * Sépare le titre placé en tête d'un document (h1 à h3 précédé d'aucun texte).
 * @returns Le titre trouvé (ou null) et les nœuds restants
 */
function extractLeadingHeading(nodes: ChildNode[]): { heading: string | null; rest: ChildNode[] } {
  const index = nodes.findIndex((node) => isTag(node) && HEADING_PATTERN.test(node.name));
  if (index < 0 || textContent(nodes.slice(0, index)).trim()) return { heading: null, rest: nodes };

  const heading = headingText(nodes[index]);
  return { heading: heading || null, rest: [...nodes.slice(0, index), ...nodes.slice(index + 1)] };
}

/**
 * Convertit un fichier EPUB en chapitres.
 * @param data   - Contenu binaire du fichier
 * @param titles - Titre de secours d'un chapitre sans titre
 * @returns Chapitres nettoyés, dans l'ordre de lecture
 * @throws ConversionError si le fichier est invalide, vide ou hors limites
 */
export async function convertEpub(
  data: Uint8Array,
  titles: EpubTitles,
): Promise<ConvertedChapter[]> {
  const zip = await openZip(data);
  const opfPath = await findOpfPath(zip);
  const opfDir = posix.dirname(opfPath);
  const pkg = xml.parse(await readText(zip, opfPath))?.package;

  const manifest: ManifestItem[] = pkg?.manifest?.item ?? [];
  const spine: SpineItemRef[] = pkg?.spine?.itemref ?? [];
  if (!manifest.length || !spine.length) throw new ConversionError("invalid_file");
  if (spine.length > MAX_SPINE_ITEMS) throw new ConversionError("too_many_chapters");

  const byId = new Map(manifest.map((item) => [item.id, item]));
  const toc = await readTocTitles(zip, opfDir, manifest, pkg?.spine?.toc);
  const chapters: ConvertedChapter[] = [];

  for (const ref of spine) {
    const item = byId.get(ref.idref);
    if (!item || ref.linear === "no" || !CONTENT_TYPES.has(item["media-type"] ?? "")) continue;

    const path = resolvePath(opfDir, item.href);
    const doc = parseDocument(await readText(zip, path));
    const body = findOne((el) => el.name === "body", doc.children);
    const nodes = flattenNodes(body ? body.children : doc.children);
    const { heading, rest } = extractLeadingHeading(nodes);
    const title = toc.get(path) ?? heading;

    // Suite technique du chapitre précédent : on la rattache
    const previous = chapters.at(-1);
    if (!title && previous) {
      const more = buildChapter(previous.title, rest);
      previous.blocks.push(...more.blocks);
      previous.word_count += more.word_count;
      continue;
    }

    const chapter = buildChapter(title ?? titles.chapter(chapters.length + 1), rest);
    // Page de couverture ou page vide : ignorée
    if (chapter.blocks.length) chapters.push(chapter);
  }

  assertLimits(chapters);
  return chapters;
}
