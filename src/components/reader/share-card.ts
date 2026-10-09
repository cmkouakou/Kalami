/**
 * =============================================================
 *  Fichier    : share-card.ts (reader)
 *  Projet     : Kalami
 *  Description: Image carrée (1080 × 1080) d'un extrait à partager : citation (280
 *               caractères au plus), titre, auteur, couverture et lien du livre. Dessinée
 *               sur un canvas dans le navigateur, sans service externe.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: lib/reader/annotations.ts
 * =============================================================
 */

import { shareExcerpt } from "@/lib/reader/annotations";

/** Côté de l'image, en pixels (format carré des réseaux sociaux). */
const SIZE = 1080;
const MARGIN = 96;
const COVER_WIDTH = 180;
const COVER_HEIGHT = 270;

/** Couleurs de la charte (valeurs fixes : l'image ne suit pas le thème de la liseuse). */
const COLORS = {
  paper: "#fbf8f2",
  ink: "#1f1b16",
  muted: "#6b6258",
  encre: "#1d4e89",
  line: "#e6dfd3",
};

/** Contenu de la carte. */
export type ShareCardData = {
  quote: string;
  title: string;
  author: string;
  coverUrl: string | null;
  /** Adresse affichée en bas de l'image (fiche du livre) */
  link: string;
  /** Police du texte (celle choisie dans la liseuse) */
  fontFamily: string;
};

// ==================== OUTILS ====================

/** Charge une image distante utilisable sur le canvas (CORS), ou null en cas d'échec. */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/**
 * Coupe un texte en lignes qui tiennent dans la largeur donnée (coupure aux espaces).
 * @returns Lignes à dessiner
 */
function wrapLines(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Plus grande taille de police (pas de 2 px) pour que la citation tienne dans la zone. */
function fitQuote(
  context: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  box: { width: number; height: number },
): { size: number; lines: string[] } {
  for (let size = 56; size > 28; size -= 2) {
    context.font = `italic ${size}px ${fontFamily}`;
    const lines = wrapLines(context, text, box.width);
    if (lines.length * size * 1.4 <= box.height) return { size, lines };
  }
  context.font = `italic 28px ${fontFamily}`;
  return { size: 28, lines: wrapLines(context, text, box.width) };
}

// ==================== DESSIN ====================

/**
 * Dessine la carte de partage.
 * @param data - Citation, livre, couverture, lien et police
 * @returns Image PNG
 * @throws Error si le canvas n'est pas disponible ou ne peut être exporté
 */
export async function drawShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible");
  const family = `${data.fontFamily}, Georgia, serif`;

  // Fond et filet de couleur
  context.fillStyle = COLORS.paper;
  context.fillRect(0, 0, SIZE, SIZE);
  context.fillStyle = COLORS.encre;
  context.fillRect(0, 0, SIZE, 16);

  // Guillemet décoratif et citation
  context.fillStyle = COLORS.encre;
  context.font = `bold 160px ${family}`;
  context.textBaseline = "top";
  context.fillText("«", MARGIN - 8, MARGIN - 24);

  const quoteTop = MARGIN + 140;
  const quoteBottom = SIZE - MARGIN - COVER_HEIGHT - 48;
  const { size, lines } = fitQuote(context, shareExcerpt(data.quote), family, {
    width: SIZE - 2 * MARGIN,
    height: quoteBottom - quoteTop,
  });
  context.fillStyle = COLORS.ink;
  lines.forEach((line, index) => context.fillText(line, MARGIN, quoteTop + index * size * 1.4));

  // Séparateur
  const footerTop = SIZE - MARGIN - COVER_HEIGHT;
  context.fillStyle = COLORS.line;
  context.fillRect(MARGIN, footerTop - 24, SIZE - 2 * MARGIN, 2);

  // Couverture (ignorée si elle ne se charge pas)
  let textLeft = MARGIN;
  const cover = data.coverUrl ? await loadImage(data.coverUrl) : null;
  if (cover) {
    context.drawImage(cover, MARGIN, footerTop, COVER_WIDTH, COVER_HEIGHT);
    textLeft = MARGIN + COVER_WIDTH + 40;
  }
  const textWidth = SIZE - MARGIN - textLeft;

  // Titre, auteur et lien
  context.fillStyle = COLORS.ink;
  context.font = `bold 40px ${family}`;
  const titleLines = wrapLines(context, data.title, textWidth).slice(0, 2);
  titleLines.forEach((line, index) => context.fillText(line, textLeft, footerTop + index * 50));
  context.fillStyle = COLORS.muted;
  context.font = `32px ${family}`;
  context.fillText(data.author, textLeft, footerTop + titleLines.length * 50 + 12, textWidth);
  context.fillStyle = COLORS.encre;
  context.font = "28px system-ui, sans-serif";
  context.fillText(data.link, textLeft, footerTop + COVER_HEIGHT - 32, textWidth);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export de l'image impossible"))),
      "image/png",
    );
  });
}
