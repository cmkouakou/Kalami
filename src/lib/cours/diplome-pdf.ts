/**
 * =============================================================
 *  Fichier    : diplome-pdf.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Diplôme du cours en PDF, produit à la demande et jamais stocké : une page
 *               A4 paysage (Literata intégrée, aucune ressource externe), imprimée par
 *               Chromium. Le nom vient toujours de la base : une correction faite par
 *               l'administrateur se retrouve donc dans le prochain téléchargement. La note
 *               n'est jamais imprimée (seule la mention l'est).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/pdf/{generate,render}.ts, pdf-lib, i18n/course.ts
 * =============================================================
 */

import "server-only";

import { PDFDocument } from "pdf-lib";

import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { APP_URL } from "@/lib/config";
import type { Mention } from "@/lib/cours/note-finale";
import { loadFonts, printHtmlToPdf } from "@/lib/pdf/generate";
import { escapeHtml, type PdfFonts } from "@/lib/pdf/render";

const t = getCourseDictionary();

/** Données imprimées sur le diplôme. */
export type DonneesDiplome = {
  numero: string;
  nom: string;
  mention: Mention;
  /** Date de délivrance (ISO). */
  delivreLe: string;
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Date longue (« 20 novembre 2026 »). */
function dateLongue(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Africa/Abidjan",
  }).format(new Date(iso));
}

/** Adresse publique de vérification d'un diplôme. */
export function adresseVerification(numero: string): string {
  return `${APP_URL}/strategie/cours/diplome/${numero}`;
}

// ==================== GABARIT ====================

/**
 * Document HTML autonome du diplôme.
 * @param d       - Données imprimées
 * @param polices - Literata (normal, italique) en base64 ; null : police de secours
 */
export function htmlDiplome(d: DonneesDiplome, polices: PdfFonts) {
  const p = t.diplome.pdf;
  const e = escapeHtml;
  const mention = interpolate(p.mention, { mention: t.diplome.mentions[d.mention] });
  const faces = polices
    ? `@font-face {
    font-family: "Literata";
    font-style: normal;
    src: url(data:font/woff2;base64,${polices.normal}) format("woff2");
  }
  @font-face {
    font-family: "Literata";
    font-style: italic;
    src: url(data:font/woff2;base64,${polices.italic}) format("woff2");
  }`
    : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${e(p.titre)} — ${e(d.nom)}</title>
<style>
  ${faces}
  @page {
    size: A4 landscape;
    margin: 0;
  }
  * {
    box-sizing: border-box;
  }
  html,
  body {
    margin: 0;
    height: 100%;
  }
  body {
    font-family: "Literata", Georgia, serif;
    color: #1f2a37;
    background: #fbf8f2;
  }
  .cadre {
    position: absolute;
    inset: 12mm;
    border: 1.2mm solid #23395b;
    padding: 4mm;
  }
  .interieur {
    height: 100%;
    border: 0.3mm solid #b08d57;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 10mm 24mm;
    gap: 5mm;
  }
  .surtitre {
    font-size: 11pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #23395b;
  }
  h1 {
    margin: 0;
    font-size: 40pt;
    font-weight: 600;
    color: #23395b;
  }
  .petit {
    font-size: 13pt;
    font-style: italic;
  }
  .nom {
    font-size: 30pt;
    font-weight: 600;
    border-bottom: 0.3mm solid #b08d57;
    padding: 0 10mm 2mm;
  }
  .intitule {
    font-size: 18pt;
    font-weight: 600;
  }
  .mention {
    font-size: 14pt;
    color: #23395b;
  }
  .pied {
    width: 100%;
    margin-top: 6mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 9.5pt;
    text-align: left;
  }
  .signature {
    text-align: right;
    font-style: italic;
  }
</style>
</head>
<body>
  <div class="cadre">
    <div class="interieur">
      <p class="surtitre">${e(p.surtitre)}</p>
      <h1>${e(p.titre)}</h1>
      <p class="petit">${e(p.decerne)}</p>
      <p class="nom">${e(d.nom)}</p>
      <p class="petit">${e(p.cours)}</p>
      <p class="intitule">${e(p.intitule)}</p>
      <p class="mention">${e(mention)}</p>
      <div class="pied">
        <div>
          <p>${e(interpolate(p.date, { date: dateLongue(d.delivreLe) }))}</p>
          <p>${e(interpolate(p.numero, { numero: d.numero }))}</p>
          <p>${e(interpolate(p.verifier, { adresse: adresseVerification(d.numero) }))}</p>
        </div>
        <p class="signature">${e(p.signature)}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ==================== GÉNÉRATION ====================

/**
 * Produit le PDF du diplôme.
 * @param d - Données imprimées (lues en base juste avant)
 * @returns Contenu du fichier PDF
 */
export async function pdfDiplome(d: DonneesDiplome): Promise<Uint8Array> {
  const brut = await printHtmlToPdf(htmlDiplome(d, await loadFonts()));
  const doc = await PDFDocument.load(brut);
  doc.setTitle(`${t.diplome.pdf.titre} — ${d.nom}`, { showInWindowTitleBar: true });
  doc.setAuthor("Claude Marcel");
  doc.setSubject(`${t.diplome.pdf.intitule} — ${d.numero}`);
  doc.setKeywords([d.numero]);
  doc.setCreator("Kalami Stratégie — kalami-livres.com");
  doc.setProducer("Kalami");
  doc.setLanguage("fr");
  return doc.save();
}
