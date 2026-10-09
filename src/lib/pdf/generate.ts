/**
 * =============================================================
 *  Fichier    : generate.ts
 *  Projet     : Kalami
 *  Description: Impression du PDF filigrané avec Chromium (@sparticuz/chromium sur Vercel,
 *               Chrome installé en local via CHROME_EXECUTABLE_PATH), puis marquage des
 *               métadonnées (titre, auteur, sujet et mots-clés au nom de l'acheteur).
 *               Aucune requête réseau n'est autorisée pendant l'impression.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: puppeteer-core, @sparticuz/chromium, pdf-lib, render.ts
 * =============================================================
 */

import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import chromium from "@sparticuz/chromium";
import { PDFDocument } from "pdf-lib";
import puppeteer, { type Browser } from "puppeteer-core";

import { buildPdfHtml, type PdfBook, type PdfFonts, type PdfLabels, type PdfStamp } from "./render";

/** Dossier des polices, inclus dans la fonction Vercel (outputFileTracingIncludes). */
const FONTS_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");

/** Délai maximal de mise en page et d'impression. */
const RENDER_TIMEOUT_MS = 60_000;

// ==================== FONCTIONS UTILITAIRES ====================

/** Lit les deux fichiers Literata en base64 (une fois par instance). */
let fontsPromise: Promise<PdfFonts> | null = null;
function loadFonts(): Promise<PdfFonts> {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONTS_DIR, "literata-normal.woff2")),
    readFile(path.join(FONTS_DIR, "literata-italic.woff2")),
  ]).then(([normal, italic]) => ({
    normal: normal.toString("base64"),
    italic: italic.toString("base64"),
  }));
  return fontsPromise;
}

/** Lance Chromium : Chrome local si CHROME_EXECUTABLE_PATH est défini, sinon sparticuz. */
async function launchBrowser(): Promise<Browser> {
  const localPath = process.env.CHROME_EXECUTABLE_PATH;
  if (localPath) return puppeteer.launch({ executablePath: localPath, headless: true });

  chromium.setGraphicsMode = false;
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });
}

/**
 * Inscrit l'acheteur dans les métadonnées du PDF.
 * @param bytes - PDF produit par Chromium
 */
async function markMetadata(bytes: Uint8Array, book: PdfBook, stamp: PdfStamp, copyOf: string) {
  const doc = await PDFDocument.load(bytes);
  doc.setTitle(book.title, { showInWindowTitleBar: true });
  doc.setAuthor(book.author);
  doc.setSubject(`${copyOf} ${stamp.name} <${stamp.email}> — ${stamp.reference}`);
  doc.setKeywords([stamp.reference, stamp.email, stamp.name]);
  doc.setCreator("Kalami — kalami-livres.com");
  doc.setProducer("Kalami");
  doc.setLanguage(book.language);
  const now = new Date();
  doc.setCreationDate(now);
  doc.setModificationDate(now);
  return doc.save();
}

// ==================== GÉNÉRATION ====================

/**
 * Produit le PDF filigrané d'un livre au nom de l'acheteur.
 * @param book   - Livre et chapitres de la version courante
 * @param stamp  - Nom, courriel et référence de l'acheteur
 * @param labels - Libellés imprimés
 * @returns Contenu du fichier PDF
 */
export async function generateWatermarkedPdf(
  book: PdfBook,
  stamp: PdfStamp,
  labels: PdfLabels,
): Promise<Uint8Array> {
  const html = buildPdfHtml(book, stamp, labels, await loadFonts());
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    // Le document est autonome : toute requête autre qu'une donnée intégrée est bloquée
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url().startsWith("data:")) void request.continue();
      else void request.abort();
    });
    await page.setContent(html, { waitUntil: "load", timeout: RENDER_TIMEOUT_MS });
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      outline: true,
      tagged: true,
      timeout: RENDER_TIMEOUT_MS,
    });
    return await markMetadata(pdf, book, stamp, labels.copyOf);
  } finally {
    await browser.close();
  }
}
